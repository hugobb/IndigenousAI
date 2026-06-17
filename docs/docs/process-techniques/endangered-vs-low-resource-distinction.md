
# Endangered vs. Low-Resource Language Distinction

**Category:** Process & Methodology Technique
**Data Regime:** any (applies before any technical decision is made)
**Applicable Languages:** All — this technique determines the correct category for the target language before method selection

## Description

The endangered/low-resource distinction is a diagnostic framework for correctly categorizing the target language before selecting NLP methods, research priorities, and community engagement protocols. The NLP community uses "low-resource" to describe any language lacking digital training data — but this umbrella term obscures a critical difference that determines nearly every downstream decision: whether the language has a large population of living speakers (merely lacking digitized resources) or whether it is critically endangered with few remaining fluent speakers and genuine risk of extinction.

Liu et al. (2022) propose a three-category taxonomy (Elephant/Ocelot/Coyote) derived from analysis of 1,050 ACL Anthology abstracts:

| Category | Description | Count in ACL (2022) | Examples |
|---|---|---|---|
| **Elephant** | Widely spoken, well supported | 99 (60.7%) | Bengali, Danish, Igbo, Pashto, Tagalog |
| **Ocelot** | Fewer speakers, well supported | 39 (23.9%) | Faroese, Maori, Quechua, Yiddish |
| **Coyote** | Few speakers, little support | 25 (15.3%) | Bribri, Kodi, Mi'kmaq, Veps, Yine |

Key finding: Coyote languages represent only 15.3% of "low-resource" languages mentioned in ACL Anthology, but face categorically different challenges and are the least served by standard NLP assumptions. Models and architectures developed for Elephant languages will not automatically work for Coyote languages, and research goals that are appropriate for Elephant languages may actively conflict with Coyote community priorities.

**The critical differences are:**

1. **Data ceiling:** For Coyote languages, more data cannot simply be collected on demand. The number of fluent speakers — often elder-only — sets a hard upper bound on how much language data can ever be produced. For Elephant languages, data scarcity is a solvable resource problem; for Coyote languages, it is a structural constraint of the language's endangered status.

2. **Standardization:** Most Coyote languages lack a widely accepted standard orthography. Multiple competing written forms may exist, developed by different linguists or communities over decades. This complicates any approach that assumes textual data can be pooled across sources.

3. **Research priority mismatch:** Coyote community priorities center on revitalization (creating new speakers), documentation (recording and archiving elder knowledge), and transmission (supporting the Master Speaker/apprentice relationship). Standard NLP research priorities (benchmark performance, publishable architectures, dataset scale) do not align with these goals. Research that achieves high benchmark scores without serving any of these community goals may actually harm the community by consuming resources without delivering benefit.

4. **Ethical asymmetry:** Data extraction is catastrophic for Coyote languages (a community that loses control of its only digital language resources may lose them permanently) but recoverable for Elephant languages (the community can generate more data). This makes data sovereignty requirements much more stringent for Coyote languages.

5. **Corporate interest dynamics:** Elephant and Ocelot languages attract industry attention and funding (commercial language tools are viable). Coyote languages do not attract commercial interest — but they do attract extractive attention from researchers who see rare digitized resources as data sources. This creates an asymmetric risk profile: Coyote languages receive less support but face predatory data extraction.

**How to apply the distinction:**

Correctly categorizing the target language changes nearly every downstream decision. A Coyote language requires: community partnership from the outset (not consultation), data sovereignty agreements before any collection, acceptance of hard data ceilings, prioritization of pedagogical over benchmark applications, and long-term community commitment. An Elephant language permits faster iteration, standard NLP benchmarks, and a wider set of viable architectures.

## When to Use

- Before beginning any language technology project — the first diagnostic step is categorizing the target language.
- When reviewing a proposed method or architecture for applicability to your target language — check whether the evidence base is from Coyote or Elephant languages.
- When writing a project proposal or ethics application — the category determines the appropriate community engagement requirements.
- When reading NLP literature described as "low-resource" — assess which category the paper's target language falls into before applying its findings.
- When communicating with funders or institutional partners about the nature and scope of the work.

