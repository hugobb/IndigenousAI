## 4. Chunking: cutting a document into pieces (20 min)

Real documents are long. One embedding for a whole document is too vague, so the document is cut into small pieces called **chunks**. Each chunk gets its own embedding, and search returns the best chunk.

In the box below, the charter is cut into chunks. The chunks are coloured blue and orange in turn. Words in green belong to two chunks (this is called **overlap**). The chunk picked by search is in bold and underlined, and is shown again below the text.

**Do this:**
1. Click ▶️ on the box below. Leave **Question** on "{DAYS_QUESTION.question}" and click **Ask the AI with this chunk**. The AI answers: within 45 days. Correct.
2. In **How to cut**, choose **Whole document (no chunking)**. The score goes down: one embedding for the whole charter is too vague.
3. Choose **Fixed size** again and move **Words/chunk** to **{DEMO_TINY_SIZE}**. Click **Ask the AI with this chunk**. The chunks are now too short to hold the answer.
4. Move **Words/chunk** back to **{DEMO_GOOD_SIZE}**. In **Question**, choose "{VOTE_QUESTION.question}". In the text, find "{CUT_BEFORE}": the chunk ends there, in the middle of the answer. Click **Ask the AI with this chunk**.
5. In **How to cut**, choose **Fixed size with overlap**, and set **Overlap** to **{DEMO_OVERLAP}**. Each chunk now repeats the last {DEMO_OVERLAP} words of the chunk before it. The answer is in one chunk again. Click **Ask the AI with this chunk**.
6. Try the other questions, and the **By sentences** option.

Chunks that are too big are vague. Chunks that are too small, or cut in the wrong place, lose the answer. Overlap helps.

<!-- panel: show_chunking | cut the charter into chunks -->
