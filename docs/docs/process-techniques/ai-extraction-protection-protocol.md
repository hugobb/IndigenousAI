
# AI Extraction Protection Protocol

**Category:** Process & Methodology Technique
**Data Regime:** any
**Applicable Languages:** Any Indigenous language with digital resources (dictionaries, corpora, conjugation tools, audio archives, linguistic atlases)

## Description

The AI Extraction Protection Protocol is a set of defensive practices for Indigenous language resource stewards — linguists, community organizations, and infrastructure administrators — to protect carefully built digital language resources from unauthorized AI data mining and extraction. The protocol was developed in response to a documented surge of AI-driven extraction attempts targeting Indigenous language infrastructure, where commercial AI developers and academic NLP researchers have begun treating community language data as a freely extractable natural resource.

The underlying dynamic is structural: Indigenous language digital resources (dictionaries, verb conjugators, audio corpora, linguistic atlases) are rare, carefully curated, and technically accessible — making them high-value targets for AI training data. The organizations that build and maintain these resources are typically under-resourced (sporadic grant funding, part-time staff), while AI developers have commercial budgets and move quickly. The result is a power asymmetry that mirrors historical resource extraction from Indigenous communities — now applied to language data.

The protocol operates on two levels:
1. **Technical defenses** — infrastructure changes that make unauthorized extraction harder to execute.
2. **Social and governance defenses** — awareness, decision frameworks, and response procedures for communities and researchers.

Three documented extraction types drive the protocol design (Junker, 2024):
- **Academic extraction without permission:** Researchers mine data after being explicitly told community permission is required, then claim "collaboration" in publications.
- **Commercial extraction via site redesign:** Technology vendors offer to "modernize" a digital resource, scrape all data during the process, and move it to commercial infrastructure under unknown terms.
- **Well-intentioned but unsanctioned access:** Researchers make a genuine data request, follow OCAP-aligned process, but the community's governance body ultimately declines — and the researchers respect the decision.

The first two require defensive responses. The third is the intended path: the protocol aims to funnel all requests toward the third pattern.

## When to Use

- When launching or maintaining any publicly accessible Indigenous language digital resource (dictionary website, corpus portal, conjugation tool, audio archive).
- When an external party (researcher, company, NGO) contacts the project requesting data access, a partnership, or a site "modernization."
- When a publication appears claiming to have used your project's data without prior contact or permission.
- When designing API access policies for a language tool with open-access features.
- **Preemptively:** Before a resource becomes publicly accessible — defenses are harder to add retroactively.

## How to Apply

### Technical Defenses

1. **Post explicit prohibition notices.** Add "Data-mining and scraping strictly prohibited" to all dictionary and tool credit pages, landing pages, and API documentation. A simpler, unambiguous statement is more enforceable than "without permission" (which implies permission requests are possible when you may lack capacity to handle them).

2. **Implement bot detection analytics.** Deploy server-side analytics (e.g., server logs + a tool like Matomo or GoAccess) to identify high-volume automated requests. Set rate limits that distinguish normal human users from scraping bots. Flag unusual patterns: many requests per second, systematic traversal of dictionary entries, bulk downloads.

3. **Restrict API access.** If the resource has or plans an API, require authentication tokens rather than open endpoints. Issue tokens to identified requesters; revoke on misuse. Avoid fully open REST APIs for language data — they are the primary technical mechanism for bulk extraction.

4. **Apply tiered access controls.** Not all data has the same sensitivity or sovereignty status. Some dictionary content can be publicly accessible; trilingual data exports, audio file archives, and database dumps should require explicit authorization. The Algonquian Dictionaries project uses "separate access by language and by level" for each group of users.

5. **Maintain community-controlled hosting.** Store data on protected servers in the relevant jurisdiction (Canadian servers for Canadian Indigenous language data, respecting relevant privacy frameworks). Avoid commercial cloud infrastructure where terms of service may grant the provider data rights.

