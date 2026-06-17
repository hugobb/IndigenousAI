# Why Standard Tokenizers Struggle with Morphologically Rich and Polysynthetic Languages

_A synthesis of structural, statistical, and empirical arguments — and the directions being explored to fix them._

---

## Summary

Subword tokenizers such as Byte-Pair Encoding (BPE), WordPiece, and Unigram-LM are widely blamed for the poor performance of language models on morphologically rich languages (MRLs) and especially polysynthetic languages. This report works through that claim carefully and arrives at a more qualified conclusion than the usual narrative.

The headline findings:

1. **The "morpheme-boundary" story is weaker than commonly assumed.** Respecting morpheme boundaries is intuitively appealing, but intrinsic tokenizer metrics — including compression and morphological alignment — are unreliable predictors of downstream model quality. Maximum compression is _not_ the same as maximum quality.
2. **Most of the dramatic cross-lingual disparity is an artifact of shared/merged tokenizers and unequal training data, not of language structure per se.** When the data-proportion and vocabulary-allocation confounds are removed, a real residual difference remains — but it is far smaller than the headline numbers suggest.
3. **The structure-vs-data question cannot be cleanly answered for truly polysynthetic languages, because every one of them is also low-resource.** The confound is near-total. The best available proxy — high-resource _agglutinative_ languages like Finnish and Turkish — works reasonably well, which is itself strong indirect evidence that data is the dominant factor.
4. **A recurring empirical pattern:** morphology-aware interventions (morpheme segmentation, templatic linearization, factored embeddings) help most when the vocabulary budget or training data is _constrained_, and their advantage tends to wash out — or reverse — at large vocabulary sizes and data scales, where a large transformer simply learns the regularities implicitly.

---

## 1. Linguistic foundations

### 1.1 What actually distinguishes a "word" from a "suffix"?

There is no deep ontological boundary between a word and a bound morpheme (a prefix/suffix/infix). The _same meaning_ can be packaged either as a free word or as a bound affix, and which packaging a language uses is largely arbitrary. English expresses negation, the subject pronoun, and modality as separate free words ("I can **not** hear"); many other languages express all of these as bound morphemes glued onto a single verb.

What makes something a bound morpheme rather than a free word is a set of _operational_ criteria, not meaning:

- You cannot insert unrelated material between the pieces.
- You cannot freely reorder them.
- They share a single prosodic/stress contour.
- Phonological rules (vowel harmony, assimilation) apply _within_ the unit and stop at its edge.

A **polysynthetic** language is simply one where an unusually large number of meanings get packed into a single such unit. Polysynthesis is therefore _not_ "the units are exotic" — it is "the meanings English spreads across eight free words are crammed into one word as bound affixes."

### 1.2 Concatenative vs. non-concatenative morphology

Morphology comes in two broad shapes, and they stress tokenizers very differently:

- **Concatenative** morphology stacks morphemes in a line (English _play-ing_, Turkish/Finnish agglutination). A linear tokenizer can in principle segment these correctly.
- **Non-concatenative (templatic) morphology** interleaves morphemes. The canonical case is Semitic root-and-pattern morphology: a consonantal root such as Hebrew/Arabic _k-t-b_ ("write") is interleaved with vowel/template patterns to yield _katab_, _kitaab_, _maktuub_, and so on. The unit of meaning — the root — is three **non-adjacent** characters, which a strictly linear tokenizer cannot capture as a single unit.

### 1.3 Why concatenation alone is the wrong assumption

BPE and friends rest on an implicit assumption: that meaning is carried by _contiguous, frequently recurring chunks of characters_. This is a statistical proxy for morphology, not a model of it, and it breaks down for MRLs because of:

- **Combinatorial explosion of word forms.** Productive affixation means most full word forms are rare or unique in any corpus, so frequency-based merging has little reliable signal.
- **Allomorphy / morphophonology.** The same morpheme surfaces as _different character strings_ depending on context (Turkish vowel harmony: `-ler`/`-lar`; Finnish consonant gradation: _katu_/_kadun_; assimilation and fusion at boundaries). A frequency counter sees these as unrelated, or merges across boundaries.
- **Non-concatenative structure.** When morphemes are interleaved, there is sometimes no contiguous cut point to find at all.

---

## 2. Structure or data? Disentangling the two

The central question of the discussion: is the problem caused by polysynthetic _structure_, or by the fact that these languages are _low-resource_? If we had English-scale data, would standard tokenizers work as well?

### 2.1 What is genuinely structural

