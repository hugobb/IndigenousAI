## 4. Splitting: cutting the programme into chunks (15 min)

The embedding model reads only about the first 200 words of a passage and ignores the rest. Even those 200 words talk about many things, so the embedding is a mix of them. The names you looked for are one sentence of the Day 2 section, among many times, rooms and talks, so that section does not stand out for the question. The fix is to cut the programme into short pieces, called chunks, each with its own embedding.

**Do this:**
1. Run the cell below. It cuts the programme into chunks of {DEMO_SIZE} words and searches them. Are the names in the first result?
2. Change {DEMO_SIZE} to {TINY_SIZE} and run the cell again. The first results are bits of sentences, and none has the names.
3. Change it to 0 and run the cell again. 0 means one chunk for the whole programme. Its score is lower: the model reads only the first 200 words of that chunk, and they talk about many things.

```python
# Change {DEMO_SIZE} to {TINY_SIZE}, then to 0, and run the cell again each time.
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE})
search("{MISS_QUESTION}", chunks)
```

A chunk can also end in the middle of an answer.

**Do this:**
1. Run the cell below. It looks for the sentence that says who gives the talk "Can we trust AI?". That sentence was cut in two: it starts at the end of one chunk and ends at the start of the next.

```python
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE})
where_is(chunks, "{CUT_PHRASE}")
```

Overlap fixes this: each chunk starts with the last words of the chunk before it.

**Do this:**
1. Run the cell below. With an overlap of {DEMO_OVERLAP} words, the sentence is whole again, in one chunk.
2. Change {DEMO_OVERLAP} to 0 and run the cell again.

```python
# Change {DEMO_OVERLAP} to 0 and run the cell again.
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
where_is(chunks, "{CUT_PHRASE}")
```

Long chunks mix many topics, and short chunks, or chunks cut in the wrong place, lose the answer.
