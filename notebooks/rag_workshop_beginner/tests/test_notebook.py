"""The built notebook: plain code cells, copy that follows the rules, and it runs top to bottom."""

import os
import re
from pathlib import Path

import nbformat
import pytest
from nbclient import NotebookClient

import build_notebook
import content as c

HERE = Path(build_notebook.__file__).parent
NOTEBOOK = Path(build_notebook.OUTPUT)
SECTIONS = ["0.", "1.", "2.", "3.", "4.", "5.", "6.", "Bonus"]
# Bold in a numbered step must be something the participant can find on screen.
ON_SCREEN = {
    "Runtime", "Change runtime type", "T4 GPU", "Save", "Setup", "Run anyway", "✅ Ready",
    "File", "Download", "Download .ipynb", "Plain text (.txt)", "Save As", "Plain Text",
    "Choose Files", "Browse",
}
BANNED = ["Think of it as", "What if", "What you'll see", "What to notice", "Imagine", "Let's dive", "delve"]
UPLOAD_STAND_IN = "my_text = ARTICLE  # stand-in for the upload, which needs a browser"


@pytest.fixture(scope="module")
def nb():
    return build_notebook.build()


def code_cells(cells):
    return [cell for cell in cells if cell.cell_type == "code"]


def setup_of(nb):
    (cell,) = [cell for cell in code_cells(nb.cells) if cell.source.startswith("#@title Setup")]
    return cell


def visible(nb):
    """What participants read and run: everything but the Setup cell (which inlines the article)."""
    setup = setup_of(nb)
    return [cell for cell in nb.cells if cell is not setup]


def by_section(nb) -> dict[str, list]:
    """The cells under each '## ' heading, keyed by the heading's first word ('0.', ..., 'Bonus')."""
    out: dict[str, list] = {}
    name = None
    for cell in nb.cells:
        if cell.cell_type == "markdown":
            for line in cell.source.splitlines():
                if line.startswith("## "):
                    name = line[3:].split()[0].rstrip(":")
                    out[name] = []
        if name:
            out[name].append(cell)
    return out


def markdown(cells) -> str:
    return "\n".join(cell.source for cell in cells if cell.cell_type == "markdown")


def is_upload(cell) -> bool:
    """The bonus cell that opens Colab's file picker (it needs a browser)."""
    return cell.cell_type == "code" and cell.source.startswith("from google.colab import files")


def run(nb, cells):
    cells = [nbformat.v4.new_code_cell(UPLOAD_STAND_IN) if is_upload(cell) else cell for cell in cells]
    trimmed = nbformat.v4.new_notebook(metadata=nb.metadata, cells=cells)
    os.environ["RAG_WORKSHOP_FAKE_LLM"] = "1"
    NotebookClient(trimmed, timeout=600, kernel_name="python3", allow_errors=True,
                   resources={"metadata": {"path": str(HERE)}}).execute()
    return trimmed


def errors(cells):
    return [o for cell in code_cells(cells) for o in cell.outputs if o.output_type == "error"]


def text_of(cell) -> str:
    return "".join(o.get("text", "") for o in cell.outputs)


def output_of(done, snippet: str) -> str:
    (cell,) = [cell for cell in code_cells(done.cells) if snippet in cell.source and not cell.source.startswith("#@title")]
    return text_of(cell)


# ---------------------------------------------------------------- structure
def test_sections_in_order(nb):
    assert list(by_section(nb)) == SECTIONS


def test_every_section_has_code_cell(nb):
    for name, cells in by_section(nb).items():
        assert code_cells(cells), name


def test_every_section_has_do_this(nb):
    for name, cells in by_section(nb).items():
        assert "**Do this:**" in markdown(cells), name


def test_code_cells_are_short_and_visible(nb):
    for cell in code_cells(visible(nb)):
        assert len(cell.source.splitlines()) <= 4, cell.source
        assert "cellView" not in cell.metadata and not cell.source.startswith("#@title")


def test_setup_inlines_all_code(nb):
    setup = setup_of(nb)
    assert setup.metadata.get("cellView") == "form"
    for name in ("def split", "def ask_with_documents", "class QwenGenerator", "ARTICLE = ", "MODELS = load_models()"):
        assert name in setup.source
    assert "from toolkit import" not in setup.source and "from content import" not in setup.source
    assert '_load("' not in setup.source  # the article is inlined: Colab has no documents/ folder
    assert "== Background ==" in setup.source


# Colab's huggingface_hub prints this on the first model download when no HF_TOKEN secret is set (it starts
# with a newline). The models are public, so no token is needed.
HF_TOKEN_NOTICE = (
    "\nThe secret `HF_TOKEN` does not exist in your Colab secrets.\nTo authenticate with the Hugging Face Hub, "
    "create a token in your settings tab (https://huggingface.co/settings/tokens), set it as secret in your "
    "Google Colab and restart your session.\nYou will be able to reuse this secret in all of your notebooks.\n"
    "Please note that authentication is recommended but still optional to access public models or datasets."
)


