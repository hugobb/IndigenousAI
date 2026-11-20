## 2. Indexing

Indexing computes the embedding of every chunk once, and keeps it next to its chunk. An embedding is a list of 384 numbers that captures what a chunk means. On the map, each dot is a chunk: dots close together have close meanings. The map squeezes 384 numbers into 2, so distances on it are only a picture; the scores are exact.

**Do this:**
1. Run the cell. The red star is the sentence, and the lines go to the 3 closest chunks, listed under the map.
2. Change the sentence to a question or sentence of your own, and run the cell again.

```python
index = build_index(chunks)
show_map(index, "{QUESTION}")
```

```show
🔍 Code: how build_index() and show_map() work (optional: double-click to see the code)
embed
build_index
show_map
```
