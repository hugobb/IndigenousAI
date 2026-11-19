"""The retrieval effects the workshop prose promises, checked on the real embedding model."""

import itertools

import numpy as np
import pytest

import content as c
from toolkit import MiniLMEmbedder, cosine, make_chunks, rank


@pytest.fixture(scope="module")
def emb():
    return MiniLMEmbedder("cpu")


def has_all(text, keywords):
    return all(k.lower() in text.lower() for k in keywords)


def top_chunk(emb, question, strategy, size, overlap):
    chunks = make_chunks(c.REPORT, strategy, size, overlap)
    q = emb.embed([question])[0]
    (i, score), = rank(q, emb.embed(chunks), k=1)
    print(f"\n  {strategy}/{size}/{overlap} {score:.3f} :: {question} -> {chunks[i][:90]}")
    return chunks[i], score


def test_report_length_and_label():
    n = len(c.REPORT.split())
    assert 900 <= n <= 1100, n
    assert "fictional" in c.REPORT.lower()


def test_every_question_answerable_at_good_size(emb):
    for q in c.REPORT_QUESTIONS:
        chunk, _ = top_chunk(emb, q.question, "fixed", c.DEMO_GOOD_SIZE, 0)
        assert has_all(chunk, q.keywords), q.question


def test_split_question_breaks_when_small(emb):
    assert c.SPLIT_QUESTION in c.REPORT_QUESTIONS
    chunk, _ = top_chunk(emb, c.SPLIT_QUESTION.question, "fixed", c.DEMO_SMALL_SIZE, 0)
    assert not has_all(chunk, c.SPLIT_QUESTION.keywords)


def test_overlap_rescues_split_question(emb):
    chunk, _ = top_chunk(emb, c.SPLIT_QUESTION.question, "overlap", c.DEMO_SMALL_SIZE, c.DEMO_OVERLAP)
    assert has_all(chunk, c.SPLIT_QUESTION.keywords)


def test_tiny_chunks_break_even_with_overlap(emb):
    for overlap in (0, c.DEMO_TINY_SIZE // 2):
        chunk, _ = top_chunk(emb, c.SPLIT_QUESTION.question, "overlap", c.DEMO_TINY_SIZE, overlap)
        assert not has_all(chunk, c.SPLIT_QUESTION.keywords)


def test_whole_document_scores_lower(emb):
    whole = emb.embed([c.REPORT])[0]
    for q in c.REPORT_QUESTIONS:
        qv = emb.embed([q.question])[0]
        _, best = top_chunk(emb, q.question, "fixed", c.DEMO_GOOD_SIZE, 0)
        print(f"  whole {cosine(qv, whole):.3f} vs best chunk {best:.3f}")
        assert cosine(qv, whole) < best


def test_similarity_pairs_surprise(emb):
    (a0, b0), (a1, b1) = c.SIMILARITY_PAIRS[:2]
    s0 = cosine(*emb.embed([a0, b0]))
    s1 = cosine(*emb.embed([a1, b1]))
    print(f"\n  same meaning, no shared words: {s0:.3f}; shared words, different meaning: {s1:.3f}")
    assert s0 > s1


def test_map_topics_cluster(emb):
    sentences = [s for s, _ in c.MAP_SENTENCES]
    topics = [t for _, t in c.MAP_SENTENCES]
    vecs = emb.embed(sentences)
    for topic in set(topics):
        inside, outside = [], []
        for i, j in itertools.combinations(range(len(vecs)), 2):
            if topics[i] == topic and topics[j] == topic:
                inside.append(cosine(vecs[i], vecs[j]))
            elif topic in (topics[i], topics[j]):
                outside.append(cosine(vecs[i], vecs[j]))
        print(f"\n  {topic}: within {np.mean(inside):.3f}, across {np.mean(outside):.3f}")
        assert np.mean(inside) > np.mean(outside)


def test_search_example_hits_kaitiakitanga(emb):
    q = emb.embed([c.SEARCH_EXAMPLE])[0]
    (i, _), = rank(q, emb.embed(c.PASSAGES), k=1)
    assert "Kaitiakitanga" in c.PASSAGES[i]


def test_problem_question_needs_top_k_3(emb):
    chunks = make_chunks(c.REPORT, "fixed", c.DEMO_GOOD_SIZE, 0)
    hits = rank(emb.embed([c.PROBLEM_QUESTION.question])[0], emb.embed(chunks), k=3)
    found = [has_all(chunks[i], c.PROBLEM_QUESTION.keywords) for i, _ in hits]
    assert not found[0]
    assert any(found)


def test_small_size_cut_falls_inside_van_answer():
    chunks = make_chunks(c.REPORT, "fixed", c.DEMO_SMALL_SIZE, 0)
    cuts = [(a, b) for a, b in zip(chunks, chunks[1:]) if a.endswith(c.CUT_BEFORE) and b.startswith(c.CUT_AFTER)]
    assert len(cuts) == 1


def test_offline_question_misranks(emb):
    q = emb.embed([c.SEARCH_MISS_EXAMPLE])[0]
    hits = rank(q, emb.embed(c.PASSAGES), k=3)
    offline = [i for i, p in enumerate(c.PASSAGES) if p.startswith("Ollama")][0]
    assert hits[0][0] != offline
    assert offline in [i for i, _ in hits]
