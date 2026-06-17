# NLP for Indigenous Latin American Languages: A Survey

**Authors:** Tonja et al. (IPN Mexico + MBZUAI)
**Year:** 2024
**Venue:** NAACL 2024

---

## Core Argument

NLP research for indigenous Latin American languages is severely limited in scope and coverage: of the ~650 indigenous languages in Latin America, only a small fraction (primarily Quechua, Guarani, Nahuatl, Aymara, and Mapuche) appear in NLP research, only 14 of 33 countries in the Americas have any indigenous NLP research at all, and the field consistently under-serves the communities whose languages are studied. The survey catalogs existing resources, identifies critical gaps, and incorporates direct community feedback into recommendations for more equitable NLP development.

## Key Concepts

- **Coverage gap:** 88% of the world's languages are overlooked in NLP research; indigenous Latin American languages are disproportionately excluded even within that. Of Mexico's 68 officially recognized indigenous languages, only approximately 22 appear in any NLP research.
- **Language size imbalance:** Research concentration follows speaker counts — Quechua (~10M speakers), Guarani (6M+), Nahuatl (~2M), Aymara (~2M), and Mapuche receive nearly all attention; smaller languages are essentially absent from NLP literature even when they have living speakers and some written materials.
- **Geographic imbalance:** Countries with both high indigenous language diversity and large speaker populations (Bolivia, Peru, Guatemala, Ecuador, Paraguay) are better represented; much of Central America, most of Brazil (outside Portuguese-dominant research), and the Caribbean are absent.
- **Resource types documented:** Parallel corpora (often Bible translations, government documents, pedagogical materials), monolingual corpora, morphological analyzers (FSTs, rule-based systems), and MT systems constitute the bulk of existing resources. Speech resources are rare.
- **Community feedback:** The survey explicitly incorporates input from community members and language advocates, not just academic researchers — this is relatively uncommon in NLP survey methodology and produces different priority rankings than researcher perspectives alone would.
- **Extractive research concerns:** Multiple community respondents noted that NLP research on their languages has produced publications and tools that the communities themselves cannot access, use, or maintain — a pattern of extraction without benefit-sharing.

## Main Findings

- Only 14 of 33 Americas countries have indigenous language NLP research in the literature reviewed; most of Central America and much of South America is absent.
- Mexico has 68 recognized indigenous languages but only ~22 appear in NLP research, and most of those only in very low-resource scenarios.
- Quechua, Guarani, Nahuatl, Aymara, and Mapuche account for the large majority of research activity; the long tail of smaller languages is essentially unaddressed.
- Community feedback consistently identifies usability and community control as priorities that the academic research agenda underserves — communities want tools they can actually use, not published models they cannot access.
- MT is the most commonly studied task; morphological analysis, ASR, and TTS are under-researched despite their importance to communities.
- Data scarcity is the primary technical bottleneck, but researchers note that scarcity is often artificial — materials exist (in churches, government archives, schools) but are not digitized or made accessible.

## Relevance to Indigenous AI

This survey provides essential comparative context for the IndigenousAI project's focus on Mohawk. Several findings translate directly. First, the concentration of NLP research on the largest languages (Quechua, Guarani) mirrors the situation in North American indigenous NLP, where Inuktitut and Ojibwe receive more attention than Mohawk — not because Mohawk is less important but because it has fewer speakers and less pre-existing NLP infrastructure. Second, the community feedback findings — particularly the extractive research critique — reinforce the IndigenousAI project's emphasis on benefit-sharing and community control, and provide concrete evidence that these concerns are widely shared, not specific to Six Nations. Third, the observation that data scarcity is often artificial (materials exist but are inaccessible) applies directly to Mohawk: there are pedagogical materials, recordings, and institutional documents that have not been digitized or made NLP-accessible. Fourth, the survey's methodology (incorporating community feedback) is a model for how the IndigenousAI project should document its own approach.

## Limitations & Critiques

- The survey covers Latin American indigenous languages; North American indigenous languages (including Mohawk) are outside the scope, limiting direct applicability of coverage statistics.
- Coverage of academic literature may miss community-produced resources (apps, dictionaries, teaching materials) that are not indexed in NLP venues.
- "Community feedback" methodology is described but not fully detailed — it is unclear how many community members participated, from which languages, or how representative the sample is.
- The survey does not assess quality of existing NLP tools, only existence — a tool may be listed as existing even if it is unusable or outdated.

## Questions & Follow-ups

- How does the North American indigenous language NLP landscape compare in coverage to Latin America? Is there an equivalent survey for Haudenosaunee/Iroquoian languages specifically?
- What is the status of Mohawk-specific NLP resources relative to the "top 5" Latin American languages in this survey — does Mohawk have more or fewer resources than, say, Nahuatl?
- Related work: Mager et al. (2022/2023) on polysynthetic languages and AmericasNLP; Junker (2024) on extraction from Algonquian languages; Kuhn et al. (2020) on NRC Canada ILT; Pinhanez et al. (2024) on Brazilian indigenous AI work; Liu et al. (2021) on Seneca NLP.
