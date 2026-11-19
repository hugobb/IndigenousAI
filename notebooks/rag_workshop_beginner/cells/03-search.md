## 3. Search: finding the right passage (10 min)

Search uses embeddings. The computer keeps an embedding for every passage. When you ask a question, it computes the score between your question and each passage, and sorts the passages from the highest score to the lowest.

Here the passages are the 9 sections of the charter.

**Do this:**
1. Click ▶️ on the box below. It has already searched for "{SEARCH_EXAMPLE}". Section 8 (Storage) comes first. Correct.
2. Replace the question with "{SEARCH_MISS_EXAMPLE}" and click **Search**. The right answer is Section 6 (Outside requests): the Council votes. Is Section 6 first?
3. Search for "{SEARCH_NOTHING_EXAMPLE}". No section is about pizza. Look at the scores.

Search is not perfect. It can put the wrong passage first. And it always returns passages, even when none of them is relevant.

<!-- panel: show_search | search the charter -->
