
# LISTED Framework for Culturally Aligned AI Deployment

**Category:** Process & Methodology Technique
**Data Regime:** Any — applies before and during deployment regardless of data availability
**Applicable Languages:** All low-resource and non-Western language contexts; especially applicable to high-stakes domains (health, education, agriculture, law)

## Description

The LISTED framework is a structured analytical and design tool for building culturally aligned AI systems in non-Western, multilingual, and high-stakes contexts. It identifies six cross-cutting factors that shape whether an AI system can be built, deployed, and sustained effectively:

- **L — Language:** The target language's script, dialect variation, morphological complexity, and resource availability. Low-resource languages often lack model support and require dedicated in-weight (fine-tuning, continued pre-training) or in-context (glossaries, prompt engineering) adaptations. Geographic and sub-regional dialects introduce granularity that generic regional models cannot capture.
- **I — Institution:** The organizational, policy, and governance context in which the system operates. Institutional alignment — compliance with government formats, embedding institutional knowledge, fitting into existing workflows — is a prerequisite for adoption, not an optional enhancement. AI strengthens existing institutional capacity but cannot substitute for missing foundations.
- **S — Safety:** Harm categories are culturally and institutionally specific. Generic content moderation misses local taboos, caste- and gender-based biases, and metaphorical expressions for sensitive topics (e.g., suicide prevention across languages). Safety requires human oversight at two points: before inputs reach the model (classifiers, guardrails) and during output processing (human-in-the-loop review).
- **T — Task:** The specific application (Q&A, summarization, translation, reading assessment, legal drafting) imposes hard technical constraints — latency, modality, output format — that override architectural preferences. Task requirements must be specified before model selection; the same language handled differently depending on whether the goal is fluency (chatbot) or error preservation (reading assessment).
- **E — End-User Demography:** Literacy level, age, income, digital access, and cultural identity of intended users shape both content relevance and interaction modality. Voice interfaces are frequently necessary for low-literacy users in languages where LLM-generated text exists but ASR does not. Gender, age, and geography introduce vocabulary and cultural reference variation that hyper-local, fine-grained adaptation cannot fully encode at scale.
- **D — Domain:** Subject matter (health, legal, education, agriculture, cultural heritage) determines what counts as correct or trustworthy. Domain experts are not intermediaries but essential collaborators throughout — they curate knowledge bases, define harm in local terms, catch retrieval errors invisible to AI developers, and maintain the pipeline over time.

The six LISTED factors are shaped by three higher-level influences:
- **Sociocultural:** Diversity, practices, and community trust dynamics
- **Institutional:** Resources, policies, and governance structures
- **Technological:** Capabilities and limits of available AI infrastructure

The paper derives 12 actionable design guidelines organized by these three influences (see How to Apply). The central empirical finding across 8 deployments in 7 countries and 18 languages is that **human expert labor is the binding constraint**, not technical model performance. Technical adaptation (fine-tuning, prompting, RAG) is tractable; identifying what "culturally appropriate" means requires irreplaceable human expertise.

## When to Use

- Before scoping any AI system intended for a non-Western, multilingual, or low-resource community
- When diagnosing why a deployed system is failing to achieve adoption or safe outcomes
- When auditing an existing system for cultural alignment gaps
- When deciding whether to invest in in-context (prompt engineering, RAG, glossaries) vs. in-weight (fine-tuning, continued pre-training) adaptations
- When planning human-in-the-loop workflows and staffing requirements

## How to Apply

**Step 1 — Characterize each LISTED dimension for your specific deployment.**

For each dimension, document: what the current state is, what gaps exist, and what human expertise is required to close them.

| Dimension | Questions to answer |
|---|---|
| Language | What script? Which dialects? What model support exists? What is the morphological complexity? |
| Institution | Who governs the domain? What formats and policies must outputs comply with? What institutional partnerships are needed for trust? |
| Safety | What counts as harmful in this community? What are cultural taboos? What dual risks exist (over-blocking vs. harmful outputs)? |
| Task | What exact function does the system perform? What latency, modality, and format constraints does that impose? |
| End-User Demography | What are literacy levels, digital access, age distribution, and cultural reference frames of real users? |
| Domain | What domain knowledge is required? Who are the domain experts? How will knowledge bases be maintained? |

**Step 2 — Identify the binding human labor constraints.**

For each dimension with a gap, determine: (a) whether it can be addressed in-context (cheaper, faster) or requires in-weight adaptation (slower, more resource-intensive), and (b) what ongoing human effort the solution requires. Budget for ongoing curation, not one-time fixes.

**Step 3 — Select adaptation strategies matched to institutional capacity.**

In-context methods (prompt engineering, RAG, glossaries) are appropriate when institutional capacity is limited or uncertain. In-weight methods (fine-tuning, continued pre-training, model training) are appropriate only when institutions can sustain the infrastructure and staffing required. The paper documents that in-context approaches often precede in-weight investments as capacity grows.

**Step 4 — Apply the 12 design guidelines.**

Organized by influence type:

