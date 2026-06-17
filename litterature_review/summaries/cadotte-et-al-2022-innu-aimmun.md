# NLP for Innu-Aimun: Challenges and a Morphological Segmentation Approach

**Authors:** Marc-Antoine Cadotte et al.
**Year:** 2022
**Venue:** Conference proceedings (computational linguistics / Indigenous language NLP)

---

## Core Argument

Innu-Aimun, a polysynthetic Algonquian language spoken by ~12,000 people in Quebec and Labrador, presents extreme out-of-vocabulary (OOV) challenges for standard NLP approaches — 82–87% of tokens in real corpora are unseen by any dictionary or statistical model trained on available data. The authors propose a pipeline combining machine translation (MT) with a finite-state transducer (FST) morphological segmenter as the most viable path forward, developed in close collaboration with the ITUM (Innu-Aimun community partner).

## Key Concepts

- **Polysynthesis and OOV explosion:** Innu-Aimun agglutinates multiple morphemes into single words, producing a combinatorial vocabulary that dwarfs any feasible training corpus. The 82–87% OOV rate quantifies what polysynthesis means in practice for NLP.
- **Finite-state transducers (FSTs):** Rule-based morphological tools that segment a polysynthetic word into its morpheme components; suitable for low-resource settings where statistical models cannot train reliably.
- **MT + FST pipeline:** Pre-segment words with the FST before feeding into an MT system; reduces the effective vocabulary and improves translation quality.
- **Community-based development:** Partnership with ITUM ensures community priorities drive the research agenda; long-term goal is a conversational agent, not just academic artifacts.
- **Conversational agent as endpoint:** The ultimate applied goal is a dialogue system capable of supporting language learning and daily use — framing NLP work within a concrete community-serving goal.

## Main Findings

- The OOV rate of 82–87% is one of the highest documented for any language in the NLP literature; it is structurally determined by polysynthesis and cannot be resolved by simply collecting more data.
- FST-based morphological segmentation substantially reduces effective vocabulary size, making downstream statistical modeling more tractable.
- The MT + FST pipeline outperforms baseline approaches without morphological segmentation.
- Community collaboration with ITUM shaped the research questions and evaluation criteria, with the conversational agent goal keeping applied utility at the center.
- Resource scarcity (limited parallel corpora, few trained linguists, limited speaker time for annotation) remains the binding constraint on all approaches.

## Relevance to Indigenous AI

Innu-Aimun is an Algonquian language — linguistically related to Cree and Ojibwe but not to Mohawk (which is Iroquoian). Still, the structural problem is directly analogous: Mohawk is also polysynthetic and will exhibit comparably extreme OOV rates. The 82–87% figure provides a concrete reference point for what Mohawk NLP teams should expect. The FST approach is already used for Mohawk (NRC Canada has developed Mohawk morphological analyzers); this paper reinforces that FST-based segmentation is the right first step before any statistical or neural approach. The community-first development model and the conversational agent long-term goal align closely with the IndigenousAI project's orientation.

## Limitations & Critiques

- The FST itself requires substantial linguistic expertise to build and maintain — the paper may understate the effort required to create and extend the transducer rules.
- Evaluation is on MT quality, not on whether the system serves actual community language learning needs; the conversational agent goal remains aspirational rather than realized.
- The paper focuses on one Algonquian language; generalizability to other polysynthetic families (Iroquoian, Athabascan) requires separate work.

## Questions & Follow-ups

- What is the current state of the ITUM conversational agent? Has it moved from research to deployment?
- How does the Innu-Aimun FST compare in coverage and accuracy to the NRC Canada Mohawk morphological analyzer?
- Related work: Junker (2024) on Algonquian participatory research; Kuhn et al. (2020) on NRC Canada Indigenous language technology; Le et al. (2022) on Innu-Aimun MT specifically.
