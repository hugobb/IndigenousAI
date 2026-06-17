
# Community Data Sovereignty

**Category:** Process & Methodology Technique
**Data Regime:** any
**Applicable Languages:** Any Indigenous language project where language data is collected, stored, or used to train models

## Description

Community Data Sovereignty is the principle and practice of ensuring that an Indigenous community retains ownership, control, and decision-making authority over its language data throughout a technology project's lifecycle — from collection and storage through model training, deployment, and archiving.

The principle distinguishes between language reclamation and language revitalization: revitalization pursues linguistic competence, while reclamation encompasses the broader political project of community self-determination. A technology that achieves linguistic goals (e.g., produces an accurate ASR system) while separating the community from its data actively undermines reclamation — even if it technically succeeds. This means data sovereignty is not an add-on constraint but a constitutive requirement for responsible Indigenous language technology.

Brinklow et al. (2019) formulate three core requirements:
1. **Community involvement from problem identification through deployment** — not merely as consultants or validators but as decision-makers at every phase.
2. **Community goals over technical elegance** — data decisions (what to collect, how to store, who can access, when to delete) are made in service of community goals, not researcher or publication needs.
3. **Community retention of data ownership** — the community, not the research institution or technology company, holds legal and practical ownership of the language data.

The OCAP Principles (Ownership, Control, Access, Possession) provide the most widely adopted operational framework for community data sovereignty in Canadian Indigenous contexts, and are the standard reference for implementing this principle.

Critically, data sovereignty extends to AI model weights trained on community language data. If a model is trained on a community's language and the community cannot inspect, modify, or withdraw the model, sovereignty over the data has been practically undermined even if formal data ownership was maintained.

## When to Use

- Before collecting any language data from an Indigenous community.
- When designing data storage, access, and governance infrastructure for an Indigenous language project.
- When deciding whether to fine-tune a foundation model on community language data — the model weights become a data sovereignty concern.
- When a research or development agreement is being drafted with a community partner.
- When evaluating whether an existing project or tool respects community sovereignty.

**Less applicable when:**
- Working with fully public-domain historical data where no living community has custodial claims.
- Working with synthetic data that does not derive from community language production.

## How to Apply

1. **Establish legal data ownership before collection.** Draft a data governance agreement that specifies: who owns the data (the community, not the institution), under what conditions the researcher can use it, what happens to the data at project end, and who can authorize future uses. Have this reviewed by community legal counsel, not only institutional legal counsel.

2. **Apply OCAP Principles throughout.**
   - **Ownership:** The community, as a collective, owns its cultural data and intellectual property.
   - **Control:** The community has authority over all aspects of data management — collection, storage, access, interpretation, and sharing.
   - **Access:** The community can access its own data at any time; researchers cannot restrict community access.
   - **Possession:** Physical or digital custody of data remains with the community or a community-designated steward; data stored on external servers should have community-controlled encryption keys.

3. **Scope data collection to community-identified needs.** Do not collect more data than the community has specifically authorized for a specific purpose. Broad consent (e.g., "for language technology research") is insufficient — each significant use should have specific consent.

4. **Build community-controlled infrastructure.** Where possible, store data on community-controlled servers or in community-controlled cloud accounts rather than institutional or commercial infrastructure. If external infrastructure is required, ensure the community holds the encryption keys and access credentials.

5. **Extend sovereignty to model artifacts.** If language data is used to train or fine-tune a model:
   - Specify in the governance agreement that model weights trained on community data are community property.
   - Ensure the community can audit, modify, or request deletion of models.
   - Do not publish or share model weights without explicit community authorization.

6. **Define end-of-project protocols.** Before the project begins, specify: what happens to data and models if the research team disbands, if funding ends, or if the community withdraws consent. Data should be transferred to community custody, not archived at a research institution without community control.

7. **Embed sovereignty in project governance.** Include community data sovereignty as a standing agenda item in project governance meetings — not a one-time setup task. Data decisions arise throughout projects; the governance structure must handle them.

## Pseudocode

```
procedure CommunityDataSovereignty(project, community):

    // Phase 1: Pre-collection governance agreement
    agreement = draft_data_governance_agreement(
        owner = COMMUNITY,                    // not institution
        authorized_uses = community.define_authorized_uses(),
        access_rights = {
            community: FULL_ACCESS,
            researcher: CONDITIONAL_ACCESS,   // per-use authorization
        },
        end_of_project = TRANSFER_TO_COMMUNITY,
        model_artifacts = COMMUNITY_PROPERTY
    )
    agreement = community.review_and_sign(agreement)  // community legal review, not only institutional

    // Phase 2: Infrastructure setup
    storage = community_controlled_storage(
        location = COMMUNITY_SERVER or COMMUNITY_CLOUD_ACCOUNT,
        encryption_keys = community.holds(),
        researcher_access = time_limited_per_task
    )

    // Phase 3: Data collection under OCAP
    for each collection_event:
        authorization = community.authorize(specific_purpose)
        if not authorization:
            abort_collection()
        data = collect(scope=authorization.scope_only)
        storage.deposit(data, provenance=authorization)

    // Phase 4: Model training (if applicable)
    if training_on_community_data:
        model_weights = train(data)
        storage.deposit(model_weights, owner=COMMUNITY)
        researcher_use_requires = community.authorize_per_use(model_weights)

    // Phase 5: End-of-project transfer
    all_data = storage.retrieve_all()
    all_models = storage.retrieve_models()
    community.receive_custody(all_data, all_models)
    researcher.delete_copies()  // unless community authorizes retention
```

