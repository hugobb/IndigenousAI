
# Decentralized Predictive Text for Indigenous Languages

**Category:** ML Technique
**Data Regime:** any (word-list based; works with as few as a few hundred words; no parallel data required)
**Applicable Languages:** Any Indigenous language with a standardized or semi-standardized orthography; demonstrated on SENĆOŦEN (Saanich); designed for communities that cannot or will not share text data with a central server

## Description

Decentralized predictive text is a technique for building smartphone keyboard predictions for Indigenous languages that keeps language data entirely under community control. Rather than mining large text corpora through a central service (the approach used by Google Gboard and similar systems), it allows Indigenous language activists to generate predictive text models from a **community-maintained spreadsheet of words** — without sending any data outside the community.

The core design principle is an inversion of the standard predictive text pipeline: instead of a central entity (Google, Apple, etc.) mining text corpora and generating language-specific models, the **language activist is in charge of their own data** and generates a local n-gram model that serves predictions only on their device and community keyboards.

**How it works:**
- The community maintains a word list in a spreadsheet (no special format required; any column of words in the language).
- The framework generates a word-level unigram language model from the word list — sufficient for keyboard word completion and next-word suggestion.
- The model is integrated into Keyman, an open-source keyboard creation platform, and distributed as a community keyboard package.
- No language data is sent to any external server; the model lives on the device.

**Why this matters for data sovereignty:** Mainstream predictive text (Gboard, iOS keyboard) mines text corpora that the user types — which, for endangered languages, means that every time a community member types in their language on a modern smartphone, that language data flows to a commercial server. This is a structural data extraction mechanism. The decentralized approach breaks this flow by making the community's word list — not commercial infrastructure — the source of predictions.

**Technical basis:** The language models generated are word-level unigrams (frequency lists), not n-gram LMs trained on sentences. This is deliberate: most Indigenous language communities do not have large sentence corpora, but every language has a vocabulary list — often maintained in a spreadsheet by a teacher or language activist. Unigram models are sufficient for keyboard word completion, which is the primary use case.

## When to Use

- A community has a word list, dictionary, or vocabulary list in their language but does not have or does not want to share a sentence corpus.
- Community members type in their language on smartphones but face difficulty due to non-standard orthography, diacritics, or digraphs not supported by standard keyboards.
- The community is concerned about data sovereignty and does not want typing data sent to commercial servers.
- A language activist or teacher wants to deploy a keyboard without involving a software developer or computational linguist.
- The language has an unusual or community-specific orthography (e.g., SENĆOŦEN uses the underbar-dot conventions of the Saanich Institute) that mainstream keyboards cannot support.

**Less applicable when:**
- The community already uses a centralized keyboard platform and has explicitly consented to data collection by that platform.
- Sentence-level prediction (full next-word language model trained on full sentences) is required — this technique produces word completion only, not full sentence-level prediction.
- The community has no word list or vocabulary resource to start from — though even a minimal list of a few hundred high-frequency words provides meaningful predictions.

## How to Apply

1. **Gather the community's word list.** Collect all words in the language from available resources: dictionaries, teaching materials, verb conjugators (e.g., export from WordWeaver), vocabulary lists. The list does not need to be complete — even 500–1,000 high-frequency words substantially improves typing ease.

2. **Format the word list as a spreadsheet.** A single column of words is sufficient. No grammatical annotation or glosses are required for this technique.

3. **Build the Keyman keyboard package.**
   - Install Keyman Developer (free, open-source).
   - Define the keyboard layout: map the community's orthography to physical keys, including diacritics and special characters.
   - Import the word list into the Keyman predictive text model builder; this generates a `.model.ts` package with word-frequency data.
   - Bundle the keyboard layout and the predictive text model into a single `.kmp` package.

4. **Distribute the keyboard.**
   - Upload the `.kmp` file to the Keyman Cloud repository or distribute directly via the community's website.
   - Community members install the keyboard on Android or iOS from the Keyman app (free).
   - No app store approval is required; distribution can be community-controlled.

