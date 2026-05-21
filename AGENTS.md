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
└── litterature_review/
    ├── README.md               # Literature review instructions
    ├── papers/                 # Source papers (PDF or plain text)
    └── summaries/              # One summary file per paper
```

## Role

You assist with research ideation and project tracking. Concretely, you:

- Help develop and refine research questions, ideas, and directions in `Draft.md`
- Maintain the literature review by generating paper summaries
- Keep documentation accurate and up to date

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

## Draft Maintenance

`Draft.md` is a living research document. When assisting with research ideation:

- Add new research questions under `## Research Questions` with a clear `###` heading.
- Add new ideas under `## Research Ideas` with a `###` heading and at least one open question.
- Add reading list entries to the table in `## Reading List`.
- Add paper notes under `## Paper Notes` using the `### Notes: [Title]` heading pattern.
- Preserve all existing content — do not remove or rewrite sections without explicit instruction.

When editing `Draft.md`, keep a neutral, academic tone. Use first-person plural ("we") when describing the project's goals or methods.

---

## Conventions

- All documentation is written in English.
- Use Markdown for all `.md` files. Follow standard Markdown linting rules:
  - Table separator rows must have spaces: `| --- | --- |` not `|---|---|`
  - Fenced code blocks must specify a language (use `text` for plain structure diagrams)
  - Lists must be surrounded by blank lines
  - Headings within the same document must be unique
- Do not commit generated summaries or edits without user confirmation unless explicitly told otherwise.
