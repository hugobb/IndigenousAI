"""The workshop's machinery: chunking, similarity, search, prompts and the two AI models."""

import os
import re
from collections.abc import Iterator
from dataclasses import dataclass
from queue import Empty
from threading import Thread
from typing import Literal

import numpy as np

Strategy = Literal["fixed", "overlap", "sentences", "whole"]


# ---------------------------------------------------------------- chunking
def split_sentences(text: str) -> list[str]:
    """Cut text after each '.', '?' or '!'."""
    # Split after . ? ! followed by a capital letter or digit, but not after a lone capital ("E. coli").
    pattern = r"(?<=[.?!])(?<!\b[A-Z]\.)\s+(?=[A-Z0-9\"“‘(])"
    return [s.strip() for s in re.split(pattern, text) if s.strip()]


def chunk_fixed(text: str, size: int) -> list[str]:
    """Cut text into pieces of `size` words, one after the other."""
    words = text.split()
    return [" ".join(words[i : i + size]) for i in range(0, len(words), size)]


def chunk_overlap(text: str, size: int, overlap: int) -> list[str]:
    """Like chunk_fixed, but each piece repeats the last `overlap` words of the previous one."""
    overlap = max(0, min(overlap, size - 1))
    step = size - overlap
    words = text.split()
    chunks = []
    for i in range(0, len(words), step):
        chunks.append(" ".join(words[i : i + size]))
        if i + size >= len(words):
            break
    return chunks


def chunk_sentences(text: str, n: int) -> list[str]:
    """Group text into pieces of `n` sentences."""
    sentences = split_sentences(text)
    return [" ".join(sentences[i : i + n]) for i in range(0, len(sentences), n)]


def make_chunks(text: str, strategy: Strategy, size: int, overlap: int) -> list[str]:
    """One entry point for every chunking strategy. For 'sentences', size = sentences per chunk."""
    if strategy == "fixed":
        return chunk_fixed(text, size)
    if strategy == "overlap":
        return chunk_overlap(text, size, overlap)
    if strategy == "sentences":
        return chunk_sentences(text, size)
    return [text.strip()]


# ---------------------------------------------------------------- similarity and search
def cosine(a: np.ndarray, b: np.ndarray) -> float:
    """How close two embeddings point: 1 = same direction (same meaning), 0 = unrelated."""
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def similarity_label(score: float) -> str:
    """Plain-language reading of a similarity score."""
    if score >= 0.60:
        return "very similar"
    if score >= 0.40:
        return "somewhat related"
    if score >= 0.20:
        return "loosely related"
    return "unrelated"


def rank(query_vec: np.ndarray, doc_vecs: np.ndarray, k: int) -> list[tuple[int, float]]:
    """The k stored texts closest to the query, best first, as (position, score)."""
    scores = [cosine(query_vec, d) for d in doc_vecs]
    order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return [(i, scores[i]) for i in order[: min(k, len(scores))]]


EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class MiniLMEmbedder:
    """Turns text into embeddings (384 numbers each) with a small, fast model."""

    def __init__(self, device: str):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(EMBED_MODEL, device=device)

    def embed(self, texts: list[str]) -> np.ndarray:
        return self.model.encode(list(texts), normalize_embeddings=True, convert_to_numpy=True)


# ---------------------------------------------------------------- prompt
def build_prompt(question: str, contexts: list[str], allow_unknown: bool) -> str:
    """The exact text sent to the model: instructions, the retrieved passages, the question."""
    lines = ["Answer the question using the context below."]
    if allow_unknown:
        lines.append('If the answer is not in the context, say "I don\'t know based on these documents."')
    lines += ["", "Context:"]
    lines += [f"[{i}] {c}" for i, c in enumerate(contexts, start=1)]
    lines += ["", f"Question: {question}", "Answer:"]
    return "\n".join(lines)


# ---------------------------------------------------------------- map of meaning
def project_2d(vectors: np.ndarray) -> np.ndarray:
    """Squash many-number embeddings down to 2 numbers each (PCA), so they can be drawn on a map."""
    x = np.asarray(vectors, dtype=float)
    x = x - x.mean(axis=0)
    out = np.zeros((len(x), 2))
    if len(x) < 2:
        return out
    _, _, vt = np.linalg.svd(x, full_matrices=False)
    proj = x @ vt[:2].T
    out[:, : proj.shape[1]] = proj
    return out


# ---------------------------------------------------------------- the answer-writing model
CHAT_MODEL_GPU = "Qwen/Qwen3-1.7B"
CHAT_MODEL_CPU = "Qwen/Qwen3-0.6B"
MAX_NEW_TOKENS = 200


def model_dtype(device: str):
    """Full precision on the GPU: half precision (float16) can overflow with Qwen3 on a T4."""
    import torch

    return torch.float32 if device == "cuda" else torch.bfloat16


