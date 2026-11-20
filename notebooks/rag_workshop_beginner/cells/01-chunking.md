## 1. Chunking

The programme is cut into chunks of a few words, and each chunk is searched on its own. `size` is the number of words per chunk. `overlap` is how many words each chunk repeats from the chunk before, so a sentence cut at the edge is still whole in one chunk.

**Do this:**
1. Run the cell. The coloured text is the start of the Day 2 schedule, cut with these settings: one colour per chunk. Bold underlined words are in two chunks.
2. Change `size` and `overlap`, and run the cell again.

```python
size = {SIZE}
overlap = {OVERLAP}
show_chunking(EXCERPT, size, overlap)
chunks = split(PROGRAMME, size, overlap)
```

```show
🔍 Code: how split() works (optional: double-click to see the code)
chunk_overlap
split
```
