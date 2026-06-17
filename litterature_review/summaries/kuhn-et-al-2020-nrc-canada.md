# The Indigenous Languages Technology Project at NRC Canada

**Authors:** Roland Kuhn, Fineen Davis, Alain Désilets, Eric Joanis, Anna Kazantseva, Rebecca Knowles, Patrick Littell, Delaney Lothian, Aidan Pine, Caroline Running Wolf, Eddie Santos, Darlene Stewart (NRC); Gilles Boulianne, Vishwa Gupta (CRIM); Owennatékha Brian Maracle (Onkwawenna Kentyohkwa); Akwiratékha' Martin (Kahnawà:ke); Christopher Cox, Marie-Odile Junker, and others (Carleton University, Queen's University, etc.)
**Year:** 2020
**Venue:** COLING 2020 (Proceedings of the 28th International Conference on Computational Linguistics)

---

## Core Argument

The National Research Council of Canada's Indigenous Languages Technology (ILT) project demonstrates what a community-centered, empowerment-oriented approach to Indigenous language technology looks like in practice. Over three years and $6 million CAD, the project produced a diverse portfolio of tools — a polysynthetic verb conjugator for Kanyen'kéha (Mohawk), one of the largest parallel corpora for any polysynthetic language (Inuktut-English Nunavut Hansard), ASR tools, predictive text, and read-along audiobooks — all developed in response to community-stated needs, with communities retaining ownership of their language data.

## Key Concepts

- **Empowerment paradigm:** Collaborative research where Indigenous community goals drive the research agenda, equal weight is given to linguists' and communities' priorities, and communities retain ownership of language data. Explicitly contrasted with extractive research.
- **WordWeaver / Kawennón:nis:** A software framework for building verb conjugators for polysynthetic languages, instantiated for Kanyen'kéha (Mohawk). Initiated at the request of Brian Maracle (Onkwawenna Kentyohkwa, Six Nations Grand River). Western dialect has 250+ verb stems; Eastern (Kahnawà:ke) has ~600. Capable of generating 100,000+ conjugated forms. Uses FSTs (Foma) as back-end; web/mobile interface translated into English, French, and Kanyen'kéha.
- **Nunavut Hansard corpus:** 1.3 million sentence-aligned Inuktut–English pairs from Nunavut Legislative Assembly proceedings. Believed to be the largest parallel corpus for any Indigenous language of the Americas or any polysynthetic language. CC-BY-4.0 license.
- **Transcription bottleneck:** Indigenous communities often have thousands of hours of Elder speech recordings with no means to transcribe them at scale. The project developed ASR tools (via CRIM) to address this; key challenge is that most Indigenous languages have extremely limited ASR training data.
- **Predictive text (decentralized):** Integrated with Keyman open-source keyboards; allows communities to build predictive text models from a spreadsheet of words, without sharing data with a central entity. Implemented for SENĆOŦEN.
- **Read-along / word-speech alignment:** Automated alignment of audio recordings with written text to support audio-assisted reading in Indigenous languages.
- **Data non-extraction commitment:** NRC explicitly committed to not claiming ownership of Indigenous language data collected with project funding — a break from the extractive research history.

## Main Findings

- The verb conjugator for Kanyen'kéha (Kawennón:nis) directly responds to the pedagogical challenge of Mohawk's polysynthetic morphology: millions of possible conjugations, bound verb roots, 72 bound pronouns, 12 tense/aspect combinations.
- Rule-based (FST) approaches were chosen for most tools due to insufficient data for statistical or neural models — a deliberate technical choice given the linguistic context, not a limitation.
- The Nunavut Hansard corpus has enabled shared MT evaluation tasks (WMT 2020 Inuktut–English) and serves as a benchmark for Inuktut NLP.
- The project demonstrates that serving diverse communities (with very different linguistic needs) requires a diverse portfolio of tools rather than a one-size-fits-all platform.
- Community trust requires in-person visits, iterative co-design, hiring in-community designers, and extensive UI/UX review — not just technical collaboration by remote.

## Relevance to Indigenous AI

This paper is the most directly relevant technical paper in the literature for the IndigenousAI project. Key connections:
- **Kawennón:nis is the existing Mohawk verb conjugator** — it already exists, was built with Six Nations/Kahnawà:ke communities, and uses FSTs. Any AI work building on Mohawk language technology should connect to this infrastructure.
- **Onkwawenna Kentyohkwa** (the adult immersion school at Six Nations Grand River that Brian Maracle directed) and **Kahnawà:ke** are the exact communities central to the IndigenousAI project's context.
- The empowerment paradigm and data non-extraction commitment are the operational form of what Brinklow (2021) argues for philosophically.
- The transcription bottleneck (Elder speech recordings) is directly relevant to the Mohawk context; ASR + alignment tools could be high-value for Six Nations.
- The decentralized predictive text model (community controls their own data in a spreadsheet) is a practical data sovereignty template.

## Limitations & Critiques

- Phase I is described (2017–2020); the paper does not fully report outcomes or community feedback on tool adoption rates.
- The project's breadth (many languages, many tools) means the depth of work on any individual language (including Kanyen'kéha) is limited by resource constraints.
- The Nunavut Hansard corpus is impressive, but its domain (legislative proceedings) is far removed from everyday language use and language learning.
- ASR results for Indigenous languages are not reported in detail; the transcription bottleneck remains a major unsolved challenge.

## Questions & Follow-ups

- What is the current status of Kawennón:nis (WordWeaver for Mohawk)? Is it actively maintained, and are both Western and Eastern dialect versions in use?
- Has Phase II of the NRC ILT project extended Kawennón:nis? What new Mohawk language technology has been built since 2020?
- How can the IndigenousAI project connect to or build on WordWeaver, rather than starting from scratch?
- Related work: Brinklow et al. (2019) on empowerment and process; Brinklow (2021) on anti-colonial ILT; Junker (2024) on data extraction ethics; Le and Sadat (2021) and Le et al. (2022) for NMT work building on NRC infrastructure.
