## 5. Generation: writing the answer ⏱ about 15 min

The last step puts everything together. The system takes the question, finds the **k** closest chunks of the report (k is just "how many"), and sends the model one piece of text: **instructions + those chunks + the question**. There is nothing magic about it. The model reads that text, the way you would, and writes an answer. The panel shows you exactly what the model receives, with the chunks highlighted in blue.

> **What you'll see:** the exact text sent to the model, then two answers side by side: one with RAG (it read the chunks) and one without (memory only).
>
> **Try this**
> 1. Click **Ask** with the question about the annual meeting and 3 passages. Compare the two columns.
> 2. Set **Passages (k)** to **1** and ask again. The single closest chunk is now the report's introduction (it mentions the group's name), not the meeting. What does the model say?
> 3. Ask *"{OUT_OF_DOC_QUESTION}"* The report doesn't say. Try it with **Allow 'I don't know'** ticked, then unticked.
> 4. Ask your own questions about the report (you can read it in section 4).
>
> **What to notice:** the model can only be as good as the chunks it is given. When search hands it the wrong chunk, it cannot answer, and it may guess. Most RAG mistakes are really search mistakes.

<!-- panel: show_generation | Ask with and without RAG -->
