"""Save the real numbers the Part 3 slides show: demo_values.json and demo_map.png.

    uv run --with-requirements requirements.txt python find_demo_values.py
        MiniLM only, about 20 seconds: chunks, the map, the search results, the prompt
        (answers saved by an earlier --answers run are kept).

    uv run --with-requirements requirements.txt python find_demo_values.py --answers Qwen/Qwen3-1.7B
        Also records that model's answers to the question, without and with the chunks (about 4 GB).

Everything is computed with the notebook's own defaults (content.py) and helpers (toolkit.py).
"""

import argparse
import contextlib
import io
import json
from pathlib import Path

import content as c
import toolkit
from toolkit import (CHAT_MODEL_CPU, CHAT_MODEL_GPU, EMBED_MODEL, FakeGenerator, Index, MiniLMEmbedder, Models,
                     QwenGenerator, build_prompt, chunk_overlap, embed, map_png, score, top_passages)

HERE = Path(__file__).resolve().parent
OUT = HERE / "demo_values.json"
MAP = HERE / "demo_map.png"
# Sentence pairs for the embedding slides (the game part of the deck, not the notebook).
PAIRS = [
    ("same meaning, different words", "We learn about machine learning.", "Students study how AI is trained."),
    ("same word, different meaning", "We learn about machine learning.", "The washing machine is broken."),
    ("unrelated", "We learn about machine learning.", "I had soup for lunch."),
    ("opposite opinions, same topic", "I love winter.", "I hate winter."),
]


def printed(function, *args, **kwargs) -> str:
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        function(*args, **kwargs)
    return out.getvalue()


def ranked(index: Index, question: str, top: int = 3) -> list[dict]:
    return [{"chunk": index.chunks.index(chunk) + 1, "score": round(s, 2), "text": toolkit._short(chunk)}
            for s, chunk in top_passages(question, index, top)]


def minilm_values() -> dict:
    """Everything in demo_values.json except the AI's answers. Needs toolkit.MODELS with MiniLM."""
    chunks = chunk_overlap(c.PROGRAMME, c.SIZE, c.OVERLAP)
    index = Index(chunks, embed(chunks))
    other = chunk_overlap(c.PROGRAMME, c.TRY_SIZE, c.OVERLAP)
    best = top_passages(c.QUESTION, index, 3)
    return {
        "programme": {"title": c.SOURCE["Title"], "url": c.PROGRAMME_URL, "retrieved": c.PROGRAMME_RETRIEVED,
                      "words": len(c.PROGRAMME.split())},
        "models": {"embeddings": EMBED_MODEL, "answers_gpu": CHAT_MODEL_GPU, "answers_cpu": CHAT_MODEL_CPU},
        "similarity_pairs": [{"kind": k, "a": a, "b": b, "score": round(score(a, b), 2)} for k, a, b in PAIRS],
        "chunking": {"size": c.SIZE, "overlap": c.OVERLAP, "chunks": len(chunks),
                     "excerpt_words": len(c.EXCERPT.split()),
                     "excerpt_chunks": len(chunk_overlap(c.EXCERPT, c.SIZE, c.OVERLAP))},
        "index": {"chunks": len(chunks), "dimensions": int(index.vectors.shape[1]), "map": MAP.name,
                  "sentence": c.QUESTION, "top3": ranked(index, c.QUESTION)},
        "search": {"question": c.QUESTION, "answer": c.ANSWER, "top3": ranked(index, c.QUESTION),
                   "try_size": c.TRY_SIZE, "try_chunks": len(other),
                   "try_top3": ranked(Index(other, embed(other)), c.QUESTION)},
        "prompt_example": {"question": c.QUESTION, "top": 3, "scores": [round(s, 2) for s, _ in best],
                           "prompt": build_prompt(c.QUESTION, [p for _, p in best], allow_unknown=True)},
    }


def write_map() -> None:
    chunks = chunk_overlap(c.PROGRAMME, c.SIZE, c.OVERLAP)
    index = Index(chunks, embed(chunks))
    MAP.write_bytes(map_png(index, c.QUESTION, top_passages(c.QUESTION, index, 3)))


def record_answers(model_name: str) -> dict:
    toolkit.MODELS = Models(toolkit.MODELS.embedder, QwenGenerator(model_name, "cpu"), "cpu", model_name)
    chunks = chunk_overlap(c.PROGRAMME, c.SIZE, c.OVERLAP)
    dtype = str(toolkit.model_dtype("cpu", model_name)).removeprefix("torch.")

    def answer_part(text: str) -> str:
        return text.split("Answer:\n", 1)[1].strip()

    return {
        "question": c.QUESTION,
        "device": f"cpu, {dtype}",
        "without_documents": answer_part(printed(toolkit.ask, c.QUESTION)),
        "with_documents": answer_part(printed(toolkit.ask_with_documents, c.QUESTION, chunks, top=3)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--answers", metavar="MODEL", help="also record this Qwen model's answers")
    args = parser.parse_args()
    toolkit.MODELS = Models(MiniLMEmbedder("cpu"), FakeGenerator(), "cpu", "fake")
    values = minilm_values()
    write_map()
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    answers = old.get("answers", {})
    values["answers"] = {m: a for m, a in answers.items() if a.get("question") == c.QUESTION}  # drop stale ones
    if args.answers:
        values["answers"][args.answers] = record_answers(args.answers)
    OUT.write_text(json.dumps(values, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} and {MAP}")


if __name__ == "__main__":
    main()
