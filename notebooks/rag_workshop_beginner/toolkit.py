"""The workshop's machinery: chunking, similarity, search, prompts and the two AI models."""

import os
import re
from collections.abc import Iterator
from dataclasses import dataclass
from queue import Empty
from threading import Thread

import numpy as np

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class MiniLMEmbedder:
    """Turns text into embeddings (384 numbers each) with a small, fast model."""

    def __init__(self, device: str):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(EMBED_MODEL, device=device)

    def embed(self, texts: list[str]) -> np.ndarray:
        return self.model.encode(list(texts), normalize_embeddings=True, convert_to_numpy=True)


# ---------------------------------------------------------------- the answer-writing model
CHAT_MODEL_GPU = "Qwen/Qwen3-1.7B"
CHAT_MODEL_CPU = "Qwen/Qwen3-0.6B"
MAX_NEW_TOKENS = 200


def model_dtype(device: str, model_name: str):
    """Full precision (float32) on the GPU, where half precision (float16) can overflow with Qwen3 on a T4,
    and for the small CPU model, because bfloat16 can be very slow on CPUs like Colab's. Larger models on
    the CPU use bfloat16, half the memory."""
    import torch

    return torch.float32 if device == "cuda" or model_name == CHAT_MODEL_CPU else torch.bfloat16


def dtype_argument(device: str, model_name: str) -> dict:
    """The precision argument for from_pretrained. transformers 4.56 renamed torch_dtype to dtype:
    older versions crash on dtype=, newer ones print a warning for torch_dtype=."""
    import transformers

    major, minor = (int(part) for part in transformers.__version__.split(".")[:2])
    return {"dtype" if (major, minor) >= (4, 56) else "torch_dtype": model_dtype(device, model_name)}


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
        self.model = AutoModelForCausalLM.from_pretrained(model_name, **dtype_argument(device, model_name)).to(device)
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


# ---------------------------------------------------------------- plain helpers for the notebook cells
SHOW = 60  # words of a passage shown on screen: a whole chunk of up to 60 words, the start of a longer one


def _short(text: str) -> str:
    words = text.split()
    return " ".join(words[:SHOW]) + (" ..." if len(words) > SHOW else "")


def ready() -> bool:
    """True once the Setup cell has loaded the models; otherwise says to run it."""
    if MODELS is None:
        print(NOT_READY)
        return False
    return True


def write_answer(prompt: str) -> None:
    """Send the prompt to the AI model and print its answer as it is written."""
    for piece in MODELS.generator.generate(prompt):
        print(piece, end="", flush=True)
    print()


def show_passages(passages: list[str]) -> None:
    print("Passages sent to the AI:")
    for n, passage in enumerate(passages, start=1):
        print(f"{n}. {_short(passage)}")
    print()


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


# ---------------------------------------------------------------- shown in the notebook, one section at a time
# Each function below is also shown, as it is here, in a collapsed "Code" cell of its section.

# Section 1
def ask(question: str) -> None:
    """Ask the AI model alone: no documents, only what it learned during its training."""
    if not ready():
        return
    print("Answer:")
    write_answer(question)  # the question is sent as it is, with nothing added


# Section 2
def embed(texts: list[str]) -> np.ndarray:
    """Turn each text into an embedding: a list of 384 numbers that captures its meaning."""
    return MODELS.embedder.embed(texts)


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    """How close two embeddings point: 1 = same direction (same meaning), 0 = unrelated."""
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def score(a: str, b: str) -> float:
    """The similarity score of two texts: embed both, then compare the two lists of numbers."""
    if MODELS is None:
        print(NOT_READY)
        return 0.0
    numbers_a, numbers_b = embed([a, b])
    return cosine(numbers_a, numbers_b)


def similarity(a: str, b: str) -> None:
    """Print how similar two texts are, e.g. 'Similarity: 0.83'."""
    if not ready():
        return
    print(f"Similarity: {score(a, b):.2f}")


# Section 3
def top_passages(question: str, passages: list[str], top: int = 3) -> list[tuple[float, str]]:
    """The `top` passages closest in meaning to the question, best first, as (score, passage)."""
    if not passages:
        return []
    # 1. Embed the question and every passage (one call, so it is fast).
    question_numbers, *passage_numbers = embed([question] + list(passages))
    # 2. Score every passage against the question.
    scored = [(cosine(question_numbers, numbers), passage) for numbers, passage in zip(passage_numbers, passages)]
    # 3. Sort from the highest score to the lowest, and keep the first `top`.
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return scored[:top]


def search(question: str, passages: list[str], top: int = 3) -> None:
    """Print the passages closest to the question: rank, score, start of the text."""
    if not ready():
        return
    for n, (s, passage) in enumerate(top_passages(question, passages, top), start=1):
        print(f"{n}. {s:.2f}  {_short(passage)}")


# Section 4
def chunk_overlap(text: str, size: int, overlap: int) -> list[str]:
    """Cut text into pieces of `size` words; each piece repeats the last `overlap` words of the one before."""
    overlap = max(0, min(overlap, size - 1))  # an overlap as long as the chunk would never move forward
    step = size - overlap  # how far each new chunk starts after the previous one
    words = text.split()
    chunks = []
    for start in range(0, len(words), step):
        chunks.append(" ".join(words[start : start + size]))
        if start + size >= len(words):  # this chunk reached the last word
            break
    return chunks


def split(document: str, words_per_chunk: int = 60, overlap: int = 0) -> list[str]:
    """Cut a document into chunks of words. 0 words means one chunk for everything."""
    if words_per_chunk <= 0:
        chunks = [document.strip()] if document.strip() else []
    else:
        chunks = chunk_overlap(document, words_per_chunk, max(0, overlap))
    print(f"Cut into {len(chunks)} {'chunk' if len(chunks) == 1 else 'chunks'}.")
    return chunks


# Section 5
def build_prompt(question: str, contexts: list[str], allow_unknown: bool) -> str:
    """The exact text sent to the model: instructions, the retrieved passages, the question."""
    lines = ["Answer the question using the context below."]
    if allow_unknown:
        lines.append('If the answer is not in the context, say "I don\'t know based on these documents."')
    lines += ["", "Context:"]
    lines += [f"[{i}] {c}" for i, c in enumerate(contexts, start=1)]
    lines += ["", f"Question: {question}", "Answer:"]
    return "\n".join(lines)


def ask_with_documents(question: str, passages: list[str], top: int = 3, say_dont_know: bool = True) -> None:
    """RAG: find the passages closest to the question, then let the AI answer from them."""
    if not ready():
        return
    # 1. Retrieve: embed the question and every passage, keep the `top` closest (section 3).
    best = [passage for _, passage in top_passages(question, passages, top)]
    show_passages(best)
    # 2. Augment: paste those passages into the prompt, above the question.
    prompt = build_prompt(question, best, say_dont_know)
    # 3. Generate: the AI writes its answer from that prompt.
    print("Answer:")
    write_answer(prompt)
