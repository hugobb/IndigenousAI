# Whose Knowledge Counts? Co-Designing Community-Centered AI Auditing Tools with Educators in Hawai'i

**Authors:** Dora Zhao, Hannah Cha, Michael J Ryan, Angelina Wang, Rachel Baker-Ramos, Evyn-Bree Helekahi-Kaiwi, Rebecca Diego, Josiah Hester, Diyi Yang
**Year:** 2026
**Venue:** Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems (CHI '26), Barcelona, Spain
**Link:** https://doi.org/10.1145/3772318.3790958

---

## Core Argument

General-purpose AI auditing tools fail Indigenous and low-resource educational communities because they assume a universal, Western epistemology of what constitutes a "harm" and how knowledge should be verified. Through four co-design workshops with 22 public school educators in O'ahu, Hawai'i — where schools operate under a mandate to integrate Hawaiian language and culture — the authors surface five dimensions of cultural misrepresentation in LLM outputs and propose auditing practices grounded in Hawaiian values (notably, tracing the genealogy of knowledge rather than citing a source). They argue for reframing AI auditing as a community-oriented practice, not a task for isolated individuals.

## Key Concepts

- **Knowledge genealogy (mo'opuna):** The Hawaiian practice of tracing not just who authored a source, but who taught that author — essential for assessing the trustworthiness of cultural knowledge in a context where mo'olelo (oral stories) and proverbs have multiple legitimate interpretations depending on lineage.
- **End-user auditing:** The bottom-up practice of having ordinary users (teachers, students) surface harmful LLM behaviors from their daily interactions, rather than relying on top-down model-provider interventions.
- **Five dimensions of cultural misrepresentation:** (1) hallucinated/incorrect cultural outputs; (2) surface-level/stereotypical depictions; (3) dominance of Western narratives; (4) failure to represent Hawai'i's ethnic diversity; (5) framing Hawaiian culture as historical rather than living.
- **Community-oriented auditing:** Reframing auditing as a collective, tiered practice where cultural expertise determines whose judgment carries weight — not a generic task any user can perform equally.
- **Data sovereignty:** The principle that Indigenous communities should maintain ownership and control over their cultural data, including any annotated outputs or flagged examples collected during auditing.
- **Decolonial HCI:** Applying decolonial theory to challenge the universalist, Eurocentric defaults embedded in computing systems, advocating for "pluriversality" — designing for a world of many worlds rather than a single standard.

## Main Findings

- Half of the 22 educators had personally encountered AI-generated content that misrepresented Hawaiian culture; common examples included incorrect mo'olelo conflation, missing 'okina punctuation in 'Olelo Hawai'i, and historically whitewashed narratives (e.g., Captain Cook presented as an explorer rather than a colonizer).
- Educators envision three auditing tool functions: (1) source attribution with genealogy tracing; (2) perspective visualization showing whose viewpoints are present and whose are absent; (3) flagging problematic outputs — all three shaped by community-specific values rather than generic detection.
- There is no ground truth for culturally grounded knowledge: mo'olelo and proverbs vary by practitioner lineage, so conventional fact-checking approaches do not apply.
- Cultural expertise is unequally distributed among educators: Kanaka Maoli (Native Hawaiian) teachers recognized harms that recently relocated mainland teachers did not, requiring tiered auditing roles rather than treating all users as equivalent auditors.
- Educators view auditing as dual-purpose: both a quality-control mechanism and a pedagogical tool for developing students' critical thinking about AI-generated content.

## Relevance to Indigenous AI

This paper is the most directly methodologically relevant to the IndigenousAI project's co-design work with Six Nations. It provides a validated co-design workshop methodology for surfacing Indigenous community concerns about generative AI and translating those concerns into auditing tool requirements. The knowledge genealogy concept maps directly onto Haudenosaunee oral tradition and knowledge transmission (through clan mothers, faithkeepers, knowledge holders). The five dimensions of cultural misrepresentation are directly applicable to assessing LLM outputs about Mohawk language, culture, and history. The data sovereignty discussion is especially critical: any Mohawk language data generated or flagged during auditing must remain under community control. The paper also models good positionality practice by including co-authors from the Ulu Lahui Foundation (a Hawaiian organization) — a template for Indigenous co-authorship in the Mila project.

## Limitations & Critiques

- Workshops were conducted exclusively with elementary school teachers in O'ahu; teachers on other islands, at other grade levels, or in private/charter settings may have different priorities and were not represented.
- Sample size (N=22) and self-selection bias (after-school participation) likely skew toward educators more familiar with and receptive to AI.
- The study centers educators' perspectives; students, administrators, cultural practitioners (kupuna, kumu hula), and other community stakeholders are not included.
- The proposed auditing tool remains at the design concept stage; no working system was built or evaluated, leaving open questions about technical feasibility — particularly for source genealogy attribution in LLMs.

## Questions & Follow-ups

- What is the equivalent of knowledge genealogy in Haudenosaunee epistemology? Who are the recognized knowledge holders for Mohawk cultural and linguistic content, and how should their authority be embedded in an AI auditing or evaluation system?
- How can the co-design workshop format used in this paper be adapted for a Six Nations setting, given specific protocols around community consultation, elder involvement, and seasonal availability?
- Related work to explore: Baker-Ramos et al. (2025) on integrating mo'olelo into Hawaiian immersion school lesson plans using generative AI; Cardona-Rivera et al. (2024) on Indigenous futures in generative AI and the paradox of participation.