**Less applicable when:**
- The language's status is well-known to all project stakeholders and the distinction has already been established.
- The project is purely methodological (developing a technique with no specific target language community).

## How to Apply

1. **Assess speaker population size and age distribution.** How many people are L1 speakers? What is their age distribution? If most L1 speakers are elderly, the effective data production rate is severely constrained regardless of population size. (Coyote indicator: handful of fluent speakers, mostly or entirely elders.)

2. **Assess external support.** Does the language have government recognition, dedicated funding programs, university language programs, or standardized curricula? (Coyote indicator: little or no government recognition, no sustained external funding for language work.)

3. **Assess digital resource availability.** Does the language have a standardized orthography accepted by most community members? Existing text corpora? Dictionary tools or linguistic databases? (Coyote indicator: no agreed-upon standard orthography or multiple competing orthographies; sparse digital resources.)

4. **Assess community self-determination capacity.** Does the community have internal capacity to run language programs, conduct documentation, and govern data independently? (Coyote indicator: limited internal capacity; high dependence on external researchers.)

5. **Classify and apply the corresponding protocol.**
   - **Elephant:** Standard low-resource NLP methods apply. Data collection can be scaled with resources. Commercial partnerships may be viable.
   - **Ocelot:** Modified low-resource methods apply. Orthographic standardization is a priority. Some community consultation required; data sovereignty agreements recommended but not necessarily critical.
   - **Coyote:** Full community partnership required before any technical work. Data sovereignty agreements are mandatory. Pedagogical and documentation priorities dominate. Hard data ceiling must be factored into method selection. Long-term commitment expected.

6. **Document the classification in project materials.** Make the language category explicit in your ethics application, data management plan, and publication. Use specific demographic numbers rather than generic "low-resource" labels. This makes your work more honest and helps future researchers correctly interpret your findings.

## Pseudocode

```
procedure ClassifyLanguage(language):

    // Step 1: Speaker demographics
    l1_speakers = census_or_community_estimate(language.speakers)
    speaker_age_distribution = get_age_distribution(language)
    elder_only = (speaker_age_distribution.median_age > 60 AND
                  l1_speakers < 1000)

    // Step 2: External support
    has_government_recognition = language.official_status != NONE
    has_sustained_funding = language.active_grant_programs.count > 0
    has_university_programs = language.university_courses.count > 0

    // Step 3: Digital resources
    has_standard_orthography = community.orthography_agreement == CONSENSUS
    has_text_corpus = language.available_text_tokens > 100_000
    has_dictionary_tools = language.digital_dictionary_exists

    // Step 4: Community capacity
    has_internal_researchers = community.language_researchers.count > 0
    runs_own_programs = community.language_programs.community_run

    // Step 5: Classify
    if l1_speakers < 1000 AND elder_only AND NOT has_sustained_funding:
        category = COYOTE
        protocol = "full_community_partnership_required"
        data_ceiling = "hard — determined by remaining speaker count"
        method_constraint = "pedagogical/documentation priority over benchmarks"
    elif l1_speakers < 50_000 AND has_sustained_funding:
        category = OCELOT
        protocol = "consultation_with_data_sovereignty_recommended"
        data_ceiling = "soft — constrained by resources, not speaker count"
    else:
        category = ELEPHANT
        protocol = "standard_low_resource_nlp"
        data_ceiling = "scalable with resources"

    return classification(category, protocol, data_ceiling)

// Application to method selection
function select_method(language_category, task):
    if language_category == COYOTE:
        // Prioritize: pedagogical tools, documentation, archive support
        // De-prioritize: benchmark MT, LLM fine-tuning, large corpora
        // Required: community approval, data sovereignty agreement
        return method_aligned_with_community_priorities(task)
    else:
        return standard_low_resource_method(task)
```

## Evidence

**Liu et al. (2022) — ACL 2022:**

