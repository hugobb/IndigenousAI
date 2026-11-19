"""Answer effects the workshop prose promises. The llm-marked tests load the real Qwen model."""

import os

import pytest

import content as c
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
    c.VAN_QUESTION.question: "Harlow Valley",
    c.RECORDS_QUESTION.question: "data training",
    c.POLLUTION_QUESTION.question: "Fenwick Bridge",
    c.MEETING_QUESTION.question: "March 14",
}

LLM = os.environ.get("RAG_WORKSHOP_LLM", "Qwen/Qwen3-1.7B")


def test_fake_generator_streams():
    pieces = list(FakeGenerator().generate(build_prompt("Q?", ["alpha beta"], True)))
    assert len(pieces) > 1
    assert "".join(pieces).startswith("(test answer) ")
    assert "alpha beta" in "".join(pieces)


def test_status_line_copy():
    assert status_line("cuda") == "✅ Ready — using the GPU. Answers take a few seconds."
    assert status_line("cpu") == (
        "⚠️ Ready, but without a GPU: answers will be slow and a bit less accurate. "
        "To fix it: menu Runtime → Change runtime type → T4 GPU → Save, then run this cell again."
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
    chunks = make_chunks(c.REPORT, "fixed", c.DEMO_GOOD_SIZE, 0)
    hits = rank(emb.embed([question])[0], emb.embed(chunks), k)
    return [chunks[i] for i, _ in hits]


@pytest.mark.llm
def test_no_rag_does_not_know(gen):
    text = say(gen, c.PROBLEM_QUESTION.question)
    assert not any(k.lower() in text.lower() for k in c.PROBLEM_QUESTION.keywords)


@pytest.mark.llm
def test_rag_answers(gen, emb):
    for q in c.REPORT_QUESTIONS:
        text = say(gen, build_prompt(q.question, top_chunks(emb, q.question), allow_unknown=True))
        assert ANSWERS[q.question].lower() in text.lower(), q.question


@pytest.mark.llm
def test_problem_question_with_rag(gen, emb):
    q = c.PROBLEM_QUESTION
    text = say(gen, build_prompt(q.question, top_chunks(emb, q.question, k=3), allow_unknown=True))
    assert "march 14" in text.lower()


@pytest.mark.llm
def test_unknown_instruction(gen, emb):
    q = c.OUT_OF_DOC_QUESTION
    text = say(gen, build_prompt(q, top_chunks(emb, q), allow_unknown=True))
    assert "don't know" in text.lower().replace("’", "'")


@pytest.mark.llm
def test_greedy_repeatable(gen):
    prompt = build_prompt(c.VAN_QUESTION.question, ["The van was paid for by the Harlow Valley Community Fund."], True)
    assert say(gen, prompt) == say(gen, prompt)
