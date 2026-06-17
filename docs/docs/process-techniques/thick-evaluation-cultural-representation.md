
# Thick Evaluation of Cultural Representation

**Category:** Process & Methodology Technique
**Data Regime:** any (evaluation methodology, not a training technique)
**Applicable Languages:** Any language community whose cultural representation is at stake in AI outputs; especially non-Western, Indigenous, and minority communities underrepresented in AI training data

## Description

A framework for evaluating whether AI system outputs adequately represent a culture, moving beyond positivist benchmark metrics to participatory, contextually-grounded, discursive assessments. Developed by Qadri et al. (2025) drawing on Ryle's and Geertz's anthropological concept of "thick description."

**Thin evaluations** (the current dominant paradigm) measure cultural representation through accuracy on multiple-choice questions, demographic diversity classifiers, or factual recall benchmarks. They treat culture as a static, objective ground truth measurable by external researchers. They reproduce Western biases from training data and systematically miss the social and political stakes of representation.

**Thick evaluations** treat cultural representation as situated, dynamic, and negotiated — requiring lived cultural knowledge and genuine co-construction with the communities being represented. They are grounded in the finding that community members evaluate AI representation through multiple, intersecting dimensions that thin evaluations cannot capture.

**Five dimensions of cultural representation** (empirically derived from workshops with 37 South Asian participants):

1. **Incorrectness** — The depicted cultural artifacts, landmarks, or practices are factually wrong. Example: an AI-generated image of a Sri Lankan landmark that gets its shape wrong. This is the dimension *closest* to thin evaluation and can sometimes be assessed with binary accuracy metrics.

2. **Missingness** — Important cultural elements are absent from the output. Example: AI images of Sri Lanka never showing beaches, post offices, or railway stations — places that are commonplace in Sri Lankan daily life. This dimension is especially critical for endangered languages where what the model *cannot* represent (rare vocabulary, endangered cultural practices) may be more significant than what it says incorrectly.

3. **Specificity** — The output is overly generic, failing to capture the particular cultural nuances of a subculture, region, or intersectional identity. Example: generating images of "saris" that collapse regional variations (Marathi vs. Northern vs. Southern saris) into a generic form.

4. **Coherence** — The output is internally inconsistent or anachronistic, mixing cultural signifiers from different regions, time periods, or social contexts. Example: an image that shows Tamil attire with Sinhalese New Year decorations, or a modern Pakistani street with 1970s-era dress. Coherence evaluation requires understanding of appropriate co-occurrence of cultural elements — knowledge that outsiders typically lack.

5. **Connotation** — The output carries unintended, harmful, or stereotyped cultural associations beyond its literal denotation. Example: images of Pakistani men all depicted with beards, evoking Western stereotypes; depictions of women in traditional dress implying poverty or backwardness. This is the *thickest* dimension and the one least accessible to thin evaluation.

**Key findings about how people evaluate representation:**
- People evaluate representation *multi-dimensionally* — not through a single accuracy axis.
- Representation goals are *situated and dynamic*: what counts as "good" representation depends on who is asking, for what purpose, and from what social position; goals change over time with generational shifts.
- Representation goals are *constructed through discourse*: collective workshop discussion revealed disagreements and new insights that individual annotation tasks would have missed.
- Outsiders cannot reliably evaluate cultural representation — they lack the situated social knowledge required, especially for "coherence" and "connotation."

## When to Use

- When evaluating whether an AI system (language model, image generator, translation system) adequately represents a specific culture or community.
- When designing an evaluation protocol for a new AI system to be deployed in a non-Western or Indigenous community context.
- When existing benchmark scores (accuracy, BLEU, chrF) have been reported but there is concern they do not reflect community experience.
- When there is internal disagreement within a community about what "good" AI representation means — thick evaluation provides a structured framework for surfacing and negotiating that disagreement.
- When advocacy is needed to push back against thin-evaluation-only assessments of AI systems affecting a community.

**Less suitable when:**
- Only a quick, cheap preliminary assessment is needed — thin evaluations are faster and cheaper; use them as a starting point and supplement with thick evaluation for the dimensions they miss (missingness, connotation).
- The community has no representatives available to participate in workshops — thick evaluations require genuine community co-construction.

## How to Apply

**Phase 1 — Preparation**

