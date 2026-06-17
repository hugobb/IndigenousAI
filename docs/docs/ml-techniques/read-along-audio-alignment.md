
# Read-Along Audio Alignment (Zero-Shot Forced Alignment)

**Category:** ML Technique
**Data Regime:** zero-resource (no training data in the target language required); requires only a text transcript and an audio recording
**Applicable Languages:** Any language that can be phonetically transcribed to IPA; demonstrated on 22 languages including Kanyen'kéha, Inuktut, East Cree, SENĆOŦEN, Seneca, and 13 other Indigenous languages of Canada

## Description

Read-along audio alignment automatically synchronizes a written text with its audio recording at the word level, enabling interactive read-along materials where each word highlights as it is spoken and learners can click any word to hear it pronounced. This technique is critical for Indigenous language education because Elder speech recordings are a primary revitalization resource, but creating read-along materials manually requires specialized expertise (ELAN, Audacity) and is extremely labor-intensive.

The technique operates in **zero-shot mode** — no audio or text data in the target language is needed for training. Instead, it builds an approximate phoneme mapping between the target language and a high-resource donor language (English in the NRC implementation), and trains an acoustic model on the donor language to recognize when each target-language word is spoken.

**Pipeline components:**

1. **G2P (Grapheme-to-Phoneme) engine:** Converts the target language's written text into a phoneme sequence (IPA or language-specific phoneme inventory). NRC Canada uses a custom G2P engine that works from a grapheme-to-IPA phoneme table, which the community or linguist provides.

2. **Phonetic distance mapping (PanPhon):** The PanPhon library computes phonetic distances between phonemes using articulatory feature vectors. For each target-language phoneme, it finds the most acoustically similar phoneme in the donor language's inventory. This creates an approximate pronunciation lexicon that allows the donor-language acoustic model to recognize approximate renditions of target-language phones.

3. **Acoustic model (donor language):** A lightweight speech recognition model (PocketSphinx, trained on English) is used to perform forced alignment — finding the time boundaries of each word in the audio given the transcript. The acoustic model never needs to be retrained for each new language.

4. **Forced alignment output:** The aligner produces a time-stamped word segmentation — each word token in the transcript receives a start time and end time in the audio. This is the information needed to drive word highlighting in the interactive player.

5. **ReadAlong Studio (interactive player):** NRC Canada's open-source tool packages the transcript and alignment into interactive web pages, MP4 videos, and EPUB documents. Words highlight as they are spoken; learners can click any word to replay its audio. Output can also be exported in ELAN, TextGrid (Praat), and subtitle formats for further annotation.

**Why this is valuable:** Elder recordings are already being made by communities; the bottleneck is not recording but alignment — without alignment, recordings sit in archives as undifferentiated audio files. Automated alignment transforms archived audio from a passive archive into an interactive learning tool. The NRC team reports that "educators find the end product very useful" and that the team cannot keep up with community demand for read-along materials.

## When to Use

- A community has recordings of Elder speech (or songs, stories, oral narratives) paired with a written transcript, and wants to create interactive read-along materials.
- The language has a standardized or semi-standardized orthography, or a linguist can provide a grapheme-to-IPA phoneme table.
- No language-specific audio training data exists — zero-shot is the only option for most Indigenous languages at current data levels.
- Educators want to create materials that can be used independently by learners (not just in the classroom with a teacher present).
- The goal is rapid production of many materials, not a single high-quality product — automated alignment enables batch production at scale.

**Less applicable when:**
- No written transcript exists for the audio — forced alignment requires a transcript. (Transcription must happen first; this tool does not transcribe audio, it aligns text to audio.)
- The language has a highly tonal phonology or complex phonation contrasts not captured by PanPhon feature vectors — alignment accuracy may degrade.
- Phoneme-level (sub-word) alignment is needed — this technique aligns at the word level.

## How to Apply

1. **Prepare the text-audio pair.** Obtain a recording and its transcript. The transcript must match the audio content — it need not be perfectly transcribed before alignment, but major omissions or insertions will cause alignment errors.

2. **Provide a grapheme-to-IPA phoneme table for the language.** This is a simple mapping of each character (or character sequence representing a phoneme) in the language's orthography to an IPA symbol. For a language with a well-documented orthography, this takes a few hours of linguist time to produce.

3. **Run the G2P engine.** Convert the transcript to a phoneme sequence using the phoneme table. Validate a sample of the output against known pronunciations.

4. **Run ReadAlong Studio.**
   - Input: audio file + phoneme-converted transcript.
   - The system internally runs PanPhon to map target-language phonemes to donor-language phonemes, then uses PocketSphinx forced alignment.
   - Output: time-stamped word boundaries.

