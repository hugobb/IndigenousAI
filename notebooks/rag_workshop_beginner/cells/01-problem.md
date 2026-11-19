## 1. The problem: an AI that guesses ⏱ about 5 min

A language model (the kind of AI behind chatbots) has read a huge amount of text, and it answers from what it remembers. But it knows nothing about documents it never saw: your organisation's reports, a community's records, or anything written after it was trained. When it doesn't know, it often doesn't say so. Instead it writes something that *sounds* right. This is called a **hallucination**.

Throughout this workshop we will use the annual report of **Millbrook River Watch**, a volunteer group that tests the water of a town's river. The group and its report are **fictional**: we invented them so that the AI cannot possibly know them already. You will see the full report in section 4.

> **What you'll see:** the model answers a question about Millbrook River Watch's annual meeting without having seen the report.
>
> **Try this**
> 1. Click ▶️ below, then click **Ask the model**.
> 2. Read the answer. Does it sound sure of itself?
> 3. Compare with the truth from the report: the meeting is on **March 14, 2026, at the Millbrook Public Library**.
>
> **What to notice:** the model does not say "I don't know". It guesses, and the guess sounds convincing.

<!-- panel: show_problem | Ask the model, without the report -->

**What if, before answering, we could hand the model the right page of the report?** That is exactly what RAG does:

```
 your question ──► 🔎 search your documents ──► 📄 the best passages ──► 🤖 the model writes the answer
```

To search by meaning, the computer first needs a way to tell whether two pieces of text mean similar things. That is the job of **embeddings**.
