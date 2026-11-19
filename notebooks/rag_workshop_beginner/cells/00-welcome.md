# How does an AI read *your* documents? A hands-on tour of RAG

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hugobb/IndigenousAI/blob/main/notebooks/rag_workshop_beginner.ipynb)

Chatbots answer questions from **memory**: everything they learned while being trained. They have never seen *your* documents, like a community report, meeting notes or an archive. **RAG** (*Retrieval-Augmented Generation*) is the most common way to fix this. Before answering, the system **looks up** the most relevant passages in documents you choose, and then the AI **writes its answer from those passages**.

In this workshop you will take a RAG system apart, piece by piece, and play with each piece to see what it does.

**No coding needed.** You never have to type or read code. Each grey box with a ▶️ button is something to run: click the ▶️ on its left (or click inside it and press **Shift + Enter**). Then use the sliders, buttons and text boxes that appear. If you are curious about the code behind a box, double-click its title to show it.

| Part | What it's about | Time |
|---|---|---|
| 0 | Setup | ⏱ 10 min |
| 1 | The problem: an AI that guesses | ⏱ 5 min |
| 2 | Embeddings: turning meaning into numbers | ⏱ 20 min |
| 3 | Search: finding the right passage | ⏱ 10 min |
| 4 | Chunking: cutting documents into pieces | ⏱ 20 min |
| 5 | Generation: writing the answer | ⏱ 15 min |
| 6 | Take it home | ⏱ 10 min |
| ★ | Bonus: try your own documents | at home |

## 0. Setup ⏱ about 10 min

1. **Check you have a GPU** (a fast chip for AI). This notebook asks Colab for one automatically. To check, open the menu **Runtime → Change runtime type**, make sure **T4 GPU** is selected, and click **Save**.
2. **Run the Setup box below** by clicking its ▶️. If Colab warns *"This notebook was not authored by Google"*, click **Run anyway**.
3. **Wait for ✅ Ready.** It takes 1–2 minutes. The box downloads two small AI models:
   - one that turns text into numbers (section 2);
   - one that writes answers (section 5).

If you see ⚠️ **without a GPU**, everything still works, just more slowly (answers take up to a minute). Raise your hand if you get stuck. An assistant will come and help.
