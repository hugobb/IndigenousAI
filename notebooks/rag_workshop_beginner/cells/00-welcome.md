# RAG workshop: how an AI answers questions from your documents

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/rag_workshop_beginner.ipynb)

An AI chatbot answers from what it learned during its training. It has never read your documents.

RAG (Retrieval-Augmented Generation) fixes this in two steps:
1. It searches your documents for the passages that match the question.
2. It gives those passages to the AI, and the AI writes the answer from them.

In this notebook you try each part of RAG yourself. You don't need to read or write code.

### How this notebook works

- The grey boxes with a ▶️ button are the things you run. To run one, click its ▶️ button (on the left of the box).
- After a few seconds, buttons, sliders or text boxes appear under it. Use them.
- Go from top to bottom.
- If you are stuck, raise your hand.

### The plan

| Part | Topic | Time |
|---|---|---|
| 0 | Setup | 10 min |
| 1 | The problem | 5 min |
| 2 | Embeddings: how a computer compares meanings | 20 min |
| 3 | Search: finding the right passage | 10 min |
| 4 | Chunking: cutting a document into pieces | 20 min |
| 5 | The AI writes the answer | 15 min |
| 6 | Summary and discussion | 10 min |
| Bonus | Your own documents | at home |

## 0. Setup (10 min)

**Do this:**
1. In the menu at the top of the page, click **Runtime**, then **Change runtime type**. Check that **T4 GPU** is selected and click **Save**. (A GPU is a chip that makes the AI fast.)
2. Click ▶️ on the **Setup** box below.
3. If a message says "This notebook was not authored by Google", click **Run anyway**.
4. Wait until the box shows **✅ Ready**. This takes 1 to 2 minutes.

If the box shows ⚠️ instead, everything still works, but the AI is slower. Tell an assistant.