def dtype_argument(device: str) -> dict:
    """The precision argument for from_pretrained. transformers 4.56 renamed torch_dtype to dtype:
    older versions crash on dtype=, newer ones print a warning for torch_dtype=."""
    import transformers

    major, minor = (int(part) for part in transformers.__version__.split(".")[:2])
    return {"dtype" if (major, minor) >= (4, 56) else "torch_dtype": model_dtype(device)}


def stream_worker(target, streamer) -> Iterator[str]:
    """Run `target` (the model writing) in the background and pass on its text as it arrives.
    If it fails, stop waiting and raise instead of hanging forever."""
    failure: list[BaseException] = []

    def work():
        try:
            target()
        except BaseException as error:  # noqa: BLE001 - any failure must reach the participant
            failure.append(error)
            streamer.text_queue.put(streamer.stop_signal)

    worker = Thread(target=work, daemon=True)
    worker.start()
    try:
        yield from streamer
    except Empty:
        raise RuntimeError("The model took too long to answer.") from None
    worker.join(timeout=1)
    if failure:
        raise RuntimeError(f"The model stopped with an error: {failure[0]}") from failure[0]


class QwenGenerator:
    """Writes answers with a small Qwen model. Greedy decoding: the same question gives the same answer."""

    def __init__(self, model_name: str, device: str):
        from transformers import AutoModelForCausalLM, AutoTokenizer

        self.device = device
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name, **dtype_argument(device)).to(device)
        self.model.eval()

    def generate(self, prompt: str) -> Iterator[str]:
        from transformers import TextIteratorStreamer

        text = self.tokenizer.apply_chat_template(
            [{"role": "user", "content": prompt}],
            tokenize=False,
            add_generation_prompt=True,
            enable_thinking=False,
        )
        inputs = self.tokenizer(text, return_tensors="pt").to(self.device)
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True, timeout=180)
        settings = dict(
            **inputs,
            streamer=streamer,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=False,
            temperature=None,
            top_p=None,
            top_k=None,
        )
        yield from stream_worker(lambda: self.model.generate(**settings), streamer)


class FakeGenerator:
    """A stand-in for tests: repeats the first passage instead of thinking."""

    def generate(self, prompt: str) -> Iterator[str]:
        yield "(test answer) "
        first = next((line for line in prompt.splitlines() if line.startswith("[1] ")), prompt)
        for word in first.removeprefix("[1] ").split():
            yield word + " "


@dataclass
class Models:
    embedder: MiniLMEmbedder
    generator: QwenGenerator | FakeGenerator
    device: str
    llm_name: str


MODELS: Models | None = None
NOT_READY = "Run the Setup cell first."


def load_models() -> Models:
    """Load both models, on the GPU when there is one. The result is also kept in MODELS."""
    global MODELS
    MODELS = _load_models()
    return MODELS


def _load_models() -> Models:
    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"
    embedder = MiniLMEmbedder(device)
    if os.environ.get("RAG_WORKSHOP_FAKE_LLM") == "1":
        return Models(embedder, FakeGenerator(), device, "fake")
    name = os.environ.get("RAG_WORKSHOP_LLM") or (CHAT_MODEL_GPU if device == "cuda" else CHAT_MODEL_CPU)
    return Models(embedder, QwenGenerator(name, device), device, name)


def running_in_colab() -> bool:
    try:
        import google.colab  # noqa: F401
    except ImportError:
        return False
    return True


def status_line(device: str, in_colab: bool | None = None) -> str:
    """The Setup cell's last line. Only Colab has a Runtime menu that can switch on a GPU."""
    if device == "cuda":
        return "✅ Ready. You can go on to section 1."
    if in_colab is None:
        in_colab = running_in_colab()
    slow = "⚠️ Ready, but there is no GPU, so the AI is slower (up to a minute per answer) and makes more mistakes. You can carry on."
    colab = " To get a GPU: click Runtime > Change runtime type > T4 GPU > Save, then click ▶️ on this cell again."
    return slow + (colab if in_colab else "")


def answer(models: Models, question: str, contexts: list[str], allow_unknown: bool) -> Iterator[str]:
    """The whole RAG step: build the prompt from the retrieved passages and stream the model's answer."""
    return models.generator.generate(build_prompt(question, contexts, allow_unknown))


# ---------------------------------------------------------------- plain helpers for the notebook cells
SHOW = 60  # words of a passage shown on screen: a whole chunk of up to 60 words, the start of a longer one


def _short(text: str) -> str:
    words = text.split()
    return " ".join(words[:SHOW]) + (" ..." if len(words) > SHOW else "")


def _embed(texts: list[str]) -> np.ndarray:
    return MODELS.embedder.embed(texts)


