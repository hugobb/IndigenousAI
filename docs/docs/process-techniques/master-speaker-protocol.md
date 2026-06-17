
# Master Speaker Protocol

**Category:** Process & Methodology Technique
**Data Regime:** any (applies regardless of data availability; structures the human relationship at the center of language work)
**Applicable Languages:** Critically endangered languages with few remaining fluent speakers; most applicable when speakers are elders and the oral tradition is the primary transmission mechanism

## Description

The Master Speaker Protocol is a set of collaboration practices that centers the irreplaceable role of fluent Indigenous language speakers — Master Speakers — in any language technology project, and structures researcher-community interaction to protect and honor that role rather than instrumentalize it.

A **Master Speaker** is a community member who is fluent in their ancestral language and has accepted apprentices through the oral tradition. This is a formal cultural role in many Indigenous communities: the Richardson/Brucell (1993) definition — "indigenous community members who are fluent in their language and have accepted apprentices through the oral tradition" — distinguishes Master Speakers from other fluent speakers because of their active role in language transmission, not just their linguistic competence.

For critically endangered languages, Master Speakers are often elderly, few in number, and extremely time-constrained by their other responsibilities as language teachers, cultural authorities, and community members. They cannot be replaced by additional data collection or by models trained on historical recordings. When a Master Speaker dies, an irreplaceable body of linguistic knowledge — including registers, ceremonial language, narrative traditions, and nuanced pragmatics — is lost.

**The central insight of this technique:** Language technology work for endangered languages must be subordinated to the welfare and priorities of Master Speakers, not the other way around. Researchers must adapt their methodologies to accommodate the realities of working with elders (health constraints, scheduling uncertainty, the emotional weight of language loss, the primacy of oral tradition over written documentation), rather than treating Master Speakers as data sources to be efficiently processed.

**Key components:**

1. **Trauma acknowledgment:** Many Master Speakers carry deep grief about language loss and trauma from government policies (residential schools, the Indian Act) that targeted their languages. Liu et al. (2022) document that "when working with elderly Master Speakers, methodologies must include space for the elders to vent their grief. Only after this is attended to, can the language be learned." Fieldwork sessions must budget time and emotional bandwidth for this, not treat it as a distraction from data collection.

2. **Scheduling deference:** Elder schedules are unpredictable due to health, community obligations, and the low priority that language technology work may have relative to other demands on their time. Sessions must be short, flexible, and structured to minimize burden on the elder, not maximize data yield per session.

3. **Copyright and data ownership:** Master Speakers hold at minimum co-use copyright over all data they produce. Liu et al. (2022) state explicitly: "Master Speakers want at the very least co-use copyright over all data which shall be inherited by their descendants. In addition, physical copies of all data should be given to Master Speakers, and copies should be submitted to tribal archives or archivists." This must be established in writing before any recording begins.

4. **Technology as tool, not replacement:** Technology can support Master Speaker work (e.g., read-along materials, predictive text) but cannot substitute for the oral relationship between Master Speaker and apprentice. Researchers must "keep in mind the relationship many endangered language communities have with their languages" — the Karuk Master Speaker cited in Liu et al. describes the language as "a canoe. It holds all of our baskets, our regalia, our materials, our food. It holds our people and all the Karuk people yet to be born." This is not metaphor; it is a governance framework. Technology that harms this relationship — by creating an illusion of preservation that substitutes for human transmission — is actively harmful.

5. **Long-term commitment:** Trust relationships with Master Speakers and their communities cannot be built in the span of a single project. Researchers must commit to continued engagement even after their formal project ends — writing dictionaries, supporting heritage learners, being present when Master Speakers are no longer able to participate in documentation.

## When to Use

- Before beginning any data collection or annotation with Indigenous community members, to establish the appropriate relational and governance framework.
- When designing fieldwork methodology for an endangered language project.
- When a Master Speaker will be directly involved in language technology work (annotation, validation, recording).
- When deciding whether to proceed with an automated approach (ASR, MT, morphological analysis) for a critically endangered language — the protocol helps assess whether that technology serves Master Speaker priorities.
- When a community has previously had negative experiences with outside researchers — the protocol provides a framework for demonstrating genuine respect and accountability.

