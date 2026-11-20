"""Pick the example values the notebook uses, and save the real numbers the slides show.

    uv run --with-requirements requirements.txt python find_demo_values.py
        MiniLM only, about 20 seconds. Tries the candidates below in order, prints what each one
        does, checks that the picks in content.py show their effect, and writes demo_values.json
        (answers saved by an earlier --answers run are kept).

    uv run --with-requirements requirements.txt python find_demo_values.py --answers Qwen/Qwen3-1.7B
        Also records that model's answers, without and with the article (about 4 GB of memory;
        Qwen/Qwen3-0.6B needs about 2.5 GB).

The effects that need the AI (it does not know alone, it says "I don't know") are checked by
tests/test_llm_effects.py, not here.
"""

import argparse
import contextlib
import io
import json
import sys
from pathlib import Path

import content as c
import toolkit
from toolkit import (
    CHAT_MODEL_CPU,
    CHAT_MODEL_GPU,
    EMBED_MODEL,
    FakeGenerator,
    MiniLMEmbedder,
    Models,
    QwenGenerator,
    build_prompt,
    chunk_overlap,
    score,
    sections,
    top_passages,
    where_is,
)

HERE = Path(__file__).resolve().parent
OUT = HERE / "demo_values.json"
NONSENSE_MAX = 0.3  # "every score is low"
CLOSE_MIN = 0.5  # "I love winter." / "I hate winter." count as close above this

# Candidates, in the order they are tried: the first that shows its effect with MiniLM is marked "pick".
# The answer examples were also put to both Qwen models (CPU, bfloat16, 2026-11-20); the notes say why
# a candidate that MiniLM accepts was dropped.
CANDIDATES = {
    "hit": [  # (question, the section that should come first)
        ("Which awards did Spain's players win?", "Post-match"),
        ("Why was the goal by Williams disallowed?", "Match: Extra time"),
        ("What was the weather like at kick-off?", "Match: First half"),
    ],
    "miss": [  # (question, the section that holds the answer, the answer): that section is not in the top 3
        ("Who was the referee of the final?", "Introduction", "Slavko Vinčić"),
        ("When did Argentina win the World Cup before?", "Background", "1978 and 1986"),
    ],
    "nonsense": ["What is the best pizza topping?", "How do I bake banana bread?"],
    "cut": [  # (question, phrase): at DEMO_SIZE words the phrase is cut in two; DEMO_OVERLAP puts it back
        ("Why was the goal by Williams disallowed?", "the goal was disallowed because Merino had stepped on Otamendi's foot"),
        ("When did Argentina win the World Cup before?", "Argentina had previously won the World Cup in 1978 and 1986"),
    ],
    "with_documents": [  # (question, answer): the best chunk holds the answer (section 5, WITH_DOC_QUESTION)
        ("How long did the halftime break last?", "over 27 minutes"),
        ("What was the weather like at kick-off?", "80 °F"),
        ("What did Messi and Yamal do after the match?", "embraced"),
        ("Who won the 2026 FIFA World Cup final?", "victory for Spain"),  # MiniLM: the answer chunk ranks 21st
    ],
    # Asked with "in the 2026 World Cup final" (as in section 1), the halftime question made Qwen3-0.6B say
    # "I don't know" with the right chunk; "What did Messi and Lamine Yamal do after the 2026 World Cup
    # final?" did the same to Qwen3-1.7B. So section 5 asks the short form.
    "top1_vs_top3": [  # (question, answer): not in the best chunk, but in the 2nd or 3rd
        ("Where was the final played?", "played at MetLife Stadium"),
        ("Who was sent off in the final?", "Fernández was sent off"),  # top=3: 1.7B said Martínez, 0.6B "don't know"
        ("Who was the best goalkeeper of the tournament?", "Golden Glove"),  # top=3: 0.6B said "I don't know"
    ],
    "wrap_up": [  # (question, answer): the best chunk holds the answer
        ("Who was the referee of the final?", "Slavko Vinčić"),
        ("Who refereed the final?", "Slavko Vinčić"),
        ("Who was named man of the match?", "man of the match"),  # 0.6B said "I don't know"
    ],
}


def norm(text: str) -> str:
    return " ".join(text.split()).lower()


def has(text: str, phrase: str) -> bool:
    return norm(phrase) in norm(text)


def heading(passage: str) -> str:
    return passage.splitlines()[0]


def chunks_of(size: int, overlap: int = 0) -> list[str]:
    """What split(ARTICLE, size, overlap) returns in the notebook, without its message."""
    return chunk_overlap(c.ARTICLE, size, overlap) if size > 0 else [c.ARTICLE.strip()]


def shown(passage: str) -> str:
    """The part of a passage that search() and ask_with_documents() print."""
    return toolkit._short(passage)


def printed(function, *args, **kwargs) -> str:
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        function(*args, **kwargs)
    return out.getvalue()


