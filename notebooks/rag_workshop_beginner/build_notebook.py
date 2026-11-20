"""Assemble rag_workshop_beginner.ipynb from cells/*.md, content.py and toolkit.py.

Run:  uv run --with-requirements requirements.txt python build_notebook.py

In the cell files:
  ```python ... ```   becomes a code cell that participants see, run and change;
  everything else     becomes Markdown (a ``` fence with no language stays Markdown);
  {NAME}, {NAME[0]}   is replaced by that value from content.py (e.g. {HIT_QUESTION}).
After the first cell file comes the Setup cell: a collapsed form that holds content.py and
toolkit.py and loads the two models.
"""

import ast
import re
from pathlib import Path

import nbformat

import content

HERE = Path(__file__).resolve().parent
OUTPUT = HERE.parent / "rag_workshop_beginner.ipynb"
MODULES = ["content.py", "toolkit.py"]
LOCAL = {"content", "toolkit"}
LOAD = re.compile(r'(?<!def )_load\("([^"]+)"\)')
CODE = re.compile(r"^```python\n(.*?)^```[ \t]*$", re.MULTILINE | re.DOTALL)
PLACEHOLDER = re.compile(r"\{([A-Z][A-Z0-9_]+)(?:\[(\d+)\])?\}")
RUNTIME_PACKAGES = "sentence-transformers transformers accelerate"


def form(title: str, body: str) -> nbformat.NotebookNode:
    cell = nbformat.v4.new_code_cell(f'#@title {title} {{ display-mode: "form" }}\n{body.strip()}\n')
    cell.metadata["cellView"] = "form"
    return cell


def inline_modules() -> str:
    """The modules as one block of code: shared imports first, local imports removed, documents inlined."""
    imports: list[str] = []
    bodies: list[str] = []
    for name in MODULES:
        source = (HERE / name).read_text()
        lines = source.splitlines()
        drop: set[int] = set()
        for node in ast.parse(source).body:
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                drop.update(range(node.lineno - 1, node.end_lineno))
                module = node.module if isinstance(node, ast.ImportFrom) else node.names[0].name
                if module.split(".")[0] not in LOCAL:
                    text = "\n".join(lines[node.lineno - 1 : node.end_lineno])
                    if text not in imports:
                        imports.append(text)
        body = "\n".join(line for i, line in enumerate(lines) if i not in drop).strip()
        body = LOAD.sub(lambda m: repr((HERE / "documents" / m.group(1)).read_text(encoding="utf-8")), body)
        bodies.append(f"# {'=' * 70}\n# {name}\n# {'=' * 70}\n{body}")
    return "\n".join(imports) + "\n\n\n" + "\n\n\n".join(bodies)


def setup_cell() -> nbformat.NotebookNode:
    body = f'''
# You don't need to read this cell. It installs what is missing, defines the helpers the
# workshop uses (ask, similarity, sections, split, where_is, search, ask_with_documents)
# and loads the two AI models. Curious? All the code is below.
import logging
import warnings

# Hide three harmless notices: tqdm's progress bars and a macOS note from torch (outside Colab), and
# Colab's note that no Hugging Face token is set (the two models are public and need none).
warnings.filterwarnings("ignore", message="IProgress not found")
warnings.filterwarnings("ignore", message=r"\\s*The secret `HF_TOKEN` does not exist in your Colab secrets")
logging.getLogger("torch.distributed.elastic.multiprocessing.redirects").setLevel(logging.ERROR)
try:
    import sentence_transformers  # noqa: F401
except ImportError:
    %pip install -q {RUNTIME_PACKAGES}

{inline_modules()}


print("Loading the two AI models. This takes 1 to 2 minutes...")
MODELS = load_models()
print(status_line(MODELS.device))
'''
    return form("Setup: click ▶️ and wait for ✅ Ready (1 to 2 minutes)", body)


def fill(text: str) -> str:
    """Replace {NAME} (a str or int in content.py) and {NAME[i]} (item i of a tuple) with the value."""

    def value(match: re.Match) -> str:
        name, index = match.group(1), match.group(2)
        if not hasattr(content, name):
            raise ValueError(f"Unknown placeholder: {match.group(0)}")
        found = getattr(content, name)
        if index is not None:
            found = found[int(index)]
        if not isinstance(found, (str, int)):
            raise ValueError(f"Placeholder {match.group(0)} is not a string or a number")
        return str(found)

    return PLACEHOLDER.sub(value, text)


def cells_of(text: str) -> list[nbformat.NotebookNode]:
    """Markdown cells for the prose, a code cell for each ```python block."""
    cells = []
    pieces = CODE.split(text)  # [markdown, code, markdown, code, ..., markdown]
    for i, piece in enumerate(pieces):
        if i % 2:
            cells.append(nbformat.v4.new_code_cell(piece.strip()))
        elif piece.strip():
            cells.append(nbformat.v4.new_markdown_cell(piece.strip()))
    return cells


def build() -> nbformat.NotebookNode:
    nb = nbformat.v4.new_notebook()
    nb.metadata = {
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
        "language_info": {"name": "python"},
        "colab": {"provenance": [], "toc_visible": True},
        "accelerator": "GPU",
        "gpuClass": "standard",
    }
    for index, path in enumerate(sorted((HERE / "cells").glob("*.md"))):
        nb.cells.extend(cells_of(fill(path.read_text(encoding="utf-8"))))
        if index == 0:
            nb.cells.append(setup_cell())
    for n, cell in enumerate(nb.cells):
        cell.id = f"cell-{n:02d}"  # stable ids keep rebuild diffs small
    return nb


def main() -> None:
    nbformat.write(build(), OUTPUT)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
