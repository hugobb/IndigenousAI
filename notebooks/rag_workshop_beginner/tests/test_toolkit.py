import time

import numpy as np
import pytest

import toolkit
from toolkit import (
    FakeGenerator,
    Models,
    ask,
    ask_with_documents,
    search,
    sections,
    split,
    top_passages,
    where_is,
    build_prompt,
    chunk_overlap,
)

WORDS25 = " ".join(f"w{i}" for i in range(25))


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


def test_cosine_same_opposite_unrelated():
    assert toolkit.cosine([1.0, 0.0], [2.0, 0.0]) == pytest.approx(1.0)
    assert toolkit.cosine([1.0, 0.0], [0.0, 3.0]) == pytest.approx(0.0)
    assert toolkit.cosine([1.0, 0.0], [-1.0, 0.0]) == pytest.approx(-1.0)


def test_build_prompt_numbering_and_unknown():
    with_unknown = build_prompt("Q?", ["alpha", "beta"], allow_unknown=True)
    assert "[1] alpha" in with_unknown and "[2] beta" in with_unknown
    assert "I don't know based on these documents." in with_unknown
    assert with_unknown.rstrip().endswith("Question: Q?\nAnswer:")
    without = build_prompt("Q?", ["alpha"], allow_unknown=False)
    assert "I don't know" not in without


def test_model_dtype_full_precision_on_gpu_and_for_the_cpu_fallback():
    """R38: float32 on the GPU (float16 can overflow on a T4) and for Qwen3-0.6B on the CPU (bfloat16 can be
    very slow on Colab's CPUs); other models on the CPU stay in bfloat16, so the 1.7B tests fit this Mac."""
    import torch

    from toolkit import CHAT_MODEL_CPU, CHAT_MODEL_GPU, model_dtype

    assert model_dtype("cuda", CHAT_MODEL_GPU) is torch.float32
    assert model_dtype("cuda", CHAT_MODEL_CPU) is torch.float32
    assert model_dtype("cpu", CHAT_MODEL_CPU) is torch.float32
    assert model_dtype("cpu", CHAT_MODEL_GPU) is torch.bfloat16


def test_qwen_generator_loads_with_the_precision_for_its_model(monkeypatch):
    import torch
    import transformers

    seen = {}

    class Loaded:
        def to(self, device):
            return self

        def eval(self):
            return self

    def from_pretrained(name, **kwargs):
        seen[name] = list(kwargs.values())
        return Loaded()

    monkeypatch.setattr(transformers.AutoModelForCausalLM, "from_pretrained", from_pretrained)
    monkeypatch.setattr(transformers.AutoTokenizer, "from_pretrained", lambda name: object())
    toolkit.QwenGenerator("Qwen/Qwen3-0.6B", "cpu")
    toolkit.QwenGenerator("Qwen/Qwen3-1.7B", "cpu")
    assert seen == {"Qwen/Qwen3-0.6B": [torch.float32], "Qwen/Qwen3-1.7B": [torch.bfloat16]}


def test_stream_worker_reports_failure():
    import pytest
    from transformers import TextIteratorStreamer

    from toolkit import stream_worker

    streamer = TextIteratorStreamer(None, timeout=5)

    def broken():
        raise ValueError("out of memory")

    with pytest.raises(RuntimeError):
        list(stream_worker(broken, streamer))


class FakeEmbedder:
    """Deterministic stand-in for MiniLM: one dimension per keyword."""

    WORDS = ["goal", "stadium", "referee", "tea"]

    def embed(self, texts):
        out = np.array([[t.lower().count(w) + 0.01 for w in self.WORDS] for t in texts], dtype=float)
        return out / np.linalg.norm(out, axis=1, keepdims=True)


@pytest.fixture
def models(monkeypatch):
    m = Models(FakeEmbedder(), FakeGenerator(), "cpu", "fake")
    monkeypatch.setattr(toolkit, "MODELS", m)
    return m


PASSAGES = ["The referee was Slavko Vincic. referee referee", "A goal was scored in extra time. goal goal", "Tea is a drink. tea tea"]


def test_split_sizes_and_count_message(capsys):
    chunks = split(WORDS25, 10)
    assert [len(c.split()) for c in chunks] == [10, 10, 5]
    assert "Cut into 3 chunks." in capsys.readouterr().out


def test_split_overlap_clamped_no_hang(capsys):
    start = time.monotonic()
    chunks = split(WORDS25, 5, overlap=50)
    assert time.monotonic() - start < 1
    assert chunks[-1].split()[-1] == "w24"


def test_split_zero_is_whole_document(capsys):
    assert split(WORDS25, 0) == [WORDS25]
    assert capsys.readouterr().out == "Cut into 1 chunk.\n"


