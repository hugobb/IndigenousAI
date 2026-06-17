
# WordWeaver FST Verb Conjugator Framework

**Category:** ML Technique
**Data Regime:** any (rule-based; no training data required — requires linguistic expertise and FST grammar)
**Applicable Languages:** Polysynthetic languages with highly inflected verbal morphology; demonstrated on Kanyen'kéha (Mohawk) and Michif; designed for extensibility to any language with a verb paradigm expressible as an FST

## Description

WordWeaver is a software framework for building community-facing verb conjugators for polysynthetic languages. It separates two concerns: (1) the **linguistic back-end** — a finite-state transducer (FST) that models the language's verbal morphology and generates all valid conjugated forms from a stem and morpheme specifications; and (2) the **front-end interface** — a web and mobile progressive web application (PWA) that guides learners through verb conjugation without requiring knowledge of FSTs or linguistics.

The framework was designed at NRC Canada at the request of Owennatékha Brian Maracle (Onkwawenna Kentyohkwa adult immersion school, Six Nations Grand River), who identified verb conjugation as the central pedagogical bottleneck in Kanyen'kéha (Mohawk) language learning. The resulting system is called **Kawennón:nis** ("It Makes Words") and covers both the Western dialect (Ohsweken/Six Nations) and the Eastern dialect (Kahnawà:ke community, Quebec).

**Why verb conjugation is hard for polysynthetic languages:** In Kanyen'kéha, verb roots are bound morphemes — they cannot stand alone as words. Every verb form requires a pronominal prefix, a root, and an aspectual ending. Kanyen'kéha has 14 free pronouns and 72 bound pronouns, 12 tense/aspect combinations, and pre- and post-pronominal prefixes. Even for a single common verb, this produces millions of possible surface forms. A paper paradigm table is impractical; a software conjugator that generates forms on demand is the only practical pedagogical tool.

**Architecture:**
- **Back-end:** Foma FST (the `lexc` formalism) encodes the language's morphophonological rules. New verb stems are entered in a spreadsheet; the spreadsheet is compiled into an FST lexicon. This design allows community teachers — not computer scientists — to add new verbs.
- **Database and API:** Data is stored in a CouchDB/FastAPI layer. The FST initially provided forms directly; the current architecture stores generated forms in the database, decoupling the runtime interface from FST availability.
- **Front-end (WordWeaver UI):** Angular SPA, available as a PWA (installable on Android and iOS, works offline after initial download). Translated into English, French, and Kanyen'kéha. Two main views:
  - **Wordmaker:** Linear guided interface — the learner answers three questions: what action (verb root), who is doing it (pronominal), when (tense/aspect). Returns a single conjugated form with its morpheme breakdown and an English gloss.
  - **Tablemaker (Tableviewer):** Advanced paradigm table view — the learner selects multiple options across the three dimensions to generate a tabular or tree-format paradigm; exportable as Word, CSV, or LaTeX for flashcard creation.

**Scale:** The Western dialect (Kawennón:nis) contains 250+ verb stems; the Eastern (Kahnawà:ke) version has approximately 600 stems. Both versions generate over 100,000 conjugated forms.

## When to Use

- You are building a verb conjugator for a polysynthetic language where verb forms cannot be covered by a finite dictionary or flashcard set.
- The community has (or can develop) an FST or partial FST for the language's verbal morphology.
- The target users are language learners and teachers, not computational linguists — the interface must hide FST complexity.
- An adult immersion school or language curriculum exists and needs a digital practice tool that complements classroom instruction rather than replacing it.
- Community members should be able to add new verbs to the system without programming knowledge (spreadsheet-driven stem entry).

**Less applicable when:**
- No FST or grammar documentation exists for the language's verbal morphology — WordWeaver requires a linguistic model as input, not a training corpus.
- The language's morphology is agglutinative but not polysynthetic — simpler conjugation tables may be more appropriate.
- The community has no interest in a digital tool or prefers oral-only transmission — never build a tool without a community-stated need.

## How to Apply

1. **Identify the community need and obtain community authorization.** WordWeaver was built because an Indigenous educator (Brian Maracle) asked for it. Do not build a conjugator unless community language teachers have identified verb conjugation as a priority. Get explicit authorization from the relevant language authority (school, band, language organization).

2. **Document the verb morphology.** Compile or obtain the verbal paradigm: bound pronouns (typically 70–80+ in Iroquoian languages), tense/aspect categories, verb root list, and morphophonological alternation rules (sandhi, palatalization, vowel harmony, etc.). Source materials: grammar books, teacher's manuals, existing conjugation tables.

