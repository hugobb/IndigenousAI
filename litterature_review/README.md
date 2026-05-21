# Literature Review

This folder contains papers and their summaries for the Indigenous AI project.

## Structure

```text
litterature_review/
├── README.md        # This file
├── OVERVIEW.md      # Global summary: all papers by theme, cross-cutting insights, gaps
├── papers/          # Source papers (PDF or plain text)
└── summaries/       # Structured summaries, one per paper
```

## Adding a Paper

1. Place the paper file in `papers/` using a lowercase kebab-case filename (e.g., `kay-et-al-2024-epistemic-injustice.pdf`).
2. An AI agent will automatically generate a corresponding summary in `summaries/` with the same base name and a `.md` extension.
3. The agent will also update `OVERVIEW.md` — adding the paper to the relevant theme table and refreshing the cross-cutting themes and gaps sections if needed.
4. If you are using Claude Code, simply open the repo after adding the paper and the agent will detect the new file and generate the summary.

To trigger summarization manually, tell the agent: *"Summarize the new papers in the literature review."*

## Summary Format

Each summary file follows a standard structure:

- **Core Argument** — the central claim or contribution
- **Key Concepts** — definitions of the main terms introduced or used
- **Main Findings** — bullet-pointed results or contributions
- **Relevance to Indigenous AI** — how the paper connects to the project
- **Limitations & Critiques** — weaknesses or points worth questioning
- **Questions & Follow-ups** — open questions and related work to explore

See [AGENTS.md](../AGENTS.md) for the full template.

## Existing Papers

See [OVERVIEW.md](OVERVIEW.md) for the full indexed list of all reviewed papers, organized by theme.
