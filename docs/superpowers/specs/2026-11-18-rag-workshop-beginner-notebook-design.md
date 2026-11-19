# Beginner RAG workshop notebook — design

## Intent

`notebooks/ollama_rag_workshop.ipynb` teaches RAG through code: 42 cells, about half of them code
the participant must read or edit, plus infrastructure (HDF5 caching, FAISS, `%pip`) that does not
help anyone understand RAG. The goal is a second notebook for people with **no coding
background**. They should follow each RAG step, see what it does and play with it, without reading
any code. The code stays available behind a click for people who are curious.

## Setting

- **Live workshop, about 1 h 30, roughly 20 participants.** The presenter walks through it, with
  3 assistants circulating to help.
- **Runs on Google Colab** (free tier). Participants are told they can also run it on their own
  computer, and the last section explains how.
- Participants have no CS or coding background.

## Goals

- Explain each RAG element in plain language: what it is, why it is needed, and what changes when
  you change it.
- Each section has an **interactive exercise** made of widgets (sliders, text boxes, dropdowns),
  never code edits, plus a short "What to try" prompt that encourages exploration.
- All code is hidden by default (Colab form cells: only the title and controls show; one click
  reveals the code).
- Every section works and makes sense on its own after the setup cell has run. If someone gets lost
  in section 3, an assistant can get them going again in section 4 by running a single cell.
- Keep the data-sovereignty framing (OCAP, what should be put into a system at all).

## Non-goals

- Teaching Python or teaching people to write RAG code.
- Production concerns: FAISS, HDF5 caching, vector databases, PDF loaders.
- Replacing the existing notebook. It stays as the "full code" version and is linked for curious
  people.

## Anti-goals (it fails even if it technically works if…)

- A participant has to edit code to do an exercise.
- An error or stack trace is the first thing a participant sees. Every failure that can be foreseen
  (no GPU, a model still loading, empty input) gets a plain-language message saying what to do.
- The demos do not show the effect they claim. For example, the chunk-size slider must visibly
  change which passage is retrieved and whether the answer is right, on the content we ship.
- The setup takes so long that the workshop loses its first 15 minutes.

## Constraints

- Colab free tier: a T4 GPU usually, CPU sometimes. 20 people hit Hugging Face downloads at the same
  moment.
- Models load directly with Hugging Face (`sentence-transformers` + `transformers`), with no Ollama
  (decided by the user, option B).
- Must also run in a local Jupyter (JupyterLab / VS Code) without changes, apart from the upload
  widget, which needs a fallback outside Colab.

## Approaches considered

| Option | Trade-off | Outcome |
|---|---|---|
| A. Ollama inside Colab | Same code as running at home, but a 2–3 min setup and needs a GPU for usable speed | Not chosen |
| **B. Hugging Face models in Python** | Faster and more robust in Colab; running at home means a Python setup rather than one app | **Chosen by the user** |
| C. Hosted API (OpenAI/Claude) | Easiest, but contradicts the "your data stays under your control" message | Dropped |

## Decisions

**Models**
- Embeddings: `sentence-transformers/all-MiniLM-L6-v2` (small, fast on CPU).
- Answers: `Qwen/Qwen3-1.7B` on a GPU. Falls back automatically to `Qwen/Qwen3-0.6B` on CPU.
  Thinking mode off (`enable_thinking=False`). Short answers (`max_new_tokens` ≈ 200), and output is
  streamed so people see it arrive.
- The setup cell prints one plain status line, e.g. "✅ Ready — using the GPU" or "⚠️ No GPU: answers
  will be slower. To fix: Runtime → Change runtime type → T4 GPU, then run this cell again."