3. **Build or adapt the FST back-end using Foma/lexc.**
   - Represent verb roots as lexical entries in a `.lexc` file.
   - Encode morphophonological rules as phonological alternation rules in `foma` script.
   - Test the FST against known paradigm forms from the grammar book; achieve high coverage before proceeding.
   - Design the stem-entry spreadsheet template so community teachers can add new verbs in a structured format.

4. **Compile stems and generate the form database.** Run the FST compiler over the stem spreadsheet to generate all valid conjugated forms; load into CouchDB. This step is repeatable as new stems are added.

5. **Deploy the WordWeaver UI.**
   - Clone the open-source WordWeaver repository and configure for the target language.
   - Translate the UI strings into the target language (in addition to the dominant language of instruction).
   - Enable PWA packaging for offline mobile use.
   - Work with community designers on the visual design and user experience; multi-day in-person collaborative sessions are essential.

6. **Quality control with community teachers.** Have language teachers at the partner school validate generated forms against their own knowledge. Fix FST rules based on their feedback. Repeat until coverage and accuracy are satisfactory.

7. **Train teachers and learners.** Hold in-person training sessions. Build simple print materials (flashcard templates generated from the CSV export) to bridge digital and paper-based pedagogy.

## Pseudocode

```
// Back-end: FST-based form generation

// Step 1: Define stem list (from community-maintained spreadsheet)
stems = load_spreadsheet("verb_stems.xlsx")  // [{root: "atékhw", gloss: "eat", ...}, ...]

// Step 2: Compile FST from lexc rules
fst = foma_compile(
    lexicon = "kanyen_keha_verbs.lexc",    // encodes morpheme categories and their ordering
    rules   = "kanyen_keha_phonology.foma" // encodes morphophonological alternations
)

// Step 3: Generate paradigm for each stem
for stem in stems:
    for pronoun in BOUND_PRONOUNS:         // 72 bound pronouns
        for aspect in TENSE_ASPECT_CATS:   // 12 tense/aspect combinations
            surface_form = fst.transduce(stem.root, pronoun, aspect)
            if surface_form:
                db.insert({
                    stem: stem.root,
                    pronoun: pronoun,
                    aspect: aspect,
                    form: surface_form,
                    gloss: build_gloss(stem.gloss, pronoun, aspect)
                })

// Front-end: Wordmaker query
function wordmaker_query(root, pronoun, aspect):
    result = db.query(stem=root, pronoun=pronoun, aspect=aspect)
    return {
        form: result.form,
        morpheme_breakdown: result.breakdown,
        english_gloss: result.gloss
    }

// Front-end: Tablemaker paradigm query
function tablemaker_query(roots, pronouns, aspects):
    results = db.query(stem IN roots, pronoun IN pronouns, aspect IN aspects)
    return format_as_paradigm_table(results)  // tabular or tree view
```

## Evidence

**Kuhn et al. (2020) — COLING 2020, NRC Canada ILT project:**

- Kawennón:nis (Western dialect) deployed with 250+ verb stems, 72 bound pronouns, 12 tense/aspect combinations: generates 100,000+ conjugated forms.
- Eastern (Kahnawà:ke) version: approximately 600 verb stems. Both versions serve distinct dialect communities.
- Quality control: in-person multi-day sessions with teachers at Onkwawenna Kentyohkwa; teachers added hundreds of new verbs via the spreadsheet workflow.
- UI translated into English, French, and Kanyen'kéha; PWA available offline.
- System referenced in Liu et al. (2022) as one of the few successful tools serving an endangered Haudenosaunee language community: "the verb conjugator, Kawennón:nis, developed for the Ohsweken dialect of Kanyen'kéha" is cited as a notable exception to the general scarcity of NLP tools for Coyote-category languages.
- A second instance for Michif (Métis) was begun using the same framework (Li Verb kaa-Ooshitahk di Michif FST), demonstrating extensibility beyond Iroquoian to polysynthetic Algonquian-French mixed language.

## Variations & Configuration

