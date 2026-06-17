
# Realist Evaluation Framework

**Category:** Process & Methodology Technique
**Data Regime:** any
**Applicable Languages:** Any Indigenous or low-resource language project where technology is being evaluated for impact

## Description

Realist Evaluation is an evaluation methodology that asks not "did the intervention work?" but "what mechanisms produced what outcomes in what contexts?" It shifts the evaluation question from a binary pass/fail on system metrics (BLEU score, word error rate, accuracy) to a nuanced understanding of how a technology interacts with community realities to produce (or fail to produce) change.

Applied to language technology, realist evaluation requires defining:

- **Mechanisms:** The causal pathways through which the technology is supposed to produce change (e.g., "if children can hear elder stories on demand via an audio archive, they will encounter the language outside of classroom hours, increasing exposure").
- **Contexts:** The specific conditions that must be present for the mechanism to fire (e.g., children must have devices, elders must consent to being recorded, families must value the archive).
- **Outcomes:** What changes in the world as a result — specified in community terms, not system performance terms (e.g., "children initiate conversations in the language without prompting").

Bird (2020) extends realist evaluation to include accountability metrics that NLP researchers typically ignore: how much project funding reaches Indigenous participants; whether products are locally sustainable after researcher departure; whether local voices are elevated in publications and presentations; whether the community's capability to evaluate and direct technology has expanded.