def test_setup_hides_only_the_hf_token_notice(nb):
    import warnings

    lines = [line for line in setup_of(nb).source.splitlines()
             if line.startswith("warnings.filterwarnings(") and "HF_TOKEN" in line]
    assert len(lines) == 1, lines
    with warnings.catch_warnings(record=True) as shown:
        warnings.simplefilter("always")
        exec(lines[0], {"warnings": warnings})
        warnings.warn(HF_TOKEN_NOTICE)
        warnings.warn("\nError while fetching `HF_TOKEN` secret value from your vault: 'boom'.")  # a real error
        warnings.warn("Some other warning about HF_TOKEN")
    assert [str(w.message) for w in shown] == [
        "\nError while fetching `HF_TOKEN` secret value from your vault: 'boom'.",
        "Some other warning about HF_TOKEN",
    ]


def test_no_widgets(nb):
    assert "ipywidgets" not in nbformat.writes(nb)
    assert "ipywidgets" not in NOTEBOOK.read_text(encoding="utf-8")
    assert "ipywidgets" not in (HERE / "requirements.txt").read_text()


def test_no_unfilled_placeholders(nb):
    for cell in visible(nb):
        assert not build_notebook.PLACEHOLDER.search(cell.source), cell.source[:80]


def test_no_link_to_the_ollama_notebook(nb):
    assert "ollama_rag_workshop" not in nbformat.writes(nb)


def test_no_old_documents(nb):
    """The CARE paper, the fictional charter and any Indigenous example left this notebook.
    "IndigenousAI" is the repository's name, in the Colab link."""
    text = nbformat.writes(nb)
    for pattern in (r"\bCARE\b", r"(?i)charter", r"(?i)fictional", r"(?i)indigenous(?!AI)"):
        assert not re.search(pattern, text), pattern


def test_says_the_article_is_a_shortened_copy(nb):
    """The full article names the halftime performers; only our shortened copy leaves them out."""
    text = markdown(visible(nb))
    assert "a shortened copy of the Wikipedia article" in text
    assert "we removed the part that says who performed" in text


# ---------------------------------------------------------------- copy rules
def test_copy_rules(nb):
    for cell in visible(nb):
        assert "—" not in cell.source, cell.source[:80]
        for phrase in BANNED:
            assert phrase.lower() not in cell.source.lower(), phrase


def test_bold_only_for_do_this_and_on_screen_labels(nb):
    for line in markdown(visible(nb)).splitlines():
        bolds = re.findall(r"\*\*([^*]+)\*\*", line)
        if not bolds:
            continue
        if line.strip() == "**Do this:**":
            continue
        assert re.match(r"\s*\d+\. ", line), line  # bold only inside a numbered step
        for bold in bolds:
            for part in bold.split(" > "):  # menu paths like File > Download
                assert part in ON_SCREEN, (bold, line)


def test_do_this_is_followed_by_numbered_steps(nb):
    lines = markdown(visible(nb)).splitlines()
    for i, line in enumerate(lines):
        if line.strip() == "**Do this:**":
            assert lines[i + 1].startswith("1. "), lines[i : i + 2]


def test_sentences_are_short(nb):
    prose = re.sub(r"`[^`]*`|\(https?://[^)]*\)|https?://\S+", "", markdown(visible(nb)))
    for sentence in re.split(r"(?<=[.!?])\s+|\n", prose):
        assert len(sentence.split()) <= 30, sentence


# ---------------------------------------------------------------- freshness and execution
def test_committed_notebook_is_fresh(nb):
    committed = nbformat.read(NOTEBOOK, as_version=4)
    assert [(cell.cell_type, cell.source) for cell in committed.cells] == [(cell.cell_type, cell.source) for cell in nb.cells]


@pytest.fixture(scope="module")
def done(nb):
    return run(nb, list(nb.cells))


def test_executes_headless(done):
    assert errors(done.cells) == []
    assert "Ready" in text_of(setup_of(done))
    for notice in ("Warning", "NOTE:"):  # tqdm's "IProgress not found", torch's macOS "NOTE: Redirects..."
        assert notice not in text_of(setup_of(done)), notice
    for cell in code_cells(done.cells):
        if cell.source != UPLOAD_STAND_IN:
            assert text_of(cell).strip(), cell.source  # every cell shows something


def test_cells_show_the_promised_results(done):
    hit = output_of(done, c.HIT_QUESTION).splitlines()
    assert hit[0].startswith("1. ") and c.HIT_SECTION in hit[0]
    assert c.MISS_SECTION not in output_of(done, f'search("{c.MISS_QUESTION}", passages)')
    nonsense = output_of(done, c.NONSENSE_QUESTION)
    assert all(float(line.split()[1]) < 0.3 for line in nonsense.splitlines())
    found = output_of(done, f'search("{c.MISS_QUESTION}", chunks)').splitlines()
    assert found[0].startswith("Cut into ")
    assert c.MISS_ANSWER in found[1]  # the name is in the first result, on screen
    cut = output_of(done, f"words_per_chunk={c.DEMO_SIZE})\nwhere_is(")
    assert "was cut in two" in cut
    restored = output_of(done, f"overlap={c.DEMO_OVERLAP})\nwhere_is(")
    assert "is in chunk" in restored and "cut" not in restored
    top1 = output_of(done, "top=1)")
    assert top1.count("\n1. ") == 1 and "\n2. " not in top1


@pytest.mark.parametrize("section", SECTIONS)
def test_section_alone_after_setup(nb, section):
    setup = setup_of(nb)
    cells = [setup] + [cell for cell in code_cells(by_section(nb)[section]) if cell is not setup]
    done = run(nb, cells)  # section 0's only code cell is the Setup cell itself
    assert errors(done.cells) == []
