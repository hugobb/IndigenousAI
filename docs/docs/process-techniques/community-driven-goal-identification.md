
# Community-Driven Goal Identification

**Category:** Process & Methodology Technique
**Data Regime:** any
**Applicable Languages:** Any endangered or Indigenous language where an external researcher or technologist is initiating a project

## Description

Community-Driven Goal Identification is the practice of discovering and centering a community's actual priorities — not assumed linguistic or technological needs — before scoping, designing, or building any language technology. It directly challenges the default NLP framing that positions researchers as goal-setters and community members as data sources or beneficiaries.

The technique recognizes that Indigenous communities frequently prioritize knowledge transmission, identity, connection, and intergenerational wellbeing over the linguistic proficiency metrics and documentation outputs that NLP researchers typically optimize for. A community may have no interest in a speech-to-text system, but urgent need for an oral storytelling archive accessible to children. These goals are not discoverable from corpus analysis — they require sustained, relational engagement.

A critical framing distinction from Brinklow et al. (2019) sharpens the technique: **language revitalization** (restoring linguistic competence) is not the same as **language reclamation** (the broader political and cultural project of community self-determination, identity, and decolonial resistance). Technology can serve revitalization goals while undermining reclamation — for example, an ASR system that requires transferring community language data to a corporate cloud. Goal identification must therefore surface not only what linguistic outcomes the community wants, but what governance, sovereignty, and identity outcomes matter to them. Goals at the revitalization level that conflict with reclamation goals should be flagged and renegotiated.

Related to this is the "technology as MacGuffin" risk (Brinklow et al. 2019): apps and tools are frequently promoted as "saving" a language, diverting community resources and energy from more effective community-centered approaches. Technology is the icing, not the cake. Community-driven goal identification guards against this by checking whether technology is actually the right lever for the identified goal — often it is not.

The process involves: entering without a predetermined agenda, eliciting community members' own descriptions of what language means to them and what would improve language vitality, mapping those goals to what kinds of technology (if any) could serve them, and only then scoping technical work. The community remains the evaluating authority throughout.

## When to Use

- **Always** — before scoping any language technology project involving an Indigenous or minority language community.
- Especially critical when the researcher/technologist is an outsider to the community (different institution, ethnicity, or geographic origin).
- When there is pressure to use a community's language as a data source for a pre-formed research agenda (e.g., building a baseline ASR system "for the community").
- When prior projects have produced technology that was unused or unwanted by the community.

**Poorly suited when:**
- The community has already articulated clear goals and invited specific technical work — skip the discovery phase and move directly to co-design.
- Working with synthetic or publicly consented datasets with no living community stake.

## How to Apply

1. **Enter without an agenda.** Approach initial meetings as listening sessions. Do not present a project proposal. Ask open questions: "What matters most to you about [language]?", "What would you want younger generations to be able to do with it?", "What feels missing right now?"

2. **Map the Language Continuation Continuum.** Plot where the community's expressed needs fall on the spectrum from naturalistic community acquisition (child-to-elder immersion, informal use) to formal documentation and archival. NLP tooling is most relevant at the documentation end; the community's priorities may be at the acquisition end — that is valid information.

3. **Identify FAMED gaps.** Using Lewis & Simons' framework, assess which of the five sustainability factors are weakest for this community: Functions (domains where the language is used), Acquisition means (pathways for children to learn), Motivation (social and economic incentives), favorable Environment (policy and institutional support), Differentiation (distinctiveness from dominant languages). Target technology only at gaps that technology can plausibly address.

4. **Surface knowledge authority.** Ask: who holds authoritative knowledge of the language? Elders? Specific lineages? Ceremonial custodians? Any language technology that bypasses these authorities risks replicating colonial patterns.

5. **Co-formulate a goal statement.** Draft a brief description of what success looks like in community terms (e.g., "Grade 4 students at Six Nations can hold a 5-minute conversation with elders without code-switching"). This becomes the evaluation target, not system accuracy.

6. **Validate and iterate.** Return the goal statement to community stakeholders — not just one liaison — for correction. Revise until it reflects the community's own language and framing.

7. **Scope technology as one option.** Check whether the identified goal requires technology at all. If it does, identify the narrowest technical intervention that serves it. Avoid feature creep driven by researcher interests.

## Pseudocode

