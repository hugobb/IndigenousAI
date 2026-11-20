## 6. Wrap-up (15 min)

RAG has four steps:
1. Cut the documents into chunks.
2. Compute an embedding for each chunk.
3. For each question, find the chunks closest to it.
4. Send those chunks and the question to the AI, which writes the answer.

**Do this:**
1. Run the cell below. It asks the question from sections 1 and 3 again. Its two lines do all four steps.
2. Change the question to one of your own about the workshop and run the cell again.

```python
# Change the question and run the cell again.
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{WRAP_UP_QUESTION}", chunks)
```

Each choice can change the answers: the chunk size, the overlap, the number of chunks sent and the instruction.

### Running it on your own computer

In Colab, your text goes to Google's computers. On your own computer, your documents stay with you. Ollama, the app from Part 2, runs AI models on your own computer. This notebook also runs in Jupyter on a laptop.

**Do this:**
1. Click **File > Download > Download .ipynb** to save this notebook.
2. Install Python 3.11 or newer.
3. In a terminal, run `pip install sentence-transformers transformers torch accelerate jupyterlab`, then `jupyter lab`.
4. In Jupyter, open the file you saved.

### Sources

- The document: the programme of Future Imaginaries of Indigenous AI, a workshop by Abundant Intelligences, with facts from [abundant-intelligences.net]({PROGRAMME_URL}) and the speakers' own pages, retrieved {PROGRAMME_RETRIEVED}. The bio of Solomon Enos is from the Wikipedia article "Solomon Enos" ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)).
- The models: all-MiniLM-L6-v2 for the embeddings, and Qwen3-1.7B (with a GPU) or Qwen3-0.6B (without one) for the answers.
