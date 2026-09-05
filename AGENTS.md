# Indigenous AI — Agent Instructions

## Project

Research project with Abundant Intelligence exploring how generative AI can be developed with and for Indigenous communities to support the continuance, transmission, and protection of their languages and cultures. The current focus is on the Mohawk language (Kanien'kéha) and Six Nations community.

See [README.md](README.md) for project overview and [Draft.md](Draft.md) for the full research document.

## Repository Layout

```text
IndigenousAI/
├── AGENTS.md                   # This file
├── CLAUDE.md                   # Claude Code config
├── README.md                   # Project overview
├── Draft.md                    # Living research draft
├── reports/                    # Deep-dive technical and conceptual reports
│   ├── README.md               # Reports index and naming conventions
│   └── *.md                    # One report per focused topic
├── docs/                       # MkDocs Material technique guide (cd docs && mkdocs serve)
│   ├── mkdocs.yml
│   └── docs/
│       ├── guide/              # End-to-end framework for building Indigenous language AI
│       ├── ml-techniques/      # ML/NLP technique docs (21 docs + index)
│       └── process-techniques/ # Process & methodology technique docs (18 docs + index)
├── tasks/                      # Task records — one dated subfolder per task
│   └── YYYY-MM-DD-task-name/
│       ├── PLAN.md             # Task prompt and methodology (reusable)
│       ├── PROGRESS.md         # Live progress tracker
│       └── papers-analyzed.md  # Paper-level extraction status (task-specific)
└── litterature_review/
    ├── README.md               # Literature review instructions
    ├── OVERVIEW.md             # Systematic review synthesis (all papers)
    ├── papers/                 # Source papers (PDF or plain text)
    └── summaries/              # One summary file per paper
```

## Role

You assist with research ideation and project tracking. Concretely, you:

- Help develop and refine research questions, ideas, and directions in `Draft.md`
- Maintain the literature review by generating paper summaries
- Keep documentation accurate and up to date
- Maintain and extend the technique guide in `docs/`

## Literature Review — Auto-Summarization

### Trigger

When the user adds a paper to `litterature_review/papers/`, generate a corresponding summary file in `litterature_review/summaries/`.

### How to detect new papers

Check for papers in `litterature_review/papers/` that have no matching summary in `litterature_review/summaries/`. A match is a file with the same base name and a `.md` extension.

### Summary file naming

Use the same base name as the paper file, with a `.md` extension.

- Paper: `litterature_review/papers/kay-et-al-2024-epistemic-injustice.pdf`
- Summary: `litterature_review/summaries/kay-et-al-2024-epistemic-injustice.md`

Prefer lowercase kebab-case filenames when naming new papers.

### Summary format

```markdown
# [Full Paper Title]

**Authors:** [Author names]
**Year:** [Publication year]
**Venue:** [Conference / Journal / Preprint]
**Link:** [URL if available]

---

## Core Argument

[2–3 sentences stating the central claim or contribution of the paper.]

## Key Concepts

- **[Concept]:** [One-line definition or explanation]
- **[Concept]:** [One-line definition or explanation]

## Main Findings

- [Finding 1]
- [Finding 2]
- [Finding 3]

## Relevance to Indigenous AI

[2–4 sentences explaining how this paper connects to the project's goals: language revitalization, Indigenous epistemology, data sovereignty, evaluation, methodology, etc.]

## Limitations & Critiques

- [Limitation or critique 1]
- [Limitation or critique 2]

## Questions & Follow-ups

- [Open question raised by this paper]
- [Related work to explore]
```

### Steps

1. Read the paper (or its abstract and sections if it is long).
2. Create the summary file using the format above.
3. Update the global overview file (see below).
4. Inform the user which files were created or updated.

Do not ask for confirmation before generating a summary — proceed automatically when a new paper is detected. If the paper cannot be read (e.g., encrypted PDF), inform the user and ask them to provide the text.

---

## Literature Review — Global Overview

### File

`litterature_review/OVERVIEW.md` is a **synthetic literature review** in the style of an academic systematic review. It is not an index or a list of summaries — it is a structured synthesis that integrates findings across papers into coherent narratives by theme. Update it every time a summary is added, edited, or removed.

### Format

```markdown
# Literature Review — Synthesis

> Last updated: [YYYY-MM-DD]. [N] papers reviewed.

## Scope

[2–3 sentences describing what this review covers: topic, inclusion criteria, and the project context it serves.]

## Paper Index

| # | Title | Authors | Year | Themes |
| --- | --- | --- | --- | --- |
| 1 | [Title](summaries/filename.md) | Last et al. | YYYY | theme-a, theme-b |

---

## Thematic Synthesis

### [Theme Name]

[Synthesizing prose — 2–4 paragraphs integrating findings from multiple papers. Do not summarize papers one by one; instead, identify what the papers collectively establish, where they agree, and where they diverge. Cite papers inline as (Author et al., YYYY).]

### [Theme Name]

[Same structure.]

---

## Convergences

[3–5 bullet points identifying claims, findings, or framings that recur across multiple papers and can be taken as relatively well-established in the literature.]

## Tensions & Divergences

[3–5 bullet points identifying places where papers disagree, use conflicting framings, or point in different directions.]

## Gaps & Open Questions

[3–5 bullet points identifying what the literature does not yet address — questions that remain open, methods that have not been tried, communities or languages that are underrepresented.]
```

### Themes

Organize sections around the project's core concerns. Suggested starting themes — revise as the corpus grows:

- **Epistemic justice & representation** — bias, cultural misrepresentation, epistemic harm, data sovereignty
- **Language revitalization & NLP** — low-resource languages, endangered language tools, linguistic inclusion
- **Methodology & co-construction** — ethical frameworks, participatory research, community partnership
- **Evaluation & benchmarking** — metrics, benchmarks, human evaluation, cultural fidelity

A paper can be cited in more than one theme section.

### Keeping it current

- **When adding a summary:** re-read all existing summaries, then rewrite the relevant theme sections to integrate the new paper. Update the Paper Index and the header date and count. Revise Convergences, Tensions, and Gaps if the new paper changes the picture.
- **When removing a summary:** remove the paper from the index and revise any theme sections that cited it.
- **Synthesis standard:** every claim in the thematic sections must be grounded in at least one paper in the index. Do not introduce outside knowledge. Write in third person, past tense, academic register.

---

## Reports

### What reports are

`reports/` contains deep-dive research reports on specific technical or conceptual topics. A report synthesizes multiple sources, working discussions, and technical reasoning on a single focused question — going deeper than a literature review summary or `OVERVIEW.md` can cover. Reports are not tied to individual papers.

### When to write a report

Write a new report (a new `.md` file in `reports/`) when:

- A specific technical question requires systematic analysis before a research or implementation decision (e.g., tokenization strategies, morphological analysis tools)
- A design decision requires comparing multiple approaches in depth
- Background knowledge on a topic needs thorough documentation that would be too long for `Draft.md`

### Report format

Reports have no fixed template — structure them to serve the question. A report typically includes:

- A summary section (3–5 bullet headline findings)
- Numbered sections developing the analysis
- A synthesis section drawing conclusions
- A references section

### Naming convention

Use lowercase kebab-case filenames that describe the topic (e.g., `tokenizer.md`, `mohawk-morphology.md`). Add an entry to the table in `reports/README.md` whenever a new report is created.

---

## Draft Maintenance

`Draft.md` is a living research document. When assisting with research ideation:

- Add new research questions under `## Research Questions` with a clear `###` heading.
- Add new ideas under `## Research Ideas` with a `###` heading and at least one open question.
- Add reading list entries to the table in `## Reading List`.
- Add paper notes under `## Paper Notes` using the `### Notes: [Title]` heading pattern.
- Preserve all existing content — do not remove or rewrite sections without explicit instruction.

When editing `Draft.md`, keep a neutral, academic tone. Use first-person plural ("we") when describing the project's goals or methods.

---

## Technique Guide (`docs/`)

The MkDocs Material site at `docs/` is the primary output of the technique extraction workflow. It contains two inventories built from the literature review:

- **`docs/docs/ml-techniques/`** — 21 ML/NLP technique docs + `index.md`
- **`docs/docs/process-techniques/`** — 18 process & methodology technique docs + `index.md`

Each technique doc follows a fixed structure: Description → When to Use → How to Apply → Pseudocode → Evidence → Variations → Code & Tools → Strengths & Weaknesses → References → Self-Review Notes.

**To run the site locally:** `cd docs && mkdocs serve`

**To build the site:** `cd docs && mkdocs build` (output in `docs/site/`)

**To add a new technique doc:**

1. Create `docs/docs/ml-techniques/[slug].md` or `docs/docs/process-techniques/[slug].md` using the structure above.
2. Add a row to the corresponding `index.md` table (use `[slug.md](slug.md)` links — MkDocs requires `.md` extensions).
3. Add the technique to the `nav:` section in `docs/mkdocs.yml` under the appropriate category.
4. Use `&lt;` instead of bare `<` before digits in prose (e.g., `&lt;1K`) — Markdown parsers may misinterpret them.
5. Use `??? note "Title"` syntax for collapsible Self-Review Notes blocks (MkDocs Material `details` extension).

---

## Tasks (`tasks/`)

`tasks/` records multi-step agent workflows. Each task lives in its own dated subfolder:

```text
tasks/YYYY-MM-DD-task-name/
├── PLAN.md             # Reusable task prompt and methodology
├── PROGRESS.md         # Live step-by-step tracker
└── [task-specific files]
```

**Existing tasks:**

| Folder | Description | Status |
| --- | --- | --- |
| `2026-06-11-technique-inventory` | Extract technique docs from top 26 papers; 63 medium-priority papers deferred | ✅ Done (first pass) |

To continue the technique inventory (process the 63 deferred papers), see `tasks/2026-06-11-technique-inventory/PLAN.md` — Step 3 instructions and `papers-analyzed.md` contain everything needed to resume.

---

## Repository Navigation

Use this map to find the right file for the information you need.

| I am looking for… | Go to |
| --- | --- |
| Project overview and research goal | [README.md](README.md) |
| Research questions, ideas, and framework | [Draft.md](Draft.md) — `## Research Questions`, `## Research Ideas` |
| Reading list / papers to read | [Draft.md](Draft.md) — `## Reading List` |
| Notes on a specific paper | [Draft.md](Draft.md) — `## Paper Notes` → `### Notes: [Title]` |
| Summary of a specific paper | [litterature_review/summaries/](litterature_review/summaries/) — `[author-year-slug].md` |
| Synthesis of the full literature | [litterature_review/OVERVIEW.md](litterature_review/OVERVIEW.md) |
| Deep-dive on a specific technical topic | [reports/](reports/) — `[topic-slug].md` |
| ML or process technique documentation | [docs/docs/ml-techniques/](docs/docs/ml-techniques/) or [docs/docs/process-techniques/](docs/docs/process-techniques/) |
| Technique extraction task plan / progress | [tasks/2026-06-11-technique-inventory/](tasks/2026-06-11-technique-inventory/) |
| AI agent workflows and conventions | [AGENTS.md](AGENTS.md) — this file |
| How to add a paper | [litterature_review/README.md](litterature_review/README.md) |

**Decision guide — where to put new content:**

- New paper to read → add to reading list in `Draft.md`
- New paper just read → add summary to `litterature_review/summaries/`, update `OVERVIEW.md`
- New research question or idea → add to `Draft.md` under the appropriate section
- Deep technical analysis (multi-source, substantial length) → new file in `reports/`, add to `reports/README.md` table
- Cross-paper pattern or emerging synthesis point → add to `litterature_review/OVERVIEW.md`
- New technique extracted from a paper → new doc in `docs/docs/ml-techniques/` or `docs/docs/process-techniques/`, row in the corresponding `index.md`
- New multi-step agent task → new folder in `tasks/YYYY-MM-DD-task-name/` with `PLAN.md` and `PROGRESS.md`

---

## Conventions

- All documentation is written in English.
- Use Markdown for all `.md` files. Follow standard Markdown linting rules:
  - Table separator rows must have spaces: `| --- | --- |` not `|---|---|`
  - Fenced code blocks must specify a language (use `text` for plain structure diagrams)
  - Lists must be surrounded by blank lines
  - Headings within the same document must be unique
- Do not commit generated summaries or edits without user confirmation unless explicitly told otherwise.