- **Multiple dialects:** WordWeaver supports separate instances per dialect (Western vs. Eastern Kanyen'kéha). Each instance has its own FST back-end and stem database; the front-end can be shared across instances or deployed as separate applications.
- **Export formats:** Forms can be exported as CSV (for spreadsheet-based flashcard creation), Microsoft Word (formatted paradigm tables), or LaTeX. This allows community teachers to produce print materials from the digital tool.
- **Offline-first PWA:** The application works without internet after initial download — critical for community members in areas with unreliable connectivity.
- **Database decoupling:** The current architecture stores all generated forms in the database rather than querying the FST at runtime. This removes the FST dependency from production serving and allows the application to run even if the FST compiler is unavailable.
- **Spreadsheet-driven stem entry:** New verb stems can be added by community members using a structured spreadsheet, compiled into the FST lexicon by a technical collaborator. This lowers the barrier for community-driven vocabulary expansion without requiring programming or linguistics expertise.

## Code & Tools

- **WordWeaver (open-source framework):** https://github.com/roedoejet/wordweaver — NRC Canada's open-source WordWeaver system; includes front-end UI and back-end API.
- **Kawennón:nis (live):** https://kawennonnis.ca — the deployed Western dialect instance for Kanyen'kéha.
- **Foma FST compiler:** https://github.com/mhulden/foma — the FST toolkit used for Kanyen'kéha morphological rules; supports `lexc` formalism.
- **HFST (Helsinki FST Tools):** https://github.com/hfst/hfst — alternative FST toolkit with broader language support; compatible with `lexc` grammars.
- **Keyman keyboard platform:** https://keyman.com — the open-source keyboard system with which WordWeaver's predictive text module integrates.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Generates all valid conjugated forms exhaustively — no ceiling on paradigm coverage | Requires an FST encoding the language's verbal morphology; building the FST requires linguistic expertise and community collaboration time |
| Spreadsheet-driven stem entry allows community teachers to expand vocabulary without programming skills | FST coverage is imperfect; irregular or archaic forms may require manual rule extension |
| PWA architecture enables offline use — essential for communities with unreliable connectivity | In-person collaborative design and QA sessions require travel budget and sustained researcher availability |
| UI translated into the target language — reinforces language learning through the tool itself | Building separate instances for each dialect multiplies maintenance burden |
| Community-initiated and community-validated — directly responds to a stated pedagogical need | The tool complements classroom instruction; it does not create new speakers on its own |
| Open-source and extensible to any language whose morphology can be encoded as an FST | FST maintenance burden grows as the language is further documented and new dialectal forms are identified |

## References

- Kuhn, R., et al. (2020). The Indigenous Languages Technology project at NRC Canada: An empowerment-oriented approach to developing language software. *COLING 2020*, pp. 5866–5878.
- Kazantseva, A., Maracle, O. B., Martin, A., & Pine, A. (2018). Kawennón:nis: the Wordmaker for Kanyen'kéha. *Workshop on Computational Modeling of Polysynthetic Languages*, COLING 2018, pp. 53–64.
- Liu, Z., Richardson, C., Hatcher, R., & Prud'hommeaux, E. (2022). Not always about you: Prioritizing community needs when developing endangered language technology. *ACL 2022*, pp. 3933–3944.
- Hulden, M. (2009). Foma: a finite-state compiler and library. *EACL 2009 Demo session*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — The seven-step How to Apply section covers the full workflow clearly, and the pseudocode illustrates the FST-compile → DB-load → query loop. However, the `lexc` grammar authoring step (Step 3) lacks any example morpheme rule or minimal `.lexc` snippet, so a practitioner without prior FST experience could not start writing the grammar without consulting Foma documentation externally. The spreadsheet-to-FST compilation step ("compile into an FST lexicon") is described at a conceptual level but the actual Foma CLI invocation is not shown.

    **Criterion 2 — Empirical results with numbers:** PASS — Concrete numbers are present: 250+ stems (Western), ~600 stems (Eastern), 72 bound pronouns, 12 tense/aspect combinations, 100,000+ generated forms. Source is cited (Kuhn et al. 2020, COLING 2020) with paper title and page numbers. The Michif extension is mentioned as a second instance, and Liu et al. 2022 citation contextualizes the tool's community impact.

    **Criterion 3 — Data regime / context clarity:** PASS — The header explicitly states "any (rule-based; no training data required — requires linguistic expertise and FST grammar)." The When to Use and Less Applicable sections are precise about the polysynthetic requirement and the FST prerequisite. The distinction from corpus-based approaches is made explicit.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The pseudocode covers the generation loop and both front-end query types correctly. However, `foma_compile()` is a black-box call with no indication of what the `.lexc` and `.foma` inputs look like. `build_gloss()` is called but never defined. The pseudocode is sufficient to understand the architecture but not to replicate the FST authoring step.

    **Criterion 5 — Failure modes:** PARTIAL — The Weaknesses table notes FST coverage imperfections and irregular/archaic forms requiring manual rule extension. The maintenance burden of multiple dialect instances is flagged. However, common failure modes during FST development (rule conflicts, over-generation, under-generation, phonological rule ordering errors) and runtime failures (form lookup misses, dialect mismatch between FST and community usage) are not explicitly described as failure scenarios with mitigation strategies.

    **Overall:** Strong on empirical grounding and architectural clarity. The main gaps are: (1) no minimal `.lexc` example to bootstrap FST authoring, (2) `build_gloss()` undefined in pseudocode, and (3) failure modes during FST development phase are underdocumented. Adding a 5-line `.lexc` snippet and a failure-modes subsection would make this fully implementable from scratch.

