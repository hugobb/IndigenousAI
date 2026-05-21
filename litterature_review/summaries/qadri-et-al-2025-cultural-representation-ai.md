# The Case for "Thick Evaluations" of Cultural Representation in AI

**Citation:** Qadri, R., Díaz, M., Wang, D., & Madaio, M. (2025). The Case for "Thick Evaluations" of Cultural Representation in AI. In *Proceedings of the 2025 AAAI/ACM Conference on AI, Ethics, and Society (AIES 2025)*, pages 2067–2080.

---

## Core Argument

Current AI evaluations of cultural representation are "thin" — they are positivist, quantitative, and Western-centric, treating culture as a static, objective ground truth that can be measured by accuracy on multiple-choice benchmarks. Drawing on Ryle's and Geertz's anthropological concept of "thick description," the authors argue for "thick evaluations": participatory, contextually grounded, discursive assessments that treat cultural representation as situated, dynamic, and negotiated. These evaluations require lived cultural knowledge and genuine co-construction with the communities being represented.

---

## Key Concepts

- **Thin evaluations:** Positivist benchmarks that measure cultural representation through accuracy metrics, MCQs, or factual recall. Assume a single correct answer exists and can be determined externally. Reproduce the WEIRD bias of training data.
- **Thick evaluations:** Evaluations grounded in anthropological thick description (Ryle/Geertz) — interpret cultural behavior and representation within its full social, historical, and relational context. Require insider cultural knowledge and participatory co-construction.
- **Five dimensions of cultural representation:**
  1. *Incorrectness* — factually wrong or culturally inaccurate outputs
  2. *Missingness* — important cultural elements absent from outputs
  3. *Specificity* — overly generic outputs that fail to capture particular cultural nuance
  4. *Coherence* — internally contradictory or contextually inconsistent cultural portrayal
  5. *Connotation* — outputs that carry unintended, harmful, or stereotyped cultural associations
- **Situated knowledge:** Cultural representation goals are not universal; what counts as "good" representation depends on who is asking, for what purpose, and from what social position.
- **Participatory workshops:** The authors conducted three in-person workshops with 37 participants in Sri Lanka, Pakistan, and India to surface what "good" cultural representation meant to participants — findings shaped the thick evaluation framework.
- **Discourse as evaluation:** Evaluation is not a one-time measurement but an ongoing, negotiated dialogue between AI developers and cultural communities.

---

## Main Findings

- Participants across three South Asian workshop sites disagreed significantly on what "correct" cultural representation looked like — even within a single country, culture is contested and context-dependent.
- Standard benchmark metrics (accuracy, recall) failed to capture the dimensions participants cared most about: missingness (what was left out) and connotation (harmful associations).
- Participants identified "coherence" failures as particularly damaging — models that mixed cultural elements across different South Asian contexts in ways that flattened regional distinctions.
- The research found that representation goals are dynamic: what communities want from AI representation changes over time, with generational shifts, diaspora contexts, and political circumstances.
- Thin evaluation formats (MCQ, human-in-the-loop accuracy scoring) reproducibly miss the social and political stakes of representation — they can rate an output as "correct" while participants experience it as harmful or reductive.
- Thick evaluations require significant community engagement investment; the authors acknowledge this is a higher-cost approach but argue it is necessary for evaluations that matter.

---

## Relevance to Indigenous AI

This paper may be the single most directly applicable theoretical framework for the Indigenous AI project:

1. **Epistemic sovereignty:** The thick evaluations framework operationalizes Indigenous data sovereignty principles — evaluation criteria should be set by communities, not imposed by external researchers. This maps directly to OCAP and CARE principles.
2. **Five dimensions for Mohawk evaluation:** The incorrectness/missingness/specificity/coherence/connotation framework can structure what "good" AI representation of Mohawk language and culture looks like — particularly missingness (language endangerment means gaps are culturally significant) and connotation (colonial history means harmful associations are pervasive).
3. **Against benchmarks as endpoints:** The paper validates the concern that accuracy on NLP benchmarks is insufficient for Indigenous language AI — it provides theoretical grounding for why community-defined evaluation must accompany technical metrics.
4. **Participatory methodology:** The workshop methodology (in-person, community-situated, facilitated discussion) is directly adaptable to engagement with Mohawk community members and language keepers.
5. **Dynamic representation goals:** Particularly relevant for endangered languages undergoing revitalization — representation goals shift as communities reclaim and redefine their language; evaluation frameworks must accommodate this.
6. **Missingness as a key dimension:** For an endangered language, what the model does *not* know or *cannot* say may be more important than what it says incorrectly — thick evaluations are designed to surface this.

---

## Limitations & Critiques

- The three workshop sites (Sri Lanka, Pakistan, India) are all South Asian and English-literate urban populations; findings may not generalize to communities with very different relationships to technology, literacy, or formal participation frameworks.
- "Thick evaluations" is presented as a framework but not yet operationalized as a replicable methodology — it is more a critique of thin evaluations than a complete alternative.
- The paper does not address the scalability problem: thin evaluations are fast and cheap; thick evaluations require deep community engagement. The authors acknowledge this tension but do not resolve it.
- Power dynamics within workshops are not fully addressed — who speaks in facilitated discussions, whose interpretations are recorded, and how disagreements are resolved all shape outcomes.
- The paper is written by Google Research authors; there is a potential tension between advocating for community-controlled evaluation and the interests of large AI companies deploying these systems.

---

## Questions & Follow-ups

- How can the five-dimension framework be adapted for oral/aural evaluation contexts where Indigenous language outputs may be spoken rather than written?
- What does the "discourse as evaluation" model look like institutionally — who facilitates, how often, what is the decision-making structure for updating evaluation criteria?
- How does thick evaluation interact with technical model development timelines? At what stage(s) of development should thick evaluation occur?
- Are there existing examples of thick evaluation applied specifically to Indigenous language AI, or is this paper primarily drawing from South Asian postcolonial contexts?
- How should conflicts between different community members' evaluation judgments be handled — is there a methodology for navigating internal disagreement about what "good" representation means?
