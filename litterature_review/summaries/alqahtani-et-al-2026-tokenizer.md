# Stop Taking Tokenizers for Granted: They Are Core Design Decisions in Large Language Models

**Authors:** Sawsan Alqahtani, Mir Tafseer Nayeem, Md Tahmid Rahman Laskar, Tasnim Mohiuddin, M. Saiful Bari
**Year:** 2026
**Venue:** EACL 2026 — 19th Conference of the European Chapter of the ACL, Long Papers, pages 8410–8432

---

## Core Argument

Tokenization is routinely treated as a preprocessing afterthought in LLM development, but it is in fact a core design decision with cascading effects on model efficiency, fairness, linguistic fidelity, and cross-lingual performance. The paper argues for a principled, context-aware framework in which tokenizer design, evaluation, and documentation are co-designed with the model rather than inherited from prior systems.

## Key Concepts

- **Tokenizer–model co-design:** The principle that tokenization choices should be made in conjunction with architecture and training objectives, not inherited by default from previously released tokenizers.
- **Context-aware tokenization:** Adapting tokenizer design to the specific linguistic characteristics, domain, and deployment context of the target application, rather than applying a universal BPE/WordPiece/Unigram default.
- **Tokenizer reuse problem:** The widespread practice of adopting a previously trained tokenizer without re-evaluating its fit for a new language, domain, or task — a practice the paper identifies as a hidden source of bias and inefficiency.
- **Multi-dimensional evaluation:** Moving beyond simple fertility or compression metrics to systematic evaluation of fairness, representational alignment, and domain-specific coverage.
- **Audited and safe tokenization:** Proactive analysis of token frequency distributions and fragmentation effects to identify undertrained tokens, bias patterns, and morphological misalignments before they affect model behavior.

## Main Findings

- Standard subword tokenization methods (BPE, WordPiece, Unigram) offer scalability but systematically misalign with linguistic structure for morphologically rich and low-resource languages, amplifying existing biases and wasting vocabulary capacity.
- Five common alternative perspectives on tokenization are identified and critiqued: that subword tokenization is sufficient; that current metrics accurately reflect quality; that byte-level methods remove the need for design; that token-free approaches will supplant tokenization; that joint optimization enables true co-design. Each is found to be overstated or premature.
- Tokenizer reuse — inheriting a tokenizer trained on data and for tasks different from the target setting — is identified as the most pervasive unexamined practice, causing misaligned boundaries, inflated sequence lengths, and fairness harms.
- The paper proposes replacing ad-hoc practices with a structured framework: (1) principled corpus and vocabulary construction, (2) standardized multi-dimensional evaluation, (3) transparent documentation for reproducibility.

## Relevance to Indigenous AI

This paper provides direct, actionable guidance for the tokenizer design decision that is central to any Mohawk-language AI system. Its core recommendation — treat tokenization as a design decision, not a given — directly validates the concern raised across multiple papers in this corpus that existing tokenizers are ill-suited to polysynthetic languages. The framework for context-aware tokenizer selection (considering linguistic type, domain, and deployment constraints) is directly applicable to Mohawk: a morphologically productive, low-resource language for which no existing tokenizer has been designed. The paper also explicitly flags that reusing tokenizers trained on majority-language data produces fairness harms — a concern particularly acute when the language in question is an endangered Indigenous language.

## Limitations & Critiques

- The paper is primarily a position/framework paper; it does not empirically evaluate tokenizer co-design for specific low-resource or Indigenous languages.
- Polysynthetic languages are mentioned as a case where over-fragmentation is expected but are not analyzed in depth.
- The proposed framework requires practitioners to have enough linguistic knowledge to specify context-aware design criteria — a resource constraint for under-documented languages like Mohawk.

## Questions & Follow-ups

- What would a context-aware tokenizer specification look like for Mohawk, given its pronominal prefix system and verb-centric polysynthesis?
- Is morpheme-level tokenization (segmenting Mohawk word forms into pronominal prefix + stem + aspect marker) achievable given existing Mohawk linguistic resources, and would it improve downstream task performance?
- Related work: Arnett & Bergen (2025) (empirical analysis of tokenization and morphological complexity), Arnett et al. (2025) (MorphScore expanded to 70 languages), Goldman et al. (2024) (tokenizer compression and LM performance), Schmidt et al. (2024) (tokenization is more than compression).
