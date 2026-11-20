## 3. Search: finding the right passage (15 min)

Search uses the same scores. It compares your question with every passage and lists the closest ones first, with their scores. Here a passage is one section of the programme. There are {N_SECTIONS}: the Introduction, About Abundant Intelligences, The Future Imaginaries workshops, Day 1, Day 2, The Ka Hawaiʻi Pae ʻĀina Pod, The AIAI Lab, and one per speaker.

**Do this:**
1. Guess which section will come first for "{HIT_QUESTION}", then run the cell.

```python
passages = sections(PROGRAMME)
search("{HIT_QUESTION}", passages)
```

```show
🔍 Code: how search() works (optional: double-click to see the code)
top_passages
search
```

**Do this:**
1. Run the cell below. This is the question from section 1. The answer, {MISS_ANSWER}, is in the section "{MISS_SECTION}". Which section comes first?

```python
passages = sections(PROGRAMME)
search("{MISS_QUESTION}", passages)
```

**Do this:**
1. Run the cell below. No section is about pizza. Look at the scores.
2. Change the question to one of your own and run the cell again.

```python
# Change the question and run the cell again.
passages = sections(PROGRAMME)
search("{NONSENSE_QUESTION}", passages)
```

Search always returns passages, even when none of them answers the question, and the best one is not always first.