**Less applicable when:**
- The language has many young fluent speakers and language transmission is not primarily elder-mediated.
- The project involves only historical or archival data with no living community interaction.

## How to Apply

1. **Establish the relationship before the project.** Do not contact a Master Speaker with a technical agenda on first introduction. Begin by learning about the community, attending community events, and understanding who the relevant language authorities are. Initial contact should be through trusted intermediaries (a community linguist, a language teacher, a cultural center staff member who already has community trust).

2. **Ask about the community's existing language documentation practices.** Many endangered language communities already have their own documentation programs, immersion schools, or revitalization projects. Researchers must understand and fit into this existing landscape, not impose a new one. "Not always about you" — the title of Liu et al. (2022) — applies literally.

3. **Discuss the Master Speaker's priorities, not yours.** What does the Master Speaker want from the collaboration? What aspects of language transmission are they most concerned about? What would make their work easier? The answers may be very different from what the researcher expected (Liu et al. found that some community members were skeptical of ASR specifically because it "doesn't create new speakers").

4. **Establish copyright and data governance in writing before any recording.** A written agreement (not just verbal) should specify: Master Speaker co-use copyright, physical copies for the Master Speaker, tribal archive copies, permitted and prohibited uses of recordings, what happens to recordings after the Master Speaker's death.

5. **Structure sessions to minimize elder burden.**
   - Sessions should be short (1–2 hours maximum for elderly speakers).
   - Allow time for conversation and relationship maintenance, not just elicitation.
   - Provide compensation that is meaningful to the Master Speaker (honoraria, reciprocal assistance, gifts appropriate to community norms).
   - Never pressure for data; accept that some sessions will not produce recordable content.
   - Accommodate health variability — elders may need to cancel or shorten sessions without notice.

6. **Make space for grief and trauma.** Do not redirect conversation away from expressions of loss, grief, or anger about language suppression. These are not obstacles to the work; they are part of the human context that makes the work meaningful. Researchers who cannot hold this space should not lead fieldwork sessions.

7. **Plan for long-term continuity.** Before the project ends, transfer all materials to community custody, train community members in using the technology outputs, and discuss how the researcher can continue to support the work (even informally) after funding ends.

## Pseudocode

```
procedure MasterSpeakerCollaboration(researcher, community):

    // Phase 0: Pre-project relationship building
    intermediary = find_trusted_community_contact()
    researcher.learn_about_community()
    researcher.attend_community_events()                // before any data agenda
    researcher.understand_existing_language_programs()

    // Phase 1: Initial engagement (no data collection yet)
    master_speaker = intermediary.introduce(researcher)
    researcher.listen_to(master_speaker.priorities)     // not research goals
    if master_speaker.priorities CONFLICT WITH researcher.agenda:
        researcher.adapt_or_abandon_agenda()            // never the reverse

    // Phase 2: Establish governance before collection
    agreement = draft_data_agreement(
        copyright = CO_USE(master_speaker),
        physical_copies = master_speaker.receives_all(),
        archive_copies = tribal_archive.receives_all(),
        permitted_uses = master_speaker.defines(),
        inheritance = master_speaker.descendants(),
        end_of_project = transfer_to_community
    )
    agreement = master_speaker.sign(agreement)

    // Phase 3: Fieldwork sessions
    for each session:
        duration = MAX(1_TO_2_HOURS)
        allow_time_for: relationship, conversation, grief, cultural_context
        if elder.expresses_grief_or_trauma:
            researcher.hold_space()                     // do not redirect
            researcher.do_NOT_prioritize_data_collection_over_human_moment()
        data = elicit_gently(no_pressure)
        if session.unproductive_for_data:
            session.still_valuable = TRUE               // relationship is the work

    // Phase 4: Output integration
    outputs = integrate_into(master_speaker.teaching_practice)
    verify_outputs_support_oral_transmission()          // not substitute for it

    // Phase 5: Long-term commitment
    after project_end:
        researcher.continue_supporting(community)
        researcher.help_write_dictionaries_if_needed()
        researcher.remain_available_when_master_speakers_can_no_longer_document()
```

## Evidence

