## 5. The AI writes the answer (15 min)

This is the full RAG system. It searches both documents (the charter and the CARE paper, cut into chunks of {DEMO_GOOD_SIZE} words with an overlap of {DEMO_OVERLAP}). It takes the best chunks, puts them in a message with the question and a short instruction, and sends the message to the AI.

The box shows the exact message the AI receives. The chunks are in blue.

**Do this:**
1. Click ▶️ on the box below, then click **Ask**. Compare the two answers: on the left the AI read the chunks (with RAG), on the right it only used its memory (without RAG).
2. In **Question**, type "{STORAGE_QUESTION.question}". Set **Passages** to **1** and click **Ask**. Then set **Passages** to **3** and click **Ask** again. With 1 passage, the AI does not get the chunk that has the answer (two computers in the Council office).
3. Type "{OUT_OF_DOC_QUESTION}" and click **Ask**. Neither document says. With **Let the AI say I don't know** ticked, the AI should say it doesn't know. Untick it and click **Ask** again.
4. Type "{CONFLICT_QUESTION}" and click **Ask**. The two documents disagree: the CARE paper says Collective Benefit, Authority to Control, Responsibility, Ethics; the made-up charter says Consent, Access, Review, Exit. Which answer does the AI give? Look at which chunks it received.

The AI can only answer as well as the chunks it receives. When search gives it the wrong chunks, the answer is wrong or missing.

<!-- panel: show_generation | ask with and without RAG -->
