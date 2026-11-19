## 6. Take it home ⏱ about 10 min

### What you built, in one picture

```
 PREPARE (once)   your documents ──► ✂️ chunking ──► 🔢 embeddings ──► stored

 ASK (each time)  question ──► 🔢 embedding ──► 🔎 search: closest chunks
                            ──► 📝 prompt = instructions + chunks + question ──► 🤖 answer
```

Every choice changes the answers you get: how you cut, which embedding model, how many chunks you hand over (k), and what the instructions say.

### Running it on your own computer

In Colab, your text is processed on Google's computers. On your own computer, your documents **never leave it**. For sensitive material, that difference matters. There are two ways to run it yourself:

1. **This same notebook.** Install Python (version 3.11 or newer), then in a terminal run
   `pip install sentence-transformers transformers torch accelerate ipywidgets plotly jupyterlab`.
   Download this notebook (**File → Download → Download .ipynb**), start `jupyter lab`, open the notebook and run it the same way. The models download once (about 1–2 GB) and then work without internet. On a computer without a GPU it uses the smaller answer model automatically.
2. **Ollama**, a free app that runs AI models on your computer. Our companion notebook, [`ollama_rag_workshop.ipynb`](https://github.com/hugobb/IndigenousAI/blob/main/notebooks/ollama_rag_workshop.ipynb), builds the same system with Ollama and shows all the code step by step.

### What should go in?

Keeping data on your own machine does not by itself answer the question of whether something *should* be digitised or put into an AI system at all. Those are community decisions about protocols and access, and they come before the technology, not after it.

The **OCAP® principles** (Ownership, Control, Access, Possession), developed by the First Nations Information Governance Centre, state that First Nations communities collectively own and control their data. Even our fictional river group had to decide who may see its raw records, and wrote a rule after someone's name was shared without permission.

**To discuss**
1. Who should decide what goes into a RAG system about a community, and who may ask it questions?
2. The model can still be wrong, even with RAG. Who is responsible when an answer is wrong?
3. What, in your own work, would you put in such a system, and what would you never put in?
