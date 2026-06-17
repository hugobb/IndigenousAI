
# Human-in-the-Loop AI Safety Workflows

**Category:** Process & Methodology Technique
**Data Regime:** Any — applies at deployment regardless of training data regime
**Applicable Languages:** All low-resource, multilingual, and high-stakes language contexts; especially relevant where off-the-shelf safety models fail on non-English or code-mixed inputs

## Description

Human-in-the-loop (HIL) AI safety workflows are structured processes that route model outputs — especially high-impact, uncertain, or culturally sensitive ones — to human experts for review, correction, or confirmation before delivery to end users. In multilingual, non-Western, and high-stakes deployments, automated safety mechanisms systematically fail because:

1. Generic content moderation classifiers are trained primarily on English and miss harmful content expressed in metaphor, code-switching, or culturally specific framing.
2. Domain errors in low-resource languages (agricultural terms, medical protocols, legal vocabulary) are invisible to general-purpose models.
3. Cultural taboos, locally-defined harm categories, and contextual appropriateness cannot be fully encoded in static guardrails.

HIL workflows address these failures not by replacing automation but by combining three complementary layers:
- **Lightweight classifiers** (low latency, high volume) for triage and routing
- **LLM-based validation agents** for reviewing outputs against guidelines
- **Human domain experts** for final judgment in high-stakes or uncertain cases

The design of HIL workflows must be matched to domain-specific risk, institutional capacity, and timing constraints. The same approach that works for healthcare (synchronous doctor review) cannot be applied to agriculture chatbots serving 15,000 farmers expecting real-time responses.

## When to Use

- When deploying AI in high-stakes domains (health, legal, child education, cultural heritage) where errors have real-world consequences
- When the target language lacks adequate off-the-shelf safety classifiers
- When outputs will be consumed by vulnerable populations (patients, children, low-income users)
- When cultural harm categories cannot be specified fully in advance or vary by region
- When code-mixed or multilingual inputs are expected (safety classifiers routinely fail on these)
- When institutional accountability demands human sign-off (legal translations, medical advice)

## How to Apply

**Step 1 — Classify queries by risk level.**

Design a lightweight classifier (can be a simple rule-based system, a fine-tuned small model, or an LLM with structured prompting) that assigns each incoming query to a risk tier:
- **Low risk:** Handled by main AI pipeline without HIL
- **Medium risk:** LLM validation agent reviews output before delivery
- **High risk / urgent:** Routed to human expert; AI response withheld or marked as pending

The risk classification schema must be designed with local domain experts, not imported from generic safety frameworks. What counts as "urgent" in maternal health (PROMPTS: symptoms indicating medical emergency) differs from what counts as "sensitive" in agriculture (practices the local government prohibits).

**Step 2 — Train the classifier on locally-annotated data.**

Off-the-shelf intent classifiers will fail on code-mixed multilingual inputs. Collect and manually annotate a corpus of real user queries from the deployment context. Key guidance:
- Prioritize queries that involve the local language mixed with a dominant language (e.g., Swahili + English, Hindi + English)
- Include domain-specific expressions that generic models misclassify (agricultural terminology, health worker jargon, cultural references)
- Budget for 50,000–100,000 annotated messages before classifier performance is reliable at scale (PROMPTS required ~100,000 annotations for a RoBERTa-based classifier)

**Step 3 — Design the human review workflow matched to institutional capacity.**

Choose a HIL workflow pattern based on domain stakes and timing constraints:

| Pattern | Description | When to use |
|---|---|---|
| Synchronous expert review | Every output reviewed by a qualified human before delivery; user is informed of delay | Medical contexts where accuracy outweighs latency (CataractBot: every message reviewed by doctors) |
| Delegation-based routing | Non-medical/low-risk queries handled by LLM; high-risk queries routed to human help desk | Mixed-risk domains where human capacity is limited (PROMPTS: medical queries to human helpdesk, general queries to LLM) |
| Asynchronous expert curation | Experts review logs and flag errors; model is corrected in subsequent versions | Contexts where some error tolerance is acceptable (FarmerChat: daily logs reviewed, model updated periodically) |
| Crowdsourced local knowledge | Multiple local knowledge holders respond; LLM synthesizes into single answer | When no single certified expert is available; local knowledge is distributed (ASHABot: local experts via WhatsApp, LLM synthesis) |
| Layered review (education) | AI drafts; domain experts curate; end users finalize with hyper-local adaptation | Educational content requiring both quality control and local contextualization (Shiksha Copilot: teacher curation + classroom teacher adaptation) |

**Step 4 — Integrate LLM validation agents for medium-risk outputs.**

Before delivering outputs that pass the classifier threshold but require quality checks, run a secondary LLM agent that:
- Checks for compliance with institutional guidelines (prescribed formats, prohibited advice)
- Flags culturally inappropriate examples or references
- Verifies domain-specific accuracy against the knowledge base