- **BPE's greedy construction mis-segments even with unlimited data.** Bostrom & Durrett (2020) showed that Unigram-LM recovers subword units that align more closely with morphology than BPE, _in high-resource English_. Their example: BPE produces `suggest-ions`, Unigram produces `suggestion-s`. The mis-segmentation is partly algorithmic, not a consequence of scarce data — swapping the algorithm fixes part of the problem regardless of data volume.
- **Allomorphy and fusion are properties of the language**, not the corpus. More data does not collapse `-ler` and `-lar` into one unit at the tokenizer level; at best the model relearns the identity downstream.

### 2.2 What is largely a data effect

- The "most word forms are near-unique, so BPE has nothing to grab onto" argument is mostly about corpus size and form-space breadth.
- Boundary misalignment producing "meaningless" tokens improves (partially) with more data, as merge statistics become more reliable.
- **Vocabulary allocation under a shared tokenizer is a data-proportion effect**, not a structural one (see §4).

### 2.3 The confound that cannot be removed

**There is no high-resource polysynthetic language.** Inuktitut, Yup'ik, Mohawk, and the rest are _all_ low-resource. The controlled experiment "polysynthetic structure + English-scale data" has never been run and currently cannot be run in the wild.

The closest available proxy is high-resource _agglutinative_ languages — Finnish, Turkish, Korean, Japanese — which are morphologically rich yet reasonably data-rich, and which models handle fairly well. This is strong indirect evidence that **data is the dominant factor**, with morphophonological complexity (fusion, allomorphy, non-concatenation) as a real but secondary structural residual that is more about BPE-the-algorithm than about polysynthesis-the-typology.

---

## 3. How is tokenizer quality actually evaluated?

### 3.1 Two families of metric

- **Intrinsic** (cheap, no model training): fertility (tokens per word), compression / corpus token count / bytes-per-token, Rényi efficiency of the token distribution, and morphological alignment against gold segmentations (e.g., MorphScore).
- **Extrinsic** (expensive, the real test): train models identical except for the tokenizer, hold data and architecture fixed, measure downstream task performance.

### 3.2 The uncomfortable result: intrinsic metrics poorly predict downstream quality

- **Compression is not quality.** Schmidt et al. (2024), _Tokenization Is More Than Compression_, built **PathPiece**, which segments text into the provably minimum number of tokens for a given vocabulary — the "maximum compression" ideal. They found that minimizing token count did **not** reliably improve downstream performance (correlation ≈ 0.24), and that the top tokenizers (PathPiece, Unigram, BPE, WordPiece) showed **no statistically significant differences** in high-resource English. This directly refutes the intuition that the most compressive vocabulary is the best one — and the "all reasonable algorithms tie" result supports the view that the transformer does most of the heavy lifting.
- **Morphological alignment explains little variance.** A 2025 large-scale study (≈70 languages) reported that morphological alignment does not explain much performance variance when measured by fertility alone, and that over-segmentation can inflate apparent alignment scores. Vemula et al. (2025) found, on Telugu/Hindi/English, that the tokenizer _algorithm_ mattered more than morphological alignment, while compression and Rényi entropy showed no correlation with downstream performance.

The practical upshot: respecting morpheme boundaries is aesthetically satisfying and weakly helpful for some syntactic tasks, but it is **not** the thing that determines whether a language model works — especially in high-resource settings.

### 3.3 Why tokenization still bites in low-resource settings

A consistent two-regime picture emerges:

- **High-resource regime:** tokenizer choice washes out; the model learns allomorphy and composition from sheer exposure.
- **Low-resource regime:** the model cannot learn those regularities from too few examples, so a badly fragmenting tokenizer is no longer something it can paper over, and fertility starts to predict accuracy. (The "Token Tax" work across 16 African languages found fertility strongly predicts accuracy — but every language there is also low-resource, so the effect is confounded with data; notably, reasoning models narrowed the gap substantially without any tokenizer change.)

---

## 4. The merged-tokenizer confound and parallel-corpus comparisons

### 4.1 The right way to compare languages: parallel text

The correct denominator is _tokens for the same content_, not tokens per word. Petrov et al. (2023), _Language Model Tokenizers Introduce Unfairness Between Languages_, used **FLORES-200** (the same sentences human-translated into 200 languages) and measured tokens per language relative to English. Findings:

