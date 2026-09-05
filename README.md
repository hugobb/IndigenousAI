# Indigenous AI

Research project with Abundant Intelligence exploring how generative AI can be developed _with_ and _for_ Indigenous communities to support the continuance, transmission, and protection of their languages and cultures.

## Research Goal

How can generative AI technologies be designed to align with Indigenous worldviews, knowledge practices, and data sovereignty? And conversely, how might Indigenous perspectives reshape AI itself — informing new algorithms, architectures, or design paradigms?

## The atlas

An interactive map of NLP initiatives for Indigenous languages, published as a
companion to the review paper: <https://indigenous-ai-atlas.vercel.app/atlas/>

The whole state of a view — the filters, the timeline window, the selected
record — is encoded in the URL, so a particular view can be cited directly by
copying the address bar. There is no separate share step and no shortener; the
link is the state.

Records are published only after a person has reviewed them. While any record is
still under review the atlas serves a holding page rather than provisional data,
and the build refuses to ship the unreviewed ones.

## Licence

Prose, data and paper summaries are CC-BY-4.0 (`LICENSE-CONTENT`); the source
code is MIT (`LICENSE`). If you use this work, `CITATION.cff` says how to cite
it.

## Repository Structure

```text
IndigenousAI/
├── AGENTS.md                   # AI agent instructions and workflows
├── CLAUDE.md                   # Claude Code config (references AGENTS.md)
├── README.md                   # This file
├── Draft.md                    # Living research draft: questions, ideas, directions
├── reports/                    # Deep-dive technical and conceptual reports
│   ├── README.md               # Reports index and naming conventions
│   └── *.md                    # One report per focused topic
└── litterature_review/
    ├── README.md               # How to add papers and trigger auto-summarization
    ├── OVERVIEW.md             # Systematic review synthesis across all papers
    ├── papers/                 # Source papers (PDF or text)
    └── summaries/              # Auto-generated summaries, one per paper
```

## Key Documents

| Document                                                                 | Purpose                                                                                        |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [Draft.md](Draft.md)                                                     | Main research document: project context, research questions, framework, ideas, and paper notes |
| [litterature_review/OVERVIEW.md](litterature_review/OVERVIEW.md)         | Systematic review synthesis integrating findings across all papers                             |
| [reports/](reports/)                                                     | Deep-dive reports on specific technical or conceptual topics                                   |
| [litterature_review/README.md](litterature_review/README.md)             | Instructions for the literature review workflow                                                |
| [AGENTS.md](AGENTS.md)                                                   | AI agent workflows, navigation guide, and documentation conventions                            |

## Literature Review Workflow

When a paper is added to `litterature_review/papers/`, an AI agent can automatically generate a structured summary in `litterature_review/summaries/`. See [AGENTS.md](AGENTS.md) for the full workflow and summary format.

## Research Themes

- Linguistic specificities of Indigenous languages and their implications for LLM design
- Epistemology and values encoded in generative AI systems
- Evaluation of LLMs on Indigenous language and culture
- Ethical frameworks for co-construction with Indigenous communities
- Applied tools: RAG, fine-tuning, knowledge graphs, prompt engineering

## Context

The project focuses initially on the **Mohawk language** (Kanien'kéha) and the **Six Nations** community, drawing on two archives:

- **Thru The Red Door (TRD)** — 1 million digitized and labeled documents on Six Nations history and culture
- **Western University archive** — multilingual (English / Mohawk) materials, currently being digitized pending consent