Validation agents must be given explicit examples of acceptable and unacceptable outputs from the local domain — do not rely on the model's general knowledge of "appropriate" content.

**Step 5 — Manage latency and user expectation.**

HIL workflows introduce latency. Mitigate user experience degradation by:
- Setting user expectations upfront ("responses will arrive within X minutes after review")
- Using visual trust indicators (CataractBot: responses marked with a badge indicating doctor review)
- Designing AI to acknowledge when it does not have an answer rather than generating low-confidence outputs
- For voice-first applications: use audio cues or status messages rather than making users wait silently

**Step 6 — Build accountability and feedback loops.**

- Log all human overrides and corrections; use these to update the classifier and model
- Track override rates by language, domain, and query type — high override rates in specific categories signal systematic model failures
- In legal contexts, include explicit disclaimers about AI-generated content legal standing (LegalTranslateAI: judgments carried disclaimers noting translations had no legal standing)

## Pseudocode

```
HIL_workflow(user_query, context):
  
  # Step 1: Risk classification
  risk_tier = classifier.predict(user_query, language=context.language)
  # classifier trained on locally-annotated data (50k-100k examples)
  
  if risk_tier == "HIGH":
    notify_human_expert(user_query, context)
    response = await human_expert_response(timeout=context.max_response_time)
    log_to_oversight_system(user_query, response, tier="HIGH")
    return response
  
  # Step 2: AI response generation
  ai_response = main_pipeline.generate(user_query, context)
  
  if risk_tier == "MEDIUM":
    # Step 3: LLM validation agent review
    validation_result = validation_agent.review(
      query=user_query,
      response=ai_response,
      guidelines=context.domain_guidelines,
      cultural_constraints=context.cultural_constraints
    )
    if validation_result.flagged:
      if context.has_available_expert:
        return await human_expert_review(ai_response, validation_result.flags)
      else:
        return safe_fallback_response(context)  # e.g., "Please consult a professional"
  
  # Step 4: Deliver response
  log_to_oversight_system(user_query, ai_response, tier=risk_tier)
  return ai_response


# Feedback loop (runs asynchronously)
def daily_oversight_review(logs):
  for entry in logs.filter(tier__in=["MEDIUM", "HIGH"]):
    domain_expert.review(entry)
    if entry.was_overridden:
      training_queue.add(entry)  # feed back into classifier retraining
  
  override_rate = compute_override_rate(logs)
  if override_rate > threshold:
    alert_team("Systematic model failure detected — review domain coverage")
```

## Evidence

**PROMPTS (maternal health, Ghana/Kenya/Nigeria, ~1.1M SMS/month, 2023):**
- Trained a RoBERTa-based classifier on ~100,000 manually annotated messages to route sensitive/medical queries to human help desk
- Classifier was necessary because incoming messages were highly code-mixed (vernacular + English); off-the-shelf classifiers consistently failed
- Delegation-based routing: LLM handled non-medical queries, human help desk handled medical/urgent queries
- Result: System handled ~12,000 queries per day with ~80% routed to automated response, remaining 20% to human agents

**CataractBot (eye surgery, India, ~2,000 patients, 2024):**
- Every AI-generated response reviewed by doctors before delivery to patients
- Responses visually marked with "doctor reviewed" badge to build patient trust
- Doctors received daily email logs of all interactions, allowing them to spot systematic errors and request AI developer fixes
- Tradeoff: High accuracy and trust at cost of doctor time and response latency

**ASHABot (community health workers, India, ~5,000 workers, 2024):**
- Unanswered questions forwarded to local knowledge experts via WhatsApp
- LLM synthesized multiple expert responses into single answer
- Limitation: Health workers expected synchronous responses but experts were often unavailable; timing mismatch caused some workers to seek information elsewhere

**LegalTranslateAI (court judgments, Bangladesh/India, ~120,000 judgments, 2019):**
- Expert translators produced initial drafts using AI assistance
- All final judgments required judicial approval before release
- Disclaimers noted translations had no legal standing — accountability placed on human translators, not AI

**Broader pattern (across all 8 deployments):**
- No deployment achieved acceptable safety through automation alone
- All projects combined at least two of: classifiers, LLM validation, human oversight
- Human oversight was especially critical for new languages — Hausa outputs in PROMPTS were reviewed by helpdesk experts until developers gained confidence; Swahili-capable models could operate with less intensive oversight

## Variations & Configuration

**Low-capacity variant:** When no dedicated expert staff are available, use community knowledge holders and crowdsourced review with LLM synthesis (ASHABot pattern). Accept longer response times and lower precision, with explicit user communication about limitations.

**Real-time constraint variant:** For chatbots requiring sub-second responses, use only the lightweight classifier tier and defer human review to asynchronous log review. Use safe fallback responses ("I'm not sure — please consult a professional") rather than withholding responses, with daily log review to detect systematic failures.

