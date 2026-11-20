"""Everything the notebook works with: the article, the example sentences and the example questions.

The article is a shortened copy of the Wikipedia article "2026 FIFA World Cup final" (a pinned
revision, CC BY-SA 4.0), saved by fetch_article.py in documents/2026_world_cup_final.txt.
The example values were picked with find_demo_values.py. tests/test_effects.py (embeddings and
search) and tests/test_llm_effects.py (the two Qwen models) check that each one does what the
notebook text says.
"""


def _load(name: str) -> str:
    """Read a file from documents/. When the notebook is built, each call is replaced by the text itself."""
    from pathlib import Path

    return (Path(__file__).resolve().parent / "documents" / name).read_text(encoding="utf-8")


# ---------------------------------------------------------------- the article
_HEADER, _BODY = _load("2026_world_cup_final.txt").split("\n\n", 1)
SOURCE = dict(line.split(": ", 1) for line in _HEADER.splitlines())  # Title, Source, Retrieved, License, Shortened
ARTICLE = _BODY.strip()  # the article without its 5-line attribution block
ARTICLE_URL = SOURCE["Source"]
ARTICLE_RETRIEVED = SOURCE["Retrieved"]
ARTICLE_REVISION = ARTICLE_URL.rsplit("=", 1)[1]

# ---------------------------------------------------------------- 1. The problem: the AI alone
NO_DOC_QUESTION = "How long did the halftime break last in the 2026 World Cup final?"
NO_DOC_ANSWER = "27"  # "over 27 minutes": in the AI's answer with the article, not without it
WINNER_QUESTION = "Who won the 2026 FIFA World Cup final?"
WINNER = "Spain"
# Section 5 asks again, with the article, in this short form: both models answer it. With "in the 2026
# World Cup final" added, Qwen3-0.6B said "I don't know" even with the right chunk (pre-test, 2026-11-20).
WITH_DOC_QUESTION = "How long did the halftime break last?"
NO_DOC_ANSWER_IN_ARTICLE = "halftime break to last over 27 minutes"

# ---------------------------------------------------------------- 2. Embeddings
SAME_MEANING = ("Spain won the final.", "The Spanish team became world champions.")
SAME_WORD = ("Spain won the final.", "This is my final offer.")
UNRELATED = ("Spain won the final.", "I had soup for lunch.")
LOVE_HATE = ("I love winter.", "I hate winter.")

# ---------------------------------------------------------------- 3. Search, over the 8 sections
HIT_QUESTION = "Which awards did Spain's players win?"
HIT_SECTION = "Post-match"
MISS_QUESTION = "Who was the referee of the final?"
MISS_SECTION = "Introduction"  # where the answer is; search does not put it in the top 3
MISS_ANSWER = "Slavko Vinčić"
NONSENSE_QUESTION = "What is the best pizza topping?"

# ---------------------------------------------------------------- 4. Splitting
DEMO_SIZE = 50  # words per chunk in sections 4 to 6
DEMO_OVERLAP = 15
TINY_SIZE = 5
SPLIT_QUESTION = "Why was the goal by Williams disallowed?"
CUT_PHRASE = "the goal was disallowed because Merino had stepped on Otamendi's foot"  # cut at DEMO_SIZE words
SPLIT_ANSWER = "Otamendi"  # in the AI's answer with DEMO_OVERLAP, not without overlap

# ---------------------------------------------------------------- 5. Answering
TOP1_VS_TOP3_QUESTION = "Where was the final played?"
TOP1_VS_TOP3_ANSWER = "MetLife"  # in the AI's answer with top=3, not with top=1
TOP1_VS_TOP3_ANSWER_IN_ARTICLE = "played at MetLife Stadium"  # in the 2nd best chunk, not the 1st
# Our shortened copy mentions the halftime show but not who performed: fetch_article.py drops the full
# article's "Halftime show" section, which names the performers.
OUT_OF_DOC_QUESTION = "Who performed at the halftime show?"
OUT_OF_DOC_ABSENT = ["performed", "performer", "sang", "singer", "concert"]

# ---------------------------------------------------------------- 6. Wrap-up
WRAP_UP_QUESTION = MISS_QUESTION  # the question search missed in section 3, now with the whole pipeline
WRAP_UP_ANSWER = "Vinčić"
