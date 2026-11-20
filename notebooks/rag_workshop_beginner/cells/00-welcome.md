# RAG workshop: an AI that looks things up

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/rag_workshop_beginner.ipynb)

An AI chatbot answers from what it learned during its training. RAG (Retrieval-Augmented Generation) lets it look things up first. RAG finds the passages of a document that match your question, and the AI writes its answer from them.

In this notebook you try each step of RAG on one Wikipedia article. You don't need to know how to code. The grey boxes are cells. To run a cell, click the ▶️ button on its left. Go from top to bottom.

## 0. Setup (5 min)

**Do this:**
1. In the menu at the top, click **Runtime**, then **Change runtime type**. Choose **T4 GPU** and click **Save**.
2. Click ▶️ on the **Setup** cell below.
3. If a message says "This notebook was not authored by Google", click **Run anyway**.
4. Wait until the cell shows **✅ Ready**. This takes 1 to 2 minutes.

If the cell shows ⚠️ instead, everything still works, only slower. Tell an assistant.

If a cell later shows an error that ends with "is not defined", run the Setup cell again, then that cell.
