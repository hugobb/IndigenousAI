"""Answer effects the workshop prose promises. The llm-marked tests load the real Qwen model."""

import os

import pytest

import content as c
from ui import collection_chunks
from toolkit import (
    FakeGenerator,
    MiniLMEmbedder,
    QwenGenerator,
    build_prompt,
    make_chunks,
    rank,
    status_line,
)

# The words a correct answer must contain (the model may phrase the rest freely).
ANSWERS = {
    c.DAYS_QUESTION.question: "45",
    c.VOTE_QUESTION.question: "seven",
    c.CARE_LETTERS_QUESTION.question: "Consent",
    c.WITHDRAW_QUESTION.question: "30",
    c.CARE_FULL_QUESTION.question: "two",
}

LLM = os.environ.get("RAG_WORKSHOP_LLM", "Qwen/Qwen3-1.7B")


def test_fake_generator_streams():
    pieces = list(FakeGenerator().generate(build_prompt("Q?", ["alpha beta"], True)))
    assert len(pieces) > 1
    assert "".join(pieces).startswith("(test answer) ")
    assert "alpha beta" in "".join(pieces)


def test_status_line_copy():
    assert status_line("cuda") == "✅ Ready. You can go on to section 1."
    assert status_line("cpu") == (
        "⚠️ Ready, but there is no GPU, so the AI is slower (up to a minute per answer) and makes more mistakes. "
        "To fix it: click Runtime > Change runtime type > T4 GPU > Save, then click ▶️ on this box again."
    )


@pytest.fixture(scope="module")
def gen():
    return QwenGenerator(LLM, "cpu")


@pytest.fixture(scope="module")
def emb():
    return MiniLMEmbedder("cpu")


def say(gen, prompt):
    text = "".join(gen.generate(prompt))
    print(f"\n--- {LLM}\n{prompt[-160:]}\n>>> {text}")
    return text


def has_all(text, keywords):
    return all(k.lower() in text.lower() for k in keywords)


def top_chunks(emb, question, k=3):
    chunks = collection_chunks()
    hits = rank(emb.embed([question])[0], emb.embed(chunks), k)
    return [chunks[i] for i, _ in hits]


@pytest.mark.llm
def test_no_rag_does_not_know(gen):
    text = say(gen, c.PROBLEM_QUESTION.question)
    assert "45" not in text


@pytest.mark.llm
def test_rag_answers(gen, emb):
    for q in c.CHARTER_QUESTIONS:
        text = say(gen, build_prompt(q.question, top_chunks(emb, q.question), allow_unknown=True))
        first_line = text.strip().splitlines()[0].lower()  # what a participant reads first
        assert ANSWERS[q.question].lower() in first_line, (q.question, text)


@pytest.mark.llm
def test_problem_question_with_rag(gen, emb):
    q = c.PROBLEM_QUESTION
    text = say(gen, build_prompt(q.question, top_chunks(emb, q.question, k=3), allow_unknown=True))
    assert "45" in text


@pytest.mark.llm
def test_storage_question_with_three_passages(gen, emb):
    q = c.STORAGE_QUESTION
    text = say(gen, build_prompt(q.question, top_chunks(emb, q.question, k=3), allow_unknown=True))
    assert "two computers" in text.lower()


@pytest.mark.llm
def test_unknown_instruction(gen, emb):
    q = c.OUT_OF_DOC_QUESTION
    text = say(gen, build_prompt(q, top_chunks(emb, q), allow_unknown=True))
    assert "don't know" in text.lower().replace("’", "'")


@pytest.mark.llm
def test_greedy_repeatable(gen):
    prompt = build_prompt(c.DAYS_QUESTION.question, ["The Council answers every outside request within 45 days."], True)
    assert say(gen, prompt) == say(gen, prompt)


@pytest.mark.llm
def test_chunking_panel_answer_at_good_size(gen, emb):
    chunks = make_chunks(c.CHARTER, "fixed", c.DEMO_GOOD_SIZE, 0)
    (i, _), = rank(emb.embed([c.DAYS_QUESTION.question])[0], emb.embed(chunks), 1)
    text = say(gen, build_prompt(c.DAYS_QUESTION.question, [chunks[i]], allow_unknown=True))
    assert "45" in text
