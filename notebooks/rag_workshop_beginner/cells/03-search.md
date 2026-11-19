## 3. Search: finding the right passage ⏱ about 10 min

Now that we can measure how close two texts are, searching is simple:

1. **In advance**, turn every passage of your collection into an embedding.
2. **When a question arrives**, turn it into an embedding too.
3. **Rank** the passages by their similarity to the question. The top few (here, 3) are what the AI will read.

Below is a small collection of 8 real passages about AI and data sovereignty. One of them is about Te Hiku Media, a Māori organisation that shares its language data under a *Kaitiakitanga License*.

> **What you'll see:** all 8 passages, ranked from most to least relevant to your question.
>
> **Try this**
> 1. Click **Search** with the question already there. Which passage comes first? Does it contain the words of your question?
> 2. Ask *"{SEARCH_MISS_EXAMPLE}"* The passage that really answers this is the one about **Ollama** (running AI on your own computer, without internet). Is it first? Why might search prefer another passage?
> 3. Ask *"What's the best pizza topping?"* None of the passages is about pizza. Look at the scores.
>
> **What to notice:** search works with meaning, not exact words, but it is not perfect: it can put the wrong passage first, and it **always returns something**, even when nothing is relevant. Remember this for section 5.

<!-- panel: show_search | Search the passages -->