6. **Audit "public" features before opening them.** Before adding any public-facing feature (export, API, open access), consider whether it could be exploited for bulk extraction. The Algonquian project had to halt work on search optimization and API availability after extraction events — features that would have benefited legitimate users became extraction vectors.

### Governance and Social Defenses

7. **Alert all stakeholders — Indigenous and non-Indigenous — to AI extraction dynamics.** Most community members, including language speakers, do not know what AI training data collection looks like or what the stakes are for their language data. Provide plain-language briefings on: what AI companies do with language data, what the community's data rights are, and who is authorized to make data-sharing decisions.

8. **Establish a clear authorization chain.** Before any data request can be granted, there must be a documented answer to: "Who, specifically, has the authority to authorize this use?" This should be a named governance body (a language committee, a band council, a project steering committee) — not an individual linguist or researcher who happens to be accessible.

9. **Equip community members to evaluate requests.** When contacted by external parties, community members should be able to ask:
   - Who does this data belong to? Do I (as an individual) have the right to authorize this use?
   - Are they using our community for their own purpose, or genuinely seeking partnership?
   - Do I/we have control over this project? Did we define its goal and process?
   - What is the requester's true goal?

10. **Equip community members to evaluate commercial "modernization" offers.** When commercial vendors offer to redesign or upgrade a digital resource, ask:
    - How will you retrieve the existing data? Can we provide it to you in proper structured form rather than having you scrape it?
    - Will you preserve all existing functionality (front end and back end), not just visual appearance?
    - Where will our data be stored? On whose servers? Under what terms?
    - Will you sell data or derivative products to third parties?
    - Who owns the code after the project? Who provides updates and for how long?

11. **Define a response procedure for unauthorized use.** If data has been used without permission:
    - Demand deletion of all mined data from all repositories, corpora, and backups (not just primary copies).
    - Demand removal of any claim of "collaboration" or "partnership" from publications, code repositories, and research program descriptions.
    - Issue a formal reminder of OCAP principles to the violating party.
    - Explore legal avenues, especially if the use is commercial or caused harm.
    - Consider public documentation of the violation (anonymized or named, per community preference) to warn other language resource stewards.

### For Researchers Approaching Indigenous Language Resources

12. **Apply a "do no harm" self-check before any data request.** Genuinely respectful researchers should ask themselves:
    - What can we offer in return (beyond authorship credit)?
    - Do people need this project, or are we trying to convince them they do?
    - What is our true goal and purpose?
    - Do we respect the community's right to say no, including after we have invested research resources?

## Pseudocode

```
// Technical defense setup (one-time infrastructure)
procedure SetupExtractionDefenses(resource):
    resource.add_notice("Data-mining and scraping strictly prohibited")
    resource.enable_bot_detection_analytics()
    resource.apply_rate_limiting(threshold=human_browsing_rate)
    resource.convert_open_api_to_authenticated(token_required=True)
    resource.apply_tiered_access(
        public_tier = [basic_dictionary_lookups, single_entry_views],
        restricted_tier = [bulk_exports, audio_archives, database_dumps, API_bulk]
    )
    resource.verify_hosting_jurisdiction = COMMUNITY_CONTROLLED

// Incoming request evaluation
procedure EvaluateDataRequest(request, community_governance_body):
    if request.authorization_chain_unclear():
        escalate_to(community_governance_body)
        return HOLD

    questions = [
        "Who owns this data? Does the requestor understand this?",
        "Has the requestor asked explicit permission questions (not assumed access)?",
        "Is there a written data usage agreement proposal?",
        "Does the agreement address: authorized uses, storage location, third-party restrictions, end-of-project data return?",
        "Is the requester prepared to accept a 'no'?"
    ]

    if all(questions answered satisfactorily):
        submit_to(community_governance_body, request.data_usage_agreement)
        decision = community_governance_body.decide()
        if decision == APPROVED:
            grant_scoped_access(request, scope=decision.authorized_uses)
        else:
            notify_requestor(DECLINED, reason=community_decision)
            // requester must respect decision
    else:
        return REQUEST_MORE_INFORMATION

// Response to unauthorized use
procedure RespondToUnauthorizedExtraction(incident, violating_party):
    send_formal_letter(violating_party, demands=[
        "delete_all_mined_data(repositories=ALL, backups=ALL)",
        "remove_collaboration_claims(publications=ALL, websites=ALL)",
        "acknowledge_ocap_principles"
    ])
    if violation.is_commercial or violation.caused_harm:
        consult_legal_counsel()
    document_incident(anonymized=community_preference)
```

