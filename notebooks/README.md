# Notebooks

| Notebook | For whom | Open |
|---|---|---|
| [`rag_workshop_beginner.ipynb`](rag_workshop_beginner.ipynb) | A 90-minute live workshop for people with **no coding background**. Each step of RAG (embeddings, search, splitting, answering) is a short code cell to run and change, on the programme of the Future Imaginaries of Indigenous AI workshop (Abundant Intelligences, Hawaiʻi, November 2026). Runs on Colab. | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/rag_workshop_beginner.ipynb) |
| [`ollama_rag_workshop.ipynb`](ollama_rag_workshop.ipynb) | The full-code version: build a RAG system step by step with Ollama, running entirely on your own computer (FAISS, HDF5 caching, query rewriting). | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/ollama_rag_workshop.ipynb) |

## Editing the beginner notebook

`rag_workshop_beginner.ipynb` is **generated**. Do not edit it in Jupyter: edit the sources in
[`rag_workshop_beginner/`](rag_workshop_beginner/) and rebuild.

- `cells/*.md` hold the text of each section. A ```` ```python ```` block becomes a code cell;
  `{HIT_QUESTION}`-style placeholders are filled from `content.py`.
- `content.py` holds the programme and the example sentences and questions.
- `toolkit.py` holds the helpers the cells call (`ask`, `similarity`, `sections`, `split`, `where_is`, `search`,
  `ask_with_documents`) and the two models. The Setup cell inlines both files.
- `documents/workshop_programme.txt` is the workshop programme, with the schedule written as prose and short
  speaker bios. Its facts come from abundant-intelligences.net and the speakers' own pages; the Solomon Enos bio is
  from Wikipedia (CC BY-SA 4.0). Its first five lines give the sources.
- `find_demo_values.py` picks the example questions and writes `demo_values.json`, the numbers the slides show.
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
models: for example, that at 50 words per chunk the sentence naming the speaker of "Can we trust AI?" is cut
in two, and that an overlap of 10 words puts it back together. If you change the programme or the questions, run
`find_demo_values.py` and the tests again: a small change in wording moves the chunk boundaries.