- Analysis of 1,050 ACL Anthology abstracts containing the terms "low resource," "under resourced," or "resource constrained": 163 unique languages identified as low-resource. Classified into Elephant (99, 60.7%), Ocelot (39, 23.9%), Coyote (25, 15.3%).
- Coyote languages are dramatically underrepresented relative to their need: they are the most critically endangered but receive the least research attention that is relevant to their actual situation.
- Thought experiment comparing three communities (Elephant, Ocelot, Coyote): demonstrates concretely how the same research approach (ASR development) produces viable results for Elephant (WER below 20%), adequate results for Ocelot (similar WER), and inadequate results for Coyote (WER ~40% with only 6 hours of audio, and structurally no more data to collect).
- Coyote (critically endangered) language: 6 hours of transcribed monolingual audio collected over 5 years; physical ceiling on data availability regardless of researcher effort or funding. "For speech communities like Elephant and Ocelot... it is possible to collect more data, whenever it is needed. For endangered languages like Coyote's, however, it is unlikely that it will ever be possible to gather even dozens of hours of audio data."
- Orthographic instability case: the Coyote language has 8 different orthographic representations developed over decades by different linguists and anthropologists. Each creates incompatible text data; pooling is not possible without normalization that itself requires linguistic expertise and community consensus.

**Methodological survey finding:**
- Community language teachers (96%) value pedagogical applications most highly — consistent with Coyote priorities.
- But some teachers express skepticism about ASR specifically: "To me this is just a way for linguists to secure funding for themselves and their tech project, which takes money and resources away from speech communities. This kind of thing is not language revitalization, as it doesn't create new speakers." This response is specific to Coyote communities; it reflects a correct assessment that ASR serves researcher agendas (Elephant-oriented benchmarks) rather than Coyote community priorities.

## Variations & Configuration

- **Hybrid classification:** Some languages sit at the Ocelot/Coyote boundary (e.g., 1,000–3,000 speakers, some external support, but declining speaker numbers and elder concentration). For these cases, apply Coyote protocols as the default safe choice.
- **Dialect-level classification:** A language may be Ocelot overall but Coyote at the dialect level (e.g., a specific regional variety with only a few elderly speakers may have Coyote dynamics even if the language family is larger). Classify at the relevant unit of analysis for your project.
- **Project-phase specificity:** The classification may affect different project phases differently. Data collection from a Coyote community requires full partnership; building an MT system trained only on existing archival data may have fewer constraints. Apply the classification at each phase of the project, not just once.
- **Re-classification over time:** A language's category can change. A revitalization program that successfully trains new adult speakers may move a language from Coyote toward Ocelot. Track changes and update your protocols accordingly.

## Code & Tools

- **Ethnologue:** https://www.ethnologue.com — standard reference for language speaker counts, endangerment status, and geographic distribution.
- **UNESCO Atlas of the World's Languages in Danger:** https://www.unesco.org/languages-atlas — UNESCO endangerment ratings; useful for initial classification.
- **Endangered Languages Project:** https://endangeredlanguages.com — community-maintained database of language endangerment status with more current data than Ethnologue for many Indigenous languages.
- **ACL Anthology search:** https://aclanthology.org — search for your target language to assess research coverage; low coverage combined with low Ethnologue speaker count suggests Coyote status.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Prevents the most common category error in low-resource NLP: applying Elephant methods to Coyote languages and expecting comparable results | Speaker count data (from census, Ethnologue) may be outdated or undercount actual fluent speakers |
| Makes explicit the structural data ceiling for Coyote languages — prevents unrealistic project scoping | The three-category taxonomy is a simplification; real languages form a continuum |
| Guides method selection, community engagement level, and data sovereignty requirements from a single classification | Classification requires community demographic knowledge that may not be publicly available |
| Improves literature interoperability: published results tagged with language category are more usable by other researchers | Researchers may resist using the framework because "Coyote" classification closes off certain methods they wish to use |
| Directly counters the false equivalence in "low-resource" terminology that obscures critical differences | The framework does not itself prescribe what to do for each category — that requires additional guidance |

## References

