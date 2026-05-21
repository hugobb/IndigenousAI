# Not always about you: Prioritizing community needs when developing endangered language technology

**Authors:** Zoey Liu, Crystal Richardson (Karuk), Richard Hatcher Jr., Emily Prud'hommeaux
**Year:** 2022
**Venue:** Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics (ACL 2022), Volume 1: Long Papers, pp. 3933–3944

---

## Core Argument

The NLP community's use of the umbrella term "low-resource" obscures a critical distinction between widely-spoken languages with limited digital resources and critically endangered Indigenous languages — a distinction that has profound consequences for research priorities, methods, and ethics. Drawing on survey data from 23 endangered language teachers and elders from four Indigenous communities (including Karuk and Cayuga), and an ongoing morphological parser collaboration for Cayuga, the authors argue that researchers must subordinate academic agendas to community-defined language revitalization needs, and provide six concrete recommendations for ethical collaboration.

## Key Concepts

- **Endangered vs. low-resource:** Endangered languages (few speakers, mostly elders, risk of extinction) face categorically different constraints than widely-spoken languages that merely lack NLP resources — they cannot generate more data on demand and have unique ethical and cultural stakes.
- **Transcription bottleneck:** The severe shortage of people capable of transcribing recordings in an endangered language, which limits how quickly any corpus can be built.
- **Master Speaker:** An Indigenous community member who is fluent in the language and has accepted apprentices through the oral tradition — the irreplaceable center of language revitalization that no technology can substitute.
- **Linguicide:** Deliberate policies aimed at destroying Indigenous languages (e.g., residential school systems), which have created lasting distrust toward outside researchers.
- **Community-Based Language Research:** A model in which community members co-design research rather than serving as passive informants for linguist-centered projects.
- **Oral tradition primacy:** For many Indigenous communities, oral transmission through human relationships is the legitimate and preferred mode of language transfer — writing and technology are secondary tools, not ends.

## Main Findings

- Analysis of 1,050 ACL Anthology abstracts mentioning "low-resource" languages shows only 15.3% (25 languages) fall into the critically endangered "Coyote" category — yet these face the most severe challenges and are the least served by standard NLP assumptions.
- Survey of 23 language teachers from four Indigenous communities shows near-universal valuation of pedagogical applications (96%) and video processing (83%), moderate valuation of ASR (83%), but significant skepticism about ASR from some respondents who see it as serving researchers' needs rather than creating new speakers.
- Community members emphasize that written documentation safeguards knowledge but cannot replace the oral tradition and human community needed to actually revitalize a language.
- Elder perspectives from the Karuk community reveal that trauma from language loss must be acknowledged and processed before productive language work can occur — methodologies must include emotional space, not just technical tasks.
- The Cayuga morphological parser case study demonstrates a viable ethical workflow: trust-building introduction, community approval, weekly iterative collaboration, transparent progress reporting, and planning to integrate output into teaching tools.
- Six recommendations are offered: build genuine community bonds; offer co-authorship to community contributors; document data collection challenges transparently; clarify data ownership including copyright for Master Speakers; create technology jointly in consultation with communities; and plan concretely for how technology output integrates into revitalization work.

## Relevance to Indigenous AI

This paper is foundational for the IndigenousAI project's methodology. It directly addresses the Mohawk language and Six Nations context — Cayuga and Mohawk are both Haudenosaunee languages facing similar endangered-language dynamics. The paper's framing that "not always about you" challenges researchers (including those at Mila) to center community self-determination over academic publication incentives. The distinction between data scarcity as a technical problem vs. as a consequence of historical trauma and distrust is essential for understanding why standard NLP pipelines cannot simply be "applied" to Mohawk. The emphasis on the oral tradition and the Master Speaker relationship directly informs what generative AI can and cannot do in this context — it can potentially support language learners and documentation, but cannot substitute for human transmission. The acknowledgements section notably thanks the Mohawk (Kanienkeha) and Seneca (Onödowa'ga:') communities alongside Karuk and Cayuga.

## Limitations & Critiques

- The survey is informal (23 respondents, four communities) and not designed to generalize statistically; the authors acknowledge this and treat it as a set of community perspectives rather than representative data.
- The paper does not engage with the specific technical capabilities of large language models (post-GPT-3), leaving the question of how generative AI specifically changes the risk-benefit calculus for Indigenous communities unaddressed.
- The case study (Cayuga morphological parser) is early-stage with ~50% F1 scores at time of publication; the longer-term community impact and adoption cannot be evaluated from this paper alone.

## Questions & Follow-ups

- How do the six ethical collaboration recommendations translate into specific protocol steps for an AI project that involves generative models rather than morphological parsers — particularly regarding data sovereignty and preventing corporate appropriation?
- What is the current status of the Cayuga morphological parser project and what lessons were learned from community integration?
- Related work: Bird (2020) "Decolonising Speech and Language Technology" — cited here and a key text for understanding decolonial approaches to NLP for Indigenous languages.
