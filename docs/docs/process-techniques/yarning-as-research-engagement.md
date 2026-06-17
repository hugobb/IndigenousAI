
# Yarning as Research Engagement

**Category:** Process & Methodology Technique
**Data Regime:** any
**Applicable Languages:** Any Indigenous language project; originates in Australian Aboriginal research contexts but applies broadly

## Description

Yarning is an Indigenous Australian relational research method built on unhurried, story-based conversation rather than structured interview or needs-assessment. In the context of language technology, Bird (2020) frames it as the appropriate starting point for community engagement: the researcher joins community life without an agenda, builds genuine relationships over time, and allows shared priorities to emerge organically rather than imposing a research framework.

The core distinction from conventional UX research or community consultation is the sequencing: **relationship first, agenda never (or very late)**. Standard technology development begins with a problem statement, then seeks community validation. Yarning inverts this — relationships are cultivated without a pre-formed technical agenda, and technology only enters the conversation if and when community members themselves raise it as potentially useful.

Practically, yarning involves: attending community gatherings without a recorder or questionnaire, listening to stories about language, family, and history, sharing aspects of your own story as reciprocity, following conversational threads rather than steering toward research questions, and building a relational record of trust over months rather than extracting information in a single visit.

Yarning is distinct from "community engagement" as typically practiced by researchers (which often means informing the community about a pre-formed plan or conducting a brief consultation session). It is a sustained, reciprocal practice.

## When to Use

- At the very start of any project involving an Indigenous community where no prior relationship exists.
- When a previous project has damaged trust or been perceived as extractive — relationship repair before any new proposal.
- When community members have expressed skepticism about external researchers or technology.
- When the researcher is uncertain what the community actually wants from language technology.

**Less applicable when:**
- A trusted, long-term relationship already exists and the community has explicitly requested specific technical work.
- Working with existing consented corpora without ongoing community interaction.

## How to Apply

1. **Seek an introduction, not a meeting.** Ask a trusted intermediary (community liaison, Indigenous colleague, already-known elder) to introduce you informally — at a community event, gathering, or meal. Do not schedule a formal meeting for a first contact.

2. **Show up without an agenda.** Attend community events, language classes, or gatherings as a participant and observer. Bring curiosity, not a slide deck.

3. **Offer your own story first.** Yarning is reciprocal. Share who you are, where you come from, why language matters to you. This is not self-promotion; it is the relational foundation that makes it appropriate to receive others' stories.

4. **Follow the thread.** Let conversations go where community members take them. Do not redirect to research topics. If someone raises language technology, ask them to say more — do not jump to solutions.

5. **Keep a relational journal, not a data log.** Document what you learn about relationships, concerns, and history — not "data points." This record guides how you show up, not what you extract.

6. **Return repeatedly.** Trust is built over multiple visits, not one session. Plan for months of relationship-building before any project proposal.

7. **Let the agenda emerge.** If and when community members begin asking "could technology help with X?", you are ready to begin co-designing. If no such question emerges, that is information: technology may not be the community's priority.

8. **Make reciprocity explicit.** Ask: "What can I offer that would be useful to you?" — and follow through. Reciprocity may be: teaching, administrative help, documentation support, fundraising assistance, none of which is your research project.

## Pseudocode

```
procedure YarningEngagement(community, researcher):
    trust_level = 0
    agenda = None  // deliberately empty

    // Phase 1: Introduction through intermediary
    introducer = find_trusted_intermediary(community, researcher)
    initial_contact = introducer.make_informal_introduction(researcher, community)

    // Phase 2: Repeated presence without agenda
    while trust_level < threshold_for_co_design:
        event = attend_community_event(without_recorder=True, without_questionnaire=True)
        researcher.share_own_story(context=event)
        conversation = follow_thread(initiated_by=community_members)
        relational_journal.record(relationships, concerns, history)
        offer = ask_what_researcher_can_give(community)
        fulfill(offer)
        trust_level += relationship_depth(conversation, reciprocity=offer)

    // Phase 3: Let agenda emerge
    if community_members raise technology as potential help:
        co_design_question = listen(community_members.describe_need())
        return co_design_question  // ready for community-driven goal identification
    else:
        return None  // technology not the priority; support other ways
```

## Evidence

