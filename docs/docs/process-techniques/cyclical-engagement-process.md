
# Cyclical Engagement Process

**Category:** Process & Methodology Technique
**Data Regime:** any
**Applicable Languages:** Any Indigenous or under-served language where an external researcher or technologist is seeking community partnership

## Description

The Cyclical Engagement Process is a structured, iterative methodology for building language technologies with — not for — Indigenous communities. It operationalizes the principle that *how* a project is conducted matters as much as what it produces, centering community relationships, negotiated control, and process-generated benefit over decontextualized technical artefacts.

The framework emerged from thematic analysis of 60-minute semi-structured interviews with 17 researchers working with Aboriginal and/or Torres Strait Islander communities in Australia (Cooper et al. 2024). It synthesizes the CARE principles (Carroll et al. 2020), the Maiam nayri Wingara (2018) Indigenous Data Sovereignty Principles, and the Te Mana Raraunga (2016) Māori data governance principles into six cyclical, mutually reinforcing steps:

**Step 1 — Seek out community needs.** Ask communities about their goals for their language before proposing any technical work. Primary motivation for language technology among interviewed communities was *cultural transmission across generations*, not access to digital products. Do not start with technology or pre-formed solutions; demo existing tools to facilitate community experimentation.

**Step 2 — Engage with representative bodies.** Work through formal community representative organizations (e.g., land councils, language centers, community-based organizations) rather than through individual contacts only. Representative bodies balance power dynamics, establish credibility faster, and have pre-existing trust within their communities.

**Step 3 — Negotiate control.** At project outset, schedule time to interrogate power dynamics: recognize distinct decision-making processes and communication approaches of researchers and community participants; develop mutually agreed protocols. Recognize Indigenous (co-)ownership of data collection outcomes — datasets, model weights, intellectual property — and formalize joint publication agreements where applicable.

**Step 4 — Create opportunities for community benefit from the process.** Data collection must benefit communities beyond the project's end. Design experiences for community members to learn about language technology *while* generating or collecting data. Create outputs from the data collection that are accessible to community members, not only to researchers.

**Step 5 — Store data in an accessible format.** Store all language data in archival formats that persist beyond the project lifetime — not locked in bespoke apps or websites ("Apps and websites are disposable… store the data in an archival format that is going to persist"). Facilitate community access to archival materials via metadata tagging, information retrieval tools, and accessible front-ends for audio/video.

**Step 6 — Scale digital shells.** Design with one community first ("design for one, then scale"). Build a *digital shell* — a technological template tailored to one community's needs but adaptable for others — then scale to additional communities. This approach preserves local customization while reducing duplicated development cost for each new engagement.

The cycle is not a linear checklist but a recurring loop: after scaling, return to seeking community needs for the next iteration, incorporating what was learned. Personal relationships between researchers and community members persist beyond project end dates; sustain them.

The framework also calls for NLP research environments to adopt the engagement process as a peer-review criterion — not just model accuracy benchmarks — when evaluating work on Indigenous languages.

**Reframing the vocabulary:** Cooper et al. prefer *under-served* over *low-resource* to pivot blame from language communities (who are fully constituted linguistically) to the technology sector's failure to serve them. This vocabulary shift signals the researcher's ethical orientation and is a small but meaningful alignment with community dignity.

## When to Use

- At the start of any project where an external researcher or organization seeks to partner with an Indigenous community on language technology.
- When there is no prior relationship between the research team and the target community.
- When designing community engagement protocols for a new project — use this framework to structure the engagement plan.
- When evaluating whether a proposed project will genuinely benefit the community or primarily serve researcher/institutional interests.
- When writing research proposals or ethics board applications for Indigenous language technology work.

**Less suitable when:**
- The community has already initiated and is leading the project; defer to their process framework.
- Working with already-public, fully consented historical data with no living community stake.

## How to Apply

**Phase 0 — Preparation (before first contact)**

