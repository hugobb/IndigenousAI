"""The search effects the notebook text promises, checked with the real embedding model (MiniLM).

The notebook's own helpers are used (sections, split, top_passages, where_is, score), with
toolkit.MODELS holding MiniLM and a stand-in for the answer model.
"""

import json
import re
from pathlib import Path

import pytest

import content as c
import find_demo_values
import toolkit
from toolkit import FakeGenerator, MiniLMEmbedder, Models, score, sections, split, top_passages, where_is

HERE = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="module", autouse=True)
def models():
    toolkit.MODELS = Models(MiniLMEmbedder("cpu"), FakeGenerator(), "cpu", "fake")
    yield toolkit.MODELS
    toolkit.MODELS = None


def norm(text: str) -> str:
    return " ".join(text.split()).lower()


def has(text: str, phrase: str) -> bool:
    return norm(phrase) in norm(text)


def headings(question: str, top: int) -> list[str]:
    return [p.splitlines()[0] for _, p in top_passages(question, sections(c.PROGRAMME), top)]


def best(question: str, chunks: list[str], top: int = 1) -> list[str]:
    return [p for _, p in top_passages(question, chunks, top)]


def words_read(text: str) -> int:
    """How many words of a text fit in what the embedding model reads (it cuts the rest)."""
    model = toolkit.MODELS.embedder.model
    words = text.split()
    n = 0
    while n < len(words) and len(model.tokenizer(" ".join(words[: n + 1]))["input_ids"]) <= model.max_seq_length:
        n += 1
    return n


# ---------------------------------------------------------------- the article
def test_programme_is_the_text_without_the_attribution_block():
    assert c.PROGRAMME.startswith("Future Imaginaries of Indigenous AI is a two-day workshop")
    assert "Title:" not in c.PROGRAMME and "License:" not in c.PROGRAMME
    assert c.PROGRAMME_URL.startswith("https://abundant-intelligences.net/")


def test_the_sections_named_in_section_3():
    names = [p.splitlines()[0] for p in sections(c.PROGRAMME)]
    assert len(names) == c.N_SECTIONS
    text = (HERE / "cells" / "03-search.md").read_text()
    assert f"There are {{N_SECTIONS}}: " in text
    listed = text.split("There are {N_SECTIONS}: ", 1)[1].split(", and one per speaker.", 1)[0].split(", ")
    assert listed[0] == "the Introduction" and listed[1:] == [n.split(":")[0] for n in names[1:7]]
    assert all(n.startswith("Speakers: ") for n in names[7:])


def test_facts_quoted_in_the_notebook_are_in_the_programme():
    for fact in ["At 1:00 pm, participants start", "The second day runs", c.MISS_ANSWER, c.CUT_PHRASE, c.CUT_SECOND_PART]:
        assert fact in c.PROGRAMME, fact


# ---------------------------------------------------------------- 2. embeddings
def test_embedding_has_384_numbers():
    assert toolkit.MODELS.embedder.embed([c.SAME_MEANING[0]]).shape == (1, 384)


def test_section_2_compares_one_sentence_with_three_others():
    """ "The cell below compares "We learn about machine learning." with three other sentences." """
    assert c.SAME_MEANING[0] == c.SAME_WORD[0] == c.UNRELATED[0]


def test_low_scores_are_low():
    """ "It shares the word "machine" with the first one, but its score is low." (close to 0 means unrelated)"""
    assert score(*c.SAME_WORD) < 0.2 and score(*c.UNRELATED) < 0.2


def test_similarity_pairs_order():
    same, word, unrelated = score(*c.SAME_MEANING), score(*c.SAME_WORD), score(*c.UNRELATED)
    assert same > word and same > unrelated


def test_pairs_share_the_words_the_text_says():
    a, b = (set(re.findall(r"[a-z]+", s.lower())) - {"the", "a"} for s in c.SAME_MEANING)
    assert not a & b  # same meaning, no shared word
    a, b = (set(re.findall(r"[a-z]+", s.lower())) for s in c.SAME_WORD)
    assert a & b == {"machine"}


def test_love_hate_close():
    assert score(*c.LOVE_HATE) > 0.5


# ---------------------------------------------------------------- 3. search over the sections
def test_hit_question_first():
    assert headings(c.HIT_QUESTION, 1) == [c.HIT_SECTION]


def test_miss_question_not_first():
    answer_section = next(p for p in sections(c.PROGRAMME) if p.startswith(c.MISS_SECTION + "\n"))
    assert c.MISS_ANSWER in answer_section
    assert headings(c.MISS_QUESTION, 1) != [c.MISS_SECTION]  # "Which section comes first?" Not that one.


