import time

import numpy as np

from toolkit import (
    build_prompt,
    chunk_fixed,
    chunk_overlap,
    chunk_sentences,
    make_chunks,
    project_2d,
    rank,
    similarity_label,
    split_sentences,
)

WORDS25 = " ".join(f"w{i}" for i in range(25))


def test_chunk_fixed_sizes():
    assert [len(c.split()) for c in chunk_fixed(WORDS25, 10)] == [10, 10, 5]


def test_chunk_overlap_shares_words():
    chunks = chunk_overlap(WORDS25, size=10, overlap=4)
    assert chunks[1].split()[:4] == chunks[0].split()[-4:]


def test_chunk_overlap_clamped_no_hang():
    start = time.monotonic()
    chunks = chunk_overlap(WORDS25, size=5, overlap=50)
    assert time.monotonic() - start < 1
    firsts = [c.split()[0] for c in chunks]
    assert len(set(firsts)) == len(firsts)
    assert chunks[-1].split()[-1] == "w24"


def test_chunk_sentences_groups():
    text = " ".join(f"Sentence {i}." for i in range(7))
    assert len(chunk_sentences(text, 3)) == 3


def test_make_chunks_whole():
    assert make_chunks("  a b. c d.  ", "whole", 10, 0) == ["a b. c d."]


def test_similarity_label_thresholds():
    assert similarity_label(0.60) == "very similar"
    assert similarity_label(0.59) == "somewhat related"
    assert similarity_label(0.20) == "loosely related"
    assert similarity_label(0.19) == "unrelated"


def test_rank_orders_and_caps_k():
    docs = np.array([[1.0, 0.0], [0.0, 1.0], [0.7, 0.7]])
    docs = docs / np.linalg.norm(docs, axis=1, keepdims=True)
    result = rank(np.array([1.0, 0.0]), docs, k=10)
    assert [i for i, _ in result] == [0, 2, 1]
    scores = [s for _, s in result]
    assert scores == sorted(scores, reverse=True)


def test_build_prompt_numbering_and_unknown():
    with_unknown = build_prompt("Q?", ["alpha", "beta"], allow_unknown=True)
    assert "[1] alpha" in with_unknown and "[2] beta" in with_unknown
    assert "I don't know based on these documents." in with_unknown
    assert with_unknown.rstrip().endswith("Question: Q?\nAnswer:")
    without = build_prompt("Q?", ["alpha"], allow_unknown=False)
    assert "I don't know" not in without


def test_project_2d_shapes():
    rng = np.random.default_rng(0)
    for n in (1, 2, 15):
        out = project_2d(rng.normal(size=(n, 384)))
        assert out.shape == (n, 2)
        assert not np.isnan(out).any()


def test_split_sentences_keeps_abbreviations():
    text = "Levels of E. coli rose at the bridge. We meet at 7 p.m. in the hall. Bring soup."
    assert split_sentences(text) == [
        "Levels of E. coli rose at the bridge.",
        "We meet at 7 p.m. in the hall.",
        "Bring soup.",
    ]


def test_model_dtype_full_precision_on_gpu():
    import torch

    from toolkit import model_dtype

    assert model_dtype("cuda") is torch.float32
    assert model_dtype("cpu") is torch.bfloat16


def test_stream_worker_reports_failure():
    import pytest
    from transformers import TextIteratorStreamer

    from toolkit import stream_worker

    streamer = TextIteratorStreamer(None, timeout=5)

    def broken():
        raise ValueError("out of memory")

    with pytest.raises(RuntimeError):
        list(stream_worker(broken, streamer))