5. **Generate the read-along artifact.**
   - ReadAlong Studio produces: interactive web component (embeddable in any website), MP4 video (for YouTube/offline distribution), EPUB (for e-readers).
   - Review a sample of alignments and manually correct any major errors (particularly at the starts and ends of utterances, or around filled pauses and hesitations).

6. **Distribute to the community.** Interactive web components can be embedded in a community language learning website or Moodle course. EPUB versions can be distributed via tablets. MP4 versions can be shared via WhatsApp or YouTube.

## Pseudocode

```
// Zero-shot forced alignment pipeline

// Step 1: Prepare inputs
transcript = load_text("story.txt")               // written transcript in target language
audio = load_audio("elder_recording.wav")

// Step 2: G2P conversion using community-provided phoneme table
phoneme_table = load_phoneme_table("kanyen_keha_g2p.tsv")  // {grapheme → IPA}
phoneme_transcript = g2p_convert(transcript, phoneme_table)

// Step 3: Cross-lingual phoneme mapping via PanPhon
donor_inventory = load_ipa_inventory("english")
target_inventory = extract_phonemes(phoneme_transcript)

phoneme_mapping = {}
for target_phoneme in target_inventory:
    target_features = panphon.featurize(target_phoneme)
    donor_phoneme = argmin(
        [panphon.distance(target_features, panphon.featurize(d)) for d in donor_inventory]
    )
    phoneme_mapping[target_phoneme] = donor_phoneme

mapped_transcript = apply_mapping(phoneme_transcript, phoneme_mapping)

// Step 4: Forced alignment using donor-language acoustic model
acoustic_model = load_pocketsphinx("english_acoustic_model")
alignment = acoustic_model.forced_align(
    audio = audio,
    transcript = mapped_transcript   // approximate donor-language phoneme sequence
)
// alignment = [{word: "kathsóris", start: 0.42, end: 1.15}, ...]

// Step 5: Generate read-along artifact
readalong = ReadAlongStudio.build(
    text = transcript,
    alignment = alignment,
    outputs = ["web_component", "mp4", "epub"]
)
readalong.export("output/")
```

## Evidence

**Kuhn et al. (2020) — COLING 2020, NRC Canada ILT project:**

- ReadAlong Studio supports 22 languages as of 2020; among Indigenous languages of Canada: Anishinaabemowin (Ojibway), Atikamekw, Dakelh, East Cree, Gitxsan, Heiltsuk, Inuktut, Kanyen'kéha, Kwak'wala, SENĆOŦEN, Seneca, Tagish, Tŝilhqot'in, and Tsuut'ina.
- Adding a new language requires "only a few hours" of work, depending on orthographic complexity.
- Prototype use case: interactive "read-along/sing-along" audiobooks for East Cree, inspired by activities developed at Carleton University (eastcree.org). These materials were already well-liked by students and teachers but previously required expert manual alignment with ELAN or Audacity.
- The NRC team reports "already received reports of significant productivity improvements due to their use in speech preprocessing in the field."
- Zero-shot design: "text/audio alignment (also called 'forced alignment') is feasible to perform in a 'zero-shot' scenario (that is, where there is no data available in the language in question)."

## Variations & Configuration

- **G2P quality:** The quality of the phoneme table determines alignment accuracy. For languages with complex morphophonology (allophony, stress-dependent reduction), more detailed G2P rules improve alignment. A simple one-to-one grapheme-to-IPA mapping is sufficient for initial deployment.
- **Donor language:** English is the default donor acoustic model. For communities where French or another high-resource language is the L2, a French acoustic model may produce better phoneme mapping for languages with phonology closer to French.
- **ELAN/TextGrid export:** For communities building annotated corpora alongside read-along materials, ReadAlong Studio can export alignment in ELAN or Praat formats, enabling further phonetic annotation by linguists.
- **Phrase-level alignment fallback:** If word-level alignment fails for a segment (the aligner cannot find a word boundary), falling back to phrase-level alignment (aligning full utterances) preserves usability.
- **Manual correction workflow:** ReadAlong Studio includes tools for reviewing and manually adjusting alignments, enabling a human-in-the-loop quality control pass before distribution.

## Code & Tools

