# Notebooks

| Notebook | For whom | Open |
|---|---|---|
| [`rag_workshop_beginner.ipynb`](rag_workshop_beginner.ipynb) | A short hands-on for people with **no coding background**: RAG in 3 steps (chunking, with a drawing of how the text is cut; retrieval; generation), one code cell each to run and change, with the code behind each step in a collapsed cell, on the programme of the Future Imaginaries of Indigenous AI workshop (Abundant Intelligences, Hawaiʻi, November 2026). Runs on Colab. | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/rag_workshop_beginner.ipynb) |
| [`ollama_rag_workshop.ipynb`](ollama_rag_workshop.ipynb) | The full-code version: build a RAG system step by step with Ollama, running entirely on your own computer (FAISS, HDF5 caching, query rewriting). | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/ollama_rag_workshop.ipynb) |

## Editing the beginner notebook

`rag_workshop_beginner.ipynb` is **generated**. Do not edit it in Jupyter: edit the sources in
[`rag_workshop_beginner/`](rag_workshop_beginner/) and rebuild.

- `cells/*.md` hold the text of each section. A ```` ```python ```` block becomes a code cell; a ```` ```show ````
  block becomes a collapsed "Code" cell holding the named `toolkit.py` functions; `{QUESTION}`-style placeholders
  are filled from `content.py`.
- `content.py` holds the programme, the excerpt drawn in step 1, the default chunk size and overlap, and the question.
- `toolkit.py` holds the helpers the cells call (`show_chunking`, `split`, `search`, `ask`, `ask_with_documents`)
  and the two models. The Setup cell inlines both files.
- `documents/workshop_programme.txt` is the workshop programme, with the schedule written as prose and short
  speaker bios. Its facts come from abundant-intelligences.net and the speakers' own pages; the Solomon Enos bio is
  from Wikipedia (CC BY-SA 4.0). Its first five lines give the sources.
- `run_real.py` runs the built notebook with the real models, plus each change the steps ask for, and prints
  every output.

```sh
cd notebooks/rag_workshop_beginner
uv run --with-requirements requirements.txt python build_notebook.py     # rebuild the .ipynb
uv run --with-requirements requirements.txt pytest -q -m "not llm"       # fast tests (about 2 min)
uv run --with-requirements requirements.txt pytest -q -m llm -k 1.7B     # real Qwen3-1.7B, about 4 GB of memory
uv run --with-requirements requirements.txt pytest -q -m llm -k 0.6B     # real Qwen3-0.6B, about 2.5 GB
uv run --with-requirements requirements.txt python run_real.py --model Qwen/Qwen3-1.7B   # read every output
```

The tests check that the effects the text promises really happen with the chosen models, on both answer
models: for example, that with 60-word chunks and an overlap of 10 the chunk with the answer comes first, that
at 80 words it leaves the top 3, and that the AI names the speakers only with the chunks. If you change the
programme, the defaults or the question, run the tests again: a small change in wording moves the chunk boundaries.