DOC = """Title: T
Source: S

Opening words.

== Background ==
Some background.

== Match ==
=== Extra time ===
A goal came.
=== Aftermath ===
A brawl.
"""


def test_sections_keep_headings():
    assert sections(DOC) == [
        "Introduction\nOpening words.",
        "Background\nSome background.",
        "Match: Extra time\nA goal came.",
        "Match: Aftermath\nA brawl.",
    ]


def test_sections_body_only_has_no_attribution():
    assert sections(DOC.split("\n\n", 1)[1])[0] == "Introduction\nOpening words."


def test_where_is_whole_and_cut(capsys):
    chunks = split(" ".join(f"w{i}" for i in range(30)), 10)
    capsys.readouterr()
    where_is(chunks, "w3 w4")
    assert "chunk 1" in capsys.readouterr().out
    where_is(chunks, "w18 w19 w20 w21")
    out = capsys.readouterr().out
    assert "Chunk 2 ends with" in out and "Chunk 3 starts with" in out
    where_is(chunks, "nowhere")
    assert "not in any chunk" in capsys.readouterr().out


def test_top_passages_orders_and_caps(models):
    result = top_passages("who was the referee?", PASSAGES, top=2)
    assert len(result) == 2
    assert result[0][1] == PASSAGES[0]
    assert result[0][0] >= result[1][0]


def test_search_prints_ranked(models, capsys):
    search("a goal", PASSAGES, top=2)
    lines = capsys.readouterr().out.splitlines()
    assert lines[0].startswith("1. ") and "A goal was scored" in lines[0]
    assert len(lines) == 2


def test_search_shows_a_whole_chunk_and_cuts_long_passages(models, capsys):
    chunk = " ".join(["goal"] * 59 + ["END"])  # 60 words: shown whole
    long = " ".join(["goal"] * 60 + ["HIDDEN"])  # 61 words: cut after 60, with "..."
    search("goal", [chunk, long], top=2)
    out = capsys.readouterr().out
    assert "END" in out and "HIDDEN" not in out
    assert out.count("...") == 1


def test_ask_with_documents_prints_passages_then_answer(models, capsys):
    ask_with_documents("who was the referee?", PASSAGES, top=1)
    out = capsys.readouterr().out
    assert out.index("Passages sent to the AI:") < out.index("1. The referee") < out.index("Answer:")
    assert "(test answer)" in out


def test_ask_prints_answer(models, capsys):
    ask("hello")
    assert capsys.readouterr().out.startswith("Answer:\n")


def test_helpers_need_setup(monkeypatch, capsys):
    monkeypatch.setattr(toolkit, "MODELS", None)
    search("q", PASSAGES)
    ask("q")
    ask_with_documents("q", PASSAGES)
    toolkit.similarity("a", "b")
    assert capsys.readouterr().out == "Run the Setup cell first.\n" * 4


def test_ask_sends_bare_question(models, capsys):
    seen = []

    class Recorder:
        def generate(self, prompt):
            seen.append(prompt)
            yield "ok"

    models.generator = Recorder()
    ask("Who won the 2026 final?")
    assert seen == ["Who won the 2026 final?"]


def test_where_is_no_false_cut(capsys):
    where_is(["alpha beta the", "gamma delta"], "the final")
    out = capsys.readouterr().out
    assert "not in any chunk" in out
    assert "cut" not in out


def test_where_is_cut_before_punctuation(capsys):
    """The phrase ends where the sentence ends: the chunk has "foul." and the phrase has "foul"."""
    where_is(["a b the goal was", "disallowed because of a foul. More text"], "the goal was disallowed because of a foul")
    assert "was cut in two, between chunk 1 and chunk 2" in capsys.readouterr().out


@pytest.mark.parametrize("version, name", [("4.51.3", "torch_dtype"), ("4.55.4", "torch_dtype"),
                                           ("4.56.0", "dtype"), ("5.23.0", "dtype"), ("5.0.0.dev0", "dtype")])
def test_dtype_argument_follows_transformers_version(monkeypatch, version, name):
    """transformers renamed torch_dtype to dtype in 4.56: older versions crash on dtype=, newer ones
    warn on torch_dtype= under the Setup cell."""
    import torch
    import transformers

    from toolkit import dtype_argument

    monkeypatch.setattr(transformers, "__version__", version)
    assert dtype_argument("cpu", "Qwen/Qwen3-1.7B") == {name: torch.bfloat16}
    assert dtype_argument("cpu", "Qwen/Qwen3-0.6B") == {name: torch.float32}
    assert dtype_argument("cuda", "Qwen/Qwen3-1.7B") == {name: torch.float32}