1. Define the evaluation scope: which AI system outputs, for which community, for what purpose.
2. Identify community members as co-evaluators. Recruit through community organizations, language programs, or cultural institutions — not through crowdworker platforms. Aim for diversity within the community: age, gender, region, urban/rural background, diaspora vs. homeland.
3. Partner with a *local research collaborator* deeply embedded in the community. This partner should: have extensive experience with marginalized local communities; understand local cultural norms (platform choice, meeting framing, question design); and be able to facilitate in the local language if needed.
4. Design a **pre-workshop individual evaluation task**: each participant evaluates a personalized set of AI outputs (generated from prompts they provided) independently, before any group discussion. This preserves individual perspectives that might be suppressed in group settings.

**Phase 2 — Workshop facilitation**

5. Convene an in-person (preferred) or online workshop of 10–15 participants per site. Four hours is a sufficient duration.
6. Structure the workshop in three sections:
   - *Reflective discussion*: participants share their individual evaluation experiences from the pre-workshop task, drawing from their lived experience with their culture.
   - *Prompting exercises*: participants iteratively refine prompts through multi-turn interactions with the AI system, exploring how different framings affect outputs.
   - *Evaluation discussion*: collective reflection on cultural representation, surfacing dimensions of evaluation that individual tasks missed.
7. Use the **five-dimension framework** as a discussion scaffold — not a checklist to fill out, but a vocabulary for articulating what participants find wrong, missing, or harmful.
8. Record and transcribe all sessions (with consent). Where necessary, translate with local partners.

**Phase 3 — Analysis**

9. Apply **reflexive thematic analysis** (Braun & Clarke 2006/2021): iteratively generate themes that capture patterns of shared meaning across workshop sections and sites.
10. Use a collaborative digital whiteboard (e.g., Mural) to cluster codes into larger themes, discussing relationships and resolving disagreements in synchronous group sessions.
11. Attribute quotes to participants using anonymized identifiers (e.g., country code + number: PK-8, LK-11, IN-3).
12. Identify where community members *disagree* about what good representation looks like — these disagreements are findings, not errors to be resolved away.

**Phase 4 — Reporting and feeding back to AI development**

13. Report evaluation results in terms of the five dimensions, with community quotes as evidence. Do not collapse results into a single score.
14. Document *dynamic* representation goals: what the community wants from AI representation is likely to shift over time; note generational differences, diaspora vs. homeland differences, and contextual variation.
15. Feed findings back into AI system development as design requirements, not just evaluation scores.

## Pseudocode

```
procedure ThickEvaluation(ai_system, community, evaluation_scope):

    // Phase 1: Preparation
    community_evaluators = recruit_diverse_participants(
        community=community,
        sources=["community_organizations", "language_programs", "cultural_institutions"],
        NOT=["crowdworker_platforms"],
        diversity_axes=["age", "gender", "region", "urban_rural", "diaspora_homeland"])
    
    local_collaborator = identify_embedded_local_partner(community)
    
    // Pre-workshop individual task
    for each participant in community_evaluators:
        prompt = participant.generate_culturally_relevant_prompt()
        ai_output = ai_system.generate(prompt)
        individual_evaluation = participant.evaluate(
            ai_output,
            // Do NOT define "good" or "representation" — let participants define
            question="Is this a good representation of your cultural experience?")

    // Phase 2: Workshop facilitation (in-person preferred, 4 hours, 10–15 participants)
    workshop = convene(participants=community_evaluators, mode="in_person")
    
    // Section 1: Reflective discussion
    discussion_1 = facilitate_reflection(
        seed=individual_evaluations,
        prompt="What did you notice about how the AI represented your culture?")
    
    // Section 2: Prompting exercises
    discussion_2 = facilitate_prompting(
        ai_system=ai_system,
        prompt="Refine prompts to explore how framing affects outputs")
    
    // Section 3: Evaluation discussion using five-dimension scaffold
    dimensions = ["incorrectness", "missingness", "specificity", "coherence", "connotation"]
    discussion_3 = facilitate_dimension_discussion(
        dimensions=dimensions,
        // Scaffold, not checklist
        goal="surface what matters to participants, not fill a rubric")
    
    // Phase 3: Analysis
    transcripts = record_and_transcribe(workshop, consent=True)
    codes = reflexive_thematic_analysis(transcripts)  // Braun & Clarke 2021
    themes = cluster_codes(codes, tool="collaborative_whiteboard")
    disagreements = identify_internal_disagreements(themes)
        // Disagreements are findings, not errors

    // Phase 4: Report and feed back
    report = {
        "dimensions": {dim: evidence_quotes for dim in dimensions},
        "dynamic_goals": document_how_goals_vary(by=["generation", "diaspora", "context"]),
        "disagreements": disagreements,
        "recommendations": derive_design_requirements(themes)
    }
    feed_back_to_ai_development(report, as="design_requirements")
    return report
```