**Liu et al. (2022) — ACL 2022, survey of 23 language teachers from four endangered-language communities:**

- Five of the 23 survey respondents are community-designated Master Speakers.
- Karuk Master Speaker explicitly states that trauma acknowledgment is a prerequisite for productive language work: "when working with elderly Master Speakers, methodologies must include space for the elders to vent their grief."
- One Karuk Master Speaker described the human dimension of language loss: "(t)hose were all my friends. That's what I was telling [the nurse]. I said I got a lot on my mind. I said, I sit here all by myself and I'm thinking about all the people that left me... You're not supposed to, they're gone. Xâatik, let it go." This passage documents why fieldwork methodology must include emotional bandwidth, not just elicitation protocols.
- 82.61% of respondents considered ASR potentially useful; but several expressed that ASR serves researchers' needs ("just a way for linguists to secure funding for themselves and their tech project, which takes money and resources away from speech communities") rather than creating new speakers. This finding directly establishes the Master Speaker Protocol requirement: technology must serve Master Speaker-identified priorities.
- Survey finding: 95.65% of respondents valued pedagogical applications; 100% used written documentation in their work. Technology that supports the Wordmaker/read-along tools directly serves stated priorities.

**Cayuga morphological parser case study (Liu et al., 2022):**

- Cayuga language (Haudenosaunee, closely related to Mohawk): approximately 50 L1 elder speakers.
- Collaboration began with a trusted community introduction by one author already known to the community. The project was described to the community and approval was sought before any annotation began.
- Weekly collaborative sessions of ~1 hour; approximately 50 words annotated per session (surface and canonical segmentation).
- Model performance is tracked weekly and reported back to the community when it reaches meaningful thresholds.
- Plans to integrate model output into community teaching tools are made explicit from the start.
- This case study documents a viable ethical workflow: it is not an abstract principle but a working model for how the Master Speaker Protocol operates in practice.

**Quantitative note:** At the time of publication, ~262 words had been annotated across the Cayuga collaboration, yielding approximately 50% F1 scores on morphological segmentation. This establishes a realistic data volume and performance expectation for the early phases of a Master Speaker-centered annotation workflow.

## Variations & Configuration

- **Community researcher training:** Where a community has young members interested in language technology (as in the Cayuga case), training them as internal researchers who can conduct fieldwork with elders preserves the cultural relationship and increases long-term sustainability. The Master Speaker teaches the apprentice; the apprentice documents for the technology; technology serves the apprentice-Master Speaker relationship.
- **Adapted for teleconference:** For communities where in-person visits are not feasible, video calls with flexible scheduling can maintain the relational dimension of the protocol, but cannot fully substitute for in-person presence. Plan in-person visits at critical project milestones.
- **Multi-speaker communities:** When a language has multiple Master Speakers, the protocol should engage each one individually as appropriate (different dialects, different registers, different cultural authorities) rather than treating the Master Speaker community as a single entity.
- **Oral consent for elders with low writing fluency:** In communities where written agreements are culturally unusual or where elders have low comfort with formal documents, recorded verbal consent with a community witness can substitute for written signatures — provided it is equally detailed in specifying rights and conditions.

## Code & Tools

- **ELAN (Linguistic Annotator):** https://archive.mpi.nl/tla/elan — the standard tool for session-by-session annotation of Elder speech recordings; supports multi-tier time-aligned annotation.
- **CMDI metadata standards:** https://www.clarin.eu/content/component-metadata — for archival-quality metadata on Elder recordings.
- **AIATSIS Code of Ethics:** https://aiatsis.gov.au/research/ethical-research/code-ethics — Australia's Indigenous research ethics framework; applicable as a model in North American contexts.
- **FNIGC OCAP Principles:** https://fnigc.ca/ocap-principles/ — Canadian Indigenous data governance framework for structuring the copyright and data agreements required by this protocol.
- **Endangered Languages Archive (ELAR):** https://www.elararchive.org/ — community-accessible digital archive for Elder recordings; supports tiered access consistent with community sovereignty requirements.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Centers the irreplaceable human resource — Master Speaker knowledge cannot be reconstructed from data after it is lost | Requires significant time investment in relationship-building before any technical work can begin |
| Directly prevents the most common failure mode: extractive research that produces academic outputs but does not serve community revitalization | Master Speaker availability is unpredictable and cannot be scheduled to fit grant timelines |
| Extends the useful life of technology outputs by ensuring they integrate into existing teaching practices | Trauma acknowledgment and emotional support are outside most technical researchers' training |
| Builds the long-term trust that enables future collaboration and data access | Commitment to long-term community engagement may exceed the scope of a single funded project |
| Creates governance structures (copyright, data agreements) that protect the community from unauthorized AI extraction | The protocol may conflict with institutional timelines and publication pressures |
| Distinguishes between documentation (safeguarding knowledge) and revitalization (creating new speakers) — technology can support the former but only oral transmission can achieve the latter | |