- Tokenization length for the same content can differ by **up to ~15×** across languages, and the disparity persists even for tokenizers trained for multilingual support.
- Crucially, even **character- and byte-level** encodings — which have _no_ vocabulary-allocation confound — still show **>4×** differences for some language pairs (e.g., byte-level Burmese or Tibetan vs. Chinese). This residual is an information-theoretic/orthographic floor.
- The premium for a given language swings widely by tokenizer (e.g., Shan ≈ 4.4× under one tokenizer, ≈ 12× under another), which points at vocabulary allocation rather than intrinsic language difficulty.

Ahia et al. (2023), _Do All Languages Cost the Same?_, tied the same parallel-corpus length differences to real API cost and latency.

### 4.2 Shared vs. monolingual tokenizers

The headline ~15× figures come overwhelmingly from **shared/merged multilingual tokenizers**, where one vocabulary is split across many languages trained on _unequal_ data proportions. That conflates two confounds: vocabulary-budget splitting and data imbalance. For those numbers, the "of course the merged tokenizer treats the under-represented language badly" objection is correct.

The cleanly controlled experiment — train monolingual tokenizers with identical implementation, dataset size, and vocabulary size, then compare — was run by _Explaining and Mitigating Crosslingual Tokenizer Inequities_ (2025). Even with the data-proportion and merge confounds removed, monolingual tokenizers still showed widely variable token-premium effects, attributed to "interactions between tokenizer design and inherent features of a language." The residual is real but smaller than the headline disparity. (Relatedly, dedicated monolingual tokenizers consistently beat shared multilingual ones — the "curse of multilinguality.")

For Latin-script high-resource pairs like English vs. French, the premium is small (≈1.1–1.5×) and nearly vanishes with a dedicated tokenizer. The eye-watering numbers are concentrated in non-Latin-script, low-resource languages — i.e., exactly where vocabulary allocation is starved.

---

## 5. Vocabulary size and the ordering of sequence lengths

A theoretical question with a clean answer: if language A produces shorter sequences than language B at vocabulary size _K_, is the ordering preserved for all vocabulary sizes?

### 5.1 Within a language: monotone

Let `T_L(V)` be the tokens needed to encode a fixed text in language _L_ at vocabulary size _V_. It is **monotonically non-increasing** in _V_. The rigorous argument needs no BPE specifics: any vocabulary of size _V_ is a feasible subset of the choices at size _V+1_ (you can decline to use the extra slot), so the optimal achievable token count cannot increase. For BPE specifically, a larger vocabulary is the smaller merge list plus more merges, and an extra merge can only fuse adjacent tokens, never split them.

### 5.2 Across languages: no order-preservation guarantee — crossovers are expected

There is **no** theorem guaranteeing the ordering is preserved, because the claim is false in general. The two ends of the vocabulary axis are governed by _different quantities_:

- **As V → small (byte/char level):** sequence length is dominated by **bytes per sentence** (script and orthographic density).
- **As V → large (every word its own token):** sequence length is dominated by **words per sentence** (analytic vs. synthetic packing).

These two quantities can order the languages _oppositely_, forcing the curves to cross. Concrete construction:

- Language X: 30 words/sentence × 2 chars = 60 chars, 30 words.
- Language Y: 6 words/sentence × 12 chars = 72 chars, 6 words.

At byte level: X = 60 tokens, Y = 72 → **X shorter**. At a vocabulary large enough to make every word one token: X = 30, Y = 6 → **Y shorter**. Same two languages, opposite ordering, depending entirely on _V_.