Bird (2020) draws on Australian Aboriginal research methodology literature, particularly the work of Indigenous methodologists who developed yarning as a research practice (see Bessarab & Ng'andu 2010). The methodological claim is that conventional consultation produces answers to the researcher's questions, not answers to the community's needs — and this gap is why technology built through consultation is often unused.

Supporting evidence for the value of long-term relational engagement over short-term consultation comes from community technology assessments in endangered language contexts: Liu et al. (2022) document that Indigenous communities repeatedly report that researchers "built tools nobody asked for" — a failure yarning is specifically designed to prevent by subordinating the researcher's agenda to the community's emergent priorities.

Bird acknowledges that yarning is an Australian Aboriginal method and that its specific protocols vary by community. The principle — relationship before agenda, reciprocity before extraction — is broadly applicable even where the term "yarning" is not used.

## Variations & Configuration

- **Online yarning:** When geographic distance prevents in-person presence, some communities have adapted yarning practices to video calls. Key requirement: calls are social/relational, not structured research sessions. Duration and frequency matter more than format.
- **Institutional yarning:** Some universities and research hospitals have adapted yarning circles as a governance practice — regular informal gatherings between researchers and community advisors without a fixed research agenda. These provide ongoing trust maintenance alongside formal project governance.
- **Group vs. individual yarning:** Individual yarning with one community member builds a specific relationship; group yarning (circle format) builds collective understanding and surfaces different perspectives. Both are useful at different stages.

## Code & Tools

- Bessarab, D., & Ng'andu, B. (2010). Yarning about yarning as a legitimate method in Indigenous research. *International Journal of Critical Indigenous Studies*, 3(1), 37–50. — Foundational methodological description.
- AIATSIS Code of Ethics for Aboriginal and Torres Strait Islander Research — practical ethical framework for relational engagement in Australian contexts; adaptable to other Indigenous research contexts.
- For Haudenosaunee/Six Nations contexts: consult the Haudenosaunee Confederacy protocol guidelines for research partnerships; protocols differ from Australian Aboriginal frameworks.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Produces genuine community buy-in because technology emerges from community priorities | Extremely time-intensive; months or years before any technical work begins |
| Prevents the "tools nobody asked for" failure mode documented across multiple studies | Difficult to fund under academic grant timelines, which expect deliverables within 1–2 years |
| Builds trust that makes later data sharing and co-design more productive | Researcher must genuinely subordinate their agenda — performative yarning is readily perceived and damages trust |
| Provides early warning of community concerns (sovereignty, data control, sacred knowledge) | Not all researchers have the social skills or cultural humility yarning requires |
| Reciprocal structure: community receives value (researcher's time, skills) before giving data | Relational journal is hard to evaluate in academic review processes |

## References

- Bird, S. (2020). Decolonising Speech and Language Technology. *Proceedings of COLING 2020*, pages 3504–3519.
- Bessarab, D., & Ng'andu, B. (2010). Yarning about yarning as a legitimate method in Indigenous research. *International Journal of Critical Indigenous Studies*, 3(1), 37–50.
- Liu, N., Daum, T., Reisewitz, P., & Mager, M. (2022). "Not my problem": The push and pull of language technology for endangered languages. *Proceedings of the 3rd Workshop on NLP for Indigenous Languages of the Americas (AmericasNLP)*.
- Smith, L. T. (1999). *Decolonizing Methodologies: Research and Indigenous Peoples*. Zed Books.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The 8-step How to Apply procedure gives concrete, sequenced guidance: seek introduction through an intermediary, attend without an agenda, offer your own story, follow the thread, keep a relational journal, return repeatedly, let the agenda emerge, make reciprocity explicit. Each step is actionable without reading the source literature.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — Liu et al. (2022) is cited for the "tools nobody asked for" finding but the citation is qualitative. No quantitative data is provided on outcomes from yarning-based engagement versus standard consultation (e.g., adoption rates, community satisfaction scores, time-to-co-design). Bessarab & Ng'andu (2010) is cited as foundational but not for specific empirical results.

    **Criterion 3 — Applicable context clarity:** PASS — The "When to Use" section covers four distinct trigger conditions (no prior relationship, damaged trust, community skepticism, researcher uncertainty). The "Less applicable when" cases (existing trusted relationship with explicit request; existing consented corpora) are clearly stated.

    **Criterion 4 — Pseudocode/flowchart completeness:** PARTIAL — The pseudocode is structurally sound but the loop condition `trust_level < threshold_for_co_design` is unspecified: "threshold" is never defined in qualitative or heuristic terms, and `relationship_depth()` is a black-box function with no description of its inputs or proxy indicators. A practitioner cannot operationalize these without additional guidance on what signals indicate readiness to move to co-design.

    **Criterion 5 — Failure modes:** PARTIAL — The Strengths & Weaknesses table identifies "performative yarning is readily perceived and damages trust" and "not all researchers have the social skills or cultural humility yarning requires" as risks. However, there is no systematic treatment of failure modes: e.g., what happens when the trusted intermediary misrepresents community consensus, when geographic or institutional constraints prevent repeated visits, or when a researcher mistakes one community member's openness for broader community readiness.

    **Overall:** Well-written and practically grounded. Two gaps worth addressing: (1) the pseudocode threshold/readiness signal needs at least a heuristic definition; (2) a dedicated failure-mode section would strengthen the entry, particularly covering the intermediary-misrepresentation and false-readiness-signal failure cases.