```
procedure CommunityGoalIdentification(community):
    goals = []
    knowledge_authorities = []

    // Phase 1: Open listening (no agenda)
    for session in initial_engagement_sessions:
        listen(community_members, open_questions=[
            "What does the language mean to your community?",
            "What do you want the next generation to be able to do?",
            "What is hardest right now about language transmission?"
        ])
        record goals expressed in community's own words

    // Phase 2: Structural analysis
    continuum_position = map_to_language_continuation_continuum(goals)
        // left = naturalistic acquisition, right = documentation/archiving
    famed_gaps = assess_FAMED_gaps(community_context)
    knowledge_authorities = identify_language_authority_holders()

    // Phase 3: Goal formulation
    candidate_goal = co_draft_goal_statement(community_members, researcher)
    validated_goal = iterate_until_approved_by_stakeholders(candidate_goal)

    // Phase 4: Technology scoping
    if technology_can_serve(validated_goal):
        scope = minimum_intervention(validated_goal)
        return scope, validated_goal, knowledge_authorities
    else:
        return None, validated_goal, knowledge_authorities  // non-tech support needed
```

## Evidence

**Liu et al. (2022) — six concrete recommendations for ethical collaboration (ACL 2022):**

Based on survey data from 23 language teachers and elders from four endangered-language communities (Karuk, Cayuga, and two others), Liu et al. (2022) distill community-driven goal identification into six actionable steps:

1. Make efforts to know the speech community and build meaningful bonds — train young community researchers where possible to increase long-term sustainability.
2. Offer co-authorship or contributor credit to community members who make meaningful contributions.
3. Document data collection protocols and challenges transparently in publications — be attentive to elder schedules, health constraints, and needs.
4. Clarify data ownership, including copyright for Master Speakers over all data they produce; provide physical copies to Master Speakers and submit copies to tribal archives.
5. Create language technologies together in consultation with speech communities to ensure usefulness to language programs; technology must be accessible to community language workers.
6. Discuss concrete plans for how technology output integrates into documentation and revitalization work before building it — a morphological parser must visualize morphemes in ways useful for language teaching, not just for benchmarking.

These recommendations are grounded in a finding that standard NLP research — optimized for Elephant or Ocelot languages — systematically misapplies its priorities to Coyote (critically endangered) languages. The survey found 95.65% of community language teachers valued pedagogical applications most highly, but some expressed explicit skepticism about ASR because it "doesn't create new speakers" and "takes money and resources away from speech communities."

The Cayuga morphological parser case study documents the technique in practice: trust-building introduction via a community-trusted co-author, community approval before annotation, weekly collaborative sessions (~50 words/session annotated by a community linguist), weekly progress reporting back to the community, and a concrete plan from day one to integrate outputs into community teaching tools. This is the minimal viable workflow for community-driven goal identification in a Coyote-language context.

Bird (2020) synthesizes 25 years of field observation and published research to support two claims with practical significance:

- **Documentation has not demonstrably reversed language shift.** Despite large investments in speech corpus collection, transcription, and archival, there is scant empirical evidence that these activities have improved language transmission rates for any endangered language community. This suggests the goals pursued by NLP researchers are not the goals that actually drive revitalization.
- **Mismatch in priorities is systematic.** Multiple Indigenous community consultation studies (cited in Bird 2020) find that community members consistently prioritize knowledge transmission, identity maintenance, and cultural wellbeing — not linguistic documentation or grammatical description. Standard NLP project scoping, which begins with data needs, systematically misses these priorities.

The Language Continuation Continuum (Bedford & Casson 2010) empirically shows that funding and researcher effort concentrate at the documentation end of the spectrum, while communities report needs at the acquisition end. Aligning project scope to the acquisition end produces higher community engagement and sustained use.

Brinklow et al. (2019) corroborate from the Canadian context (approximately 70 Indigenous languages across 10 language families, ~57% with fewer than 500 active speakers): the most persistent failure mode in Canadian Indigenous language technology is goal misalignment — researchers and institutions pursue documentation and archival outputs while communities prioritize active use and intergenerational transmission. The reclamation framing sharpens this: goals that serve linguistic documentation while undermining community governance or data sovereignty are goals that technology development should refuse, even when technically achievable.

Brinklow (2021) adds the digital colonization context: the global technology ecosystem is structured to serve ~5–10 majority languages; all Indigenous North American languages are excluded from commercial language infrastructure. This means community-driven goal identification must also ask whether the identified goals require engaging with (and thereby depending on) colonially-structured digital infrastructure — and whether that dependency serves or undermines language reclamation.

## Variations & Configuration

