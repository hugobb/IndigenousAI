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


def test_fake_generator_streams():
    pieces = list(FakeGenerator().generate(build_prompt("Q?", ["alpha beta"], True)))
    assert len(pieces) > 1
    assert "".join(pieces).startswith("(test answer) ")
    assert "alpha beta" in "".join(pieces)


def test_status_line_copy():
    """No GPU step any more: both cases say Ready, and none points to the Runtime menu."""
    assert status_line("cuda") == "✅ Ready. You can go on to section 1."
    assert status_line("cpu") == "✅ Ready. You can go on to section 1. Each answer takes up to a minute."


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


def chunks(size: int = c.SIZE) -> list[str]:
    return split(c.PROGRAMME, size, c.OVERLAP)


# ---------------------------------------------------------------- 3. generation: alone, then with the chunks
@pytest.mark.llm
def test_bare_model_does_not_know(models, capsys):
    assert plain(c.NAME) not in plain(answer(capsys, ask, c.QUESTION))


@pytest.mark.llm
def test_with_documents_answers(models, capsys):
    assert plain(c.NAME) in plain(answer(capsys, ask_with_documents, c.QUESTION, chunks()))


@pytest.mark.llm
def test_greedy_repeatable(models):
    prompt = build_prompt(c.QUESTION, chunks()[:3], allow_unknown=True)
    first, second = ("".join(toolkit.MODELS.generator.generate(prompt)) for _ in range(2))
    assert first == second
