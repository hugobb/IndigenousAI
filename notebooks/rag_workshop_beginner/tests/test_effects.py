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
    return [p.splitlines()[0] for _, p in top_passages(question, sections(c.ARTICLE), top)]


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
def test_article_is_the_text_without_the_attribution_block():
    assert c.ARTICLE.startswith("The final match of the 2026 FIFA World Cup")
    assert "Title:" not in c.ARTICLE and "License:" not in c.ARTICLE
    assert c.ARTICLE_URL.endswith(f"oldid={c.ARTICLE_REVISION}") and c.ARTICLE_REVISION.isdigit()


def test_the_eight_sections_named_in_section_3():
    names = [p.splitlines()[0] for p in sections(c.ARTICLE)]
    text = (HERE / "cells" / "03-search.md").read_text()
    listed = text.split("There are 8: ", 1)[1].split(".\n", 1)[0].replace(", and ", ", ").split(", ")
    assert listed == names and len(names) == 8


def test_facts_quoted_in_the_notebook_are_in_the_article():
    for fact in ["July 19, 2026", "1–0 victory for Spain", "extra time", "include a halftime show, which caused the full "
                 "halftime break to last over 27 minutes", c.MISS_ANSWER, c.CUT_PHRASE]:
        assert fact in c.ARTICLE, fact


# ---------------------------------------------------------------- 2. embeddings
def test_embedding_has_384_numbers():
    assert toolkit.MODELS.embedder.embed(["Spain won the final."]).shape == (1, 384)


def test_section_2_compares_one_sentence_with_three_others():
    """ "The cell below compares "Spain won the final." with three other sentences." """
    assert c.SAME_MEANING[0] == c.SAME_WORD[0] == c.UNRELATED[0]


def test_low_scores_are_low():
    """ "It shares the word "final" with the first one, but its score is low." (close to 0 means unrelated)"""
    assert score(*c.SAME_WORD) < 0.2 and score(*c.UNRELATED) < 0.2


def test_similarity_pairs_order():
    same, word, unrelated = score(*c.SAME_MEANING), score(*c.SAME_WORD), score(*c.UNRELATED)
    assert same > word and same > unrelated


def test_pairs_share_the_words_the_text_says():
    a, b = (set(re.findall(r"[a-z]+", s.lower())) - {"the", "a"} for s in c.SAME_MEANING)
    assert not a & b  # same meaning, no shared word
    a, b = (set(re.findall(r"[a-z]+", s.lower())) for s in c.SAME_WORD)
    assert a & b == {"final"}


def test_love_hate_close():
    assert score(*c.LOVE_HATE) > 0.5


# ---------------------------------------------------------------- 3. search over the sections
def test_hit_question_first():
    assert headings(c.HIT_QUESTION, 1) == [c.HIT_SECTION]


def test_miss_question_not_first():
    answer_section = next(p for p in sections(c.ARTICLE) if p.startswith(c.MISS_SECTION + "\n"))
    assert c.MISS_ANSWER in answer_section
    assert c.MISS_SECTION not in headings(c.MISS_QUESTION, 3)  # "Is the Introduction in the list?" No.


def test_nonsense_scores_low():
    assert all(s < 0.3 for s, _ in top_passages(c.NONSENSE_QUESTION, sections(c.ARTICLE), 8))


# ---------------------------------------------------------------- 4. splitting
def test_model_reads_about_200_words():
    assert 190 <= words_read(c.ARTICLE) <= 210
    for passage in sections(c.ARTICLE):
        read = words_read(passage)
        assert 170 <= read <= 210 and len(passage.split()) > read, passage.splitlines()[0]


def test_chunks_find_what_the_sections_missed():
    (top,) = best(c.MISS_QUESTION, split(c.ARTICLE, c.DEMO_SIZE))
    assert c.MISS_ANSWER in toolkit._short(top)  # in the first result, and on screen


def test_tiny_size_loses_answer():
    assert not any(c.MISS_ANSWER in p for p in best(c.MISS_QUESTION, split(c.ARTICLE, c.TINY_SIZE), 3))


def test_whole_article_scores_lower():
    ((whole, _),) = top_passages(c.MISS_QUESTION, split(c.ARTICLE, 0), 1)
    ((chunked, _),) = top_passages(c.MISS_QUESTION, split(c.ARTICLE, c.DEMO_SIZE), 1)
    assert whole < chunked


def test_cut_at_demo_size(capsys):
    chunks = split(c.ARTICLE, c.DEMO_SIZE)
    capsys.readouterr()
    where_is(chunks, c.CUT_PHRASE)
    out = capsys.readouterr().out
    assert "was cut in two" in out
    assert "starts with: disallowed because Merino" in out  # the reason itself is in the next chunk


def test_overlap_restores(capsys):
    chunks = split(c.ARTICLE, c.DEMO_SIZE, overlap=c.DEMO_OVERLAP)
    capsys.readouterr()
    where_is(chunks, c.CUT_PHRASE)
    out = capsys.readouterr().out
    assert "is in chunk" in out and "cut" not in out


def test_split_question_gets_the_reason_only_with_overlap():
    """Section 5: "Look at the chunks sent to the AI: is the reason still there?" With overlap 0: no."""
    sent_cut = best(c.SPLIT_QUESTION, split(c.ARTICLE, c.DEMO_SIZE), 3)
    (top_whole,) = best(c.SPLIT_QUESTION, split(c.ARTICLE, c.DEMO_SIZE, overlap=c.DEMO_OVERLAP))
    assert not any(has(p, "Merino had stepped") for p in sent_cut)
    assert has(top_whole, c.CUT_PHRASE)


# ---------------------------------------------------------------- 5. answering (what search hands to the AI)
@pytest.fixture(scope="module")
def chunks():
    return split(c.ARTICLE, c.DEMO_SIZE, overlap=c.DEMO_OVERLAP)


def test_with_doc_question_answer_in_best_chunk(chunks):
    (top,) = best(c.WITH_DOC_QUESTION, chunks)
    assert has(top, c.NO_DOC_ANSWER_IN_ARTICLE)


def test_top1_misses_top3_finds(chunks):
    found = [has(p, c.TOP1_VS_TOP3_ANSWER_IN_ARTICLE) for p in best(c.TOP1_VS_TOP3_QUESTION, chunks, 3)]
    assert not found[0] and any(found[1:])


def test_out_of_doc_answer_not_in_our_copy():
    for word in c.OUT_OF_DOC_ABSENT:
        assert word not in c.ARTICLE.lower(), word


def test_wrap_up_answer_in_best_chunk(chunks):
    (top,) = best(c.WRAP_UP_QUESTION, chunks)
    assert has(top, c.WRAP_UP_ANSWER)


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
