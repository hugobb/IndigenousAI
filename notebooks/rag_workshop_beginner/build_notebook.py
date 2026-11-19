"""Assemble rag_workshop_beginner.ipynb from cells/*.md and the three Python modules.

Run:  uv run --with-requirements requirements.txt python build_notebook.py

In the Markdown files:
  {NAME}                           is replaced by that constant from content.py (e.g. {DEMO_SMALL_SIZE})
  <!-- panel: show_x | Title -->   ends the Markdown cell and inserts a hidden form cell running show_x(MODELS)
"""

import ast
import re
from pathlib import Path

import nbformat

import content

HERE = Path(__file__).resolve().parent
OUTPUT = HERE.parent / "rag_workshop_beginner.ipynb"
MODULES = ["content.py", "toolkit.py", "ui.py"]
LOCAL = {"content", "toolkit", "ui"}
LOAD = re.compile(r'(?<!def )_load\("([^"]+)"\)')
PANEL = re.compile(r"^<!-- panel: (\w+) \| (.+?) -->\s*$", re.MULTILINE)
RUNTIME_PACKAGES = "sentence-transformers transformers accelerate ipywidgets matplotlib"
BEFORE_SETUP = "⚠️ Run the Setup box first (section 0, at the top). Then click ▶️ on this box again."


def form(title: str, body: str) -> nbformat.NotebookNode:
    cell = nbformat.v4.new_code_cell(f'#@title {title} {{ display-mode: "form" }}\n{body.strip()}\n')
    cell.metadata["cellView"] = "form"
    return cell


def inline_modules() -> str:
    """The three modules as one block of code: shared imports first, local imports removed."""
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
# You don't need to read this cell. It installs what is missing, defines everything the
# workshop does, and loads the two AI models. Curious? All the code is below.
try:
    import sentence_transformers, matplotlib, ipywidgets  # noqa: F401
except ImportError:
    %pip install -q {RUNTIME_PACKAGES}

{inline_modules()}


print("Loading the two AI models. This takes 1 to 2 minutes...")
MODELS = load_models()
print(status_line(MODELS.device))
'''
    return form("Setup: click ▶️ and wait for ✅ Ready (1 to 2 minutes)", body)


def panel_cell(function: str, title: str) -> nbformat.NotebookNode:
    body = f'''
if "MODELS" not in globals():
    print("{BEFORE_SETUP}")
else:
    {function}(MODELS)
'''
    return form(f"Click ▶️: {title}", body)


def fill(markdown: str) -> str:
    """Replace {NAME} and {NAME.question} with values from content.py."""
    for name in dir(content):
        value = getattr(content, name)
        if name.isupper() and isinstance(value, (str, int)):
            markdown = markdown.replace("{" + name + "}", str(value))
        if name.isupper() and isinstance(value, content.QuestionSpec):
            markdown = markdown.replace("{" + name + ".question}", value.question)
    leftover = re.findall(r"\{[A-Z_]{3,}[.a-z]*\}", markdown)
    if leftover:
        raise ValueError(f"Unknown placeholders: {leftover}")
    return markdown


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
        pieces = PANEL.split(fill(path.read_text()))
        # pieces = [markdown, function, title, markdown, function, title, ..., markdown]
        for i in range(0, len(pieces), 3):
            if pieces[i].strip():
                nb.cells.append(nbformat.v4.new_markdown_cell(pieces[i].strip()))
            if i + 2 < len(pieces):
                nb.cells.append(panel_cell(pieces[i + 1], pieces[i + 2]))
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
