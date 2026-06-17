# Task: Technique Inventory — Docusaurus Documentation Site

**Created:** 2026-06-11
**Status:** In Progress

---

## Goal

Build a Docusaurus documentation site at `IndigenousAI/docs/` serving as a practical guide for any community or team starting from scratch to develop AI for indigenous language revitalization. The site covers:

1. **Guide** — end-to-end framework for building AI for indigenous languages
2. **ML Techniques** — one detailed doc per ML/NLP technique, built from the literature
3. **Process & Methodology Techniques** — one detailed doc per process/methodology technique

---

## Context

The literature review at `IndigenousAI/litterature_review/` contains 92 reviewed papers across six themes:
- Epistemic Justice & Representation
- Language Revitalization & NLP
- Tokenization, Morphology & Polysynthetic NLP
- RAG, Knowledge Graphs & Retrieval Systems
- Low-Resource LLM Adaptation & Community AI
- Methodology & Co-construction

Summaries are in `litterature_review/summaries/`. PDFs are in `litterature_review/papers/`.

---

## Execution Steps

### Step 0 — Task scaffold (this file + PROGRESS.md + papers-analyzed.md)

Create the task folder `tasks/2026-06-11-technique-inventory/` containing:
- `PLAN.md` — this file
- `PROGRESS.md` — live progress tracker
- `papers-analyzed.md` — persistent index of all 92 papers with status

### Step 1 — Initialize Docusaurus

Spawn one subagent to initialize a Docusaurus site (`pnpm create docusaurus@latest docs classic --typescript`) inside `IndigenousAI/`. Configure the sidebar with three top-level categories: **Guide**, **ML Techniques**, **Process & Methodology Techniques**.

Create two skeleton index files:
- `docs/ml-techniques/index.md` — intro + empty table: `Technique | Short Description | Data Regime | Link`
- `docs/process-techniques/index.md` — intro + empty table: same columns

### Step 2 — Screen all 92 papers

Spawn one subagent that reads all 92 summary `.md` files in `litterature_review/summaries/` and produces a ranked list. For each paper: `{ paper_slug, paper_title, techniques_mentioned[], technique_type: ml|process|both, priority: high|medium|low, read_pdf_needed: true|false }`.

Priority criteria:
- `high` — paper's primary contribution is a novel, concrete technique with implementation details
- `medium` — technique comparison, application study, or useful implementation context
- `low` — survey, ethics critique, or epistemological paper with limited implementation specifics

The subagent selects the **top 20–25 high-priority papers** and updates both `PROGRESS.md` and `papers-analyzed.md` with the full screening results.

### Step 3 — Sequential technique extraction

For each of the top 20–25 papers, spawn subagents **one at a time** (sequential, to avoid file conflicts). Each subagent:

1. Reads the paper's markdown summary from `litterature_review/summaries/`
2. If `read_pdf_needed: true`, also reads the PDF from `litterature_review/papers/`
3. Reads the relevant index file(s)
4. Reads `papers-analyzed.md` to confirm not already processed
5. For each technique found:
   - **ML technique, new** → create `docs/ml-techniques/[technique-slug].md`, add row to `ml-techniques/index.md`
   - **ML technique, exists** → read existing doc, update with complementary info
   - **Process technique, new** → create `docs/process-techniques/[technique-slug].md`, add row to `process-techniques/index.md`
   - **Process technique, exists** → read existing doc, update with complementary info
6. Mark paper as `analyzed` in `papers-analyzed.md`
7. Update `PROGRESS.md`

#### Technique doc structure

Each technique doc must contain:

```markdown
## Description
Detailed enough to implement/apply from scratch.

## When to Use
Required data size, language typology, compute constraints, applicable tasks.

## How to Apply
Step-by-step instructions.

## Pseudocode
Algorithm pseudocode (ML) or process flowchart (methodology).

## Evidence
Empirical results with numbers (dataset, model, metric scores).
Note convergence or conflict across papers.

## Variations & Configuration
Hyperparameters, model choices, known variants.

## Code & Tools
GitHub repos, libraries, tools mentioned in papers.

## Strengths & Weaknesses
Summary table.

## References
Papers that use/discuss this technique.
```

### Step 4 — Self-review (per technique doc)

After each technique doc is created or updated, immediately spawn a self-review subagent. Reviewer checks:
- (a) Implementable from scratch?
- (b) Empirical results cited with numbers?
- (c) Applicable data regime clear?
- (d) Pseudocode present and unambiguous?
- (e) Failure modes documented?

Reviewer appends a `<details><summary>📋 Self-Review Notes</summary>` block listing gaps — does **not** edit main content.

### Step 5 — Final progress update

Update `PROGRESS.md` with a summary of what was completed, what remains (remaining `medium` papers), and instructions for re-running Step 3 to extend the inventory.

---

## How to Extend This Task

To process the remaining `medium`-priority papers:

1. Check `papers-analyzed.md` for papers with status `pending` or `medium`
2. Re-run Step 3 for each unprocessed paper (spawn sequential subagents as described above)
3. Each subagent reads `papers-analyzed.md` first to avoid re-processing

---

## File Structure

```
IndigenousAI/
├── docs/                                      # Docusaurus site
│   ├── docusaurus.config.ts
│   ├── sidebars.ts
│   ├── docs/
│   │   ├── guide/
│   │   ├── ml-techniques/
│   │   │   ├── index.md
│   │   │   └── [technique-slug].md
│   │   └── process-techniques/
│   │       ├── index.md
│   │       └── [technique-slug].md
│   └── ...
└── tasks/
    └── 2026-06-11-technique-inventory/
        ├── PLAN.md                            # This file
        ├── PROGRESS.md                        # Live progress tracker
        └── papers-analyzed.md                 # Index of all 92 papers
```