## Evidence

Junker (2024) documents three extraction events targeting the Algonquian Dictionaries and Language Resources project in 2023 — the clearest published case study of AI extraction dynamics in Indigenous language NLP:

**The Good (July–October 2023):** A European university team requested access to conjugation guides for morphological change research. They asked explicit OCAP-aligned questions, negotiated a data usage agreement, and submitted it to the Indigenous group. The community declined. The researchers respected the decision and excluded Algonquian languages from their research. Outcome: the OCAP-aligned process worked as intended.

**The Bad (reported March 2023):** An NLP professor's students contacted the project announcing an AI machine translation project for one Algonquian language. The professor had been previously told that the community was not interested in AI machine translation. Despite being informed that community permission was required, the team mined the entire trilingual dictionary dataset — a non-public bulk feature. They presented at a conference claiming "collaboration," which was discovered by an Indigenous co-editor attending the conference. Outcome: community and editors co-signed a letter demanding data deletion, retraction of "collaboration" claims, and an OCAP reminder.

**The Ugly (Winter–Spring 2023):** A web design company offered an Indigenous institution a site redesign for their oral stories database. The Indigenous institution contact was unaware of the database's backend structure and signed based on visual appearance. The company scraped all trilingual data (audio, text, video) from the public interface, rebuilt the database incorrectly with many errors, and moved it to a commercial server under unknown terms. The company was paid a large sum; ~10% would have covered a proper non-extractive update. Outcome: data on unknown commercial infrastructure with unknown terms; no reported resolution.

**Structural finding:** These events forced the Algonquian project to halt work on search optimization, API availability, and open-access features that would have benefited legitimate users. The defensive cost — engineering time, administrative overhead, lost functionality — falls entirely on the under-resourced Indigenous language project, not the extractors.

**Scale indicator:** Meta released a paper on pre-trained text-to-speech systems including Canadian Indigenous languages without documentation of permissions or community evaluation (Pratap et al., 2023). The Algonquian project's audio files are likely included without any contact or consent. This indicates the extraction problem extends to major commercial AI labs, not only opportunistic researchers.

## Variations & Configuration

- **Minimal viable defense (capacity-constrained projects):** If full analytics and tiered access controls are not feasible, the minimum is: (a) explicit prohibition notice on all pages, (b) no open-bulk-export features, (c) a documented authorization chain that individuals can refer requesters to.
- **Open-access with extraction controls:** Some resources want to remain open for human use while blocking AI extraction. Approaches include: CAPTCHA-gated bulk features, robots.txt disallowing AI crawler agents, and rate limiting calibrated to human browsing patterns.
- **Proactive community briefing:** For communities with limited digital literacy, hold explicit briefings on AI data dynamics before any external AI interest materializes — waiting until an extraction attempt occurs is too late.
- **Cross-project coordination:** Language resource stewards who share infrastructure (as in the Algonquian common infrastructure model) can share bot detection data and coordinate responses to extraction attempts that target multiple projects simultaneously.

## Code & Tools