5. **Update the model as the word list grows.** When new words are added to the community's vocabulary (e.g., new verbs from a conjugator session, new terminology from a curriculum), repeat steps 3–4 with the updated word list. The process takes minutes once the initial keyboard is set up.

## Pseudocode

```
// Generate predictive text model from community word list

// Step 1: Load word list
words = load_spreadsheet("community_word_list.xlsx")["word_column"]
words = [normalize_orthography(w) for w in words]  // standardize casing, diacritics

// Step 2: Build unigram frequency model
// (for a simple word list without corpus frequencies, assign uniform frequency = 1)
frequency_model = {}
for word in words:
    frequency_model[word] = frequency_model.get(word, 0) + 1

// Step 3: Build Keyman predictive text model (lexical model)
// Keyman .model.ts format:
lexical_model = KeymanLexicalModel(
    wordBreaker = "default",             // split on spaces
    entries = [
        (word, freq) for word, freq in frequency_model.items()
    ]
)
lexical_model.compile("output/community.model.js")

// Step 4: Bundle keyboard + model into .kmp package
keyboard = KeymanKeyboard.load("community_keyboard.kmx")
package = KeymanPackage(
    keyboards = [keyboard],
    models    = [lexical_model],
    metadata  = {
        name:     "Community Language Keyboard",
        version:  "1.0",
        language: community.language_bcp47_tag
    }
)
package.compile("output/community_keyboard.kmp")

// Step 5: Distribution (no central server required)
community_website.upload("output/community_keyboard.kmp")
// Community members: Keyman app → Install from URL → community_website.url
```

## Evidence

**Kuhn et al. (2020) — COLING 2020:**

- Implemented for SENĆOŦEN (Saanich, a Central Salish language, approximately 5 speakers as of the 2016 census — critically endangered).
- SENĆOŦEN has an unusual orthography (e.g., `Ŧ`, underbar-dot characters, glottalized stops) not supported by standard mobile keyboards — a barrier to digital language use.
- Members of the SENĆOŦEN community reported that the keyboard "makes typing in their language, which has an unusual orthography, dramatically easier."
- The NRC team describes the contrast with centralized systems explicitly: "We have 'decentralized' the creation of predictive text models, by making it possible for Indigenous language activists, using a spreadsheet of words in their language, to provide predictive text suggestions for their community. Thus, the language activists are in charge of their own data, and can choose how they share their predictive text keyboard. This contrasts with Gboard ... where a centralized entity mines text corpora and creates a language-specific model."

The approach generalizes to any language loadable into Keyman; the NRC team was working to make the software easier to deploy so other communities could implement it independently.

## Variations & Configuration

- **Corpus-frequency weighting:** If a sentence corpus is available, word frequencies from the corpus can replace uniform weights — higher-frequency words appear higher in suggestions. This improves prediction quality without requiring the corpus to leave the community.
- **Phrase prediction (bigrams):** If a sentence corpus is available, bigram transitions can be added to the model, enabling next-word prediction (not just word completion). Still buildable from a local corpus without data leaving the community.
- **Keyman Web:** The same keyboard package can be embedded in a community website (e.g., a dictionary or learning tool) for in-browser typing in the language, using the Keyman Web SDK.
- **Offline-only distribution:** For communities with strong data sovereignty concerns, the `.kmp` file can be distributed via USB, QR code, or local network without ever being uploaded to a public server.
- **Integration with WordWeaver/conjugator export:** Verb forms generated by a conjugator (e.g., Kawennón:nis) can be exported as a word list and added to the predictive text model — extending predictions to inflected verb forms without a separate corpus.

## Code & Tools

