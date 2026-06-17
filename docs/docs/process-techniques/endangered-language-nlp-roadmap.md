
# Endangered Language NLP Roadmap

**Category:** Process & Methodology Technique
**Data Regime:** any (a sequencing framework; applies before any technical work begins)
**Applicable Languages:** Critically and severely endangered North American Indigenous languages; applicable by analogy to other endangered languages with small speaker communities and minimal digital infrastructure

## Description

A three-stage sequencing framework for NLP work with endangered language communities, developed by Zhang et al. (2022) as a case study for Cherokee. The roadmap orders activities by prerequisite dependencies: principles before tools, education-supporting tools before research-grade NLP, and community infrastructure before advanced applications. Critically, the framework requires that community-grounded principles be established *before* any technical scoping decisions are made.

The three stages are:

**Stage 1 — Pre-NLP Community Principles (must precede all technical work)**

Three foundational principles that constrain all subsequent NLP decisions:

1. *Understand and respect first.* Address power imbalances before asking any technical questions. The historical relationship between research institutions and Indigenous communities is one of extraction and harm — this must be acknowledged explicitly, not just procedurally. Practical actions: study the community's history; attend community events; ask about the community's language goals before proposing tools; prioritize what the community considers worth preserving over what NLP researchers find technically tractable.

2. *Decolonize the research.* Question whether standard NLP task formulations fit the target language. Polysynthetic languages like Cherokee cannot be adequately processed by pipelines designed for English or French — tokenization, parsing, and evaluation metrics all require rethinking. The paper's finding that standard subword tokenization (BPE, Unigram LM) poorly aligns with Cherokee morpheme boundaries is an example of what decolonizing means technically. More broadly: do not impose research frameworks that center publication metrics over community benefit.

3. *Build community.* Create shared, sustainable infrastructure. Research projects end; language communities persist. Design data collection to build community capacity, not just research datasets. Enable community members to maintain and extend language technology tools without ongoing researcher involvement. Co-author with Indigenous language community members (Frey, a Cherokee citizen, is a co-author of the paper itself).

**Stage 2 — NLP-Assisted Language Education**

Tools that directly support community-identified priorities (MT, OCR, ASR, basic NLP) and can be integrated into existing educational and revitalization programs. These are intermediate-complexity tools that require less labeled data than research-grade NLP but provide immediate community utility:
- Machine translation (for drafting/editing workflows; community-requested)
- OCR (to digitize manuscript text; community-requested)
- ASR (for audio transcription; community-requested)
- Community resource platform with machine-in-the-loop annotation (see Machine-in-the-Loop Annotation)

**Stage 3 — Language-Specific NLP Research**

Research-grade NLP tools that require substantial labeled data and linguistics expertise but unlock higher-level applications:
- POS tagger
- Dependency parser
- Morphological analyzer (critical for polysynthetic languages)
- Information extraction systems

These are prerequisites for more advanced applications (summarization, question answering, knowledge base construction) but should be developed only after Stage 2 tools are deployed and the community is actively engaged.

**Resource-enrichment methods** proposed for the Cherokee data bootstrapping problem:
- Mine digitized manuscripts using OCR (Stage 2)
- Extract parallel Bible text (with community consent and contamination monitoring; see Tiny-Data LLM Fine-Tuning)
- Apply back-translation to expand monolingual text into pseudo-parallel training data
- Use machine-in-the-loop annotation to build morphological and syntactic labeled data

## When to Use

- Before scoping any NLP project for a critically or severely endangered language.
- When there is pressure (from funders, institutions, or the research team itself) to skip Stage 1 and go directly to model building — use this framework to justify the prerequisite sequence.
- When deciding what to build first: map proposed tools to Stage 2 vs. Stage 3 and prioritize Stage 2 items that community members have explicitly requested.
- When writing a research proposal or institutional ethics application — the three stages provide a structure for describing the project's community engagement and technical scope.

**Less suitable when:**
- The language community is itself leading and directing the project — defer to their sequencing priorities.
- The project involves a language with substantial digital infrastructure (Stage 1 principles still apply but Stage 2/3 sequencing may be less critical).

## How to Apply

**Phase 0 — Language classification (prerequisite)**

Before applying this roadmap, classify the target language using the Endangered vs. Low-Resource Language Distinction framework. The roadmap is designed for Ocelot/Coyote-tier languages (1K–100K speakers, critically endangered) — not for Elephant-tier high-resource languages where standard NLP pipelines may already work.

**Phase 1 — Stage 1: Establish principles (before any technical work)**

