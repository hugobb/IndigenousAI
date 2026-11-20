# Notebooks

| Notebook | For whom | Open |
|---|---|---|
| [`rag_workshop_beginner.ipynb`](rag_workshop_beginner.ipynb) | A 90-minute live workshop for people with **no coding background**. Each step of RAG (embeddings, search, splitting, answering) is a short code cell to run and change, on the Wikipedia article about the 2026 FIFA World Cup final. Runs on Colab. | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/rag_workshop_beginner.ipynb) |
| [`ollama_rag_workshop.ipynb`](ollama_rag_workshop.ipynb) | The full-code version: build a RAG system step by step with Ollama, running entirely on your own computer (FAISS, HDF5 caching, query rewriting). | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/ollama_rag_workshop.ipynb) |

## Editing the beginner notebook

`rag_workshop_beginner.ipynb` is **generated**. Do not edit it in Jupyter: edit the sources in
[`rag_workshop_beginner/`](rag_workshop_beginner/) and rebuild.

- `cells/*.md` hold the text of each section. A ```` ```python ```` block becomes a code cell;
  `{HIT_QUESTION}`-style placeholders are filled from `content.py`.
- `content.py` holds the article and the example sentences and questions.
- `toolkit.py` holds the helpers the cells call (`ask`, `similarity`, `sections`, `split`, `where_is`, `search`,
  `ask_with_documents`) and the two models. The Setup cell inlines both files.
- `documents/2026_world_cup_final.txt` is a shortened, pinned revision of the Wikipedia article (CC BY-SA 4.0),
  made by `fetch_article.py`.
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
models: for example, that at 50 words per chunk the reason a goal was disallowed is cut in two, and that an
overlap of 15 words puts it back together. If you change the article or the questions, run them again.