The framework is distinct from standard NLP evaluation in that a system can achieve high performance metrics and still fail realist evaluation (e.g., a perfect ASR system nobody uses because it doesn't address a community priority), and a technically imperfect tool can pass realist evaluation (e.g., a rough chatbot that motivates teenagers to text in their language daily).

## When to Use

- When evaluating the impact of any language technology deployed with or for an Indigenous community.
- When designing a new project and needing to specify what success looks like before building.
- When writing grants or reporting to funders — to shift evaluation criteria from system performance to community benefit.
- When assessing whether a prior project delivered genuine value or only academic outputs.

**Less applicable when:**
- Evaluating a component in isolation (e.g., comparing tokenizer variants on a benchmark) — standard ML metrics are appropriate for component-level evaluation; realist evaluation applies at the deployment/impact level.

## How to Apply

1. **Define the theory of change.** For each project outcome, write a CMO (Context-Mechanism-Outcome) triplet: "In context C, mechanism M will produce outcome O." Example: "In a context where Six Nations families have smartphones and value intergenerational language connection [C], providing a short-form audio archive of elder stories [M] will increase the frequency of language exposure for children under 10 [O]."

2. **Identify testable predictions.** Each CMO generates testable predictions: "If the mechanism is operating, we should observe X." Keep predictions in community-observable terms, not system logs.

3. **Collect evidence on all three components.** Do not only measure outcomes. Also assess: Is the context present as assumed? Is the mechanism actually operating as designed? If outcomes are not observed, was it a context failure (wrong conditions) or a mechanism failure (wrong causal pathway)?

4. **Add Bird's accountability metrics.** For every project, track:
   - Proportion of project budget that reached Indigenous participants as wages, stipends, or community benefit
   - Local sustainability: can the community maintain/extend the technology without the research team?
   - Voice: are Indigenous contributors credited as authors, not just "consultants" or "data sources"?
   - Capability expansion: has the community's ability to direct future technology projects increased?

5. **Report realist evaluation results alongside technical metrics.** Publish CMO findings, not just benchmark scores. If the context was wrong, say so. This is more useful to the field than inflated claims of system success.

6. **Conduct mid-project realist review.** At project midpoint, revisit CMO triplets: are contexts still holding? Are mechanisms firing? Adjust scope based on evidence, not only on system performance milestones.

## Pseudocode

```
procedure RealistEvaluation(project):
    cmo_triplets = []
    accountability_metrics = {}

    // Step 1: Define theory of change
    for each intended_outcome in project.outcomes:
        context = specify_required_conditions(intended_outcome)
        mechanism = specify_causal_pathway(context, intended_outcome)
        cmo = CMO(context, mechanism, intended_outcome)
        cmo_triplets.append(cmo)

    // Step 2: Generate testable predictions
    for cmo in cmo_triplets:
        predictions = cmo.derive_observable_predictions()  // community-level, not system logs

    // Step 3: Collect multi-component evidence
    for cmo in cmo_triplets:
        context_present = assess(cmo.context)
        mechanism_operating = assess(cmo.mechanism)
        outcome_observed = assess(cmo.outcome)

        if outcome_observed == False:
            if context_present == False:
                diagnosis = "CONTEXT FAILURE — wrong conditions assumed"
            elif mechanism_operating == False:
                diagnosis = "MECHANISM FAILURE — causal pathway wrong"
            else:
                diagnosis = "OUTCOME FAILURE — mechanism present but insufficient"

    // Step 4: Accountability metrics
    accountability_metrics['indigenous_budget_share'] = budget_to_indigenous_participants / total_budget
    accountability_metrics['local_sustainability'] = can_community_maintain_without_team()
    accountability_metrics['voice'] = count_indigenous_authors(publications) / count_total_authors(publications)
    accountability_metrics['capability_expansion'] = community_can_direct_future_projects()

    return cmo_triplets, accountability_metrics
```

## Evidence

Bird (2020) argues from the 25-year empirical record of language technology for endangered communities: high-performing NLP systems (by internal metrics) have not demonstrably contributed to language revitalization, suggesting that system performance is not the relevant evaluation criterion. Realist evaluation is proposed as the corrective framework.

The realist evaluation framework itself originates in social science (Pawson & Tilley 1997) and has been applied to health, education, and development interventions. Its utility in community technology contexts has been documented in adjacent fields: development technology evaluations that tracked CMO rather than output metrics showed higher predictive validity for long-term sustained use.

Bird's accountability metrics (budget share, sustainability, voice, capability) have no published quantitative thresholds, but operationalize the standard from UNDRIP Article 18 and OCAP principles (Ownership, Control, Access, Possession) into project-level indicators that can be audited.

## Variations & Configuration

- **Prospective version:** Use CMO triplets during project design to stress-test assumptions before building anything. Present CMOs to community members for validation — they will often correct wrong context assumptions immediately.
- **Retrospective version:** Apply realist evaluation to completed projects to understand why technology was or was not used. More useful than attribution of success/failure to system quality alone.
- **Rapid CMO:** When time is limited, construct a single CMO for the project's primary outcome. Even one CMO shifts evaluation from "did it work?" to "why / why not?"
- **Funder reporting variant:** Translate accountability metrics (budget share, sustainability, voice) into grant report KPIs. Some funders (e.g., SSHRC, CIHR Indigenous Research Support) now accept or prefer these metrics over citation counts.

## Code & Tools

- Pawson, R., & Tilley, N. (1997). *Realistic Evaluation*. SAGE Publications. — Full methodological foundation.
- CMO worksheet template: available from the RAMESES (Realist And Meta-narrative Evidence Syntheses) project at ramesesproject.org.
- OCAP principles (First Nations Information Governance Centre): fnigc.ca/ocap-principles — complementary accountability framework for Indigenous data.
- CARE Principles for Indigenous Data Governance: gida-global.org — collective benefit, authority to control, responsibility, ethics.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Surfaces context failures (wrong assumptions) that system metrics cannot detect | Requires more evaluation effort than reporting a benchmark score |
| Produces actionable diagnostics: context failure vs. mechanism failure vs. outcome failure | CMO triplets require clear theory of change, which many projects lack |
| Accountability metrics make power dynamics in projects visible and auditable | Indigenous budget share and capability metrics are unfamiliar to most ML reviewers |
| Applicable to prospective design and retrospective audit | No validated thresholds exist for accountability metrics |
| Aligns evaluation with community benefit, not researcher career incentives | Findings of context or mechanism failure are hard to publish in venues expecting positive results |

## References

- Bird, S. (2020). Decolonising Speech and Language Technology. *Proceedings of COLING 2020*, pages 3504–3519.
- Pawson, R., & Tilley, N. (1997). *Realistic Evaluation*. SAGE Publications.
- First Nations Information Governance Centre. OCAP Principles. fnigc.ca/ocap-principles.
- CARE Principles for Indigenous Data Governance. Global Indigenous Data Alliance. gida-global.org.
- Walter, M., & Suina, M. (2019). Indigenous data, indigenous methodologies and indigenous data sovereignty. *International Journal of Social Research Methodology*, 22(3), 233–243.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The 6-step procedure walks through defining CMO triplets, generating testable predictions, collecting multi-component evidence, applying accountability metrics, reporting alongside technical metrics, and conducting mid-project review. The worked CMO example ("Six Nations families with smartphones … elder stories archive … frequency of language exposure for children under 10") is concrete enough to imitate without reading Pawson & Tilley.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — Bird's 25-year empirical record is invoked qualitatively. The claim that "development technology evaluations that tracked CMO rather than output metrics showed higher predictive validity for long-term sustained use" is asserted without a specific citation or effect size. The accountability metrics section explicitly notes that no published quantitative thresholds exist, which is honest but means the framework lacks empirical calibration points a practitioner can use to benchmark against.

    **Criterion 3 — Applicable context clarity:** PASS — The "When to Use" section covers four scenarios (impact evaluation, prospective success definition, grant reporting, retrospective audit). The "Less applicable when" carve-out for component-level evaluation (tokenizer benchmarks, etc.) is precise and important.

    **Criterion 4 — Pseudocode/flowchart completeness:** PASS — The pseudocode covers all six steps including the three-way diagnostic branching (context failure / mechanism failure / outcome failure) and the four accountability metrics with explicit formulas. The logic is unambiguous and directly maps to the prose procedure.

    **Criterion 5 — Failure modes:** PARTIAL — The Strengths & Weaknesses table mentions "CMO triplets require clear theory of change, which many projects lack" and "no validated thresholds exist for accountability metrics." These are important but framed as weaknesses rather than failure modes. Missing: what happens when the CMO is constructed post-hoc to justify a project already underway (rationalization risk); when contexts shift during the project invalidating original triplets without a mid-project review; or when community-observable outcome measures are unavailable due to access constraints.

    **Overall:** The strongest of the three process-technique entries in terms of pseudocode completeness and implementability. The main gap is empirical: the claim about CMO tracking producing higher predictive validity for sustained use needs a citation. A short failure-mode section covering post-hoc rationalization and context drift would make the entry more robust.