*Sociocultural:*
- G1: AI developers and local domain experts must collaborate as equal partners throughout the full lifecycle — not just at requirements or handoff stages.
- G2: Dedicate explicit effort to linguistic and cultural gaps in low-resource contexts; baseline model performance will be poor and foundational work is required before domain refinement.
- G3: In multilingual communities, dominant shared languages can provide workable alternatives to unsupported local languages — adapt the dominant language with local glossaries and phrasing rather than attempting full modeling of an unsupported language.
- G4: Community trust must be actively designed for, addressing both skepticism and over-reliance; trust is built through institutional branding, on-ground champions, and demonstrated accuracy on locally relevant content.

*Institutional:*
- G5: Compliance with institutional mandates and workflows is non-negotiable for adoption; outputs must match prescribed formats and align with existing professional practices.
- G6: AI strengthens existing institutional capacities but cannot substitute for missing foundations; only deploy where basic infrastructure and staffing already exist.
- G7: Sustainable deployment requires continuous institutional commitment — language support, knowledge base curation, and safety oversight are ongoing costs, not one-time investments.
- G8: Institutional capacity shapes depth of adaptation; start with in-context methods and move to in-weight only as capacity is confirmed.

*Technological:*
- G9: Design for flexibility and modular replacement of model components; AI capabilities evolve rapidly and rigid architectures become liabilities.
- G10: Deploy at small scale first — many AI failures only surface when real users with long-tail inputs, community-specific references, and domain nuances interact with the system; laboratory testing is insufficient.
- G11: Develop localized evaluation methods; standard benchmarks reflect Western assumptions and miss failures that matter locally (domain terminology accuracy, cultural reference appropriateness, dialect coverage).
- G12: Effective safety combines lightweight triage classifiers, frontier LLMs for general reasoning, and human oversight — no single component is sufficient in multilingual, high-stakes settings.

**Step 5 — Monitor and iterate.**

Build feedback loops: daily logs reviewed by domain experts, field staff feedback channels, user feedback mechanisms. Language support requires periodic updating as dialects evolve, new gaps surface, and user demographics shift.

## Pseudocode

```
LISTED_audit(deployment_context):

  # Step 1: Characterize all six dimensions
  gaps = {}
  for dimension in [Language, Institution, Safety, Task, EndUserDemography, Domain]:
    gaps[dimension] = characterize_gaps(deployment_context, dimension)
  
  # Step 2: Identify human labor requirements
  for dimension, gap_list in gaps.items():
    for gap in gap_list:
      gap.adaptation_type = classify(gap, options=["in-context", "in-weight"])
      gap.ongoing_labor = estimate_human_effort(gap)
      gap.institutional_feasibility = assess_capacity(deployment_context.institution, gap)
  
  # Step 3: Select adaptation strategies
  strategy_plan = []
  for gap in all_gaps:
    if gap.institutional_feasibility == "low" or gap.adaptation_type == "in-context":
      strategy_plan.append(InContextAdaptation(gap))  # prompt eng, RAG, glossary
    else:
      strategy_plan.append(InWeightAdaptation(gap))   # fine-tuning, pre-training
  
  # Step 4: Apply guidelines
  for guideline in G1_through_G12:
    audit_compliance(deployment_context, guideline)
    flag_violations(deployment_context, guideline)
  
  # Step 5: Build feedback loops
  monitoring_plan = DesignFeedbackLoops(
    domain_expert_review=daily_logs,
    field_staff_channels=True,
    localized_evaluation=True,
    small_scale_pilot_first=True
  )
  
  return strategy_plan, monitoring_plan
```

## Evidence

**Deployment breadth:** 8 real-world AI systems across 7 countries (India, Bangladesh, Colombia, Kenya, Ethiopia, Nigeria, Ghana), 18 languages, 4 domains (education, healthcare, agriculture, law). Projects ranged from &lt;500 to ~350,000 users. 17 interviews with AI developers and domain experts.

**Human labor as the binding constraint:** Across all 8 deployments, human expert labor — translators, cultural consultants, domain validators, field staff — was more consistently cited as the limiting factor than technical model performance. Quote from P16: "Fine-tuning itself is not the difficult part. Around 80% of the effort goes into preparing and collecting the data."

**Safety dimension specificity:** PROMPTS (maternal health, Ghana/Kenya/Nigeria) required 100,000 manually annotated messages to train a safety classifier because off-the-shelf classifiers consistently failed in code-mixed vernacular-English inputs. P4: "Security vulnerabilities are hard to manage in multilingual contexts... the problem is especially visible in areas like suicide prevention, where cultural differences and metaphorical language make detection more difficult."

**In-context before in-weight:** Projects with limited institutional capacity used prompt engineering and RAG first; FarmerChat (Ethiopia/India/Kenya) and PROMPTS were able to move to in-weight adaptations only because they had organizational infrastructure to support ongoing annotation and model maintenance.

**Small-scale deployment value (G10):** FarmerChat's early STT deployments revealed that the model mis-transcribed similar-sounding agricultural words — errors only detectable with real accents and domain vocabulary, not laboratory testing.