def test_nonsense_scores_low():
    assert all(s < 0.3 for s, _ in top_passages(c.NONSENSE_QUESTION, sections(c.PROGRAMME), 8))


# ---------------------------------------------------------------- 4. splitting
def test_model_reads_about_200_words():
    assert 170 <= words_read(c.PROGRAMME) <= 210 < len(c.PROGRAMME.split())  # 183: ʻokina and kahakō cost tokens
    day2 = next(p for p in sections(c.PROGRAMME) if p.startswith(c.MISS_SECTION + "\n"))
    assert len(day2.split()) > 150  # "among many times, rooms and talks"


def test_chunks_find_what_the_sections_missed():
    (top,) = best(c.MISS_QUESTION, split(c.PROGRAMME, c.DEMO_SIZE))
    assert c.MISS_ANSWER in toolkit._short(top)  # in the first result, and on screen


def test_tiny_size_loses_answer():
    assert not any(c.MISS_ANSWER in p for p in best(c.MISS_QUESTION, split(c.PROGRAMME, c.TINY_SIZE), 3))


def test_whole_article_scores_lower():
    ((whole, _),) = top_passages(c.MISS_QUESTION, split(c.PROGRAMME, 0), 1)
    ((chunked, _),) = top_passages(c.MISS_QUESTION, split(c.PROGRAMME, c.DEMO_SIZE), 1)
    assert whole < chunked


def test_cut_at_demo_size(capsys):
    chunks = split(c.PROGRAMME, c.DEMO_SIZE)
    capsys.readouterr()
    where_is(chunks, c.CUT_PHRASE)
    out = capsys.readouterr().out
    assert "was cut in two" in out
    assert f"starts with: {c.CUT_SECOND_PART}" in out  # the second half is in the next chunk


def test_overlap_restores(capsys):
    chunks = split(c.PROGRAMME, c.DEMO_SIZE, overlap=c.DEMO_OVERLAP)
    capsys.readouterr()
    where_is(chunks, c.CUT_PHRASE)
    out = capsys.readouterr().out
    assert "is in chunk" in out and "cut" not in out


def test_split_question_gets_the_reason_only_with_overlap():
    """Section 5: "Look at the chunks sent to the AI: is the speaker's name still there?" With overlap 0: no."""
    sent_cut = best(c.SPLIT_QUESTION, split(c.PROGRAMME, c.DEMO_SIZE), 3)
    (top_whole,) = best(c.SPLIT_QUESTION, split(c.PROGRAMME, c.DEMO_SIZE, overlap=c.DEMO_OVERLAP))
    assert not any(has(p, c.SPLIT_ANSWER) for p in sent_cut)
    assert has(top_whole, c.CUT_PHRASE)


# ---------------------------------------------------------------- 5. answering (what search hands to the AI)
@pytest.fixture(scope="module")
def chunks():
    return split(c.PROGRAMME, c.DEMO_SIZE, overlap=c.DEMO_OVERLAP)


def test_with_doc_question_answer_in_best_chunk(chunks):
    (top,) = best(c.WITH_DOC_QUESTION, chunks)
    assert has(top, c.NO_DOC_ANSWER_IN_PROGRAMME)


def test_top1_misses_top3_finds(chunks):
    found = [has(p, c.TOP1_VS_TOP3_ANSWER_IN_PROGRAMME) for p in best(c.TOP1_VS_TOP3_QUESTION, chunks, 3)]
    assert not found[0] and any(found[1:])


def test_out_of_doc_answer_not_in_our_copy():
    for word in c.OUT_OF_DOC_ABSENT:
        assert word not in c.PROGRAMME.lower(), word


def test_wrap_up_answer_in_the_chunks_sent(chunks):
    assert any(has(p, c.MISS_ANSWER) for p in best(c.WRAP_UP_QUESTION, chunks, 3))


# ---------------------------------------------------------------- the numbers the slides show
def test_saved_answers_match_content():
    """The answers in demo_values.json were recorded for today's questions, and show the effect."""
    saved = json.loads((HERE / "demo_values.json").read_text(encoding="utf-8"))["answers"]
    assert set(saved) == {"Qwen/Qwen3-1.7B", "Qwen/Qwen3-0.6B"}
    for model, answers in saved.items():
        assert answers["question_without_documents"] == c.NO_DOC_QUESTION, model
        assert answers["question_with_documents"] == c.WITH_DOC_QUESTION, model
        assert c.NO_DOC_ANSWER not in answers["without_documents"], model
        assert c.NO_DOC_ANSWER in answers["with_documents"], model


def test_demo_values_are_fresh():
    saved = json.loads((HERE / "demo_values.json").read_text(encoding="utf-8"))
    saved.pop("answers")
    assert find_demo_values.minilm_values() == saved
