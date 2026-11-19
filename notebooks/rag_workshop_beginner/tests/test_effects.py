"""The retrieval effects the workshop text promises, checked on the real embedding model."""

import itertools

import numpy as np
import pytest

import content as c
from toolkit import MiniLMEmbedder, cosine, make_chunks, project_2d, rank
from ui import collection_chunks


@pytest.fixture(scope="module")
def emb():
    return MiniLMEmbedder("cpu")


def norm(text):
    return " ".join(text.split()).lower()


def has_all(text, keywords):
    return all(norm(k) in norm(text) for k in keywords)


def top_chunk(emb, question, strategy, size, overlap):
    chunks = make_chunks(c.CHARTER, strategy, size, overlap)
    (i, score), = rank(emb.embed([question])[0], emb.embed(chunks), k=1)
    return chunks[i], score


# ---------------------------------------------------------------- documents
def test_documents_loaded_and_labelled():
    assert c.CHARTER.startswith("FICTIONAL DOCUMENT")
    assert 250 < len(c.CHARTER.split()) < 400
    assert 3500 < len(c.CARE_PAPER.split()) < 4200
    assert "## " not in c.CARE_PAPER
    assert len(c.CHARTER_SECTIONS) == 9 and c.CHARTER_SECTIONS[5].startswith("Section 6.")


def test_kit_answers_are_in_the_charter():
    for q in c.CHARTER_QUESTIONS + [c.PROBLEM_QUESTION]:
        assert has_all(c.CHARTER, q.keywords), q.question
    assert "phone" not in c.CHARTER.lower() and "phone" not in c.CARE_PAPER.lower()


# ---------------------------------------------------------------- chunking (section 4)
def test_every_question_but_split_found_at_good_size(emb):
    for q in c.CHARTER_QUESTIONS:
        chunk, _ = top_chunk(emb, q.question, "fixed", c.DEMO_GOOD_SIZE, 0)
        assert has_all(chunk, q.keywords) is (q is not c.SPLIT_QUESTION), q.question


def test_cut_falls_inside_split_answer():
    chunks = make_chunks(c.CHARTER, "fixed", c.DEMO_GOOD_SIZE, 0)
    cuts = [(a, b) for a, b in zip(chunks, chunks[1:]) if a.endswith(c.CUT_BEFORE) and b.startswith(c.CUT_AFTER)]
    assert len(cuts) == 1


def test_overlap_rescues_split_question(emb):
    chunk, _ = top_chunk(emb, c.SPLIT_QUESTION.question, "overlap", c.DEMO_GOOD_SIZE, c.DEMO_OVERLAP)
    assert has_all(chunk, c.SPLIT_QUESTION.keywords)


def test_tiny_chunks_lose_the_days_answer(emb):
    for overlap in (0, c.DEMO_TINY_SIZE - 1):
        chunk, _ = top_chunk(emb, c.DAYS_QUESTION.question, "overlap", c.DEMO_TINY_SIZE, overlap)
        assert not has_all(chunk, c.DAYS_QUESTION.keywords)


def test_whole_document_scores_lower(emb):
    whole = emb.embed([c.CHARTER])[0]
    for q in c.CHARTER_QUESTIONS:
        if q is c.SPLIT_QUESTION:
            continue
        _, best = top_chunk(emb, q.question, "fixed", c.DEMO_GOOD_SIZE, 0)
        assert cosine(emb.embed([q.question])[0], whole) < best, q.question


# ---------------------------------------------------------------- search (section 3)
def test_search_examples(emb):
    vecs = emb.embed(c.CHARTER_SECTIONS)

    def ranked(q):
        return rank(emb.embed([q])[0], vecs, len(vecs))

    assert c.CHARTER_SECTIONS[ranked(c.SEARCH_EXAMPLE)[0][0]].startswith("Section 8.")
    assert not c.CHARTER_SECTIONS[ranked(c.SEARCH_MISS_EXAMPLE)[0][0]].startswith("Section 6.")
    assert max(s for _, s in ranked(c.SEARCH_NOTHING_EXAMPLE)) < 0.15


# ---------------------------------------------------------------- generation collection (section 5)
def test_collection_retrieval(emb):
    chunks = collection_chunks()
    vecs = emb.embed(chunks)

    def found(q, k):
        hits = rank(emb.embed([q.question])[0], vecs, k)
        return [has_all(chunks[i], q.keywords) for i, _ in hits]

    assert found(c.PROBLEM_QUESTION, 1) == [True]
    storage = found(c.STORAGE_QUESTION, 3)
    assert not storage[0] and any(storage)  # k = 1 misses it, k = 3 finds it


# ---------------------------------------------------------------- embeddings (section 2)
def test_similarity_pairs(emb):
    scores = [cosine(*emb.embed(list(pair))) for pair in c.SIMILARITY_PAIRS]
    assert scores[0] > 0.4 and scores[1] < 0.25 and scores[2] < 0.25


def test_love_hate_winter_is_close(emb):
    assert cosine(*emb.embed(["I love winter.", "I hate winter."])) > 0.6


def test_map_topics_cluster_in_2d(emb):
    vecs = emb.embed([s for s, _ in c.MAP_SENTENCES])
    points = project_2d(vecs)
    topics = [t for _, t in c.MAP_SENTENCES]
    for topic in set(topics):
        inside, across = [], []
        for i, j in itertools.combinations(range(len(points)), 2):
            d = np.linalg.norm(points[i] - points[j])
            if topics[i] == topics[j] == topic:
                inside.append(d)
            elif topic in (topics[i], topics[j]):
                across.append(d)
        assert np.mean(inside) < np.mean(across), topic