**Legal accountability variant:** Reserve HIL for final output approval, not intermediate steps. Human expert is responsible for the final artifact; AI is a drafting tool. Include explicit disclaimers about AI involvement and the human's accountability for the output.

**Indigenous language variant:** For Indigenous language contexts where community protocols govern what knowledge can be shared and by whom, the HIL layer is also a cultural governance checkpoint — elders or knowledge keepers review outputs for protocol compliance, not just technical accuracy.

## Code & Tools

- **RoBERTa-based classifier (PROMPTS):** Fine-tuned on 100,000 annotated multilingual messages; code not publicly released but architecture described in Sahoo et al. (2025)
- **BeaverTails safety dataset:** Used by PROMPTS for adversarial pre-training; available at https://github.com/PKU-Alignment/beavertails
- **Whisper STT with manual cleaning:** Used by ReadAI for children's speech transcription with human evaluator correction
- **Generic RAG + human review pattern:** Described across VetBot, FarmerChat, CataractBot; implementable with LangChain, LlamaIndex, or similar RAG frameworks with added human-approval step

## Strengths & Weaknesses

| Strengths | Weaknesses |
|---|---|
| Addresses systematic failure modes of automated safety in multilingual contexts | Human oversight is expensive and does not scale linearly with user base; cost grows with deployment size |
| Grounded in real deployments across health, legal, education, and agriculture domains | Timeliness tradeoff: synchronous review introduces latency that can undermine adoption for real-time applications |
| Delegation-based routing efficiently allocates human capacity to highest-risk queries | Classifier training requires large locally-annotated datasets (50k–100k messages) that may not be available early in deployment |
| Adaptable to different institutional capacities — can begin with asynchronous log review and add real-time routing as capacity grows | Expert burnout risk: daily review of large log volumes can be unsustainable without dedicated staffing |
| Builds trust through visible human accountability (badges, disclaimers, doctor attribution) | Crowdsourced knowledge synthesis may introduce inconsistency if local experts have conflicting views |

## References

- Dennison, D.V., Jain, M., Ganu, T., & Vashistha, A. (2026). Designing Culturally Aligned AI Systems For Social Good in Non-Western Contexts. *CHI '26*. §4.3, §4.6.2. https://doi.org/10.1145/3772318.3791513
- Sahoo, P. et al. (2025). ASHABot: An LLM-Powered Chatbot to Support the Health Information Needs of Community Health Workers. arXiv:2409.10913
- Ramjee, P. et al. (2025). CataractBot: An LLM-Powered Expert-in-the-Loop Chatbot for Cataract Patients. arXiv:2402.04620
- Ji, J. et al. (2023). BeaverTails safety dataset. *NeurIPS 2023*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The six steps are concrete and actionable: risk tier classification, local annotation budget, workflow pattern selection (table with five named patterns), LLM validation agent design, latency/UX mitigations, and feedback-loop construction. The five workflow patterns (synchronous expert review, delegation-based routing, asynchronous curation, crowdsourced synthesis, layered review) give a practitioner a clear decision tree for choosing the right variant.

    **Criterion 2 — Empirical results with numbers:** PASS — All four key deployments include system-scale figures: PROMPTS (~1.1M SMS/month, ~100,000 annotations, ~12,000 queries/day, ~80% automated / 20% human); CataractBot (~2,000 patients); ASHABot (~5,000 workers); LegalTranslateAI (~120,000 judgments). The annotation budget range (50k–100k) is cited with a concrete source. The "no deployment achieved acceptable safety through automation alone" finding is stated as a cross-deployment pattern.

    **Criterion 3 — Data regime / context clarity:** PASS — "Any — applies at deployment regardless of training data regime" is explicit. The doc is honest that the classifier training step itself requires 50k–100k locally-annotated examples, which may not exist early in deployment — this tension is flagged both in Step 2 and in the Weaknesses table. The Indigenous language variant is specifically noted in Variations.

    **Criterion 4 — Pseudocode completeness:** PASS — The pseudocode is the strongest of the four docs reviewed. The main `HIL_workflow` function covers all three risk tiers with branching logic, expert routing, safe fallback, and logging. The `daily_oversight_review` async loop covers override tracking and retraining queue. The only opaque call is `safe_fallback_response` (reasonable to leave abstract) and `compute_override_rate` (trivially implementable).

    **Criterion 5 — Failure modes:** PASS — The Weaknesses table directly enumerates: linear cost scaling with user base, latency/adoption tradeoff, 50k–100k annotation requirement not available early, expert burnout from high log volumes, and inconsistency from crowdsourced synthesis. The ASHABot timing mismatch (synchronous expectation vs. asynchronous availability) is documented as a named real-world failure in the Evidence section.

    **Overall:** The strongest doc in the set. All five criteria are met. A minor gap: the LLM validation agent step (Step 4) does not specify how to construct the "explicit examples of acceptable and unacceptable outputs" — a brief worked example or template would make that step fully self-contained.

