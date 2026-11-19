"""The built notebook: every code cell hidden, prose complete, and it runs top to bottom."""

import os
from pathlib import Path

import nbformat
import pytest
from nbclient import NotebookClient

import build_notebook

NOTEBOOK = Path(build_notebook.OUTPUT)
BEFORE_SETUP = "Run the Setup box first"


@pytest.fixture(scope="module")
def nb():
    return build_notebook.build()


def code_cells(nb):
    return [cell for cell in nb.cells if cell.cell_type == "code"]


def run(nb, cells):
    trimmed = nbformat.v4.new_notebook(metadata=nb.metadata, cells=cells)
    os.environ["RAG_WORKSHOP_FAKE_LLM"] = "1"
    NotebookClient(trimmed, timeout=600, kernel_name="python3", allow_errors=True,
                   resources={"metadata": {"path": str(Path(build_notebook.__file__).parent)}}).execute()
    return trimmed


def errors(cells):
    return [o for cell in cells if cell.cell_type == "code" for o in cell.outputs if o.output_type == "error"]


def text_of(cell):
    return "".join(o.get("text", "") for o in cell.outputs)


def chunking_cell(nb):
    (cell,) = [c for c in code_cells(nb) if "show_chunking(MODELS)" in c.source]
    return cell


def test_every_code_cell_is_a_form(nb):
    assert len(code_cells(nb)) >= 8
    for cell in code_cells(nb):
        assert cell.source.startswith("#@title "), cell.source[:60]
        assert 'display-mode: "form"' in cell.source.splitlines()[0]
        assert cell.metadata.get("cellView") == "form"


def test_every_section_has_try_this(nb):
    markdown = "\n".join(c.source for c in nb.cells if c.cell_type == "markdown")
    for heading in ("## 0.", "## 1.", "## 2.", "## 3.", "## 4.", "## 5."):
        section = markdown.split(heading, 1)[1].split("\n## ", 1)[0]
        assert "**Do this:**" in section, heading


def test_no_unfilled_placeholders(nb):
    for cell in nb.cells:
        if cell.cell_type == "markdown":
            assert "{DEMO_" not in cell.source and "{OUT_OF_DOC" not in cell.source


def test_setup_inlines_all_code(nb):
    setup = code_cells(nb)[0].source
    for name in ("def make_chunks", "class QwenGenerator", "def show_chunking", "CHARTER = "):
        assert name in setup
    assert "from toolkit import" not in setup and "from content import" not in setup
    assert '_load("' not in setup  # the documents are inlined, Colab has no documents/ folder
    assert "Section 6. Outside requests." in setup


def test_steps_name_real_labels(nb):
    """Every **bold** word in a "Do this" step must be a label on screen, a menu name, or a known term."""
    import re

    import ui

    screen = set(re.findall(r'description="([^"]+)"', Path(ui.__file__).read_text()))
    screen |= {"Whole document (no chunking)", "Fixed size", "Fixed size with overlap", "By sentences"}
    menus = {"Setup", "Runtime", "Change runtime type", "T4 GPU", "Save", "Run anyway", "✅ Ready", "File", "Download",
             "Download .ipynb", "Plain text (.txt)"}
    markdown = "\n".join(c.source for c in nb.cells if c.cell_type == "markdown")
    steps = [line for line in markdown.splitlines() if re.match(r"\s*\d+\. ", line)]
    for line in steps:
        for bold in re.findall(r"\*\*([^*]+)\*\*", line):
            if bold.rstrip(":").isdigit() or bold.startswith(("Section", "Do this")):
                continue
            for part in bold.rstrip(":").split(" > "):  # menu paths like File > Download
                assert part in screen | menus, (bold, line)


def test_committed_notebook_is_fresh(nb):
    committed = nbformat.read(NOTEBOOK, as_version=4)
    assert [(c.cell_type, c.source) for c in committed.cells] == [(c.cell_type, c.source) for c in nb.cells]


def test_executes_headless(nb):
    done = run(nb, list(nb.cells))
    assert errors(done.cells) == []
    assert "Ready" in text_of(code_cells(done)[0])


def test_section_alone_after_setup(nb):
    done = run(nb, [code_cells(nb)[0], chunking_cell(nb)])
    assert errors(done.cells) == []
    assert BEFORE_SETUP not in text_of(done.cells[1])


def test_section_before_setup_message(nb):
    done = run(nb, [chunking_cell(nb)])
    assert errors(done.cells) == []
    assert BEFORE_SETUP in text_of(done.cells[0])
