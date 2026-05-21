# Research Draft — Indigenous AI

> Working document capturing research questions, ideas, and directions for the Indigenous AI project. Treat this as a living document — update it as the project evolves.

---

## Project Context

### Description

The goal of the project is to answer the following question: **how can generative AI technologies be developed with and for Indigenous communities to support the continuance, transmission, and protection of their languages and cultures?**

A central concern is what it would take for these systems to operate in ways that align with Indigenous worldviews, knowledge practices, and sovereignty over data and meaning. The inquiry also runs in the other direction: how Indigenous perspectives and practices might in turn reshape AI itself, potentially informing new algorithms, architectures, or design paradigms.

### Applications

This is ultimately an applied project that aims to develop tools for Indigenous communities. One application we are already aware of is the **generation of learning materials** for lectures and classes. Are there other applications that might shape the research questions and directions?

While driven by applications, the project should also strive to produce general knowledge and practices that can be reused across different projects and shared — enabling the appropriation of such techniques by Indigenous communities. This connects to Ivan Illich's notion of **convivial technology**, grounded in three criteria, one of which is creative autonomy: the user's ability to appropriate a tool and redirect it from its original purpose to create something new (see Mayrand, B. (2023). *Leurres éthiques à l'ère de la technique*).

---

## Datasets

The project will build on two datasets:

| Feature | Thru The Red Door (TRD) | Western University |
| --- | --- | --- |
| Archive Size | 1 Million Documents | Unknown (academic + library books) |
| Language | English only | English, English-Mohawk, Mohawk |
| Data Type | Text, Images, Audio, Video | Text, Images, Audio, Video |
| Content Focus | Six Nations history and culture | Six Nations history, culture, and Mohawk language |
| Status / AI Readiness | Digitized and labeled | In process of digitization — cannot be used yet (waiting for consent) |

### Datasets — Open Questions

- Should the model produce output in both English and Mohawk, or only in Mohawk? What would it mean if the model only answered in English?
- Should the model understand both Mohawk and English as input, or only Mohawk?

---

## Background & Related Work

### Epistemic Injustice in Generative AI

Kay et al. (2024), [*Epistemic Injustice in Generative AI*](https://arxiv.org/abs/2408.11441), provides a useful conceptual framing for thinking about how generative AI systems can produce harms that are not just inaccuracies or biases in the conventional sense, but injustices in how knowledge itself is produced, attributed, and validated. It draws on Miranda Fricker's concept of **epistemic injustice** — wrongs done to someone in their capacity as a knower — and extends it to generative AI.

### NLP for Language Revitalization

A recommended starting point for application-driven approaches is: [*How can NLP Help Revitalize Endangered Languages? A Case Study and Roadmap for the Cherokee Language*](https://aclanthology.org/2022.acl-long.108/). David Adelani may also have relevant suggestions for linguistic inclusion work, specifically on languages from the African continent, though he may not have worked in a revitalization and preservation context specifically.

### Methodology: Working with Indigenous Communities

There are existing frameworks for ethical collaboration with Indigenous communities.

Zhang et al. (2022) propose **3 principles**:

1. **Understand and Respect First**
2. **Decolonize research** — acknowledge that other solutions might be possible; avoid a technosolutionist lens; be prepared to conclude that a particular technology might not be the right tool
3. **Build a Community**

An additional principle worth adding: information, expertise, and exchange must be **bilateral**. AI experts should share their knowledge about AI but also learn Indigenous perspectives. The AI experts should know about the culture, history, and context of the particular language and communities they are working with.

**Open question:** If the main language is Mohawk, what is the history of Mohawk? Where and how can we learn more about it?

---

## Research Questions

### 1. Where in the generative AI stack does linguistic and conceptual meaning live?

LLMs are a stack of distinct components (tokenizer, pretraining data, model architecture, weights, system prompts, etc.), each carrying its own assumptions about language, and each participating in the generation of meaning. Can we identify what those assumptions are, and how different parts of the system contribute to the output?

Articulating these layers explicitly would give a shared map for reasoning about where to intervene for any given cultural or linguistic requirement. Such a framework may also be useful beyond this project, as a tool for any community working to shape generative AI to its own linguistic and cultural specificity.

### 2. What are the linguistic specificities of Indigenous languages, and do they require rethinking assumptions in current LLMs?

Relations and context seem to play a central role — but what exactly are those relations? How do they shape the language? And how, if at all, can they be encoded into an LLM?

A related question is **embodiment and situatedness**. Many Indigenous languages seem to require knowing where you are, who you are speaking to, and what you stand in relation to in order to produce language correctly. What does it mean for an AI system to be situated in that sense? Does it need access to its own location, the user's location, both? And is access to that kind of contextual metadata enough, or is there something more fundamental that a disembodied system cannot do?

**Land acknowledgement** is a concrete case worth thinking through: what would it mean for a system to genuinely acknowledge land, in a way that shapes *how it speaks* rather than just *what it says*?

### 3. What values and epistemologies are encoded in current LLMs, and what does it mean for communities whose values and epistemologies differ?

LLMs are not value-neutral. They are trained on data that reflects particular ways of knowing and valuing — predominantly western and English-centric. These assumptions are often implicit: in what the training data takes for granted, what kinds of responses get rewarded during alignment, and what the model treats as common sense.

- **Epistemology**: how knowledge is defined, produced, and validated — e.g., whether knowledge is treated as universal and extractable, or as situated, relational, and owned
- **Values**: what the model implicitly treats as good, appropriate, or normal in its outputs

Do Indigenous languages and knowledge systems carry distinct epistemologies and values, and if so, what happens when a model trained on different assumptions attempts to produce or reason about them? Are those assumptions silently imported into the output? Can they be detected, measured, or corrected? And what would it mean to build a model that encodes a genuinely different epistemology — not as a surface adjustment, but at the level of how it produces knowledge and language?

### 4. How can we evaluate LLMs on Indigenous language and knowledge?

Standard NLP evaluation metrics (BLEU, ROUGE, perplexity) are a poor fit for assessing cultural fidelity, relational appropriateness, or linguistic correctness in Indigenous languages. This raises the question of what evaluation even means in this context: what are the right tasks to evaluate on, what does a good output look like, and who has the authority to decide?

Beyond performance, we also need to think about **bias**: how do we measure what assumptions and misrepresentations the model carries about Indigenous peoples, languages, and cultures — both before and after adaptation? Are there specific capabilities worth designing targeted benchmarks for (relational structure, situatedness?) that don't yet exist and may need to be built from scratch?

---

## The Framework

One of the theoretical contributions of the project could be to develop a **framework for reasoning about where and how linguistic and conceptual meaning is encoded in generative AI systems**. The motivation is practical as much as theoretical: when a community wants to shape a generative AI system to its own linguistic and cultural specificity, it needs a map of where to intervene, what each intervention costs, and what its limits are.

### Layers

| Layer | Description |
| --- | --- |
| **Tokenizer** | Encodes assumptions about what counts as a meaningful unit. May struggle with unknown characters and low-resource languages. Might require fine-tuning for use with low-resource languages. |
| **Architecture** | Carries specific assumptions about the structure of language. The dominant architecture today is the transformer, which relies on attention mechanisms. Does this carry assumptions that may not apply to every language? |
| **Pretraining Data** | Encodes existing biases about language and knowledge. Often sourced from web scraping, raising concerns about consent, ownership, and potential bias. How much does pretraining data affect the final output? Can biases be removed through fine-tuning? |
| **Fine-tuning / RLHF** | Plays a key role in aligning models and removing some biases. Requires far less data than training from scratch. However, hidden biases from the original pretraining may remain and be hard to detect. |
| **System Prompt** | Provides instructions on how to behave. Allows easy customization using plain language. Limitation: may require instructions to be written in English if the model primarily understands English. |
| **Reasoning** | Chain-of-thought reasoning greatly improves performance on certain complex tasks. Can be combined with RL. |
| **Context** | Longer contexts allow longer system prompts and richer in-context examples. Compaction techniques can help within limited windows. |

### Framework — Open Questions

- Is this the right set of layers for understanding how LLMs produce language?
- For each layer: what kind of knowledge or assumption lives there? How can we identify and measure those assumptions? How do they affect the output? Do they carry a specific epistemology?
- Where does language emerge, and what *is* language? Is there a difference between fluency and articulating meaning or thought? Can we separate language from meaning, or are they tied?
- How can we make the framework operational, usable for any language, to understand how LLMs influence language production and to adapt the technology to specific use cases?

---

## Research Ideas

### Information Retrieval

Explore and compare different information retrieval strategies, for example using **semantic search** or **RAG**. A related idea: use an LLM to generate a structured index, then develop AI agents that can navigate archives using these structured index files to find relevant information.

**Open questions:**

- What are the pros and cons of each system?
- How can we evaluate and compare the performance of such systems?

### Training / Fine-tuning

Directly train a model on the existing corpus of documents. Training from scratch may be challenging due to data requirements, so fine-tuning may be a better option. It could be particularly interesting to train a **tokenizer on Mohawk** or another Indigenous language.

**Open questions:**

- What do we expect fine-tuning to achieve? Current take: fine-tuning may be useful for language modeling — for models with limited knowledge of a specific language, it may enable them to learn the syntax and grammar, allowing them to model it better and potentially provide better answers in it.
- How do we evaluate fine-tuning?
- What is the influence of model size on performance? Is there a tradeoff?
- How do we measure bias? Can biases from the original training data carry over to the fine-tuned model? If so, how to mitigate?

### RLHF from Community Experts

Could we gather feedback from experts and Indigenous speakers to create a dataset that could be used for fine-tuning a model?

- Possible creation of an app for evaluation and feedback collection was discussed.

### Knowledge Graph

Can we build a **knowledge graph** that represents the relational structure of Indigenous language and knowledge? If so, what types of relations should the graph capture? How can we evaluate the graph?

> **TODO:** Look into GraphRAG

### Prompt Engineering

The response quality of LLMs often depends on the system prompt and prompting strategy. Can we improve a base model's performance through prompting? How does prompting compare to other approaches?

Several prompting strategies have been proposed to improve model performance on low-resource languages, for example:

- **Chain-of-Translation Prompting**
- **Chain-of-Dictionary Prompting** — requires a dictionary but may improve performance (though it may require a large context)

### Self-Supervised Learning / Constitutional AI

Anthropic proposed **Constitutional AI**: first define a constitution specifying principles and values the AI should obey, then ask the AI to answer questions, evaluate its own responses against the constitution, and fine-tune to favor the responses most aligned. This enables training without human feedback, requiring only that someone authors a constitution. The downside: this may only work with state-of-the-art large models.

A similar approach can be used to train a model to reason: ask it to solve tasks with known solutions, generate multiple chains-of-thought, and use RL to favor the chains that lead to correct answers. Potentially useful for training on textbook data, particularly if textbooks contain language exercises.

### Model Distillation

Model distillation is the process of training a smaller model using a larger one. This could be useful for extracting specific knowledge from a particular model. A more speculative idea: if it is possible to extract specific knowledge, is it also possible to do the opposite — to insert or erase specific knowledge from a model?

---

## Reading List

| Paper | Link |
| --- | --- |
| Epistemic Injustice in Generative AI | [arxiv.org/abs/2408.11441](https://arxiv.org/abs/2408.11441) |
| How can NLP Help Revitalize Endangered Languages? A Case Study and Roadmap for the Cherokee Language | [aclanthology.org/2022.acl-long.108](https://aclanthology.org/2022.acl-long.108/) |
| Survey of Cultural Awareness in Language Models: Text and Beyond | [direct.mit.edu](https://direct.mit.edu/coli/article/51/3/907/130804/Survey-of-Cultural-Awareness-in-Language-Models) |
| Randomness, Not Representation: The Unreliability of Evaluating Cultural Alignment in LLMs | [dl.acm.org](https://dl.acm.org/doi/full/10.1145/3715275.3732147) |
| Reinforcement Learning from Human Feedback in LLMs: Whose Culture, Whose Values, Whose Perspectives? | [springer.com](https://link.springer.com/article/10.1007/s13347-025-00861-0) |
| AI's Regimes of Representation: A Community-centered Study of Text-to-Image Models in South Asia | [arxiv.org/abs/2305.11844](https://arxiv.org/abs/2305.11844) |
| Cultural Incongruencies in Artificial Intelligence | [arxiv.org/abs/2211.13069](https://arxiv.org/abs/2211.13069) |
| Interviewing AI: Using qualitative methods to explore and capture machines' characteristics and behaviors | — |
| ChrEn: Cherokee-English Machine Translation for Endangered Language Revitalization | [aclanthology.org/2020.emnlp-main.43](https://aclanthology.org/2020.emnlp-main.43/) |

---

## Paper Notes

### Notes: Epistemic Injustice in Generative AI

**Link:** [arxiv.org/abs/2408.11441](https://arxiv.org/abs/2408.11441)

**Core risks identified:**

- **Generative hermeneutical ignorance** — LLMs erase or misrepresent marginalized groups because they lack the cultural and contextual grounding needed for accurate representation, even when they appear knowledgeable.
- **Multilingual / access injustice** — model quality drops sharply in under-resourced languages; speakers (often globally marginalized communities) receive degraded or different information. The same question in different languages can yield contradictory answers.
- **Sources of harm** — inaccuracies memorized from training data, plus the model's tendency to generate high-likelihood sequences that look fluent but contain factual errors.
- **Systemic stakes** — if GenAI becomes a default epistemic tool (like search or encyclopedias), these distortions shape collective knowledge.

**Principles for doing it right:**

1. **Participatory development** — meaningfully engage affected community members throughout, not just for evaluation at the end; they hold the hermeneutical knowledge the model lacks.
2. **Data sovereignty** — communities consent to, own, and control the data that represents them; surface authentic accounts on their terms (cites Kukutai & Taylor 2016 on indigenous data sovereignty).
3. **Epistemic transparency** — thorough model/dataset documentation, user-friendly interfaces, and explainability of model mechanisms.
4. **Preserve diverse voices in fine-tuning** — avoid collapsing outputs into a "neutral" (i.e. dominant-culture) voice; investigate techniques that pinpoint and retain culturally distinct registers.

**GenAI as a tool for epistemic justice:**

- Use AI to surface testimonial injustices — e.g., consult community members on narratives that discredit their identity, then audit models and corpora for those patterns.
- Embeddings-based retrieval to detect instances of testimonial injustice across large corpora (semantic similarity as a proxy).
- Generative systems can contribute to shared hermeneutical resources — expanding cultural understanding rather than flattening it — if directed that way intentionally.

---

### Notes: How can NLP Help Revitalize Endangered Languages? — Cherokee Case Study

**Paper:** [aclanthology.org/2022.acl-long.108](https://aclanthology.org/2022.acl-long.108/)
**Code:** [github.com/ZhangShiyue/RevitalizeCherokee](https://github.com/ZhangShiyue/RevitalizeCherokee)

**3 Principles for NLP Practitioners:**

1. Understand and Respect First
2. Decolonize research
3. Build a Community

**Applications of NLP for assisted language education:**

- Automated Quiz Generation
- Automated Assessment
- Community-based Language Learning

**Linguistic characteristics of Cherokee:**

- **Polysynthetic** — words are primarily composed of a root whose meaning is modified by multiple prefixes and suffixes
- **Minimum verb structure** — the simplest verb form contains at minimum a root, a pronominal prefix, and a tense/aspect suffix
- **Object-shape conjugation** — verbs with direct objects must conjugate to indicate the physical shape of the direct object (e.g., "I have (solid)" vs. "I have (liquid)" vs. "I have (long & rigid)")
- **Geographical prefixes** — pre-pronominal prefixes can specify geographical location of events (e.g., *wi-* = translocative, action at a distance; *di-* = cislocative, action approaching the speaker)
- **Pragmatic word order** — word order is dependent on the larger pragmatic context; new information or timeframes occur before the verb, old or established information post-verbally
- **Dual-argument pronominal prefixes** — subject-object agreement handled largely via prefixes encoding both agent and patient
- **Three-way number** — singular, plural, and dual (unlike English's two-way)
- **Verb-centric** — verbs comprise ~75% of Cherokee
- **Evidentiality** — Cherokee marks whether the speaker has firsthand knowledge of past events or is reporting hearsay

**Key NLP challenges:**

- Machine translation: lack of data; subword tokenization doesn't seem to work (Cherokee has its own syllabary alphabet), suggesting a dedicated tokenizer may be needed
- OCR: existing tools (Tesseract, Google Vision) perform well on relatively clean data
- Speech recognition and synthesis: finetuning pretrained tools seems promising

**Comments:**
The paper structure is well-aligned with the project's approach: principles → applications → language characterization → technology survey → community-validated NLP tools. Points worth critiquing: mentions gamification for data annotation (potential "free labour" concern), and data mining framing — treating data as a resource to extract can lead to abuse and should be examined critically.
