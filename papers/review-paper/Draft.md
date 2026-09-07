# Review Paper

## Applications

## Techniques and Methods

### Tokenizers

## Languages

### AfriqueLLM

### Choctaw

Population: 195,000
Number of speakers: 9600 -> 1000 speakers cited in another paper ?
Number of dialects: 3
Language family: Muskogean
Morphological Typology: Polysynthetic & Agglutinative
Dataset: Choco
UNESCO classification: Vulnerable

#### Sources

- [Wikipedia](https://en.wikipedia.org/wiki/Choctaw_language)
- [Masheli: A Choctaw-English bilingual chatbot](https://people.ict.usc.edu/traum/public_html/Papers/masheli_iwsds2020.pdf)
- [Developing a spoken dialogue system for theChoctaw language](https://drive.google.com/file/d/1C8mUq6BLe1ymRSvMzUY46_LS-QARE_Tk/view)
- [ChoCo: a multimodal corpus of the Choctaw language](https://www.jstor.org/stable/48756644?seq=1)

### Myaamia

Population: 7,000
Number of fluent speakers: 500
Number of dialects: 2
Language family: Algonquian
Morphological Typology: Highly Agglutinative & Polysynthetic
UNESCO classification: Critically endangered

#### Applications

##### Text-to-Speech

Dataset:

- 7 speakers -> 2 speakers contributed 95% of recordings
- 14,358 utterances -> sentences of 3 to 163 characters
- 10.4h of audio

Models:

- FastSpeech, Glow-TTS, VITS (best performing model)

#### Sources

- [Wikipedia](https://en.wikipedia.org/wiki/Miami%E2%80%93Illinois_language)
- [Neural Text-to-Speech for Myaamia: Speech Synthesis for an Indigenous Algonquian Language](https://aclanthology.org/2026.americasnlp-6.1/)

### Lakota

Population: 170,000
Number of fluent speakers: 2,000 speakers
Number of dialects:
Language family: Siouan
Morphological Typology: Synthetic and Agglutinative
UNESCO classification: Critically endangered

Dataset: 200 sentences from published Lakota learning materials

- Mentions ortography as a contested issue but decide on a standardized ortography
- Gemini 3.1 Pro outperforms other methods

#### Sources

- [Evaluating Frontier LLM Translation Capability for Lakota](https://aclanthology.org/2026.americasnlp-6.2/)

## Other

### [Bridging Digital Tools for Linguistic Documentation and Revitalization](https://aclanthology.org/2026.americasnlp-6.3.pdf)

> For example, Littell et al. (2017) introduce a reusable framework for web dictionaries across languages and Kazantseva et al. (2018) describe a verb conjugation tool for Kanyen’keha designed to help learners navigate complex morphology. These tools are often effective for engagement and beginner learning but few consistently integrate morphological search functionality over annotated corpora, limiting utility for teachers and advanced learners who need contextualized examples of specific grammatical phenomena (Neubig et al., 2020; TaylorAdams, 2019).

### [A Systematic Comparison of Parameter-Efficient Fine-Tuning Techniques for Low-Resource Neural Machine Translation: Evidence from Indigenous Languages of the Americas](https://aclanthology.org/2026.americasnlp-6.4/)

Keywords: NMT, PEFT (Parameter Efficient Fine Tuning)

Task: Indigenous -> Spanish translation

Dataset:
AmericasNLP shared-task datasets

| Language   | Family       | Morphological Typology | Train (Number of Sentences) |   Dev | Tier                  |
| ---------- | ------------ | ---------------------- | --------------------------: | ----: | --------------------- |
| Quechua    | Quechuan     | Agglutinative          |                     125,008 |   996 | High (>25K)           |
| Wayuu      | Arawakan     |                        |                      59,715 | 6,635 | High                  |
| Guarani    | Tupian       | Polysynthetic          |                      26,032 |   995 | High                  |
| Awajun     | Jivaroan     |                        |                      21,964 | 1,018 | Med. (10K–25K)        |
| Nahuatl    | Uto-Aztecan  | Agglutinative          |                      16,063 |   672 | Med.                  |
| Raramuri   | Uto-Aztecan  |                        |                      14,720 |   995 | Med.                  |
| Shipibo-K. | Panoan       |                        |                      14,592 |   996 | Med.                  |
| Wixarika   | Uto-Aztecan  |                        |                       8,966 |   994 | Low (5K–10K)          |
| Bribri     | Chibchan     | Tonal                  |                       7,508 |   996 | Low                   |
| Aymara     | Aymaran      | Agglutinative          |                       6,531 |   996 | Low                   |
| Otomi      | Oto-Manguean | Tonal                  |                       4,889 |   599 | Low                   |
| Ashaninka  | Arawakan     | Polysynthetic          |                       3,883 |   883 | V-Low (<5K sentences) |
| Chatino    | Oto-Manguean | Tonal                  |                         357 |   499 | V-Low                 |

Models:
Step 1: Selecting base model
Train three models on a subset of languages using LORA and selecting highest mean chrF++

- NLLB-200-distilled-600M (mean chrF++ = 26.13) -> Selected
- mBART-large-50-many-to-many (mean chrF++ = 24.32)
- ByT5-small (mean chrF++ = 13.92)

Methods:

- Tested (Best to Worst): OFT, Full, LoRA, AdaLoRA, DoRA, BOFT, IA3, Prefix Tuning, VeRA
- Best methods are OFT, Full, LoRA
- In very low tier: OFT
- No statistical different between OFT (train only 0.28% of parameters but slower to train ?) and Full

- [IndigiEval: Evaluating LLMs in North American Indigenous Languages](https://aclanthology.org/2026.americasnlp-6.8.pdf)
- [Sixth Workshop on NLP for Indigenous Languages of the Americas](https://aclanthology.org/2026.americasnlp-6.pdf)