## Evidence

Qadri et al. (2025) conducted three in-person workshops and two online workshops across three South Asian countries (Sri Lanka, Pakistan, India). Total: 37 participants (11 Sri Lanka, 10 Pakistan, 15 India across two workshops). Participants were recruited through local research partners with extensive experience in marginalized communities.

**Key empirical findings:**

- Participants across three workshop sites *disagreed significantly* on what "correct" cultural representation looked like — even within a single country. This finding directly challenges the assumption that a single ground-truth evaluation rubric can be constructed for a culture.
- Standard benchmark metrics (accuracy, recall) failed to capture the dimensions participants cared most about: *missingness* (what was left out) and *connotation* (harmful associations). Thin evaluations could rate an output as "correct" while participants experienced it as harmful or reductive.
- "Coherence" failures were identified as particularly damaging: models that mixed cultural elements across different South Asian contexts flattened regional distinctions in ways participants found offensive and inaccurate.
- Representation goals are demonstrably dynamic: participants noted that some cultural elements models depicted accurately were no longer practiced, while new practices were absent. "[This] seems like Pakistan from the 70s. Pakistan has evolved. This is a very old Pakistan." (PK-11)
- Collective discussion revealed disagreements and new insights unavailable to individual annotation: a debate about whether to combat stereotypes vs. reflect realism could only be surfaced through group dialogue.
- Evaluation becomes *thicker* as the dimension becomes more social: incorrectness can often be assessed individually; connotation requires collective negotiation.

**Limitation to note:** All three workshop sites were South Asian and English-literate urban populations. Findings have not yet been validated for communities with very different relationships to technology, literacy, or formal participation frameworks — including oral-primary Indigenous communities.

## Variations & Configuration

- **Thin + thick complementarity:** Thin evaluations (accuracy, chrF, BLEU) are *not* to be abandoned — they provide cheap initial screening and "baseline empiricism." The five dimensions suggest which constructs require thick evaluation: use thin for "incorrectness," thick for "missingness," "specificity," "coherence," and especially "connotation."
- **Adaptation for oral/aural contexts:** For Indigenous communities where language outputs may be spoken rather than written (ASR, TTS), replace image-based evaluation with audio playback tasks. The five dimensions still apply: are sounds/words incorrect? Missing? Generic? Incoherent? Carrying harmful connotations?
- **Adaptation for language evaluation (not image evaluation):** Apply the five dimensions to language model outputs for endangered languages. "Missingness" is especially critical: what vocabulary, grammatical structures, or cultural concepts is the model unable to express? For an endangered language, the gaps may matter more than the errors.
- **Longitudinal thick evaluation:** Because representation goals are dynamic, schedule thick evaluation at multiple points in the AI development lifecycle — not just at initial deployment. Annual community evaluation sessions can surface how goals have shifted.
- **Lightweight version (when resources are limited):** Conduct individual evaluation tasks only (no workshop) using the five-dimension framework as a structured questionnaire. This captures thin versions of each dimension but misses the discursive negotiation. Report limitations explicitly.

## Code & Tools

