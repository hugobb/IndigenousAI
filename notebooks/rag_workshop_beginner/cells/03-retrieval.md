## 3. Retrieval

Search turns the question into an embedding, scores it against every chunk in the index, and keeps the closest chunks. The score goes from 0 (unrelated) to 1 (same meaning).

**Do this:**
1. Run the cell. Is the chunk with the answer, Hugo Berard and Hamza Abdelhedi, first?
2. Go back to step 1, set `size` to {TRY_SIZE}, and run steps 1, 2 and 3 again. Where is the answer now?

```python
question = "{QUESTION}"
search(question, index, top=3)
```

```show
🔍 Code: how search() works (optional: double-click to see the code)
cosine
top_passages
search
```