1. Research the community's history with research institutions. Have prior technology projects been extractive? Is there mistrust of universities or government-linked researchers?
2. Identify relevant representative bodies (land councils, language centers, elders' committees) as entry points.
3. Prepare a demo of existing comparable technology to facilitate community experimentation — not a pitch deck, a demo.

**Phase 1 — Seek needs (Steps 1–2)**

4. Contact representative bodies first. Request an initial meeting framed as a listening session, not a project proposal.
5. Ask community members: "What are your goals for your language?", "What would cultural transmission look like for the next generation?", "What would be most useful right now?" Do not frame questions around technology.
6. Demo existing tools (e.g., speech recognition, translation systems for other languages). Ask how communities might appropriate such tools for their own languages — let experimentation be community-led.
7. Clarify mutual benefits of the project at the outset. Be explicit about what the research institution gets (publications, data, reputation) and what the community gets (described concretely, not vaguely).

**Phase 2 — Establish control and governance (Step 3)**

8. Schedule a dedicated power-dynamics session. Document: Who has decision-making authority over the data? Who can veto project activities? What are the community's communication preferences (meeting format, language, schedule)?
9. Draft a data governance agreement specifying: community ownership of raw data and model weights, access rights beyond the project, publication co-authorship protocols, and data disposal procedures.
10. Develop mutually agreed project protocols. Review with community representatives before any data collection begins.

**Phase 3 — Execute with benefit by design (Step 4)**

11. Design data collection activities that are intrinsically valuable to participants: e.g., recording elders' stories creates an archive for the family, not only a training corpus. Language documentation workshops build community capacity while generating data.
12. Create community-facing outputs from data collection: printed story books, audio archives with accessible interfaces, vocabulary resources. These exist independently of any model trained on the data.

**Phase 4 — Store and sustain (Steps 5–6)**

13. Archive all language data in open, durable formats: ELAN (.eaf), TEI/XML, MPEG-4 audio/video, CSV word lists. Avoid proprietary formats.
14. Deposit in a community-accessible repository (e.g., ELAR, PARADISEC, or a community-controlled server) with clear access permissions.
15. Build the technological output as a digital shell — document design decisions, configuration parameters, and community customization points so a different community can adapt it without starting from scratch.
16. Handoff: train community members to operate and maintain the technology and archive independently of the research team.

**Phase 5 — Cycle back**

17. After project completion, maintain the relationship. Schedule a follow-up 6–12 months later to assess community use and needs. Feed findings back into step 1 for the next iteration.

## Pseudocode

```
procedure CyclicalEngagement(researcher, target_community):

    // Phase 0: Preparation
    representative_bodies = identify_representative_bodies(target_community)
    existing_tools = compile_demo_tools()
    prior_research_history = review_community_research_history(target_community)

    // Step 1: Seek community needs
    initial_meeting = contact(representative_bodies, framing="listening_session")
    community_goals = elicit_goals(community_members,
        questions=["What are your language goals?",
                   "What would cultural transmission look like?",
                   "What would be most useful?"])
    demo(existing_tools, let_community_appropriate=True)

    // Step 2: Engage representative bodies
    clarify_mutual_benefits(community=community_goals, researcher=research_outputs)
    establish_relationships(representative_bodies)

    // Step 3: Negotiate control
    power_dynamics_session()
    data_governance_agreement = draft_agreement(
        community_ownership=True,
        access_beyond_project=True,
        co_authorship=True,
        data_disposal=True
    )
    project_protocols = co_develop_protocols(researcher, representative_bodies)

    // Step 4: Community benefit from process
    data_collection_activities = design_for_community_benefit(community_goals)
    community_outputs = generate_community_outputs(data_collection_activities)
        // e.g., family archives, story books, vocabulary resources

    // Step 5: Store data accessibly
    archive_data(formats=["ELAN", "TEI/XML", "MPEG-4", "CSV"],
                 repository=community_controlled_repository,
                 access_permissions=data_governance_agreement)

    // Step 6: Scale digital shell
    digital_shell = build_adaptable_template(technology_output)
    document_customization_points(digital_shell)
    train_community_operators(digital_shell)

    // Cycle: follow-up and iterate
    follow_up = schedule(months=6)
    updated_goals = reassess_community_needs(follow_up)
    return CyclicalEngagement(researcher, target_community, goals=updated_goals)
```

## Evidence

Cooper et al. (2024) derive the framework from 17 semi-structured interviews (60 min each) with researchers from academia and community-based organizations, conducted October 2022–June 2023. Interviewees held expertise in linguistics (7), computing (7), and community-based research (3), across Australian states/territories.

**Key empirical findings from the interviews:**

- **100% of interviewees** (17/17) emphasized that projects "must start with a community need" — the strongest finding in the study.
- Communities' primary motivation for language technology is **cultural transmission** across generations, not access to digital services — a finding that directly challenges the assumption that expanded digital access is intrinsically valuable.
- Interviewees warned against starting with technology or solutions. Instead: demo existing tools and facilitate community experimentation.
- On data longevity: "Apps and websites are disposable… store the data in an archival format that is going to persist" — multiple interviewees independently converged on this point.
- On benefit from process: capacity building in technology development was identified as a mechanism for community benefit *during* data collection, not only after project completion.

**Convergence with other frameworks:**

The CARE principles (Carroll et al. 2020) — Collective Benefit, Authority to Control, Responsibility, Ethics — are operationalized in steps 3–5 of the framework. The "design for one, then scale" approach echoes the digital shell concept from Richards et al. (2019) on the Mangarrayi language revitalization project in Australia.

**Limitation to note:** 12 of 17 interviewees were non-Indigenous; no Torres Strait Islander voices were included. The framework is grounded in an Australian context, though colonial legacies create cross-regional applicability. Results should be validated against community feedback in other contexts (e.g., Canada, Six Nations).

## Variations & Configuration

- **Rapid version:** When timeline is constrained, compress steps 1–2 into a single structured workshop with representative bodies. Use a co-designed survey instrument (validated with 3–5 community members) to elicit goals more efficiently.
- **Multi-community version:** Run separate engagement cycles per community. Do not aggregate goals across communities without explicit consent. Digital shells enable efficiency at scale while preserving per-community customization.
- **Research-proposal version:** Use the framework as a checklist when writing ethics board applications and research proposals: does the proposal address all six steps? Gaps in the proposal indicate risks that should be mitigated before funding.
- **Ongoing project version:** If a project is already underway, enter the cycle at whatever step is most appropriate (e.g., if data is being collected, step 4) and work both forward and backward to address earlier steps retroactively where possible.

## Code & Tools

- ELAN (EUDICO Linguistic Annotator) — for archiving annotated speech data: https://archive.mpi.nl/tla/elan
- ELAR (Endangered Languages Archive) — community-accessible language archive: https://elar.soas.ac.uk/
- PARADISEC (Pacific and Regional Archive for Digital Sources in Endangered Cultures): https://www.paradisec.org.au/
- CARE Principles for Indigenous Data Governance (Carroll et al. 2020): https://www.gida-global.org/care
- Maiam nayri Wingara Indigenous Data Sovereignty Principles: https://www.maiamnayriwingara.org/mnw-principles
- Te Mana Raraunga (Māori Data Sovereignty Network): https://www.temanararaunga.maori.nz/tutohinga
- PULiiMA Indigenous Languages and Technology Conference (community engagement events): https://www.puliima.com/

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Grounded in practitioner experience — derived from researchers who have actually navigated these engagements | Primarily informed by Australian context; cross-regional applicability requires local validation |
| Prevents extractive research by making community benefit a structural requirement, not an afterthought | Requires significant time investment before any technical work; difficult to fund under standard grant models |
| The digital shell model enables scale without sacrificing community customization | Representative bodies may not reflect all community voices (internal power dynamics exist within communities) |
| Process-as-criterion challenges decontextualized benchmark culture in NLP | Non-Indigenous majority sample (12/17) in the original study may underrepresent community-side perspectives |
| Archival-first data storage protects community language resources beyond project lifetime | Step 6 (scaling) can inadvertently homogenize culturally distinct communities if digital shells are not sufficiently customizable |
| Operationalizes CARE, Maiam nayri Wingara, and Te Mana Raraunga in a single integrated workflow | Engagement process itself can become extractive if framed as "consultation" rather than genuine co-design |

## References

- Cooper, N., Heldreth, C., & Hutchinson, B. (2024). "It's how you do things that matters": Attending to Process to Better Serve Indigenous Communities with Language Technologies. *Proceedings of the 18th Conference of the European Chapter of the Association for Computational Linguistics (EACL)*, Volume 2: Short Papers, pages 204–211.
- Carroll, S. R., Garba, I., Figueroa-Rodríguez, O., Holbrook, J., Lovett, R., Materechera, S., … Hudson, M. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*, 19:1–12.
- Maiam nayri Wingara. (2018). Indigenous Data Sovereignty Communiqué. https://www.maiamnayriwingara.org/mnw-principles
- Te Mana Raraunga. (2016). Our Charter. https://www.temanararaunga.maori.nz/tutohinga
- Richards, M., Jones, C., Merlan, F., & MacRitchie, J. (2019). Revitalisation of Mangarrayi: Supporting community use of archival audio exemplars for creation of language learning resources. *Language Documentation & Conservation*, 13:253–280.
- Liu, Z., Richardson, C., Hatcher, R., & Prud'hommeaux, E. (2022). Not Always About You: Prioritizing Community Needs When Developing Endangered Language Technology. *Proceedings of ACL 2022*, pages 3933–3944.
- Smith, L. T. (1999). *Decolonizing Methodologies: Research and Indigenous Peoples* (2nd ed.). Zed Books.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The five-phase How-to-Apply section (17 numbered steps) is the most procedurally complete of the three docs. Each step specifies a concrete action with enough context to execute: specific questions to ask communities (verbatim), what to bring to the first meeting (a demo, not a pitch deck), what a data governance agreement must contain (5 explicit items), which archival formats to use (ELAN, TEI/XML, MPEG-4, CSV), and which repositories to deposit in (ELAR, PARADISEC). A practitioner could plan and execute a community engagement using this document alone.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — The Evidence section reports the study's strongest quantitative finding (17/17 interviewees = 100% endorsed "start with community needs") and documents sample composition (17 interviewees; 7 linguistics, 7 computing, 3 community-based; Oct 2022–Jun 2023). However, no outcome metrics for the framework itself are reported — e.g., no before/after data on community adoption, project sustainability, or data longevity from projects that applied the framework. This is inherent to a process framework derived from qualitative interviews rather than a controlled trial, and the doc notes the limitation explicitly, but it means readers cannot calibrate expected impact with numbers.

    **Criterion 3 — Data regime / context clarity:** PASS — The "any" data regime designation is appropriate and explained. The Australian grounding is called out explicitly as a limitation (12/17 non-Indigenous; no Torres Strait Islander voices; cross-regional validation needed for Canada, Six Nations). Less-suitable conditions are clearly stated. The vocabulary note ("under-served" vs. "low-resource") adds useful framing context.

    **Criterion 4 — Pseudocode completeness:** PASS — The pseudocode maps cleanly to all six framework steps and the five How-to-Apply phases. Function names are descriptive and unambiguous (`draft_agreement`, `co_develop_protocols`, `design_for_community_benefit`, etc.). The recursive tail call (`return CyclicalEngagement(...)`) correctly represents the iterative cycle. This is appropriate for a process framework; the pseudocode is a structural summary, not an algorithm, and it reads as such.

    **Criterion 5 — Failure modes:** PASS — The Strengths & Weaknesses table documents six failure modes with specificity: Australian-context bias limiting generalizability; time investment incompatible with standard grant timelines; representative bodies not always reflecting all community voices; non-Indigenous majority sample in the source study; risk of homogenizing communities when scaling digital shells; and the risk of the engagement process itself becoming extractive if framed as "consultation" rather than co-design. The last point is particularly nuanced and valuable.

    **Overall:** The strongest of the three docs on implementability and failure-mode documentation. The only gap is the absence of outcome metrics for the framework itself, which is a structural limitation of qualitative-interview-derived frameworks rather than a documentation failure. The explicit acknowledgment of study limitations (sample composition, geographic scope) is a model for honest Evidence sections.

