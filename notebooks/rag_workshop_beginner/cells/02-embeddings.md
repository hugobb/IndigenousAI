## 2. Embeddings: comparing meanings (22 min)

To compare meanings, the computer turns each sentence into a list of 384 numbers, called an embedding. Sentences with similar meanings get similar lists. The similarity score compares two lists: close to 0 means unrelated, and the closer to 1, the closer the meanings.

**Do this:**
1. The cell below compares "{SAME_MEANING[0]}" with three other sentences. Guess which one gets the highest score, then run the cell.
2. Look at the score of the second sentence. It shares the word "machine" with the first one, but its score is low.

```python
similarity("{SAME_MEANING[0]}", "{SAME_MEANING[1]}")
similarity("{SAME_WORD[0]}", "{SAME_WORD[1]}")
similarity("{UNRELATED[0]}", "{UNRELATED[1]}")
```

```show
🔍 Code: how similarity() works (optional: double-click to see the code)
embed
cosine
score
similarity
```

**Do this:**
1. Guess the score of "{LOVE_HATE[0]}" and "{LOVE_HATE[1]}", then run the cell.
2. Write two sentences of your own between the quotes and run the cell again.

```python
# Change the two sentences and run the cell again.
similarity("{LOVE_HATE[0]}", "{LOVE_HATE[1]}")
```

The score tells you whether two sentences talk about the same thing, not whether they agree.