def top_sections(question: str, top: int = 3) -> list[tuple[str, float]]:
    return [(heading(p), s) for s, p in top_passages(question, sections(c.ARTICLE), top)]


# ---------------------------------------------------------------- the effects
def is_hit(question, section):
    return top_sections(question, 1)[0][0] == section


def is_miss(question, section, answer):
    passage = next(p for p in sections(c.ARTICLE) if heading(p) == section)
    return has(passage, answer) and section not in [h for h, _ in top_sections(question, 3)]


def is_nonsense(question):
    return max(s for _, s in top_sections(question, 8)) < NONSENSE_MAX


def chunks_find(question, answer, size, overlap=0):
    """The best chunk holds the answer, in the part that is printed."""
    (_, best), = top_passages(question, chunks_of(size, overlap), 1)
    return has(shown(best), answer)


def tiny_loses(question, answer, size):
    return not any(has(p, answer) for _, p in top_passages(question, chunks_of(size), 3))


def whole_scores_lower(question, size):
    (whole, _), = top_passages(question, chunks_of(0), 1)
    (best, _), = top_passages(question, chunks_of(size), 1)
    return whole < best


def is_cut(phrase, size, overlap):
    cut = printed(where_is, chunks_of(size), phrase)
    whole = printed(where_is, chunks_of(size, overlap), phrase)
    return "was cut in two" in cut and "is in chunk" in whole


def top1_misses_top3_finds(question, answer, size, overlap):
    found = [has(p, answer) for _, p in top_passages(question, chunks_of(size, overlap), 3)]
    return not found[0] and any(found[1:])


def pairs_in_order():
    same, word, unrelated = (score(*pair) for pair in (c.SAME_MEANING, c.SAME_WORD, c.UNRELATED))
    return same > word and same > unrelated and score(*c.LOVE_HATE) > CLOSE_MIN


# ---------------------------------------------------------------- picking
def report() -> list[str]:
    """Print each candidate with its numbers; return the problems with the picks in content.py."""
    size, overlap = c.DEMO_SIZE, c.DEMO_OVERLAP
    checks = {
        "hit": lambda q, s: is_hit(q, s),
        "miss": lambda q, s, a: is_miss(q, s, a),
        "nonsense": lambda q: is_nonsense(q),
        "cut": lambda q, p: is_cut(p, size, overlap),
        "with_documents": lambda q, a: chunks_find(q, a, size, overlap),
        "top1_vs_top3": lambda q, a: top1_misses_top3_finds(q, a, size, overlap),
        "wrap_up": lambda q, a: chunks_find(q, a, size, overlap),
    }
    for kind, candidates in CANDIDATES.items():
        print(f"\n{kind}")
        picked = False
        for candidate in candidates:
            args = candidate if isinstance(candidate, tuple) else (candidate,)
            ok = checks[kind](*args)
            mark = "pick" if ok and not picked else ("ok" if ok else "no")
            picked = picked or ok
            print(f"  {mark:4s}  {args[0]}   top 3 sections: {top_sections(args[0])}")

    problems = []
    expect = {
        "HIT_QUESTION comes first in HIT_SECTION": is_hit(c.HIT_QUESTION, c.HIT_SECTION),
        "MISS_SECTION holds MISS_ANSWER and is not in the top 3": is_miss(c.MISS_QUESTION, c.MISS_SECTION, c.MISS_ANSWER),
        "NONSENSE_QUESTION scores low everywhere": is_nonsense(c.NONSENSE_QUESTION),
        "chunks of DEMO_SIZE find MISS_ANSWER, on screen": chunks_find(c.MISS_QUESTION, c.MISS_ANSWER, size),
        "TINY_SIZE chunks lose MISS_ANSWER": tiny_loses(c.MISS_QUESTION, c.MISS_ANSWER, c.TINY_SIZE),
        "the whole article (0) scores lower than DEMO_SIZE": whole_scores_lower(c.MISS_QUESTION, size),
        "CUT_PHRASE cut at DEMO_SIZE, whole with DEMO_OVERLAP": is_cut(c.CUT_PHRASE, size, overlap),
        "WITH_DOC_QUESTION finds its answer in the best chunk": chunks_find(c.WITH_DOC_QUESTION, c.NO_DOC_ANSWER_IN_ARTICLE, size, overlap),
        "TOP1_VS_TOP3 answer in chunk 2 or 3, not 1": top1_misses_top3_finds(c.TOP1_VS_TOP3_QUESTION, c.TOP1_VS_TOP3_ANSWER_IN_ARTICLE, size, overlap),
        "WRAP_UP_ANSWER in the best chunk": chunks_find(c.WRAP_UP_QUESTION, c.WRAP_UP_ANSWER, size, overlap),
        "similarity pairs in order": pairs_in_order(),
    }
    print("\npicks in content.py")
    for name, ok in expect.items():
        print(f"  {'ok' if ok else 'FAILS'}  {name}")
        if not ok:
            problems.append(name)
    return problems