- Reflexive thematic analysis method: Braun, V., & Clarke, V. (2021). *Thematic Analysis: A Practical Guide*. SAGE.
- Mural (collaborative digital whiteboard for code clustering): https://www.mural.co/
- AIES 2025 paper and supplemental material: Qadri et al. (2025), Proceedings of AIES 2025, pages 2067–2080.
- Related framework — TALES taxonomy of cultural misrepresentation (Bhagat et al. 2026): overlapping but distinct categorization of cultural failure modes.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Captures dimensions (missingness, connotation) that thin evaluations systematically miss | High cost: requires in-person workshops, local research partners, and significant community engagement investment |
| Grounded in community expertise — surfaces knowledge outsiders cannot access | Not scalable at the speed of thin evaluations; tension with AI development timelines is unresolved |
| Surfacing internal disagreements as findings rather than noise reflects the contested nature of cultural representation | Applying to oral/aural contexts or language model outputs (vs. images) requires adaptation not yet validated |
| Five-dimension framework provides a common vocabulary for researchers and community members | Power dynamics within workshops (who speaks, whose interpretations are recorded) can shape outcomes — facilitation expertise required |
| Dynamic goal documentation accommodates the evolving nature of language revitalization | Paper authored by Google Research; tension between advocating community-controlled evaluation and large AI company interests |
| Provides theoretical grounding (Ryle/Geertz) for why accuracy benchmarks are insufficient for evaluating social worlds | Workshop findings may not generalize across different global contexts; validated only in South Asian urban settings |

## References

- Qadri, R., Díaz, M., Wang, D., & Madaio, M. (2025). The Case for "Thick Evaluations" of Cultural Representation in AI. *Proceedings of AIES 2025*, pages 2067–2080.
- Ryle, G. (1968). The Thinking of Thoughts. University Lectures, No. 18. University of Saskatchewan.
- Geertz, C. (2008). *The Interpretation of Cultures* (Selected Essays). Basic Books.
- Braun, V., & Clarke, V. (2021). *Thematic Analysis: A Practical Guide*. SAGE.
- Hall, S. (1997). *Representation: Cultural Representations and Signifying Practices*. SAGE.
- Jacobs, A. Z., & Wallach, H. (2021). Measurement and Fairness. *FAccT 2021*.
- Díaz, M., & Smith, I. (2024). Relating to Generative AI Image Models: A Situated Approach to Cultural Representation. (Companion work by same group.)

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — The four phases (preparation, workshop facilitation, analysis, reporting) are concrete enough to follow. Participant count (10–15 per workshop, 4 hours), recruitment channels (community organizations, not crowdworker platforms), and analysis method (reflexive thematic analysis, Braun & Clarke 2021) are all specified. However, the pre-workshop individual task design is underspecified: the doc says participants evaluate "a personalized set of AI outputs (generated from prompts they provided)" but does not explain how prompts are collected before the workshop, what the evaluation instrument looks like, or how many outputs per participant. A practitioner would need to design this instrument from scratch.

    **Criterion 2 — Empirical results with numbers:** PASS — 37 participants across 3 countries (11 Sri Lanka, 10 Pakistan, 15 India across two workshops), 3 in-person + 2 online workshops, AIES 2025 pages 2067–2080 cited. Specific participant quotes with anonymized identifiers (PK-11) are included. The limitation that all sites were South Asian and English-literate urban populations is explicitly noted.

    **Criterion 3 — Data regime / context clarity:** PASS — "Any data regime (evaluation methodology, not a training technique)" is correctly stated. Applicable contexts are well defined. The "Less suitable when" section correctly identifies resource-constrained and community-unavailable scenarios. The note that the framework has only been validated in South Asian urban settings is an honest scope limitation.

    **Criterion 4 — Pseudocode completeness:** PASS — The pseudocode covers all four phases with the key design choices encoded (NOT crowdworker platforms, dimensions as scaffold not checklist, disagreements as findings). The `reflexive_thematic_analysis` and `cluster_codes` steps delegate to external method (Braun & Clarke) which is appropriate — these cannot be fully pseudocoded. No ambiguous branches.

    **Criterion 5 — Failure modes:** PARTIAL — The Strengths & Weaknesses table documents relevant risks: high cost, non-scalability, facilitation expertise required, power dynamics within workshops, and the tension between Google Research authorship and community-controlled evaluation advocacy. However, no explicit failure-mode guidance is embedded in the procedural steps. For example, the doc does not warn about what to do if a community workshop surfaces irreconcilable internal disagreements, or how to handle situations where local collaborators have conflicts of interest. The lightweight variation (individual tasks only) is noted as a fallback but its limitations are flagged only briefly.

    **Overall:** Solid evaluation framework doc. Key gap: the pre-workshop individual task instrument is underspecified — a practitioner needs more guidance on prompt collection and evaluation form design. Failure modes are confined to the table rather than integrated into procedural steps.

