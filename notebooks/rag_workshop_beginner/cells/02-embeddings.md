## 2. Embeddings: turning meaning into numbers ⏱ about 20 min

Computers can't compare meanings directly, but they are very good at comparing numbers. An **embedding model** reads a piece of text and turns it into a list of numbers (here, 384 of them). Think of these numbers as the **coordinates of the sentence on a giant map of meaning**. Sentences that mean similar things land close together, even when they use completely different words.

To measure how close two sentences are, we use a **similarity score**. A score near **1** means the two sentences are about the same thing, and a score near **0** means they have nothing in common. With this model, a score around 0.5 already means "close".

### 2a. Compare two sentences

> **What you'll see:** two sentences and their similarity score.
>
> **Try this**
> 1. Look at the first example, *"Same meaning, different words"*. The two sentences share almost no words. What score do they get?
> 2. Pick *"Same word, different meaning"* in the **Example** menu. Both sentences contain the word "bank". Is the score high?
> 3. Write your own pair, then click **Compare**. Try a sentence and its opposite, like *"I love winter."* and *"I hate winter."*
>
> **What to notice:** the score measures whether two sentences are **about the same thing**, not whether they agree. Opposites are often "close" because they talk about the same topic.

<!-- panel: show_similarity | Compare two sentences -->

### 2b. The map of meaning

384 numbers can't be drawn on a screen, so we squash them down to just 2. It's a bit like the shadow of a 3D object on a wall: you keep the general shape but lose some detail. On the map below, each dot is a sentence, and the colours show four topics we picked.

> **What you'll see:** 16 sentences on a map, grouped by meaning.
>
> **Try this**
> 1. Hover over the dots to read the sentences. Do the colours form groups?
> 2. Type *"My grandmother bakes the best apple pie."* and click **Add to map**. Where does your ★ land?
> 3. Add a sentence that mixes two topics, like *"We cooked the fish we caught in the river."* Then add one in another language, like *"La rivière déborde après la pluie."* (this model learned mostly from English text).
>
> **What to notice:** nobody told the computer what the topics are. The groups appear on their own, from the meaning alone. The map moves a little each time you add a sentence, because squashing 384 numbers into 2 is only an approximation.

<!-- panel: show_meaning_map | The map of meaning -->

<details><summary>💡 For the curious</summary>

The embedding model is `all-MiniLM-L6-v2`. It is small (about 90 MB) and fast, and it was trained on more than a billion pairs of related sentences. The similarity score is called **cosine similarity**: it measures the angle between two lists of numbers seen as arrows. The squashing to 2D is called **PCA** (principal component analysis).

</details>
