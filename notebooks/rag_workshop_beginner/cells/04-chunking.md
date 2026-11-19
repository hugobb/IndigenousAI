## 4. Chunking: cutting documents into pieces ⏱ about 20 min

Real documents are long. An embedding is always one list of 384 numbers, whether the text is one line or a whole report. Squeezing a 1,000-word report into a single embedding blurs it, like summarising a book in one sentence. So before searching, we cut documents into smaller pieces called **chunks**, and give each chunk its own embedding. Search can then return the precise piece that answers the question.

**How you cut matters:**
- **Chunks too big:** the embedding gets blurry, and the AI receives a lot of text that has nothing to do with the question.
- **Chunks too small:** an answer can be cut in half.
- **A cut in the wrong place:** a fact that spans two sentences ends up split between two chunks.
- **Overlap** is a common fix: each chunk repeats the last few words of the one before, like roof tiles that overlap so no rain gets through.

In the panel below, the Millbrook River Watch report is coloured by chunk: **blue and orange** take turns, **green** words belong to two chunks (overlap), and the chunk that search found is in **bold and underlined**.

> **What you'll see:** the report cut into chunks, the chunk found for your question, and the model's answer when it reads only that chunk.
>
> **Try this**
> 1. Keep *Fixed size, 60 words* and the question *"Who paid for the group's testing van?"*. Click **Ask the model with this chunk**. It finds the answer.
> 2. Choose **Whole document — no chunking**. The score of the match drops: the whole report is "about" too many things at once.
> 3. Back to **Fixed size**, set **{DEMO_TINY_SIZE} words**. The chunk found now holds only part of the answer. Ask the model.
> 4. Set **{DEMO_SMALL_SIZE} words**. The size looks reasonable, but the cut falls right between *"…a second-hand testing van."* and *"It was paid for by the Harlow Valley Community Fund."* Ask the model.
> 5. Switch to **Fixed size with overlap**, keep {DEMO_SMALL_SIZE} words, and set the overlap to **{DEMO_OVERLAP}**. The answer is back in one piece. Look for the green words.
> 6. Explore the other questions and the **By sentences** option.
>
> **What to notice:** no chunk size is perfect for every question. Real systems try several, and often cut at natural boundaries like paragraphs, with some overlap.

<!-- panel: show_chunking | Cut the report into chunks -->
