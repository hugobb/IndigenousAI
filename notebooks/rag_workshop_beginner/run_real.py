"""Run the built notebook top to bottom with the real models and print every output.

    uv run --with-requirements requirements.txt python run_real.py                          # model for this device
    uv run --with-requirements requirements.txt python run_real.py --model Qwen/Qwen3-1.7B  # about 4 GB of memory

After each cell whose step asks for a change ("Change 50 to 5", "Change top=1 to top=3", ...), the same
cell with that change is run too, marked "# CHANGED", so every output a participant can see gets read.
The bonus upload cell needs a browser, so it is replaced by `my_text = ARTICLE`.
Without a GPU, the models run on the CPU in bfloat16 (Colab's GPU runs Qwen3-1.7B in float32).
"""

import argparse
import os
import time

import nbformat
from nbclient import NotebookClient

import build_notebook
import content as c

UPLOAD_STAND_IN = "my_text = ARTICLE  # stand-in for the upload, which needs a browser"

# After the cell whose source contains the key, run these changed copies (what the steps ask for).
CHANGES = {
    f'ask("{c.NO_DOC_QUESTION}")': [f'ask("{c.WINNER_QUESTION}")'],
    f'search("{c.MISS_QUESTION}", chunks)': [
        f'chunks = split(ARTICLE, words_per_chunk={c.TINY_SIZE})\nsearch("{c.MISS_QUESTION}", chunks)',
        f'chunks = split(ARTICLE, words_per_chunk=0)\nsearch("{c.MISS_QUESTION}", chunks)',
    ],
    f"overlap={c.DEMO_OVERLAP})\nwhere_is(": [
        f'chunks = split(ARTICLE, words_per_chunk={c.DEMO_SIZE}, overlap=0)\nwhere_is(chunks, "{c.CUT_PHRASE}")'
    ],
    "top=1)": [
        f'chunks = split(ARTICLE, words_per_chunk={c.DEMO_SIZE}, overlap={c.DEMO_OVERLAP})\n'
        f'ask_with_documents("{c.TOP1_VS_TOP3_QUESTION}", chunks, top=3)'
    ],
    "say_dont_know=True)": [
        f'chunks = split(ARTICLE, words_per_chunk={c.DEMO_SIZE}, overlap={c.DEMO_OVERLAP})\n'
        f'ask_with_documents("{c.OUT_OF_DOC_QUESTION}", chunks, say_dont_know=False)'
    ],
    f'ask_with_documents("{c.SPLIT_QUESTION}", chunks)': [
        f'chunks = split(ARTICLE, words_per_chunk={c.DEMO_SIZE}, overlap=0)\nask_with_documents("{c.SPLIT_QUESTION}", chunks)'
    ],
}


def is_upload(cell) -> bool:
    return cell.cell_type == "code" and cell.source.startswith("from google.colab import files")


def with_changes(nb: nbformat.NotebookNode) -> nbformat.NotebookNode:
    cells = []
    for cell in nb.cells:
        if is_upload(cell):
            cells.append(nbformat.v4.new_code_cell(UPLOAD_STAND_IN))
            continue
        cells.append(cell)
        if cell.cell_type == "code" and not cell.source.startswith("#@title"):
            for key, changed in CHANGES.items():
                if key in cell.source:
                    cells += [nbformat.v4.new_code_cell("# CHANGED\n" + source) for source in changed]
    nb.cells = cells
    return nb


def show(nb: nbformat.NotebookNode) -> None:
    for i, cell in enumerate(nb.cells):
        if cell.cell_type != "code":
            continue
        print(f"\n----- [{i}] " + (cell.source.splitlines()[0] if cell.source.startswith("#@title") else cell.source))
        for out in cell.outputs:
            if out.output_type == "stream":
                print(out.text, end="")
            elif out.output_type == "error":
                print(f"ERROR {out.ename}: {out.evalue}")
            elif "text/plain" in out.get("data", {}):
                print(out["data"]["text/plain"])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", help="answer model, e.g. Qwen/Qwen3-1.7B (default: the one for this device)")
    args = parser.parse_args()
    os.environ.pop("RAG_WORKSHOP_FAKE_LLM", None)
    if args.model:
        os.environ["RAG_WORKSHOP_LLM"] = args.model  # the kernel inherits it; load_models() reads it
    nb = with_changes(build_notebook.build())
    start = time.time()
    NotebookClient(nb, timeout=1800, kernel_name="python3", allow_errors=True,
                   resources={"metadata": {"path": str(build_notebook.HERE)}}).execute()
    errors = sum(out.output_type == "error" for cell in nb.cells if cell.cell_type == "code" for out in cell.outputs)
    print(f"model: {args.model or 'the default for this device'}; ran in {time.time() - start:.0f} s; errors: {errors}")
    show(nb)


if __name__ == "__main__":
    main()