def ranked(question: str, passages: list[str], top: int = 3) -> list[dict]:
    return [{"passage": heading(p) if "\n" in p else shown(p), "score": round(s, 2)} for s, p in top_passages(question, passages, top)]


def minilm_values() -> dict:
    """Everything in demo_values.json except the AI's answers. Needs toolkit.MODELS with MiniLM."""
    size, overlap = c.DEMO_SIZE, c.DEMO_OVERLAP
    passages = sections(c.ARTICLE)
    chunks, with_overlap = chunks_of(size), chunks_of(size, overlap)
    best = top_passages(c.WITH_DOC_QUESTION, with_overlap, 3)
    return {
        "article": {
            "title": c.SOURCE["Title"], "url": c.ARTICLE_URL, "retrieved": c.ARTICLE_RETRIEVED,
            "license": c.SOURCE["License"], "words": len(c.ARTICLE.split()), "sections": [heading(p) for p in passages],
        },
        "models": {"embeddings": EMBED_MODEL, "answers_gpu": CHAT_MODEL_GPU, "answers_cpu": CHAT_MODEL_CPU},
        "similarity_pairs": [
            {"kind": kind, "a": a, "b": b, "score": round(score(a, b), 2)}
            for kind, (a, b) in [
                ("same meaning, different words", c.SAME_MEANING),
                ("same word, different meaning", c.SAME_WORD),
                ("unrelated", c.UNRELATED),
                ("opposite opinions, same topic", c.LOVE_HATE),
            ]
        ],
        "search_example": {"question": c.HIT_QUESTION, "passages": "the 8 sections", "top3": ranked(c.HIT_QUESTION, passages)},
        "miss_example": {"question": c.MISS_QUESTION, "answer": c.MISS_ANSWER, "answer_in": c.MISS_SECTION,
                         "top3": ranked(c.MISS_QUESTION, passages)},
        "nonsense_example": {"question": c.NONSENSE_QUESTION, "top3": ranked(c.NONSENSE_QUESTION, passages)},
        "split_demo": {
            "words_per_chunk": size, "overlap": overlap, "tiny_size": c.TINY_SIZE,
            "chunks": len(chunks), "chunks_with_overlap": len(with_overlap),
            "referee_top1": ranked(c.MISS_QUESTION, chunks, 1)[0],
            "referee_top3_tiny": ranked(c.MISS_QUESTION, chunks_of(c.TINY_SIZE)),
            "referee_whole_article": ranked(c.MISS_QUESTION, chunks_of(0), 1)[0]["score"],
            "phrase": c.CUT_PHRASE,
            "cut": printed(where_is, chunks, c.CUT_PHRASE).strip(),
            "with_overlap": printed(where_is, with_overlap, c.CUT_PHRASE).strip(),
        },
        "prompt_example": {
            "question": c.WITH_DOC_QUESTION, "top": 3, "scores": [round(s, 2) for s, _ in best],
            "prompt": build_prompt(c.WITH_DOC_QUESTION, [p for _, p in best], allow_unknown=True),
        },
    }


def record_answers(model_name: str) -> dict:
    """The model's answers without the article (section 1) and with it (section 5), as the notebook prints them."""
    toolkit.MODELS = Models(toolkit.MODELS.embedder, QwenGenerator(model_name, "cpu"), "cpu", model_name)

    def answer_part(text: str) -> str:
        return text.split("Answer:\n", 1)[1].strip()

    with_documents = chunks_of(c.DEMO_SIZE, c.DEMO_OVERLAP)
    return {
        "question_without_documents": c.NO_DOC_QUESTION,
        "question_with_documents": c.WITH_DOC_QUESTION,
        "device": "cpu, bfloat16 (Colab's GPU runs float32, so its wording can differ)",
        "without_documents": answer_part(printed(toolkit.ask, c.NO_DOC_QUESTION)),
        "with_documents": answer_part(printed(toolkit.ask_with_documents, c.WITH_DOC_QUESTION, with_documents)),
        "winner_without_documents": answer_part(printed(toolkit.ask, c.WINNER_QUESTION)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--answers", metavar="MODEL", help="also record this Qwen model's answers")
    args = parser.parse_args()

    toolkit.MODELS = Models(MiniLMEmbedder("cpu"), FakeGenerator(), "cpu", "fake")
    problems = report()
    if problems:
        sys.exit("These picks in content.py do not show their effect: " + "; ".join(problems))

    values = minilm_values()
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    values["answers"] = old.get("answers", {})
    if args.answers:
        values["answers"][args.answers] = record_answers(args.answers)
    OUT.write_text(json.dumps(values, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {OUT}")


if __name__ == "__main__":
    main()
