"""The answer effects the notebook text promises, checked with both answer models.

Colab gives a participant Qwen3-1.7B on a GPU and Qwen3-0.6B without one, so every effect is
checked on both. The tests call the notebook's own helpers (ask, ask_with_documents) and read
what they print. Run one model per process, so only one is in memory:

    uv run --with-requirements requirements.txt pytest -q -m llm -k 1.7B    # about 4 GB
    uv run --with-requirements requirements.txt pytest -q -m llm -k 0.6B    # about 3.5 GB (float32)

Here on the CPU, Qwen3-0.6B runs in float32, as on Colab without a GPU, and Qwen3-1.7B in bfloat16;
on Colab's GPU, Qwen3-1.7B runs in float32.
"""

import gc
import unicodedata

import pytest

import content as c
import toolkit
from toolkit import FakeGenerator, MiniLMEmbedder, Models, QwenGenerator, ask, ask_with_documents, build_prompt, split, status_line

ANSWER_MODELS = {"1.7B": "Qwen/Qwen3-1.7B", "0.6B": "Qwen/Qwen3-0.6B"}
DONT_KNOW = "don't know"


def test_fake_generator_streams():
    pieces = list(FakeGenerator().generate(build_prompt("Q?", ["alpha beta"], True)))
    assert len(pieces) > 1
    assert "".join(pieces).startswith("(test answer) ")
    assert "alpha beta" in "".join(pieces)


def test_status_line_copy():
    assert status_line("cuda") == "✅ Ready. You can go on to section 1."
    slow = "⚠️ Ready, but there is no GPU, so the AI is slower (up to a minute per answer) and makes more mistakes. You can carry on."
    assert status_line("cpu", in_colab=False) == slow  # on a laptop there is no Runtime menu to point to
    assert status_line("cpu", in_colab=True) == (
        slow + " To get a GPU: click Runtime > Change runtime type > T4 GPU > Save, then click ▶️ on this cell again."
    )


def test_status_line_knows_it_is_not_in_colab():
    assert status_line("cpu") == status_line("cpu", in_colab=False)  # the tests do not run in Colab


@pytest.fixture(scope="module", params=list(ANSWER_MODELS))
def models(request):
    name = ANSWER_MODELS[request.param]
    toolkit.MODELS = Models(MiniLMEmbedder("cpu"), QwenGenerator(name, "cpu"), "cpu", name)
    yield toolkit.MODELS
    toolkit.MODELS = None
    gc.collect()


def plain(text: str) -> str:
    """Lower case, no accents, straight apostrophes: "Fernández" and "fernandez" match."""
    text = unicodedata.normalize("NFKD", text.replace("’", "'"))
    return "".join(ch for ch in text if not unicodedata.combining(ch)).lower()


def answer(capsys, helper, *args, **kwargs) -> str:
    """Run a notebook helper and return the answer it prints (the text after "Answer:")."""
    capsys.readouterr()
    helper(*args, **kwargs)
    out = capsys.readouterr().out
    with capsys.disabled():
        print(f"\n--- {toolkit.MODELS.llm_name} | {helper.__name__}{args[:1]} {kwargs}\n{out.rstrip()}")
    return out.split("Answer:\n", 1)[1].strip()


def chunks(overlap: int = c.DEMO_OVERLAP) -> list[str]:
    return split(c.PROGRAMME, c.DEMO_SIZE, overlap=overlap)


# ---------------------------------------------------------------- 1. the AI alone
@pytest.mark.llm
def test_bare_model_does_not_know_the_teachers(models, capsys):
    assert plain(c.TEACHER) not in plain(answer(capsys, ask, c.TEACHERS_QUESTION))


@pytest.mark.llm
def test_bare_model_does_not_know_the_answer(models, capsys):
    assert plain(c.NO_DOC_ANSWER) not in plain(answer(capsys, ask, c.NO_DOC_QUESTION))


# ---------------------------------------------------------------- 5. answering
@pytest.mark.llm
def test_with_documents_answers(models, capsys):
    assert plain(c.NO_DOC_ANSWER) in plain(answer(capsys, ask_with_documents, c.WITH_DOC_QUESTION, chunks()))


@pytest.mark.llm
def test_top1_misses_top3_finds(models, capsys):
    one = answer(capsys, ask_with_documents, c.TOP1_VS_TOP3_QUESTION, chunks(), top=1)
    three = answer(capsys, ask_with_documents, c.TOP1_VS_TOP3_QUESTION, chunks(), top=3)
    assert plain(c.TOP1_VS_TOP3_ANSWER) not in plain(one)
    assert plain(c.TOP1_VS_TOP3_ANSWER) in plain(three)


@pytest.mark.llm
def test_out_of_doc_says_dont_know(models, capsys):
    told = answer(capsys, ask_with_documents, c.OUT_OF_DOC_QUESTION, chunks(), say_dont_know=True)
    untold = answer(capsys, ask_with_documents, c.OUT_OF_DOC_QUESTION, chunks(), say_dont_know=False)
    assert DONT_KNOW in plain(told)
    assert DONT_KNOW not in plain(untold)  # "Compare the two answers": they differ


@pytest.mark.llm
def test_overlap_restores_the_answer(models, capsys):
    whole = answer(capsys, ask_with_documents, c.SPLIT_QUESTION, chunks())
    cut = answer(capsys, ask_with_documents, c.SPLIT_QUESTION, chunks(overlap=0))
    assert plain(c.SPLIT_ANSWER) in plain(whole)
    assert plain(c.SPLIT_ANSWER) not in plain(cut)  # the chunks sent no longer hold the reason


@pytest.mark.llm
def test_wrap_up_question_answers(models, capsys):
    assert plain(c.WRAP_UP_ANSWER) in plain(answer(capsys, ask_with_documents, c.WRAP_UP_QUESTION, chunks()))


@pytest.mark.llm
def test_greedy_repeatable(models):
    prompt = build_prompt(c.WITH_DOC_QUESTION, chunks()[:3], allow_unknown=True)
    first, second = ("".join(toolkit.MODELS.generator.generate(prompt)) for _ in range(2))
    assert first == second
