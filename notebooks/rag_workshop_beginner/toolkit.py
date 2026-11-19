"""The workshop's machinery: chunking, similarity, search, prompts and the two AI models."""

import re
from typing import Literal

import numpy as np

Strategy = Literal["fixed", "overlap", "sentences", "whole"]


# ---------------------------------------------------------------- chunking
def split_sentences(text: str) -> list[str]:
    """Cut text after each '.', '?' or '!'."""
    return [s.strip() for s in re.split(r"(?<=[.?!])\s+", text) if s.strip()]


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