1. Research the community's documented history with outside researchers and institutions. Has prior academic NLP work been extractive? Have community members experienced broken promises about data use or benefit-sharing?
2. Identify and meet with Indigenous community members who have formal or informal roles in language revitalization (e.g., language program directors, master speakers, school language teachers, community language organizations).
3. Explicitly ask: "What are your language goals?" and "What tools would be most useful to your community right now?" — do not present a pre-formed technical agenda.
4. If the community has a preferred research ethics framework, adopt it. The paper cites Mihesuah (1993) for US Indigenous communities; Canadian contexts have OCAP and CARE principles; specific nations may have their own governance requirements.
5. Identify co-authors or co-investigators from the Indigenous community before the project begins. Not as "community consultants" but as genuine intellectual contributors with authorship rights.
6. Audit the planned NLP pipeline for colonial assumptions: Does the tokenizer assume isolating/fusional morphology? Does the evaluation metric penalize the language's natural word order? Do the training data sources carry colonial or religious associations?

**Phase 2 — Stage 2: Build education-supporting tools**

7. Prioritize tools by community request. The Cherokee community specifically requested (in order of community stated priority): MT, OCR, ASR, POS tagger, dependency parser. Start with the top-requested items.
8. For MT (community's top priority): Apply Tiny-Data LLM Fine-Tuning with existing parallel text (pedagogical materials, Bible text if approved, available literary texts). Focus on text types the community actually uses: educational materials, administrative documents, not just Bible domain.
9. For OCR: Apply machine-in-the-loop OCR pipeline (see Machine-in-the-Loop Annotation). Prioritize digitizing materials that the community identifies as culturally significant, not just any available printed text.
10. For ASR: Fine-tune XLSR-53 or similar cross-lingual model on a seed set of community-provided recordings. WER=0.21 is achievable for Cherokee with modest labeled data — a useful baseline for transcription support tools.
11. Deploy tools in community educational settings. Use technology probe methodology (imperfect but deployed) to gather feedback. Do not wait for research-grade quality before community deployment.

**Phase 3 — Stage 3: Research-grade NLP (only after Stage 2 tools are deployed and used)**

12. Use machine-in-the-loop annotation (Stage 2 infrastructure) to build POS-tagged and morphologically analyzed training data.
13. Develop a morphological analyzer specific to the polysynthetic structure of the language. For Cherokee: address the challenge that a single verb can encode subject, object, tense, aspect, and shape-of-object classifier — standard English-derived morphological tools will fail.
14. Avoid "number games": optimizing data quantity for benchmark performance rather than community benefit. The paper explicitly warns against this — report results in terms of community utility (can community members use this tool?), not just automatic metrics.

**Anti-pattern — "Number games":**
Zhang et al. explicitly name the failure mode of optimizing for NLP benchmark performance ("number games") rather than community benefit. Warning signs:
- Evaluating MT quality only on Bible parallel text without testing on domain-relevant community texts.
- Reporting only automatic metrics (BLEU, WER) without community evaluation of tool usefulness.
- Publishing improvements on benchmark leaderboards without deploying tools for community use.
- Framing success as "state-of-the-art performance on Cherokee NLP" rather than "Cherokee community members can now transcribe elder recordings more efficiently."

## Pseudocode

```
procedure EndangeredLanguageNLPProject(target_language, research_team):

    // Phase 0: Language classification
    tier = classify_language(target_language,
        framework=EndangeredVsLowResourceDistinction)
    assert tier in ["ocelot", "coyote"], "Roadmap designed for endangered languages"

    // Stage 1: Community principles (BEFORE any technical work)
    history = research_institutional_history(target_language, research_team)
    community_contacts = identify_language_stewards(
        roles=["language_programs", "master_speakers", "teachers", "organizations"])
    
    community_goals = elicit_community_goals(community_contacts,
        question="What would be most useful for your language right now?",
        NOT="here is what we propose to build")
    
    indigenous_co_investigators = recruit_co_authors(community_contacts)
        // Not consultants — intellectual partners with authorship rights
    
    pipeline_audit = audit_colonial_assumptions(
        tokenizer="Does it assume isolating morphology?",
        evaluation="Does it penalize natural word order?",
        data_sources="Do they carry colonial/religious associations?")
    
    // Stage 2: Education-supporting tools (in community priority order)
    priority_tools = rank_by_community_request(community_goals)
    for tool in priority_tools[:top_n]:
        model = build_tool(tool,
            data=community_approved_sources,
            method=appropriate_technique[tool])  // MT→TinyData, OCR→MachineInLoop, ASR→XLSR
        deploy_as_technology_probe(model, setting="community_educational_context")
        feedback = gather_community_feedback(model)
        // Iterate; do not wait for research-grade quality
    
    // Stage 3: Research-grade NLP (after Stage 2 deployment)
    // Only proceed if community is engaged and Stage 2 tools are actively used
    if community_engagement_confirmed(feedback):
        annotation_data = machine_in_the_loop_annotation(
            tasks=["pos_tagging", "morphological_analysis", "dependency_parsing"],
            seed_annotators=fluent_speakers_or_linguists)
        research_models = build_stage3_tools(annotation_data)
        
        // Anti-pattern check
        evaluate_by_community_utility(research_models)  // NOT benchmark leaderboard
        publish_with_co_authors(indigenous_co_investigators)
```

## Evidence

**Cherokee (chr) — case study:**
- Speakers: ~2,200 (Eastern Band) to ~22,000 (Cherokee Nation of Oklahoma) — severely to critically endangered.
- Writing system: Cherokee syllabary (85 characters, 6 vowels × 1 consonant + 6 pure vowels), polysynthetic morphology.
- Key finding: XLSR-53 fine-tuned on Cherokee audio achieves **WER = 0.21** on syllabic text transcription — demonstrates that Stage 2 ASR is achievable with modest labeled data.
- Key finding: standard BPE/Unigram LM tokenization poorly aligns with Cherokee morpheme boundaries — character-level generation in transliterated Latin script may be more appropriate for polysynthetic MT.
- Community-requested tool priority (from paper): MT > OCR > ASR > POS tagger > dependency parser. This ordering directly determined the Stage 2 prioritization recommendation.
- Co-authorship: Benjamin E. Frey (Cherokee citizen) is a named co-author; several Cherokee speakers are cited by name as contributors. This is a model for Stage 1 principle implementation.

**Alignment with other frameworks:**
- Stage 1 principles align with Bird (2020) on non-extractive language technology and the three-category distinction in Cooper et al. (2024) Cyclical Engagement Process.
- The "number games" anti-pattern aligns with the community-benefit measurement approach in the Realist Evaluation Framework.
- The decolonize-research principle aligns with the Responsive and Responsible ILT Design framework.

**Limitation:** The proposed community resource platform (Stage 2 collaborative infrastructure) was conceptual at paper publication time — not yet deployed or evaluated for Cherokee. The WER=0.21 ASR result is the main empirical finding; MT, OCR, and annotation platform results are proposed rather than demonstrated.

## Variations & Configuration

- **Compressed Stage 1 (when prior relationships exist):** If the research team already has established trust with the community (e.g., a Cherokee citizen is a co-PI), Stage 1 can be compressed to a formal documentation of existing principles rather than a full trust-building engagement process. Do not skip the pipeline audit.
- **Stage 2 subset (resource-constrained projects):** If only one tool can be built, choose the community's top-priority request (MT for Cherokee). Build it bilingually with clean community-approved data. Deploy it even if imperfect; imperfect tools in use generate more benefit and feedback than perfect tools never deployed.
- **Multi-language generalization:** The three-stage framework applies across endangered languages with small speaker communities. The specific tool priority list will differ by community — always elicit from the community, do not import Cherokee's priority order wholesale.
- **Synchronizing with educational calendars:** Deploy Stage 2 tools through schools and language classes. This gives access to a stable community of users (students, teachers) and aligns tool deployment with existing language transmission infrastructure.

## Code & Tools

- Cherokee Corpus (Bible parallel text, community-approved): accessible through eBible and community language programs
- XLSR-53 for ASR: https://huggingface.co/facebook/wav2vec2-large-xlsr-53
- Tesseract OCR (Cherokee syllabary support): https://github.com/tesseract-ocr/tesseract
- Cherokee Unicode syllabary: U+13A0–U+13FF (original) and U+AB70–U+ABBF (supplement)
- Cherokee Language Revitalization resources: Cherokee Nation Language Department — https://language.cherokee.org/
- Mihesuah (1993) research guidelines: Mihesuah, D. A. (1993). *Cultivating the Rosebuds: The Education of Women at the Cherokee Female Seminary, 1851–1909*. University of Illinois Press. (Cited for research ethics with US Indigenous communities.)
- CARE Principles: https://www.gida-global.org/care
- OCAP Principles (First Nations Information Governance Centre): https://fnigc.ca/ocap-training/

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Prerequisite sequencing prevents the most common failure mode: building tools before community trust is established | Stage 1 requires substantial time investment before any technical output; difficult to fund under standard NLP grant models |
| Community-requested tool prioritization ensures Stage 2 tools address actual needs | Stage 3 (research-grade NLP) may never be reached if Stage 2 deployment fails to sustain community engagement |
| "Number games" anti-pattern is explicitly named and described — provides shared vocabulary for research team self-critique | Community resource platform (GWAP/collaborative annotation) was conceptual at publication — implementation path requires further work |
| Indigenous co-authorship requirement (not just consultation) aligns incentive structures with community benefit | Polysynthetic language challenges (tokenization, morphological analysis) require specialized linguistics expertise not commonly available in NLP research teams |
| Decolonize-research principle operationalizes what it means to challenge colonial NLP assumptions technically, not just rhetorically | Cherokee case study involves multiple nations with different governance structures — generalizing from one nation's priorities requires caution |
| Three-stage structure makes it easy to communicate project scope and sequencing to funders and ethics boards | ASR WER=0.21 is the only empirical result; MT, OCR, and annotation platform performance on Cherokee remains undemonstrated |

## References

- Zhang, S., Frey, B. E., & Bansal, M. (2022). How can NLP Help Revitalize Endangered Languages? A Case Study and Roadmap for the Cherokee Language. *Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics (ACL 2022)*, Long Papers.
- Mihesuah, D. A. (1993). Guidelines for Researchers. *American Indian Culture and Research Journal*, 17(3).
- Bird, S. (2020). Decolonising Speech and Language Technology. *Proceedings of COLING 2020*.
- Conneau, A., et al. (2021). Unsupervised Cross-Lingual Representation Learning at Scale. *ACL 2020*.
- Cooper, N., Heldreth, C., & Hutchinson, B. (2024). It's how you do things that matters: Attending to Process to Better Serve Indigenous Communities with Language Technologies. *EACL 2024*.
- Carroll, S. R., et al. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The three-stage framework is clearly ordered with prerequisite dependencies explicit. Phase 0 (language classification), Phase 1 (Stage 1 principles), Phase 2 (Stage 2 tools), and Phase 3 (Stage 3 research NLP) each have numbered sub-steps. The "anti-pattern: number games" section is especially useful — it names four concrete warning signs a practitioner can check against. Cross-references to companion technique docs (Tiny-Data LLM Fine-Tuning, Machine-in-the-Loop Annotation) are correctly placed rather than duplicating content. One gap: "identify and meet with Indigenous community members" (Step 2) is not given any suggested outreach pathway or timeline guidance.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — The Cherokee WER = 0.21 result is the sole empirical number. Community-requested tool priority order (MT > OCR > ASR > POS > dependency parser) is cited from the paper and constitutes useful concrete data. However, the doc explicitly acknowledges that MT, OCR, and the annotation platform remain undemonstrated for Cherokee — the roadmap is largely a design proposal. This limitation is honestly stated in the Evidence section and the Strengths & Weaknesses table, which is appropriate, but means criterion 2 cannot fully pass.

    **Criterion 3 — Data regime / context clarity:** PASS — "Any (a sequencing framework; applies before any technical work begins)" is correct. The roadmap is explicitly scoped to Ocelot/Coyote-tier languages (Phase 0 language classification requirement). The "Less suitable when" cases are clear (community-led projects, languages with substantial digital infrastructure). The multi-language generalization note correctly warns against importing Cherokee's priority order to other communities.

    **Criterion 4 — Pseudocode completeness:** PASS — The pseudocode covers all three stages with the key design principles encoded: community goals are elicited (NOT "here is what we propose"), co-investigators are recruited (not consultants), tools are deployed as technology probes (not withheld until research-grade), and Stage 3 is gated on community engagement confirmation. The `appropriate_technique[tool]` dictionary encoding (MT→TinyData, OCR→MachineInLoop, ASR→XLSR) is a clean way to delegate without duplicating pseudocode. `community_engagement_confirmed` is a black-box function but is not ambiguous in intent.

    **Criterion 5 — Failure modes:** PASS — The "anti-pattern: number games" section is an explicit, named failure mode with four concrete warning signs embedded directly in the procedural steps (not confined to the table). The Strengths & Weaknesses table adds: Stage 1 funding difficulty, Stage 3 never being reached if Stage 2 fails, conceptual-only platform status, polysynthetic linguistics expertise gap, and multi-nation governance complexity. This is the best failure-mode coverage among the process technique docs.

    **Overall:** Well-structured sequencing doc with honest acknowledgment of its own evidential limits. Key gaps: (1) only one empirical number (WER=0.21); most Stage 2/3 results are proposed not demonstrated; (2) no outreach pathway or timeline guidance for the initial community contact step.

