## 2. Retrieval

Search turns the question and every chunk into lists of numbers (embeddings) that capture their meaning, then keeps the chunks closest to the question. The score goes from 0 (unrelated) to 1 (same meaning).

**Do this:**
1. Run the cell. Is the chunk with the answer, Hugo Berard and Hamza Abdelhedi, first?
2. Go back to step 1, set `size` to {TRY_SIZE}, run that cell, then run this one again. Where is the answer now?

```python
question = "{QUESTION}"
search(question, chunks, top=3)
```

```show
🔍 Code: how search() works (optional: double-click to see the code)
embed
cosine
top_passages
search
```