- **Rapid version:** When time is constrained, conduct a structured survey instrument co-designed with a community liaison, rather than open ethnographic listening. Validate with 3–5 community members across age groups.
- **Ongoing version:** Build goal identification into project governance as a recurring checkpoint (e.g., every 6 months), not a one-time front-loaded phase.
- **Multi-community version:** If working across communities with the same language (e.g., multiple Six Nations reserves), conduct separate goal identification per community; do not aggregate goals across communities without explicit consent to do so.

## Code & Tools

- Language Continuation Continuum diagram: Bedford & Casson (2010), available via ELDP/ELAR documentation resources.
- FAMED framework: Lewis & Simons (2010) "Assessing Endangerment: Expanding Fishman's GIDS" — provides a structured interview guide template.
- ELDP (Endangered Languages Documentation Programme) community needs assessment template.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Prevents building technology nobody wants | Requires significant upfront time investment before any technical work |
| Surfaces knowledge authority structures early, preventing later conflicts | Outcome may be that no technology is appropriate — hard to fund or publish |
| Produces a community-legible success metric, enabling genuine evaluation | "Community goals" can be contested within communities; not all members agree |
| Reduces risk of data extraction without benefit | Researcher must resist pressure to translate community goals into research-publishable forms |
| Aligns with UNDRIP free, prior, and informed consent requirements | Iterative validation across diverse stakeholders is logistically demanding |

## References

- Bird, S. (2020). Decolonising Speech and Language Technology. *Proceedings of COLING 2020*, pages 3504–3519.
- Brinklow, N. T., Littell, P., Lothian, D., Pine, A., & Souter, H. (2019). Indigenous Language Technologies & Language Reclamation in Canada. *LREC 2019 Workshop on Computationally Assisted Language Documentation and Description*.
- Brinklow, N. T. (2021). Indigenous Language Technologies: Anti-Colonial Oases in a Colonizing (Digital) World. *WINHEC: International Journal of Indigenous Education Scholarship*, 16(1), 239–266.
- Liu, Z., Richardson, C. (Karuk), Hatcher, R., & Prud'hommeaux, E. (2022). Not always about you: Prioritizing community needs when developing endangered language technology. *ACL 2022*, pp. 3933–3944.
- Lewis, M. P., & Simons, G. F. (2010). Assessing endangerment: Expanding Fishman's GIDS. *Revue Roumaine de Linguistique*, 55(2), 103–120.
- Bedford, J., & Casson, A. (2010). Language continuation continuum. *ELDP Documentation*.
- Smith, L. T. (1999). *Decolonizing Methodologies: Research and Indigenous Peoples*. Zed Books.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The 7-step How to Apply procedure is concrete and action-oriented, with example open questions, the FAMED gap framework, and a model goal statement ("Grade 4 students at Six Nations can hold a 5-minute conversation with elders without code-switching"). A practitioner could follow this without reading Bird 2020.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — Bird (2020) is cited as synthesizing "25 years of field observation" and the claim that documentation has not "demonstrably reversed language shift" is substantiated, but no specific case studies with measured outcomes (e.g., uptake rates, engagement numbers, or revitalization metrics) are provided. The Bedford & Casson (2010) continuum claim about funding concentration is qualitative only.

    **Criterion 3 — Applicable context clarity:** PASS — The "When to Use" section distinguishes the default case ("always"), the outsider case, the pre-formed agenda case, and the prior failure case. The "Poorly suited when" cases (community already has articulated goals; synthetic datasets) are explicit and helpful.

    **Criterion 4 — Pseudocode/flowchart completeness:** PASS — The pseudocode covers all four phases (open listening, structural analysis, goal formulation, technology scoping) with readable detail. The branching on `technology_can_serve(validated_goal)` correctly represents the "maybe no tech needed" outcome.

    **Criterion 5 — Failure modes:** PARTIAL — The Strengths & Weaknesses table implicitly covers several failure modes (contested community goals, researcher translation pressure, logistical demands). However, there is no explicit failure-mode section documenting conditions under which the technique itself produces wrong outcomes — e.g., when a single community liaison does not represent the broader community, when time pressure collapses open listening into a guided survey, or when the researcher unconsciously translates community goals into research-publishable forms during co-formulation.

    **Overall:** Solid, actionable entry. The main gap is the absence of a dedicated failure-mode section: the weaknesses table gestures at risks but does not systematically describe the conditions under which the technique's outputs (the goal statement, the technology scope) become invalid.

