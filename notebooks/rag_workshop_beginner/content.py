"""Every piece of text the workshop uses: the two documents, the example sentences and the preset questions.

The two documents come from the RAG trust tests kit (corpus/easy/):
- CARE paper: Carroll et al. (2020), The CARE Principles for Indigenous Data Governance,
  Data Science Journal 19:43, https://doi.org/10.5334/dsj-2020-043, CC BY 4.0.
- Example Community Data Charter: FICTIONAL, written for the kit, CC0 1.0.
"""

import re
from dataclasses import dataclass, field


def _load(name: str) -> str:
    """Read a file from documents/. When the notebook is built, each call is replaced by the text itself."""
    from pathlib import Path

    return (Path(__file__).resolve().parent / "documents" / name).read_text(encoding="utf-8")


@dataclass
class QuestionSpec:
    question: str
    keywords: list[str] = field(default_factory=list)  # a passage "contains the answer" if it has all of them


# ---------------------------------------------------------------- the two documents
def _charter_text(raw: str) -> str:
    """Keep the two-line FICTIONAL label, drop the kit's notes about how the file was made."""
    lines = raw.splitlines()
    return "\n".join(lines[:2] + lines[7:]).strip()


def _care_text(raw: str) -> str:
    """Drop the licence header (shown in the notebook instead) and the '## ' heading marks."""
    body = raw.split("Abstract and main text follow.", 1)[1]
    return re.sub(r"^## (.+)$", r"\1.", body, flags=re.MULTILINE).strip()


CHARTER_TITLE = "Example Community Data Charter (fictional)"
CHARTER = _charter_text(_load("example_community_data_charter_FICTIONAL.txt"))
CARE_TITLE = "The CARE Principles for Indigenous Data Governance (Carroll et al. 2020)"
CARE_PAPER = _care_text(_load("care_principles.txt"))
CARE_CREDIT = (
    "Carroll, S. R., et al. (2020). The CARE Principles for Indigenous Data Governance. "
    "Data Science Journal, 19: 43. https://doi.org/10.5334/dsj-2020-043. "
    "CC BY 4.0. Changes: converted to plain text; figures, headers and references removed."
)

# The charter's sections: the passages searched in section 3.
CHARTER_SECTIONS = [" ".join(s.split()) for s in re.findall(r"Section \d+\..*?(?=\nSection \d+\.|\Z)", CHARTER, flags=re.S)]

# ---------------------------------------------------------------- preset questions (chunking section, about the charter)
DAYS_QUESTION = QuestionSpec("How long does the Council take to answer an outside request?", ["within 45 days"])
VOTE_QUESTION = QuestionSpec(
    "How is an outside request approved?", ["seven of the nine"]
)
CARE_LETTERS_QUESTION = QuestionSpec("What does CARE stand for in the charter?", ["Consent, Access, Review and Exit"])
WITHDRAW_QUESTION = QuestionSpec("How quickly is a withdrawn record deleted?", ["within 30 days"])
CARE_FULL_QUESTION = QuestionSpec("When does a project count as CARE Full?", ["any two of the four"])

CHARTER_QUESTIONS = [DAYS_QUESTION, VOTE_QUESTION, CARE_LETTERS_QUESTION, WITHDRAW_QUESTION, CARE_FULL_QUESTION]

# At DEMO_GOOD_SIZE words, a cut falls inside the answer to this one: chunk ends with CUT_BEFORE, next starts with CUT_AFTER.
SPLIT_QUESTION = VOTE_QUESTION
CUT_BEFORE = "A request is approved"
CUT_AFTER = "only if at least seven"

# Chunk sizes (in words) that the exercises refer to. All verified by tests/test_effects.py.
DEMO_GOOD_SIZE = 60   # every charter question but the vote one is found at this size
DEMO_OVERLAP = 15     # at DEMO_GOOD_SIZE, this overlap puts the vote answer back in one chunk
DEMO_TINY_SIZE = 5    # chunks too short: the 45-day answer is not found, with or without overlap

# Section 1 (the AI alone) and section 5 (the full system, over both documents).
PROBLEM_QUESTION = QuestionSpec(
    "How long does the Example Community Data Council take to answer an outside request?", ["within 45 days"]
)
# Over both documents, search puts this answer 2nd: Passages = 1 misses it, Passages = 3 finds it (tested).
STORAGE_QUESTION = QuestionSpec("Where does the Council keep its records?", ["two computers"])
# Not in either document: a good test of "I don't know".
OUT_OF_DOC_QUESTION = "What is the phone number of the Example Community Data Council?"
# The two documents disagree on this one: the charter redefines CARE.
CONFLICT_QUESTION = "What does CARE stand for?"

# ---------------------------------------------------------------- search section (over CHARTER_SECTIONS)
SEARCH_EXAMPLE = "Can outside companies store our records?"          # Section 8 comes first (tested)
SEARCH_MISS_EXAMPLE = "Who decides if an outside researcher can use the records?"  # answer is Section 6; it is not first (tested)
SEARCH_NOTHING_EXAMPLE = "What's the best pizza topping?"              # every score is low (tested)

# ---------------------------------------------------------------- embedding exercises
SIMILARITY_PAIRS = [
    (  # same meaning, almost no shared words
        "Communities have the right to control data collected about them.",
        "Indigenous peoples should govern how their information is stored and used.",
    ),
    (  # shared word, different meaning
        "Members can withdraw a record at any time.",
        "She broke the world record in the marathon.",
    ),
    (  # unrelated
        "Communities have the right to control data collected about them.",
        "I love to ride my bike on Sunday mornings.",
    ),
]

MAP_SENTENCES = [
    ("No record is collected without a signed consent form.", "asking permission"),
    ("People must agree before their stories are recorded.", "asking permission"),
    ("Elders are asked for permission before photos are taken.", "asking permission"),
    ("Participants can say no to the study at any time.", "asking permission"),
    ("All records are kept on two computers in the office.", "storing data"),
    ("The files are locked in a cabinet and backed up every night.", "storing data"),
    ("Passwords protect the database from strangers.", "storing data"),
    ("The recordings are saved on a server in the community.", "storing data"),
    ("Profits from the research must return to the community.", "sharing benefits"),
    ("The language app was built to help children learn.", "sharing benefits"),
    ("Researchers share their results with the people who took part.", "sharing benefits"),
    ("Jobs created by the project go to local youth.", "sharing benefits"),
    ("Simmer the soup slowly with onions and garlic.", "cooking"),
    ("Fresh bread is best eaten warm from the oven.", "cooking"),
    ("She added a pinch of salt to the sauce.", "cooking"),
    ("We roasted vegetables for the family dinner.", "cooking"),
]
