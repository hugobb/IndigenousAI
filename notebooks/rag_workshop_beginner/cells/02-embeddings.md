## 2. Embeddings: how a computer compares meanings (20 min)

To search by meaning, the computer turns each sentence into a list of 384 numbers. This list is called an **embedding**. Two sentences with similar meanings get similar numbers, even if they use different words.

By comparing two embeddings, the computer gives a **similarity score**: 0 means unrelated, and the higher the score, the closer the meanings. With this model, scores above 0.6 are rare, and 0.4 is already close.

### 2a. Compare two sentences

**Do this:**
1. Click ▶️ on the box below. You see two sentences and their score.
2. In the **Example** menu, choose each example in turn:
   - "Same meaning, different words": a high score, even though the sentences share almost no words.
   - "Same word, different meaning": a low score, even though both sentences contain the word "record".
   - "Unrelated": a low score.
3. Write your own sentences in **Sentence A** and **Sentence B**, then click **Compare**. Try "I love winter." and "I hate winter."

The score tells you if two sentences talk about the same thing, not if they agree. "I love winter." and "I hate winter." get a high score.

<!-- panel: show_similarity | compare two sentences -->

### 2b. The map of meanings

The map shows 16 sentences. Each dot is a sentence. Dots close together have similar meanings. The colours show 4 topics.

**Do this:**
1. Click ▶️ on the box below.
2. Move your mouse over the dots to read the sentences.
3. Type "Nobody may record a ceremony without the family's permission." in the text box, then click **Add to map**. Your sentence appears as a black star. Which colour is it closest to?
4. Add your own sentences. Click **Reset** to remove them.

Nobody told the computer what the topics are. It places sentences with similar meanings close together on its own.

<!-- panel: show_meaning_map | the map of meanings -->

<details><summary>More detail (optional)</summary>

The embedding model is `all-MiniLM-L6-v2`. The similarity score is the cosine similarity between the two lists of numbers. To draw the map, the 384 numbers are reduced to 2 with a method called PCA, so the map is only an approximation.

</details>