def score(a: str, b: str) -> float:
    """How close in meaning two texts are (cosine of their embeddings)."""
    if MODELS is None:
        print(NOT_READY)
        return 0.0
    va, vb = _embed([a, b])
    return cosine(va, vb)


def similarity(a: str, b: str) -> None:
    """Print how similar two texts are, e.g. 'Similarity: 0.83'."""
    if MODELS is None:
        print(NOT_READY)
        return
    print(f"Similarity: {score(a, b):.2f}")


def split(document: str, words_per_chunk: int = 60, overlap: int = 0) -> list[str]:
    """Cut a document into chunks of words. 0 words means one chunk for everything."""
    if words_per_chunk <= 0:
        chunks = [document.strip()] if document.strip() else []
    else:
        chunks = chunk_overlap(document, words_per_chunk, max(0, overlap))
    print(f"Cut into {len(chunks)} {'chunk' if len(chunks) == 1 else 'chunks'}.")
    return chunks


_ATTRIBUTION = ("Title:", "Source:", "Retrieved:", "License:", "Shortened:")
_HEADING = re.compile(r"^(={2,3})\s*(.+?)\s*\1\s*$")


def sections(document: str) -> list[str]:
    """One passage per section (== and === headings). The heading path is the first line."""
    lines = document.splitlines()
    head = []
    for line in lines:
        if not line.strip():
            break
        head.append(line)
    if head and all(line.startswith(_ATTRIBUTION) for line in head):
        lines = lines[len(head) :]

    passages: list[str] = []
    title = "Introduction"
    parent = ""
    body: list[str] = []

    def flush() -> None:
        text = "\n".join(body).strip()
        if text:
            passages.append(f"{title}\n{text}")
        body.clear()

    for line in lines:
        match = _HEADING.match(line.strip())
        if not match:
            body.append(line)
            continue
        flush()
        name = match.group(2)
        if len(match.group(1)) == 2:
            parent = name
            title = name
        else:
            title = f"{parent}: {name}" if parent else name
    flush()
    return passages


def _bare(text: str) -> list[str]:
    """The words of a text, without the punctuation around them ("foot." and "foot" match)."""
    return [word.strip(".,;:!?\"'()“”‘’") for word in text.split()]


def where_is(chunks: list[str], phrase: str) -> None:
    """Say which chunks contain a phrase, or show where it was cut in two."""
    norm = " ".join(phrase.split()).lower()
    flat = [" ".join(c.split()).lower() for c in chunks]
    found = [i + 1 for i, c in enumerate(flat) if norm and norm in c]
    if found:
        label = "chunk" if len(found) == 1 else "chunks"
        print(f'"{phrase}" is in {label} {", ".join(map(str, found))}.')
        return
    words = _bare(norm)
    for i in range(len(flat) - 1):
        left, right = _bare(flat[i]), _bare(flat[i + 1])
        for j in range(len(words) - 1, 0, -1):
            if left[-j:] == words[:j] and right[: len(words) - j] == words[j:]:
                print(f'"{phrase}" was cut in two, between chunk {i + 1} and chunk {i + 2}.')
                print(f"Chunk {i + 1} ends with: ...{chunks[i][-80:]}")
                print(f"Chunk {i + 2} starts with: {chunks[i + 1][:80]}...")
                return
    print(f'"{phrase}" is not in any chunk.')


def top_passages(question: str, passages: list[str], top: int = 3) -> list[tuple[float, str]]:
    """The `top` passages closest in meaning to the question, best first, as (score, passage)."""
    if not passages:
        return []
    vecs = _embed([question] + list(passages))
    return [(s, passages[i]) for i, s in rank(vecs[0], vecs[1:], top)]


def search(question: str, passages: list[str], top: int = 3) -> None:
    """Print the passages closest to the question: rank, score, start of the text."""
    if MODELS is None:
        print(NOT_READY)
        return
    for n, (s, passage) in enumerate(top_passages(question, passages, top), start=1):
        print(f"{n}. {s:.2f}  {_short(passage)}")


def _stream(prompt: str) -> None:
    for piece in MODELS.generator.generate(prompt):
        print(piece, end="", flush=True)
    print()


def ask(question: str) -> None:
    """Ask the AI with no documents."""
    if MODELS is None:
        print(NOT_READY)
        return
    print("Answer:")
    _stream(question)


def ask_with_documents(question: str, passages: list[str], top: int = 3, say_dont_know: bool = True) -> None:
    """Find the best passages, show them, and ask the AI to answer from them."""
    if MODELS is None:
        print(NOT_READY)
        return
    contexts = [p for _, p in top_passages(question, passages, top)]
    print("Passages sent to the AI:")
    for n, c in enumerate(contexts, start=1):
        print(f"{n}. {_short(c)}")
    print()
    print("Answer:")
    _stream(build_prompt(question, contexts, say_dont_know))