## Evidence

Brinklow et al. (2019) document that data sovereignty violations are not hypothetical — in several documented Canadian Indigenous language technology projects, communities discovered post-hoc that their language data had been archived at research institutions, made available in linguistic databases, or used in ways they did not authorize. These violations damaged trust and in some cases caused communities to withdraw cooperation from future projects.

The OCAP Principles were developed by the First Nations Information Governance Centre specifically in response to documented patterns of data extraction from Indigenous communities without meaningful consent or community benefit — establishing that this is a systemic problem, not an isolated failure.

Brinklow (2021) extends this to digital colonization: the structural mechanism by which commercial technology companies build language infrastructure is precisely data extraction at scale — models trained on scraped language data produce tools that serve the company's commercial interests without community governance. The difference between a commercial language tool and a community-governed one is fundamentally a data sovereignty distinction.

The principle that data sovereignty extends to model weights is practically important for the current generation of LLMs: if a foundation model is fine-tuned on community language data and the weights are published or transferred to a third party, the community's ability to control use of its language data is practically eliminated even if formal data ownership is preserved.

**Three documented AI extraction incidents from the Algonquian Dictionaries project (Junker, 2024):**

The Algonquian Dictionaries and Language Resources project — a 20-year collaborative infrastructure of 12 dictionaries, linguistic atlases, verb conjugators, and audio corpora for 20 Algonquian languages — experienced three distinct AI data mining events in 2023. These are the clearest documented cases of the AI extraction dynamic in Indigenous language NLP:

1. **"The Good" (July–October 2023):** A European university linguistics team requested access to conjugation guides and the Proto-Algonquian dictionary for morphological change research. They asked explicit OCAP-aligned questions ("Do you have the data in a .csv file? ... can we include this data in a potentially open-source format, with appropriate citation?"), negotiated a data usage agreement, and submitted it for community review. The Indigenous group declined permission in light of the second event (below). The researchers accepted the decision and excluded Algonquian languages from their research. This is the model: written request, explicit questions, negotiated agreement, community decision respected.

2. **"The Bad" (reported March 2023):** A computer science professor's students contacted the infrastructure announcing their thesis on machine learning for an Algonquian language. The professor had previously been told by Indigenous language organizations that they were not interested in AI machine translation at this time. Despite being told community permission was required, the team forged ahead and mined the entire dataset of trilingual dictionary examples — a feature not accessible as such to the public. They presented a paper at a conference in October 2023, claiming "collaboration" with the Indigenous group and citing the source they had mined. An Indigenous scholar co-editor of the dictionary, attending the conference, noticed. The community and editors co-signed a letter demanding deletion of all mined data from all repositories, corpora, and backups, removal of the term "collaboration" from the research program, and a reminder of OCAP principles.

3. **"The Ugly" (Winter–Spring 2023):** A private web design company offered an Indigenous institution a site redesign for their oral stories database (built collaboratively with the Algonquian project, 2010–13). The Indigenous institution contact was unaware of the database's backend structure and signed based on visual appearance. The company scraped all trilingual data (audio, text, video) from the public interface, rebuilt the database incorrectly with many errors, and moved the data to a commercial server under unknown terms. They were paid a large sum — 10% of which would have covered a proper non-extractive update. This case shows that the threat is not only from academic researchers: commercial technology vendors exploit the same governance gap.

**Pattern across all three:** Indigenous digital language infrastructure becomes a "gold rush" target because it is rare, carefully curated, and technically accessible. The extractors — whether academic or commercial — treat web-accessible data as a free natural resource. Communities and their representatives often do not know what is happening until after the fact. The economic imbalance is severe: the Algonquian project is funded by sporadic research grants and part-time staff, while AI developers come with commercial budgets but offer no compensation.

**Operational response:** Following these events, the Algonquian project posted "Data-mining and scraping strictly prohibited" notices on all dictionary credit pages (an earlier attempt to add "without permission" was abandoned because the team lacked capacity to process all requests). Analytics were implemented to detect bot activity.

## Variations & Configuration