Even without a full crossover, the _gap_ is non-monotone, because the two curves descend at different rates (a Heaps'/Zipf phenomenon): a language with a small reused vocabulary saturates early; a morphologically productive language keeps benefiting from larger _V_. Empirically, _Explaining and Mitigating Crosslingual Tokenizer Inequities_ found that uniformly increasing vocabulary size does **not** reduce token-premium effects, but that an _optimal per-language vocabulary size_ can. If ordering were scale-invariant, no such tuning would be possible.

### 5.3 Implication for polysynthetic languages

A polysynthetic language is the extreme of "few, very long words." Its asymptotic regime — where it would _win_ on token count because one word carries a sentence of meaning — sits at an astronomically large _V_, because covering "every word as one token" means covering a combinatorially exploding form space. No feasible budget reaches that crossover, so in practice we only ever observe the far-left, heavily-fragmented portion of its curve. The observed ordering is an artifact of being stuck below the crossover point.

---

## 6. Directions for improvement

### 6.1 Handling non-concatenative morphology

A natural idea is **discontinuous / gappy tokens** (e.g., a pattern `C_C` that skips the interleaved vowel). The intuition is correct — it targets templatic morphology — but the literal mechanism breaks the property that makes tokenization work: a token sequence must be a **lossless partition** of the byte stream, and a gappy token discards the gap content and stops tiling the string cleanly, while exploding the candidate space.

The field solves the problem the other way around. **SPLINTER** (Gazit et al., 2025) is a preprocessing step that **linearizes** non-concatenative text by iteratively pruning characters to isolate template forms (mapping into an "enriched alphabet" via a reduction map), so that an ordinary linear tokenizer can find the now-contiguous root. Results are **mixed and vocabulary-size-dependent**: SPLINTER helps at small vocabulary sizes (e.g., 2K) and on several downstream Hebrew tasks, but at 128K its intrinsic advantage is roughly neutral in Hebrew and is _outperformed_ by the baseline in Arabic and Malay — again, the bias helps when the budget is tight and fades when it is large.

### 6.2 Self-supervised / learned boundary induction

Instead of a fixed vocabulary, let the model's own predictions decide the units. This idea has a deep ancestor: **Zellig Harris (1955)** proposed that morpheme boundaries fall where the predictability of the next symbol drops (successor variety / branching entropy). Unsupervised morphology induction (e.g., **Morfessor**) operationalized it statistically.

The modern, at-scale realization is Meta's **Byte Latent Transformer** (Pagnoni et al., 2024). BLT trains a small byte-level next-byte predictor and segments bytes into **patches based on next-byte entropy** — predictable (low-entropy) runs are merged into long patches; high-entropy points become boundaries. No fixed vocabulary. It is the first byte-level architecture to match tokenization-based models at scale (up to 8B params, 4T bytes) and shows large gains on character-manipulation/spelling and robustness to noise and long-tail/multilingual inputs — precisely the failure modes of BPE. The cost is architectural complexity and coupling between segmentation and a learned predictor, which is why static BPE persists. Related learned-segmentation work includes Charformer (gradient-based subword segmentation), CANINE (character-level), and MEGABYTE (fixed-size patches).

A useful reframing: the proposal "train on bytes, then merge units by a learned criterion, iterating" is essentially **BPE with the merge criterion replaced by predictive entropy/MDL rather than raw co-occurrence frequency**. Local predictability ("where to cut") is a better signal than global embedding similarity ("what is the same").

### 6.3 Factored / compositional embeddings (and the LoRA analogy)

Rather than fix the _segmentation_, fix the _representation_: build a word's embedding by composing a root/template embedding with a pattern/affix embedding (the `v1 + v2` idea). This is well-studied:

- **Botha & Blunsom (2014)** composed word embeddings additively from morpheme embeddings, obtaining substantial perplexity reductions and up to +1.2 BLEU into MRLs.
- **Luong et al. (2013)** used recursive composition; **Qiu et al. (2014)** and **Cotterell & Schütze (2015)** used addition.
- **fastText** (Bojanowski et al., 2017) represents a word as a bag of character n-grams (sum of n-gram vectors) — the most successful descendant, which deliberately avoids needing a morphological analyzer by using linguistically uninterpretable n-grams.

The limitation: morpheme-based versions **require a morphological decomposition** (the hard, ambiguous step for Semitic), which is exactly why fastText's analyzer-free n-gram trick won in practice.

The **LoRA analogy** is apt at the level of structure: morphological variation is _low-rank and shared_ — the singular→plural or template-A→template-B transformation is a consistent, low-dimensional operation applied across all roots (the classic linear-analogy structure). The refinement is that LoRA adapts a _weight matrix_, whereas an embedding table is a _lookup_; the object you actually want is a low-rank offset _conditioned on the morphological feature_, `emb(root, pattern) = base(root) + M(pattern)`, which is closer to a factored bilinear model or hypernetwork than to vanilla LoRA. The spirit — parameterize a structured family of morphological adjustments cheaply with a shared low-rank term — is sound, and this exact conditioned-low-rank framing for templatic morphology appears under-explored.

### 6.4 Lossy tokenization

Removing information (e.g., dropping a letter) is a real and used strategy, in three flavors:

- **Vowel/diacritic dropping in Semitic.** Arabic and Hebrew are natively written as abjads (largely without short vowels); most Semitic NLP already operates on the unvocalized consonantal skeleton, which collapses all forms of a root together — the root-sharing benefit, for free. (Re-adding vowels — diacritization — is then a separate task.) SPLINTER's character pruning is a controlled, _recoverable_ relative of this idea.
- **Lossy normalization** (lowercasing, Unicode NFKC, accent/diacritic stripping) is standard tokenizer practice, especially in older encoder models.
- **Stemming/lemmatization** is the classic, explicitly lossy reduction from pre-neural information retrieval, where the surface form never needs reconstructing.

The hard constraint: lossy tokenization is acceptable for **understanding** models (classification, retrieval, similarity) but breaks **generative** models, which must emit the exact dropped characters. This is the fundamental reason modern generative LLMs use lossless byte-level tokenizers, and why lossy reductions survive only in encode-only settings or paired with a separate restoration step.

---

## 7. Synthesis

Across every sub-topic the same shape recurs:

- **Tokenizer "correctness" (morpheme alignment, compression) is a weak predictor of model quality**, and is largely absorbed by a sufficiently large transformer trained on sufficient data.
- **The dramatic cross-lingual disparities are mostly artifacts of shared vocabularies and unequal data**, with a smaller genuine residual driven by script density and non-concatenative structure.
- **Morphology-aware inductive biases pay off precisely when data and vocabulary budgets are scarce** — the low-resource regime — and fade at scale.
- **For truly polysynthetic languages the structure-vs-data question is empirically unanswerable today**, because data scarcity is a total confound; the agglutinative evidence suggests data dominates.

The most promising research directions therefore aim either to _remove the fixed vocabulary entirely_ (entropy-based byte models like BLT, reviving Harris's 1955 predictability principle) or to _inject cheap, structured morphological priors_ (templatic linearization, factored/low-rank embeddings) that help most exactly where data is thin.

---

## References

- Ahia, O., et al. (2023). _Do All Languages Cost the Same? Tokenization in the Era of Commercial Language Models._
- Bojanowski, P., Grave, E., Joulin, A., & Mikolov, T. (2017). _Enriching Word Vectors with Subword Information_ (fastText).
- Bostrom, K., & Durrett, G. (2020). _Byte Pair Encoding is Suboptimal for Language Model Pretraining._
- Botha, J. A., & Blunsom, P. (2014). _Compositional Morphology for Word Representations and Language Modelling._ ICML.
- Clark, J. H., et al. (2022). _CANINE: Pre-training an Efficient Tokenization-Free Encoder for Language Representation._
- Cotterell, R., & Schütze, H. (2015). _Morphological Word Embeddings._
- Gazit, B., Shmidman, S., Shmidman, A., & Pinter, Y. (2025). _Splintering Nonconcatenative Languages for Better Tokenization._ Findings of ACL 2025. arXiv:2503.14433.
- Harris, Z. (1955). _From Phoneme to Morpheme._ (Successor variety / branching-entropy segmentation.)
- Klein, S., & Tsarfaty, R. (2020). _Getting the ##life out of living: tokenization and morphology in nonconcatenative languages._
- Luong, M.-T., Socher, R., & Manning, C. D. (2013). _Better Word Representations with Recursive Neural Networks for Morphology._
- Pagnoni, A., et al. (2024). _Byte Latent Transformer: Patches Scale Better Than Tokens._ arXiv:2412.09871.
- Petrov, A., La Malfa, E., Torr, P., & Bibi, A. (2023). _Language Model Tokenizers Introduce Unfairness Between Languages._ NeurIPS 2023.
- Qiu, S., et al. (2014). _Co-learning of Word Representations and Morpheme Representations._
- Rust, P., et al. (2021). _How Good is Your Tokenizer? On the Monolingual Performance of Multilingual Language Models._
- Schmidt, C. W., et al. (2024). _Tokenization Is More Than Compression_ (PathPiece).
- Tay, Y., et al. (2021). _Charformer: Fast Character Transformers via Gradient-based Subword Tokenization._
- Vemula, et al. (2025). _Rethinking Tokenization for Rich Morphology_ (Telugu/Hindi/English).
- Yu, L., et al. (2023). _MEGABYTE: Predicting Million-byte Sequences with Multiscale Transformers._
- _Explaining and Mitigating Crosslingual Tokenizer Inequities_ (2025). arXiv:2510.21909.
- _From Bias to Balance: How Multilingual Dataset Composition Affects Tokenizer Performance_ (2025).
- _The Token Tax_ / AfriMMLU multilingual evaluation work (2025), 16 African languages.

_Note: citation details (years, venues, author lists) are drawn from web searches conducted during the discussion and should be verified against the primary sources before formal use. Some preprint identifiers and 2025 venue assignments may be approximate._