- **Keyman Developer (keyboard creation tool):** https://keyman.com/developer — free, open-source; Windows-based; builds keyboard layouts and predictive text models.
- **Keyman app (distribution):** https://keyman.com — free app for Android and iOS that installs community keyboard packages.
- **Keyman Cloud repository:** https://keyman.com/keyboards — public repository for distributing keyboards; communities can host privately instead.
- **Keyman Web SDK:** https://keyman.com/web — for embedding keyboards in web applications (e.g., community dictionary).
- **NRC Canada Keyman collaboration:** Described in Kuhn et al. (2020); NRC integrated predictive text generation into the Keyman platform and contributed the spreadsheet-driven model-building workflow.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Full community control over language data — no data leaves the community | Unigram word completion is simpler than full n-gram prediction; prediction quality is lower than commercial keyboards for high-resource languages |
| Works from a word list alone — no sentence corpus needed | Keyman Developer is currently Windows-only; limits who can build and update keyboards |
| Directly addresses the orthography barrier for languages with non-standard characters | Communities need someone to maintain and update the keyboard as the word list grows |
| Free and open-source; no vendor dependency | Initial setup still requires some technical guidance even with the simplified workflow |
| PWA-style distribution — no app store approval required | Unigram model does not personalize or learn from user typing behavior (a feature, not a bug, for sovereignty, but a limitation for prediction quality) |
| Easily updated as word lists grow | The approach does not apply to speech (only text typing) |

## References

- Kuhn, R., et al. (2020). The Indigenous Languages Technology project at NRC Canada: An empowerment-oriented approach to developing language software. *COLING 2020*, pp. 5866–5878.
- van Esch, D., et al. (2019). Missing the forest for the trees: Machine translation for all languages. *EMNLP 2019*.
- Keyman Developer documentation: https://help.keyman.com/developer/

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — The five-step How to Apply section walks through the full workflow at a level that a technically inclined language activist could follow. The pseudocode clearly illustrates the unigram model construction and Keyman packaging steps. However, the actual Keyman Developer UI workflow (which menus to use, which project type to select) is described abstractly rather than as concrete UI steps. A practitioner would still need to consult Keyman Developer documentation to complete Step 3 without external guidance.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — The SENĆOŦEN case is cited with a concrete speaker count (~5 speakers as of the 2016 census) and qualitative community feedback ("makes typing in their language dramatically easier"). However, there are no quantitative metrics on prediction quality (e.g., keystroke savings rate, word completion accuracy, or user study scores). The evidence is qualitative and anecdotal rather than quantitatively benchmarked. Source is cited (Kuhn et al. 2020, COLING 2020).

    **Criterion 3 — Data regime / context clarity:** PASS — The header states "any (word-list based; works with as few as a few hundred words; no parallel data required)" and the description explicitly distinguishes this from corpus-based systems. The When to Use section clearly specifies the word-list-only prerequisite and the data sovereignty motivation. The note that even 500–1,000 words provides meaningful improvement is a useful concrete bound.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The pseudocode covers unigram model construction and Keyman packaging clearly. However, `normalize_orthography()` is called but not defined — for languages with complex diacritic conventions (e.g., SENĆOŦEN underbar-dot characters), this step is non-trivial and deserves at least a comment. `KeymanLexicalModel`, `KeymanKeyboard`, and `KeymanPackage` are used as if they are Python classes, but Keyman's actual model format is TypeScript (`.model.ts`), not Python — the pseudocode abstraction may mislead implementers about the actual toolchain.

    **Criterion 5 — Failure modes:** PARTIAL — The Weaknesses table flags Keyman Developer being Windows-only, lower prediction quality vs. commercial keyboards, and lack of personalization. However, operational failure modes are not documented: what happens if the word list contains encoding inconsistencies (mixed Unicode normalization forms for diacritics), how to handle orthographic variants within the word list, or what occurs when the `.kmp` package fails to install on certain Android/iOS versions.

    **Overall:** Well-motivated and clearly structured. Key gaps: (1) pseudocode uses Python-style classes for what is actually a TypeScript/Windows toolchain — the abstraction gap could mislead implementers; (2) `normalize_orthography()` is a significant hidden step for languages with complex orthographies; (3) no quantitative prediction quality metrics. Adding a note about the TypeScript reality and a brief orthography-normalization example would substantially improve implementability.