**Localized evaluation (G11):** FarmerChat developed gold-standard transcripts to assess agricultural terminology accuracy (crop names, pests, diseases, units, numerals) because standard ASR metrics did not capture domain-critical failures.

## Variations & Configuration

**High-resource vs. low-resource language split:** When the target community speaks both an unsupported local language and a dominant regional language (e.g., Bhojpuri + Hindi in Bihar), teams can apply in-context adaptation to the dominant language rather than building full support for the unsupported language. FarmerChat used Bhojpuri glossaries to map terms into Hindi before processing — effective and cheaper than training a Bhojpuri model.

**Delegation-based safety (G12 variant):** PROMPTS used a classifier to route non-medical queries to an LLM and high-risk/medical queries to a human help desk. This hybrid division of labor matches system capabilities to query types while ensuring human capacity for critical interactions.

**Layered human-in-the-loop (education):** Shiksha Copilot used a two-layer HIL process — AI developers + teachers curated lesson plans, then classroom teachers made hyper-local adaptations. This division captures both quality assurance and fine-grained local contextualization.

## Code & Tools

No single software tool implements LISTED. Key components used across deployments:
- **RAG:** Used by VetBot, FarmerChat, CataractBot, ASHABot, Shiksha Copilot for knowledge grounding
- **Safety classifiers:** RoBERTa-based intent classifiers (PROMPTS); prompt guardrails (ASHABot, VetBot)
- **Glossary integration:** BabelNet-style word-level alignment; manually curated domain glossaries (FarmerChat Bhojpuri, ASHABot health terms)
- **Evaluation:** FarmerChat gold-standard transcripts; user feedback logs; domain expert review cycles

## Strengths & Weaknesses

| Strengths | Weaknesses |
|---|---|
| Grounded in 8 real-world deployments across 4 domains and 18 languages — not theoretical | Sample of 8 deployments is small; all are from South Asia and sub-Saharan Africa; generalizability to other regions untested |
| Identifies human labor as the binding constraint — prevents over-investment in technical solutions | Framework is descriptive and analytical; does not specify how to trade off between LISTED dimensions when they conflict |
| 12 guidelines are actionable and grounded in specific failure cases, not abstract principles | Does not specifically address Indigenous language contexts or decolonial considerations; "Institution" dimension may not capture sovereignty and self-determination |
| Distinguishes in-context vs. in-weight adaptations and links them to institutional capacity — directly actionable | Most deployments studied were NGO-implemented with technology company partners; community-governed contexts (e.g., Indigenous band councils) are not represented |
| G10 (small-scale deployment) and G11 (localized evaluation) fill gaps not addressed in most technical ML literature | Published CHI 2026 — very recent, not yet widely tested or critiqued |

## References

- Dennison, D.V., Jain, M., Ganu, T., & Vashistha, A. (2026). Designing Culturally Aligned AI Systems For Social Good in Non-Western Contexts. *CHI '26*. https://doi.org/10.1145/3772318.3791513
- Related: Brinklow (2021) on responsive/responsible ILT design; Bird et al. (2020) on decolonising NLP; Cooper et al. (2024) on cyclical engagement; Liu et al. (2022) on community needs

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The five-step process (characterize dimensions, identify labor constraints, select adaptation strategies, apply 12 guidelines, monitor) is concrete and self-contained. The dimension table with specific questions to answer and the G1–G12 guidelines give enough scaffolding to run an audit without the paper. The pseudocode mirrors the steps faithfully.

    **Criterion 2 — Empirical results with numbers:** PASS — 8 deployments, 7 countries, 18 languages, 4 domains, 17 interviews, project scales from &lt;500 to ~350,000 users all named. The PROMPTS 100,000-annotation figure and the P16 quote ("80% of effort goes into data preparation") are concrete. FarmerChat agricultural-vocabulary evaluation and Bhojpuri glossary approach are also cited with specifics.

    **Criterion 3 — Data regime / context clarity:** PASS — Explicitly stated: "Any — applies before and during deployment regardless of data availability." Target contexts (non-Western, multilingual, low-resource, high-stakes) are well-specified, and the Strengths/Weaknesses table honestly notes the sample is limited to South Asia and sub-Saharan Africa with no Indigenous or community-governed context representation.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The pseudocode captures the overall audit loop but calls opaque helper functions (`characterize_gaps`, `classify`, `estimate_human_effort`, `assess_capacity`) without defining them. The G1–G12 audit step is represented as a single loop over guidelines with no detail. Acceptable for a process framework (not an algorithm), but a practitioner would need the text description alongside the code.

    **Criterion 5 — Failure modes:** PASS — The Strengths/Weaknesses table is substantive. Documented failures include: small/geographically-limited sample, no conflict-resolution between dimensions, absence of Indigenous/community-governed contexts, NGO-partner bias, and the framework being descriptive rather than prescriptive for trade-off decisions. G10 (small-scale first) and G11 (localized evaluation) implicitly document failure modes of large-scale premature deployment and Western benchmark reliance.

    **Overall:** Strong doc. The main gap is in the pseudocode: the helper functions are placeholders rather than specifications. Practitioners using this as a standalone reference would benefit from a worked example showing how to score or document a single dimension gap.