- **Minimal viable sovereignty:** When full community-controlled infrastructure is not feasible, the minimum requirement is: (a) a signed data governance agreement specifying community ownership and authorized uses, and (b) community-held copies of all data and any model weights.
- **Federated data governance:** For projects spanning multiple community members or reserves, a federated governance structure (e.g., a data governance committee with representatives from each community node) prevents any single party from making decisions that affect the whole community.
- **Tiered access model:** Some language data is generally usable (public greetings, place names) while other data is restricted (ceremonial language, elder recordings). A tiered access model allows the project to proceed with general-tier data while protecting restricted-tier data under stricter protocols.
- **Time-limited consent:** Consent to use data for a specific purpose expires when that purpose is fulfilled; data cannot be reused for new purposes without fresh authorization. This prevents "consent creep" where broad initial consent is used to justify unanticipated future uses.

## Code & Tools

- **OCAP Principles:** First Nations Information Governance Centre, fnigc.ca/ocap-principles — the primary operational framework for Indigenous data sovereignty in Canada. Includes implementation guides.
- **CARE Principles:** Global Indigenous Data Alliance, gida-global.org — international complement to OCAP; Collective Benefit, Authority to Control, Responsibility, Ethics.
- **First Peoples' Cultural Council:** fpcc.ca — BC-based organization with extensive experience in community-controlled Indigenous language data infrastructure; published data governance templates.
- **FNIGC Research Ethics Framework:** fnigc.ca — community-based research ethics standards for projects involving First Nations data in Canada.
- **Whisper Community Edition / local ASR deployment:** For communities wishing to use speech models without sending data to external APIs, locally-deployed ASR (e.g., fine-tuned Whisper running on community hardware) preserves data sovereignty while enabling modern speech technology.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Prevents the most common and damaging failure mode in Indigenous language technology: data extraction without community benefit | Negotiating and maintaining data governance agreements requires significant time and legal expertise |
| Builds the trust foundation that makes long-term collaboration possible | Community-controlled infrastructure is more expensive and technically demanding than institutional or commercial cloud storage |
| Extends naturally to AI model governance, preventing post-hoc data sovereignty violations via model weights | "Community ownership" may be contested within communities; defining the authorized governing body requires care |
| Compatible with OCAP, CARE, UNDRIP, and most Indigenous data governance frameworks | Time-limited and purpose-specific consent increases administrative overhead on researchers |
| Ensures community benefit persists beyond researcher departure | Some data governance requirements may conflict with open-science publishing norms |

## References

- Brinklow, N. T., Littell, P., Lothian, D., Pine, A., & Souter, H. (2019). Indigenous Language Technologies & Language Reclamation in Canada. *LREC 2019 Workshop on Computationally Assisted Language Documentation and Description*.
- Brinklow, N. T. (2021). Indigenous Language Technologies: Anti-Colonial Oases in a Colonizing (Digital) World. *WINHEC: International Journal of Indigenous Education Scholarship*, 16(1), 239–266.
- First Nations Information Governance Centre. (2014). *Ownership, Control, Access and Possession (OCAP): The Path to First Nations Information Governance*. fnigc.ca/ocap-principles.
- CARE Principles for Indigenous Data Governance. Global Indigenous Data Alliance. gida-global.org.
- Walter, M., & Suina, M. (2019). Indigenous data, indigenous methodologies and indigenous data sovereignty. *International Journal of Social Research Methodology*, 22(3), 233–243.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The seven-step How to Apply section gives end-to-end operational guidance (governance agreement, OCAP application, scoped collection, community infrastructure, model artifact sovereignty, end-of-project protocols, standing governance). A practitioner can execute this without reading Brinklow et al. (2019).

    **Criterion 2 — Empirical results with numbers:** PARTIAL — The evidence section documents that data extraction without consent occurred in "several" Canadian Indigenous language projects, causing trust damage and withdrawal from future collaboration. The OCAP Principles' origin as a systemic response is cited. No specific project names, dates, counts, or quantitative outcomes are provided.

    **Criterion 3 — Applicable context clarity:** PASS — "When to Use" covers five positive contexts (pre-collection, infrastructure design, fine-tuning decisions, agreement drafting, existing tool evaluation) and two explicit negatives (fully public-domain historical data, synthetic data with no community origin).

    **Criterion 4 — Pseudocode/flowchart completeness:** PASS — All five phases are clearly separated with concrete logic: agreement structure is spelled out with named fields, the collection loop enforces per-purpose authorization, model weight handling is explicit, and end-of-project transfer including researcher copy deletion is covered. Unambiguous.

    **Criterion 5 — Failure modes:** PARTIAL — Key failure modes appear in the Strengths & Weaknesses table (contested community ownership definition, administrative overhead of time-limited consent, open-science publishing conflicts, expense of community-controlled infrastructure). No dedicated "Failure Modes" section; the most critical failure mode — "consent creep" where broad initial consent justifies unanticipated future uses — is described in the Variations section rather than a failures section, making it easy to miss.

    **Overall:** Well-structured and practically complete. Two gaps worth addressing: (1) the Evidence section would benefit from at least one named case study (even anonymized) to ground the "several documented projects" claim; (2) "consent creep" is a critical failure mode buried in Variations — it should be surfaced in a dedicated failure modes note or the weaknesses table.

