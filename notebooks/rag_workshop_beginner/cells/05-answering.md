## 5. Answering: the AI reads the chunks (15 min)

Now the AI gets the chunks that search finds. Each cell below cuts the programme as in section 4 ({DEMO_SIZE} words, overlap {DEMO_OVERLAP}), then sends the AI one message: an instruction, the 3 best chunks and your question. The instruction says to answer from the chunks, and to say "I don't know based on these documents." when the answer is not there.

**Do this:**
1. Run the cell below. It asks when the hands-on session starts again, this time with the programme. It first shows the chunks it sent, under "Passages sent to the AI".
2. Compare the answer with the one you got in section 1.

```python
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{WITH_DOC_QUESTION}", chunks)
```

```show
🔍 Code: how ask_with_documents() works, the whole RAG (optional: double-click to see the code)
build_prompt
ask_with_documents
```

**Do this:**
1. Run the cell below. With top=1, the AI gets only the best chunk, and that chunk is about Friday, not Thursday.
2. Change top=1 to top=3 and run the cell again.

```python
# Change top=1 to top=3 and run the cell again.
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{TOP1_VS_TOP3_QUESTION}", chunks, top=1)
```

**Do this:**
1. Run the cell below. The programme does not give the Wi-Fi password.
2. Change True to False and run the cell again. This removes the "I don't know" instruction. Compare the two answers.

```python
# Change True to False and run the cell again.
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{OUT_OF_DOC_QUESTION}", chunks, say_dont_know=True)
```

**Do this:**
1. Run the cell below. It asks who gives the talk "Can we trust AI?", with the overlap of {DEMO_OVERLAP} words from section 4.
2. Change {DEMO_OVERLAP} to 0 and run the cell again. The sentence is cut in two again. Look at the chunks sent to the AI: is the speaker's name still there?

```python
# Change {DEMO_OVERLAP} to 0 and run the cell again.
chunks = split(PROGRAMME, words_per_chunk={DEMO_SIZE}, overlap={DEMO_OVERLAP})
ask_with_documents("{SPLIT_QUESTION}", chunks)
```

The AI can only answer as well as the chunks it gets.
