"""The widgets, driven the way a participant would: set values, click buttons."""

import pytest

import content as c
import ui
from toolkit import FakeGenerator, MiniLMEmbedder, Models, build_prompt, make_chunks


@pytest.fixture(scope="module")
def emb():
    return MiniLMEmbedder("cpu")


@pytest.fixture
def models(emb):
    return Models(emb, FakeGenerator(), "cpu", "fake")


# ---------------------------------------------------------------- chunking
def test_chunking_count_updates_live(models):
    box = ui.show_chunking(models)
    ctl = box.controls
    ctl["strategy"].value = "fixed"
    ctl["size"].value = 50
    assert f"{len(make_chunks(c.CHARTER, 'fixed', 50, 0))} chunks" in ctl["count"].value
    ctl["size"].value = 100
    assert f"{len(make_chunks(c.CHARTER, 'fixed', 100, 0))} chunks" in ctl["count"].value


def test_chunking_overlap_slider_disabled_unless_overlap(models):
    ctl = ui.show_chunking(models).controls
    ctl["strategy"].value = "fixed"
    assert ctl["overlap"].disabled
    ctl["strategy"].value = "overlap"
    assert not ctl["overlap"].disabled


def test_chunking_whole_document_one_chunk(models):
    ctl = ui.show_chunking(models).controls
    ctl["strategy"].value = "whole"
    assert "1 chunk" in ctl["count"].value
    assert "1 chunks" not in ctl["count"].value


def test_chunking_sentences_switches_slider_range(models):
    ctl = ui.show_chunking(models).controls
    ctl["strategy"].value = "sentences"
    assert (ctl["size"].min, ctl["size"].max) == (1, 10)
    ctl["strategy"].value = "fixed"
    assert (ctl["size"].min, ctl["size"].max) == (5, 200)


def test_chunking_top_chunk_shown(models):
    ctl = ui.show_chunking(models).controls
    ctl["strategy"].value = "fixed"
    ctl["size"].value = c.DEMO_GOOD_SIZE
    ctl["question"].value = c.DAYS_QUESTION.question
    assert "within 45 days" in ctl["top"].value


def test_chunking_ask_uses_top_chunk(models):
    ctl = ui.show_chunking(models).controls
    ctl["strategy"].value = "fixed"
    ctl["size"].value = c.DEMO_GOOD_SIZE
    ctl["question"].value = c.DAYS_QUESTION.question
    ctl["ask"].click()
    assert "(test answer)" in ctl["answer"].value
    assert "45" in ctl["answer"].value


# ---------------------------------------------------------------- empty input (Review Focus 2)
def test_similarity_empty_input_message(models):
    ctl = ui.show_similarity(models).controls
    ctl["a"].value = "   "
    ctl["compare"].click()
    assert "Type a sentence first." in ctl["result"].value


def test_search_empty_input_message(models):
    ctl = ui.show_search(models).controls
    ctl["question"].value = ""
    ctl["search"].click()
    assert "Type a question first." in ctl["results"].value


def test_generation_empty_input_message(models):
    ctl = ui.show_generation(models).controls
    ctl["question"].value = " "
    ctl["ask"].click()
    assert "Type a question first." in ctl["prompt"].value


def test_map_empty_input_message(models):
    ctl = ui.show_meaning_map(models).controls
    ctl["sentence"].value = ""
    ctl["add"].click()
    assert "Type a sentence first." in ctl["message"].value


# ---------------------------------------------------------------- the rest
def test_similarity_scores_pair(models):
    ctl = ui.show_similarity(models).controls
    ctl["pair"].value = 1
    assert ctl["a"].value == c.SIMILARITY_PAIRS[1][0]
    ctl["compare"].click()
    assert "Score" in ctl["result"].value


def test_search_ranks_all_passages(models):
    ctl = ui.show_search(models).controls
    ctl["search"].click()
    html = ctl["results"].value
    assert html.count('class="rag-row') == len(c.CHARTER_SECTIONS)
    assert html.index("Section 8.") < html.index("Section 1.")


def test_map_is_a_png_picture(models):
    # Plotly needs JavaScript, which Colab does not run inside a widget, so the map is a PNG.
    plot = ui.show_meaning_map(models).controls["plot"]
    assert plot.value[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(plot.value) > 10_000


def test_map_add_and_reset(models):
    box = ui.show_meaning_map(models)
    ctl = box.controls

    def mine():
        return len(box.map_state["mine"])

    assert mine() == 0
    ctl["sentence"].value = "Salmon swim upstream in autumn."
    ctl["add"].click()
    assert mine() == 1
    ctl["reset"].click()
    assert mine() == 0


class WatchingGenerator(FakeGenerator):
    """Records whether the Ask button was disabled while the answer was being written."""

    button = None
    seen = None

    def generate(self, prompt):
        WatchingGenerator.seen = self.button.disabled
        yield from super().generate(prompt)


def test_ask_button_disabled_while_streaming(emb):
    gen = WatchingGenerator()
    ctl = ui.show_generation(Models(emb, gen, "cpu", "fake")).controls
    gen.button = ctl["ask"]
    ctl["ask"].click()
    assert WatchingGenerator.seen is True
    assert ctl["ask"].disabled is False


def test_generation_shows_exact_prompt(models):
    ctl = ui.show_generation(models).controls
    ctl["topk"].value = 2
    ctl["unknown"].value = False
    ctl["ask"].click()
    expected = build_prompt(ctl["question"].value, ui.retrieve(models, ctl["question"].value, 2), False)
    assert ctl["prompt_text"] == expected
    assert "(test answer)" in ctl["rag"].value
    assert "(test answer)" in ctl["norag"].value


# ---------------------------------------------------------------- uploads (Review Focus 5)
def test_upload_rejects_bad_files():
    chunks, messages = ui.load_uploads(
        {
            "empty.txt": b"",
            "broken.txt": b"\xff\xfe\xfa not text",
            "report.pdf": b"%PDF-1.4",
            "notes.txt": ("word " * 120).encode(),
        }
    )
    joined = " ".join(messages)
    assert "empty.txt" in joined and "broken.txt" in joined and "report.pdf" in joined
    assert "notes.txt" not in joined
    assert len(chunks) >= 2


class BrokenGenerator(FakeGenerator):
    def generate(self, prompt):
        yield "Half an "
        raise RuntimeError("The model stopped with an error")


def test_failed_generation_shows_message(emb):
    ctl = ui.show_chunking(Models(emb, BrokenGenerator(), "cpu", "fake")).controls
    ctl["ask"].click()
    assert "Something went wrong" in ctl["answer"].value
    assert ctl["ask"].disabled is False


class CountingGenerator(FakeGenerator):
    calls = 0

    def generate(self, prompt):
        CountingGenerator.calls += 1
        yield from super().generate(prompt)


def test_double_click_runs_once(emb):
    CountingGenerator.calls = 0
    ctl = ui.show_problem(Models(emb, CountingGenerator(), "cpu", "fake")).controls
    ctl["ask"].click()
    ctl["ask"].click()  # a second click queued while the first answer was being written
    assert CountingGenerator.calls == 1


def test_upload_widget_value_formats():
    v8 = ({"name": "a.txt", "content": memoryview(b"hello")},)
    v7 = {"a.txt": {"metadata": {"name": "a.txt"}, "content": b"hello"}}
    assert ui.files_from_widget(v8) == {"a.txt": b"hello"}
    assert ui.files_from_widget(v7) == {"a.txt": b"hello"}
