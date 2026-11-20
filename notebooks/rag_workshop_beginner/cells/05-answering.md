## 5. Answering: the AI reads the chunks (15 min)

Now the AI gets the chunks that search finds. Each cell below cuts the article as in section 4 ({DEMO_SIZE} words, overlap {DEMO_OVERLAP}), then sends the AI one message: an instruction, the 3 best chunks and your question. The instruction says to answer from the chunks, and to say "I don't know based on these documents." when the answer is not there.

**Do this:**
1. Run the cell below. It asks about the halftime break again, this time with the article. It first shows the chunks it sent, under "Passages sent to the AI".
2. Compare the answer with the one you got in section 1.

```python
chunks = split(ARTICLE, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{WITH_DOC_QUESTION}", chunks)
```

**Do this:**
1. Run the cell below. With top=1, the AI gets only the best chunk, and that chunk does not say where the final was played.
2. Change top=1 to top=3 and run the cell again.

```python
# Change top=1 to top=3 and run the cell again.
chunks = split(ARTICLE, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{TOP1_VS_TOP3_QUESTION}", chunks, top=1)
```

**Do this:**
1. Run the cell below. Our copy of the article says there was a halftime show, but we removed the part that says who performed.
2. Change True to False and run the cell again. This removes the "I don't know" instruction. Compare the two answers.

```python
# Change True to False and run the cell again.
chunks = split(ARTICLE, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{OUT_OF_DOC_QUESTION}", chunks, say_dont_know=True)
```

**Do this:**
1. Run the cell below. It asks why the goal by Williams was disallowed, with the overlap of {DEMO_OVERLAP} words from section 4.
2. Change {DEMO_OVERLAP} to 0 and run the cell again. The sentence is cut in two again. Look at the chunks sent to the AI: is the reason still there?

```python
# Change {DEMO_OVERLAP} to 0 and run the cell again.
chunks = split(ARTICLE, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{SPLIT_QUESTION}", chunks)
```

The AI can only answer as well as the chunks it gets.