- Liu, Z., Richardson, C. (Karuk), Hatcher, R., & Prud'hommeaux, E. (2022). Not always about you: Prioritizing community needs when developing endangered language technology. *ACL 2022*, pp. 3933–3944.
- Joshi, P., Santy, S., Budhiraja, A., Bali, K., & Choudhury, M. (2020). The state and fate of linguistic diversity and inclusion in the NLP world. *ACL 2020*, pp. 6282–6293.
- Lewis, M. P., Simons, G. F., & Fennig, C. D. (2015). *Ethnologue: Languages of the World, 18th Edition*. SIL International.
- Meek, B. A. (2012). *We are our language: An ethnography of language revitalization in a Northern Athabaskan community*. University of Arizona Press.
- Bird, S. (2020). Decolonising Speech and Language Technology. *COLING 2020*, pp. 3504–3519.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The six-step How to Apply section provides a concrete diagnostic procedure: assess speaker population, external support, digital resources, and community capacity, then classify and apply the corresponding protocol. The mapping of classification outcomes to downstream protocols (Elephant → standard NLP, Ocelot → modified methods, Coyote → full partnership) is explicit and actionable. The Variations section covers edge cases (hybrid/border cases, dialect-level classification, phase-specific re-application) that a practitioner will encounter immediately. No specialized tools or domain expertise are required to apply the framework.

    **Criterion 2 — Empirical results with numbers:** PASS — The ACL Anthology analysis is numerically grounded: 1,050 abstracts surveyed, 163 languages identified, with exact percentages by category (Elephant 60.7%, Ocelot 23.9%, Coyote 15.3%). The Coyote ASR thought experiment is anchored by concrete figures: 6 hours of audio collected over 5 years, WER ~40% compared to sub-20% for Elephant/Ocelot conditions. The 8 competing orthographic representations for the Coyote example language is a specific, citable claim. The 96% teacher preference for pedagogical applications is sourced. All figures are attributed to Liu et al. 2022 (ACL 2022) with page numbers in the references.

    **Criterion 3 — Data regime / context clarity:** PASS — The header explicitly states "any (applies before any technical decision is made)" and the opening description makes clear this is a prerequisite diagnostic, not a method for a specific data regime. The data ceiling concept is clearly distinguished between Elephant (resource-constrained, solvable) and Coyote (structurally determined by speaker demographics). The note on corporate interest dynamics adds an important asymmetric risk dimension that helps practitioners understand why Coyote classification triggers more stringent protocols than raw data scarcity alone would suggest.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The `ClassifyLanguage` procedure is clean and the threshold values (l1_speakers < 1000, median_age > 60, l1_speakers < 50,000) give concrete cutoffs. However, the thresholds are presented as if they are definitive when the paper's taxonomy is intentionally non-numerical — Liu et al. use Elephant/Ocelot/Coyote as named examples, not a formal threshold-based classifier. A practitioner following the pseudocode literally might misclassify a language with 1,200 speakers and no young speakers as Ocelot rather than Coyote-protocol-required. The Variations section addresses this ("apply Coyote protocols as the default safe choice" for border cases), but that guidance is not reflected in the pseudocode itself. The `select_method()` function is a reasonable abstraction but leaves `method_aligned_with_community_priorities()` undefined.

    **Criterion 5 — Failure modes:** PASS — The Weaknesses table documents: outdated census data, three-category oversimplification, inaccessible demographic data, researcher resistance to Coyote classification, and the framework's non-prescriptive nature. The Variations section adds reclassification over time and the dialect-level classification caveat. The quoted teacher skepticism ("just a way for linguists to secure funding") is included as direct evidence of the research-priority-mismatch failure mode. The asymmetric data extraction risk for Coyote communities is explicitly named.

    **Overall:** The strongest of the five docs on empirical grounding and failure mode documentation. The main gap is in the pseudocode: the numerical classification thresholds are more precise than the underlying taxonomy warrants, and `method_aligned_with_community_priorities()` is left undefined. Noting in the pseudocode that thresholds are heuristic defaults (not Liu et al.'s own formulation) and adding a comment pointing to the Master Speaker Protocol doc for Coyote method selection would close the gap.