## References

- Liu, Z., Richardson, C. (Karuk), Hatcher, R., & Prud'hommeaux, E. (2022). Not always about you: Prioritizing community needs when developing endangered language technology. *ACL 2022*, pp. 3933–3944.
- Richardson, N., & Brucell, S. (1993). *Now you're speaking — Karuk*. Center for Indian Community Development.
- Richardson, C. (2018). *Uhyanavararatih: A Call Across The Divide*. Master's thesis, University of California, Davis.
- Hinton, L. (1994). *Flutes of Fire: Essays on California Indian Languages*. Heyday Books.
- Grenoble, L. (2017). Producing language reclamation by decolonising 'language'. In *The Cambridge Handbook of Endangered Languages*, pp. 15–36.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The seven-step How to Apply section is the most actionable of the five docs. Each step specifies who does what and why, with concrete guidance (e.g., session length of 1–2 hours maximum, using trusted intermediaries for first contact, requiring written agreements before recording). The Cayuga case study in the Evidence section provides a working model (weekly ~1-hour sessions, ~50 words annotated per session) that a practitioner can directly emulate. The pseudocode translates the relational phases into a readable decision procedure.

    **Criterion 2 — Empirical results with numbers:** PASS — Concrete quantitative anchors are present: 23 survey respondents (5 Master Speakers), 82.61% found ASR potentially useful, 95.65% valued pedagogical applications, 100% used written documentation, ~262 words annotated in the Cayuga collaboration yielding ~50% F1 on morphological segmentation, ~50 words per session. These numbers are specific and sourced (Liu et al. 2022, ACL 2022). The Cayuga case study is particularly valuable as a realistic data volume/performance expectation for the early protocol phase.

    **Criterion 3 — Data regime / context clarity:** PASS — The header explicitly states "any (applies regardless of data availability)" and the applicability section specifies "critically endangered languages with few remaining fluent speakers." The Less Applicable section correctly limits scope to elder-mediated transmission contexts. The distinction between documentation and revitalization is well-drawn and directly relevant to method selection.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The pseudocode captures the five phases (pre-project, initial engagement, governance, fieldwork, long-term) at the right level of abstraction for a process technique. The `if master_speaker.priorities CONFLICT WITH researcher.agenda: researcher.adapt_or_abandon_agenda()` construct is appropriately directional. Minor gap: the pseudocode does not represent the multi-speaker variant (Phase 3 iterates over sessions but not over multiple Master Speakers with potentially conflicting dialect or authority claims), and the `draft_data_agreement()` function's parameters, while listed, do not indicate what form the output takes (written contract vs. recorded consent).

    **Criterion 5 — Failure modes:** PASS — The Weaknesses table and the How to Apply steps both document failure modes explicitly: unpredictable elder availability conflicting with grant timelines, trauma acknowledgment being outside most technical researchers' training, long-term commitment exceeding project scope, institutional pressure conflicting with the protocol. The quoted survey response ("just a way for linguists to secure funding for themselves") is a direct documentation of the failure mode where the protocol is violated. The technology-as-replacement failure mode (creating an illusion of preservation) is called out in the description.

    **Overall:** The strongest overall doc in the set. Empirical grounding, implementability, and failure mode documentation are all at PASS level. The only meaningful gap is that the pseudocode's `draft_data_agreement()` does not indicate the difference between written and oral consent forms, which is addressed in Variations but not surfaced in the pseudocode itself.

