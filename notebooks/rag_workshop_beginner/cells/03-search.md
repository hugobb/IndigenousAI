## 3. Search: finding the right passage (15 min)

Search uses the same scores. It compares your question with every passage and lists the closest ones first, with their scores. Here a passage is one section of our shortened copy of the article. There are 8: Introduction, Background, Route to the final: Spain, Route to the final: Argentina, Match: First half, Match: Second half, Match: Extra time, and Post-match.

**Do this:**
1. Guess which section will come first for "{HIT_QUESTION}", then run the cell.

```python
passages = sections(ARTICLE)
search("{HIT_QUESTION}", passages)
```

**Do this:**
1. Run the cell below. The referee's name, {MISS_ANSWER}, is in the {MISS_SECTION}. Is the {MISS_SECTION} in the list?

```python
passages = sections(ARTICLE)
search("{MISS_QUESTION}", passages)
```

**Do this:**
1. Run the cell below. No section is about pizza. Look at the scores.
2. Change the question to one of your own and run the cell again.

```python
# Change the question and run the cell again.
passages = sections(ARTICLE)
search("{NONSENSE_QUESTION}", passages)
```

Search always returns passages, even when none of them answers the question, and the best one is not always first.