- **ReadAlong Studio (open-source):** https://github.com/ReadAlongs/Studio — NRC Canada's full pipeline; Python package; generates web components, MP4, EPUB.
- **ReadAlong Web Component:** https://github.com/ReadAlongs/Web-Component — the interactive JavaScript player; embeddable in any website.
- **PanPhon:** https://github.com/dmort27/panphon — phonetic distance library using articulatory feature vectors; used for cross-lingual phoneme mapping.
- **PocketSphinx:** https://github.com/cmusphinx/pocketsphinx — lightweight CMU speech recognizer used as the donor-language alignment engine.
- **Festival toolkit / G2P:** Black et al. (1998); used for grapheme-to-phoneme conversion in the original ReadAlong implementation.
- **ELAN:** https://archive.mpi.nl/tla/elan — annotation tool for validating and correcting alignments; accepts ReadAlong TextGrid export.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Zero-shot — no Indigenous language audio training data required | Alignment quality is lower than a language-matched acoustic model; errors are common around disfluencies, rare words, and segments with unusual prosody |
| Transforms archived Elder recordings into interactive learning tools without manual annotation | Requires a written transcript — the transcription bottleneck must be resolved first |
| Adding a new language takes only a few hours of linguist time (phoneme table) | Phoneme mapping via PanPhon is an approximation; languages with phonemes very distant from English may have higher alignment error rates |
| Produces multiple output formats (web, video, EPUB) for different distribution contexts | Word-level alignment; sub-word (phoneme-level) alignment is not currently supported |
| Open-source and maintained by NRC Canada; actively extended | The interactive player is a supplement to oral instruction, not a substitute; materials must be integrated into pedagogy by teachers |
| Supports export to ELAN/Praat for corpus annotation workflows | Limited to languages where a phoneme table can be constructed; languages with undocumented phonology require prior linguistic analysis |

## References

- Kuhn, R., et al. (2020). The Indigenous Languages Technology project at NRC Canada: An empowerment-oriented approach to developing language software. *COLING 2020*, pp. 5866–5878.
- Black, A. W., Lenzo, K. A., & Pagel, V. (1998). Issues in building general letter to sound rules. *3rd ESCA/COCOSDA Workshop on Speech Synthesis*.
- Mortensen, D. R., et al. (2016). PanPhon: Accessing Phonological Features of IPA Transcriptions Programmatically. *COLING 2016*.
- Huggins-Daines, D., et al. (2006). Pocketsphinx: A free, real-time continuous speech recognition system for hand-held devices. *ICASSP 2006*.
- Wittenburg, P., et al. (2006). ELAN: a Professional Framework for Multimodality Research. *LREC 2006*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — The six-step How to Apply section is clear and action-oriented. Steps 1–5 map directly onto the pseudocode. However, the G2P phoneme table format is described as "a simple mapping of each character to an IPA symbol" without showing what the `.tsv` actually looks like (column headers, multi-character grapheme handling). The `g2p_convert()` function in the pseudocode is a black box — for languages with context-sensitive grapheme-to-phoneme rules (e.g., a digraph `kw` that maps to a single IPA symbol), a first-time implementer would not know how to handle this. PocketSphinx's `forced_align()` API call is presented without indicating the required audio format (sample rate, mono/stereo), which is a common practical stumbling block.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — The doc names 22 supported languages and lists 14 specific Indigenous Canadian languages by name, which is concrete. It cites "only a few hours" to add a new language and "significant productivity improvements." However, no alignment accuracy metric (e.g., word boundary error rate, percentage of words within 100ms of correct boundary) is reported. The zero-shot claim is well-supported conceptually but no quantitative comparison to manual ELAN alignment or to a supervised baseline is provided.

    **Criterion 3 — Data regime / context clarity:** PASS — The header explicitly states "zero-resource (no training data in the target language required)" and the description explains why (donor-language acoustic model + cross-lingual phoneme mapping). The transcript prerequisite is clearly stated in both the description and the Less Applicable section. The comment about tonal languages as a potential failure context is appropriately flagged.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The pipeline pseudocode is the clearest of the five docs reviewed. The PanPhon `argmin` loop correctly captures the cross-lingual mapping logic. Gaps: (1) `g2p_convert()` is undefined for multi-character graphemes; (2) the `forced_align()` call omits the dictionary/pronunciation lexicon argument that PocketSphinx requires (the mapped transcript must also be compiled into a pronunciation dictionary before alignment); (3) `ReadAlongStudio.build()` is a reasonable abstraction but the actual CLI invocation (`readalong align`) is not shown.

    **Criterion 5 — Failure modes:** PASS — The Weaknesses table explicitly calls out: alignment errors around disfluencies/rare words/unusual prosody, the transcription bottleneck, PanPhon approximation errors for phonemes distant from English, word-level-only granularity, and the requirement for prior phonological documentation. The "phrase-level alignment fallback" in Variations also documents a mitigation for word-level failure. This is the best-documented failure modes section of the five docs.

    **Overall:** The strongest of the three ML technique docs on failure modes and data regime clarity. Main gaps are in pseudocode completeness: the G2P multi-character grapheme case and the PocketSphinx pronunciation dictionary requirement are non-trivial omissions that would block a first-time implementer. Adding a 3-row example phoneme table and noting the pronunciation dictionary compilation step would close the implementability gap.

