# Notebooks

| Notebook | For whom | Open |
|---|---|---|
| [`rag_workshop_beginner.ipynb`](rag_workshop_beginner.ipynb) | A 90-minute live workshop for people with **no coding background**. All code is hidden; every step of RAG (embeddings, search, chunking, generation) is a panel to play with. Runs on Colab. | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/rag_workshop_beginner.ipynb) |
| [`ollama_rag_workshop.ipynb`](ollama_rag_workshop.ipynb) | The full-code version: build a RAG system step by step with Ollama, running entirely on your own computer (FAISS, HDF5 caching, query rewriting). | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/ollama_rag_workshop.ipynb) |

## Editing the beginner notebook

`rag_workshop_beginner.ipynb` is **generated**. Do not edit it in Jupyter: edit the sources in
[`rag_workshop_beginner/`](rag_workshop_beginner/) and rebuild.

- `cells/*.md` hold the text of each section. `{DEMO_SMALL_SIZE}`-style placeholders are filled from `content.py`;
  `<!-- panel: show_x | Title -->` inserts a hidden cell that shows that panel.
- `content.py` holds the fictional report, the passages, the example sentences and the preset questions.
- `toolkit.py` holds chunking, similarity, search, the prompt and the two models.
- `ui.py` holds one interactive panel per section.

```sh
cd notebooks/rag_workshop_beginner
uv run --with-requirements requirements.txt python build_notebook.py     # rebuild the .ipynb
uv run --with-requirements requirements.txt pytest -q -m "not llm"       # fast tests (~30 s)
uv run --with-requirements requirements.txt pytest -q -m llm             # real Qwen3-1.7B, ~2 min, ~6 GB RAM
```

The tests check that the effects the text promises really happen with the chosen models: for example, that at
35 words the answer about the van is cut in half and that an overlap of 15 words puts it back together. If you
change the report or the questions, run them again.
