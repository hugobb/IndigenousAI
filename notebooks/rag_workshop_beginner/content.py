"""Everything the notebook works with: the programme, the excerpt drawn in step 1, and the question.

The document is the programme of this workshop (Future Imaginaries of Indigenous AI, Abundant
Intelligences, November 19 and 20, 2026), with its schedule written as prose and short speaker bios,
saved in documents/workshop_programme.txt. tests/test_effects.py (MiniLM) and tests/test_llm_effects.py
(the two Qwen models) check that the defaults below do what the notebook text says.
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

# ---------------------------------------------------------------- 1. Chunking
# The part of the programme drawn in step 1: the start of the Day 2 schedule, which holds the answer.
_DAY2 = PROGRAMME.split("== Day 2: Friday, November 20 ==\n", 1)[1]
EXCERPT = _DAY2[: _DAY2.index("until noon.") + len("until noon.")]
SIZE = 60  # words per chunk, the default in step 1
OVERLAP = 10
TRY_SIZE = 80  # step 2 suggests it: the chunk with the answer drops out of the top 3

# ---------------------------------------------------------------- 2. Retrieval and 3. Generation
QUESTION = "Who gives the introduction to machine learning?"
ANSWER = "Hugo Berard and Hamza Abdelhedi"  # in the best chunk at SIZE and OVERLAP
NAME = "Berard"  # in the AI's answer with the chunks, not without them

# ---------------------------------------------------------------- Before RAG: the AI alone
ALONE_QUESTION = "When does the hands-on session start at the Future Imaginaries of Indigenous AI workshop?"
ALONE_ANSWER = "1:00"  # 1:00 pm in the programme; the AI alone does not say it
