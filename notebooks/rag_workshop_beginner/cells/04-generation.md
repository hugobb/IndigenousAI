## 4. Generation

The AI writes the answer: first alone, then with the 3 chunks that search found pasted above the question.

**Do this:**
1. Run the cell and compare the two answers.
2. Change the question in step 3, or the chunking in step 1, and run the cells again from there.

```python
ask(question)
ask_with_documents(question, index, top=3)
```

```show
🔍 Code: how ask() and ask_with_documents() work (optional: double-click to see the code)
ask
build_prompt
ask_with_documents
```

Sources: the programme of Future Imaginaries of Indigenous AI (Abundant Intelligences), with facts from [abundant-intelligences.net]({PROGRAMME_URL}) and the speakers' own pages, retrieved {PROGRAMME_RETRIEVED}. The bio of Solomon Enos is from Wikipedia ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)). Models: all-MiniLM-L6-v2 for the embeddings, Qwen3-0.6B (or Qwen3-1.7B with a GPU) for the answers.