- **Matomo** (open-source web analytics): https://matomo.org — self-hosted analytics for detecting bot traffic; preserves data sovereignty better than Google Analytics.
- **robots.txt AI crawler blocking:** Add `User-agent: GPTBot` / `Disallow: /` and similar entries for common AI crawlers (CCBot, anthropic-ai, Google-Extended, etc.) to robots.txt. Not a technical barrier but establishes clear prohibition.
- **FNIGC OCAP Training:** https://fnigc.ca/ocap-training — formal training on OCAP principles for community members and researchers; relevant for establishing shared governance vocabulary.
- **GIDA CARE Principles:** https://gida-global.org — international complement to OCAP for data governance frameworks.
- **Rate limiting (nginx):** `limit_req_zone` and `limit_req` directives for server-side rate limiting of HTTP requests without requiring application code changes.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Directly addresses the specific AI extraction dynamic that existing data sovereignty frameworks (OCAP, CARE) do not yet fully operationalize | Technical defenses add infrastructure burden to already under-resourced projects |
| Grounded in three documented real extraction incidents — not hypothetical | Determined bad actors can circumvent most technical defenses with modest effort (distributed scraping, rotating IPs); social and legal enforcement is ultimately necessary |
| Provides concrete question lists that community members can apply immediately without technical expertise | Prohibition notices and robots.txt are not legally binding; enforcement depends on community capacity to detect and respond to violations |
| Creates a model for good practice (The Good pattern) that researchers can follow proactively | Commercial AI labs with large crawling infrastructure are not deterred by small-project defenses; systemic policy change is needed beyond project-level protocol |
| Addresses both academic and commercial extraction vectors | Most extraction goes undetected; these protocols help catch incidents but cannot prevent all of them |

## References

- Junker, M.-O. (2024). Data Mining and Extraction: the gold rush of AI on Indigenous Languages. *Proceedings of the Seventh Workshop on the Use of Computational Methods in the Study of Endangered Languages (ComputEL-7)*, ACL 2024, pages 52–57.
- Carroll, S., et al. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*, 19, pp. 1–12.
- First Nations Information Governance Centre. (2014). *Ownership, Control, Access and Possession (OCAP): The Path to First Nations Information Governance*. fnigc.ca/ocap-principles.
- Pratap, V., et al. (2023). Scaling Speech Technology to 1,000+ Languages. *arXiv preprint arXiv:2305.13516*. — cited as an example of undisclosed use of Indigenous language audio data by a major commercial AI lab.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — Twelve concrete action steps are organized into technical defenses, governance/social defenses, and researcher self-checks. Each step is specific enough to act on immediately (e.g., exact robots.txt directives, specific questions to ask vendors, explicit demands for an unauthorized-use response). No prerequisite paper reading is required.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — By the nature of a process/governance technique, quantitative ML metrics do not apply. The three documented incidents from Junker (2024) provide real-world grounding with named parties, dates, and outcomes. The only quantitative reference is the cost comparison ("~10% would have covered a proper non-extractive update") and the Pratap et al. (2023) scale indicator (1,000+ languages). For a process technique this level of evidence is appropriate, but noting the absence of measured outcomes (e.g., extraction rate reduction after deploying defenses) is worth flagging for a future iteration.

    **Criterion 3 — Data regime / context clarity:** PASS — "Any" data regime is correctly specified; the protocol explicitly scopes to publicly accessible Indigenous language digital resources and distinguishes between resource types with different sensitivity levels (single-entry lookups vs. bulk exports vs. audio archives).

    **Criterion 4 — Pseudocode completeness:** PASS — Three distinct procedures are defined: infrastructure setup, incoming request evaluation (with branching on authorization clarity and governance decision), and unauthorized-use incident response. Decision logic and outputs are unambiguous.

    **Criterion 5 — Failure modes:** PASS — The weaknesses table documents five explicit failure modes: infrastructure burden on under-resourced projects, circumvention by determined actors, non-legal-bindingness of notices and robots.txt, inability to deter large commercial labs, and most extractions going undetected. The "Ugly" case study illustrates the failure of informal trust without governance structures.

    **Overall:** Well-grounded in documented incidents and immediately actionable. The main gap is the absence of any measured outcomes showing whether the defenses reduce extraction (acknowledged as largely undetectable). A "minimal viable defense" variant is helpfully included for capacity-constrained projects.

