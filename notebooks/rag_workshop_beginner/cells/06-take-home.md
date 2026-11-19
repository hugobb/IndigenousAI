## 6. Summary and discussion (10 min)

### RAG in short

1. Once, in advance: cut the documents into chunks and compute an embedding for each chunk.
2. For each question: compute the question's embedding, find the closest chunks, send them to the AI with the question, and get the answer.

Each choice changes the answers: chunk size, overlap, the embedding model, the number of passages, and the instruction given to the AI.

### Running it on your own computer

In Colab, your text is processed on Google's computers. On your own computer, your documents stay with you. This matters for sensitive documents.

Two options (they need some help from someone comfortable with computers):
- **This notebook.** Install Python 3.11 or newer. In a terminal, run `pip install sentence-transformers transformers torch accelerate ipywidgets plotly jupyterlab`. Download this notebook (**File > Download > Download .ipynb**), then start `jupyter lab` and open it.
- **Ollama**, a free app that runs AI models on your computer. The notebook [`ollama_rag_workshop.ipynb`](https://github.com/hugobb/IndigenousAI/blob/main/notebooks/ollama_rag_workshop.ipynb) builds the same system with Ollama and shows all the code.

### What should go into such a system?

Running the AI on your own computer does not answer a more important question: should these documents go into an AI system at all? That is a decision for the community the documents come from, and it comes before the technology.

The **OCAP® principles** (Ownership, Control, Access, Possession), from the First Nations Information Governance Centre, say that First Nations communities own and control their data. The **CARE Principles** you used today (Collective Benefit, Authority to Control, Responsibility, Ethics) say the same for Indigenous data worldwide.

**To discuss:**
1. Who should decide which documents go into a RAG system about a community, and who may ask it questions?
2. Even with RAG, the AI can be wrong. Who is responsible for a wrong answer?
3. In your own work, what would you put into such a system, and what would you never put in?

### Sources

- {CARE_CREDIT}
- Example Community Data Charter: fictional, written for the RAG trust tests kit, CC0 1.0. It describes no real community.
