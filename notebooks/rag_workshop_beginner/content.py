"""Everything the notebook works with: the programme, the example sentences and the example questions.

The document is the programme of this workshop (Future Imaginaries of Indigenous AI, Abundant
Intelligences, November 19 and 20, 2026), with its schedule written as prose and short speaker bios,
saved in documents/workshop_programme.txt. The example values were picked with find_demo_values.py.
tests/test_effects.py (embeddings and search) and tests/test_llm_effects.py (the two Qwen models) check
that each one does what the notebook text says.
"""


def _load(name: str) -> str:
    """Read a file from documents/. When the notebook is built, each call is replaced by the text itself."""
    from pathlib import Path

    return (Path(__file__).resolve().parent / "documents" / name).read_text(encoding="utf-8")


# ---------------------------------------------------------------- the programme
_HEADER, _BODY = _load("workshop_programme.txt").split("\n\n", 1)
SOURCE = dict(line.split(": ", 1) for line in _HEADER.splitlines())  # Title, Source, Retrieved, License, Shortened
PROGRAMME = _BODY.strip()  # the programme without its 5-line attribution block
PROGRAMME_URL = SOURCE["Source"]
PROGRAMME_RETRIEVED = SOURCE["Retrieved"]

# ---------------------------------------------------------------- 1. The problem: the AI alone
WORKSHOP = "the Future Imaginaries of Indigenous AI workshop"
NO_DOC_QUESTION = f"When does the hands-on session start at {WORKSHOP}?"
NO_DOC_ANSWER = "1:00"  # in the AI's answer with the programme, not without it
TEACHERS_QUESTION = f"Who gives the introduction to machine learning at {WORKSHOP}?"
TEACHER = "Berard"
# Section 5 asks again, with the programme, in this short form.
WITH_DOC_QUESTION = "When does the hands-on session start?"
NO_DOC_ANSWER_IN_PROGRAMME = "At 1:00 pm, participants start the 75-minute hands-on session"

# ---------------------------------------------------------------- 2. Embeddings
SAME_MEANING = ("We learn about machine learning.", "Students study how AI is trained.")
SAME_WORD = ("We learn about machine learning.", "The washing machine is broken.")
UNRELATED = ("We learn about machine learning.", "I had soup for lunch.")
LOVE_HATE = ("I love winter.", "I hate winter.")

# ---------------------------------------------------------------- 3. Search, over the sections
N_SECTIONS = 20  # the Introduction, 6 sections and 13 speakers; tests/test_effects.py checks it
HIT_QUESTION = "Who are the co-directors of the AIAI Lab?"
HIT_SECTION = "The AIAI Lab"
# The section that holds the answer is not first: the Introduction, which also mentions "an introduction
# to machine learning", comes before it.
MISS_QUESTION = "Who gives the introduction to machine learning?"
MISS_SECTION = "Day 2: Friday, November 20"
MISS_ANSWER = "Hugo Berard and Hamza Abdelhedi"
NONSENSE_QUESTION = "What is the best pizza topping?"

# ---------------------------------------------------------------- 4. Splitting
DEMO_SIZE = 50  # words per chunk in sections 4 to 6
DEMO_OVERLAP = 10
TINY_SIZE = 5
SPLIT_QUESTION = "Who gives the talk Can we trust AI?"
CUT_PHRASE = "Yorguin José Mantilla Ramos gives a 15-minute talk at 2:30 pm"  # cut at DEMO_SIZE words
CUT_SECOND_PART = "gives a 15-minute talk at 2:30 pm"  # how the next chunk starts
SPLIT_ANSWER = "Yorguin"  # in the AI's answer with DEMO_OVERLAP, not without overlap

# ---------------------------------------------------------------- 5. Answering
TOP1_VS_TOP3_QUESTION = "Which room is used on Thursday?"
TOP1_VS_TOP3_ANSWER = "G-129"  # in the AI's answer with top=3, not with top=1
TOP1_VS_TOP3_ANSWER_IN_PROGRAMME = "in room G-129"  # in the 2nd best chunk, not the 1st
OUT_OF_DOC_QUESTION = "What is the Wi-Fi password?"
OUT_OF_DOC_ABSENT = ["password", "wi-fi", "wifi"]

# ---------------------------------------------------------------- 6. Wrap-up
WRAP_UP_QUESTION = MISS_QUESTION  # the question from sections 1 and 3, now with the whole pipeline
WRAP_UP_ANSWER = "Berard"
