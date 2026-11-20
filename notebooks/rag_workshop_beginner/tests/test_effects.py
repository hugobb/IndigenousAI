"""The effects the notebook text promises, checked with the real embedding model (MiniLM).

The notebook's own helpers are used (split, top_passages, show_chunking), with toolkit.MODELS
holding MiniLM and a stand-in for the answer model.
"""

import pytest

import content as c
import toolkit
from toolkit import FakeGenerator, MiniLMEmbedder, Models, chunk_overlap, split, top_passages

QUOTED = ["Hugo Berard and Hamza Abdelhedi"]  # named in step 2's text


@pytest.fixture(scope="module", autouse=True)
def models():
    toolkit.MODELS = Models(MiniLMEmbedder("cpu"), FakeGenerator(), "cpu", "fake")
    yield toolkit.MODELS
    toolkit.MODELS = None


def norm(text: str) -> str:
    return " ".join(text.split()).lower()


def rank_of_answer(size: int, overlap: int, top: int = 3) -> int | None:
    """Where the chunk with the answer comes in search's top results (1 = first), or None."""
    found = [norm(c.ANSWER) in norm(p) for _, p in top_passages(c.QUESTION, chunk_overlap(c.PROGRAMME, size, overlap), top)]
    return found.index(True) + 1 if True in found else None


def test_programme_is_the_text_without_the_attribution_block():
    assert c.PROGRAMME.startswith("Future Imaginaries of Indigenous AI is a two-day workshop")
    assert "Title:" not in c.PROGRAMME and "License:" not in c.PROGRAMME
    assert c.PROGRAMME_URL.startswith("https://abundant-intelligences.net/")


def test_excerpt_is_the_start_of_day_2_and_holds_the_answer():
    """Step 1: "The coloured text is the start of the Day 2 schedule"."""
    assert c.EXCERPT.startswith("The second day runs from 9:30 am") and c.EXCERPT in c.PROGRAMME
    assert c.ANSWER in c.EXCERPT and 80 <= len(c.EXCERPT.split()) <= 120


def test_default_chunking_draws_more_than_one_chunk_with_overlap():
    assert len(chunk_overlap(c.EXCERPT, c.SIZE, c.OVERLAP)) >= 2 and c.OVERLAP > 0


def test_answer_first_with_the_default_chunking():
    """Step 2: "Is the chunk with the answer ... first?" Yes, with the defaults."""
    assert rank_of_answer(c.SIZE, c.OVERLAP) == 1
    assert c.ANSWER in toolkit._short(top_passages(c.QUESTION, split(c.PROGRAMME, c.SIZE, c.OVERLAP), 1)[0][1])


def test_answer_leaves_the_top_3_at_try_size():
    """Step 2: "set size to TRY_SIZE ... Where is the answer now?" Not in the top 3."""
    assert rank_of_answer(c.TRY_SIZE, c.OVERLAP) is None


def test_names_quoted_in_the_text_are_in_the_programme():
    for name in QUOTED:
        assert name in c.PROGRAMME