**Language:** English throughout (user's decision).

**Content**
- One **fictional, clearly non-Indigenous document** of about 1,000 words is used throughout.
  Example: the annual report of an invented town river-monitoring project or community library. It
  contains specific, checkable facts (names, dates, numbers, a rule about who may access the
  records) placed at different points in the text. Some facts must span two sentences, so that a
  small chunk size can split them.
- It is fictional on purpose: the bare model cannot know it, so the "without RAG" answer reliably
  fails or makes something up. It is non-Indigenous on purpose: we do not invent a community's
  words. The user asked for a made-up document; the non-Indigenous subject is Claude's call. It is
  labelled as fictional in the notebook.
- The existing short real passages (Kaitiakitanga License, OCAP, local models) are what **Section 3
  (Search)** searches over and feed the embedding exercises. Section 3 therefore stands alone,
  before chunking.

**Verification**
- Retrieval effects (which chunk or passage wins) depend only on MiniLM, so they are the same on
  GPU and CPU. They must be verified by running them.
- Answer effects are verified on Qwen3-1.7B with greedy decoding (`do_sample=False`), so they
  repeat in the room. On the 0.6B CPU fallback they are best-effort, and the notebook says so in the
  setup status line.

**Sections and time budget (about 90 min)**

| # | Section | Min | What participants see and do |
|---|---|---|---|
| 0 | Welcome + setup | 10 | Run one cell; see the status line. Assistants check everyone is green. |
| 1 | The problem | 5 | Ask the bare model a question about the fictional document → it doesn't know or makes something up. "What if we could hand it the right page?" |
| 2 | Embeddings | 20 | (a) Type two sentences → similarity score shown as a bar plus a plain label ("very similar" / "unrelated"). (b) A 2D "map of meaning" (Plotly scatter, PCA on the embeddings) of ~15 preset sentences in colour-coded topics; a text box adds your own sentence to the map. Exercises: find two sentences with no shared words that score high; find two that share words but mean different things. |
| 3 | Search | 10 | Type a question → passages ranked with score bars. Exercise: rephrase a question until the wrong passage wins; notice what made it win. |
| 4 | Chunking | 20 | Controls: strategy (fixed words / with overlap / by sentence), size slider, overlap slider. Output: the document with each chunk in alternating colours, a chunk count, the chunk retrieved for a preset question (dropdown of 3–4 questions), and a button "Ask the model with this chunk" that shows the answer. Also: "the whole document as one chunk" for comparison. Exercises: find a size so small the answer breaks (a fact split across chunks); find one so big the retrieved chunk is mostly noise; see overlap rescue a split fact. |
| 5 | Generation | 15 | A question box + top-k slider → shows the **exact prompt** sent to the model (context highlighted), then the answer, side by side with the no-RAG answer. A checkbox for "tell the model to say 'I don't know' when the context lacks the answer" → ask something not in the document, with and without it. |
| 6 | Take it home | 10 | Recap diagram of the whole pipeline; how to run it on your own computer (local Jupyter + same notebook; Ollama as the one-app route with a link to the full notebook); what should and should not go into such a system (OCAP, community protocols). |
| — | Bonus (optional, if time or at home) | — | Upload your own `.txt` files and ask questions (Colab upload widget; a file-path text box outside Colab). Query rewriting is left out and pointed to in the full notebook. |

**Format of each section**
1. A heading and 3–6 sentences of plain explanation (no jargon left undefined; a small analogy where
   it helps).
2. A highlighted box: **What you'll see** / **Try this** (2–3 numbered prompts) / **What to notice**.
3. One hidden form cell containing the widgets.
4. Optionally, a "💡 For the curious" collapsed note with the technical term or the detail.

**Implementation shape**
- One hidden "toolkit" cell after setup defines every helper (embed, similarity, chunkers,
  retrieve, generate, the widget builders), so each section cell is a one-line `show_…()` call
  behind a form. Each section cell re-runs the toolkit cell if it was skipped, so it stands on its
  own.
- Widgets: `ipywidgets` (they work in Colab and Jupyter). Charts: Plotly.
- Embeddings of the fixed content are computed once and kept in memory, which takes seconds with
  MiniLM. No disk cache.
- Generation runs on a button click, never on every slider move.

## Left to the builder

- The exact wording of the fictional document and the preset sentences and questions, subject to
  the content rules above. They must be **verified to produce the claimed effects** with the chosen
  models (for example, at chunk size N the answer to question Q breaks), by actually running them.
- The visual styling of the boxes and chunk colouring.
- The filename (proposed: `notebooks/rag_workshop_beginner.ipynb`) and a short README note linking
  the two notebooks.
- Whether a verification script runs the notebook headless (e.g. `nbclient` on CPU with the 0.6B
  model) as a smoke test.
