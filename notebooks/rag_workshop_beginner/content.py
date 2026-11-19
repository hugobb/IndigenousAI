"""Every piece of text the workshop uses: the fictional report, the short real passages,
the example sentences and the preset questions."""

from dataclasses import dataclass, field


@dataclass
class QuestionSpec:
    question: str
    keywords: list[str] = field(default_factory=list)  # a passage "contains the answer" if it has all of them


# ---------------------------------------------------------------- the fictional report
REPORT_TITLE = "Millbrook River Watch — 2025 Annual Report"

REPORT = """\
Millbrook River Watch is a fictional volunteer group, invented for this workshop. None of the people, places or numbers below are real.

A word from the coordinator. This was our eleventh year of looking after the Millbrook River, and our busiest one yet. When Dana Whitlock started the group in 2014, it was six neighbours with a bucket, a notebook and a borrowed thermometer. Today we are a registered charity with a small office above the hardware store on Elm Street, and we share what we learn with the town council every season. I want to thank every volunteer who stood in cold water at seven in the morning so that the rest of the town could know whether the river was healthy.

Our volunteers. In 2025, 143 people volunteered with us at least once, and 38 of them were new this year. Most volunteers join a monthly testing shift, which takes about three hours. A smaller group of twenty people helps with school visits, the newsletter and our spring clean-up. Our youngest volunteer this year was nine years old and came with her grandfather; our oldest was eighty-four. We also welcomed our first group of students from Millbrook High School, who now test two sites as part of their science class.

Where and how we test. We test the water at twelve sites along the river, from the springs above Ashford Farm down to the old mill at the edge of town. At each site, volunteers measure the water temperature, how cloudy the water is, how much oxygen it holds, and the level of E. coli bacteria, which tells us whether sewage or animal waste is getting into the river. Each sample is labelled, kept cold, and carried to our partner laboratory at Harlow College within six hours. The results come back within two days and are entered into our records by a trained volunteer.

What we found. Overall, the river was in slightly better health than in 2024. Oxygen levels were good at ten of the twelve sites for most of the year. Summer was hot and dry, and in August the water at the two lowest sites became warm enough to stress the trout. The site with the highest E. coli readings was Fenwick Bridge, where levels went above the safe swimming limit on nine of our twenty-four visits. We believe the cause is an old storm drain that overflows after heavy rain. We reported this to the town council in September, and repairs to the drain are planned for next summer. Until then, we advise people not to swim or let their dogs swim near Fenwick Bridge for two days after a storm.

Equipment. For years, volunteers carried samples to the laboratory in their own cars, which was slow and hard on people who live far from the river. In June we finally bought a second-hand testing van. It was paid for by the Harlow Valley Community Fund. The van has a small fridge for samples, a fold-out table and space for six volunteers, and it now drives the full testing route twice a month. We also replaced four of our oldest oxygen meters, which had started to give readings that did not match the laboratory results.

Who can see our data. We collect a lot of information, and we take care with it. Our monthly summaries, with one number per site for each measurement, are free for anyone and are posted on the notice board at the public library and in our newsletter. The raw records, which include every single reading, the exact time it was taken and the name of the volunteer who took it, are kept private. Only volunteers who have completed our data training course may open the raw records, and they may not share them outside the group without a vote of the board. We made this rule in 2021 after a volunteer's name and home street were shared online without her permission. Researchers who want the raw records can write to the board, which meets every two months to review such requests.

Money. Our total income in 2025 was a little over forty thousand dollars. About half came from grants, a quarter came from small donations, and the rest came from our spring plant sale and the riverside fun run. Our largest costs were laboratory fees, the van, insurance and printing. We have no paid staff; every hour of work is given freely. A full statement of accounts is available on request from our treasurer, Priya Natarajan.

Working with others. We work closely with the Ashford Farm family, who have planted a strip of trees and shrubs along their stretch of the river to slow down muddy runoff from the fields. Since the trees were planted, the water below the farm has been noticeably clearer after rain. We also lent our equipment to two neighbouring towns that are starting their own river groups, and we ran a training day for their first volunteers in October.

Looking ahead. In 2026 we want to add three new testing sites on the small streams that feed the river, start testing for tiny pieces of plastic, and train at least twenty more volunteers to use the new van. We will also keep pressing the town council until the storm drain at Fenwick Bridge is fixed.

Our annual meeting. Everyone is welcome at our annual meeting, which will be held on March 14, 2026, at 7 p.m. in the community room of the Millbrook Public Library. We will present this report, elect the board for the coming year and share hot soup made by our volunteers. Thank you for caring about our river.
"""

# The preset questions in the chunking section. Each one's answer sits somewhere specific in the report.
VAN_QUESTION = QuestionSpec(
    "Who paid for the group's testing van?",
    ["testing van", "Harlow Valley Community Fund"],
)
RECORDS_QUESTION = QuestionSpec(
    "Who is allowed to look at the raw records?",
    ["raw records", "data training course"],
)
POLLUTION_QUESTION = QuestionSpec(
    "Which site had the most E. coli bacteria?",
    ["Fenwick Bridge", "E. coli"],
)
MEETING_QUESTION = QuestionSpec(
    "When and where is the annual meeting?",
    ["March 14, 2026", "Millbrook Public Library"],
)

REPORT_QUESTIONS = [VAN_QUESTION, RECORDS_QUESTION, POLLUTION_QUESTION, MEETING_QUESTION]

# The answer to this one is spread over two sentences: tiny chunks cut it in half.
SPLIT_QUESTION = VAN_QUESTION

# Used in section 1 (the model alone) and section 5 (the full system). Naming the group makes the
# bare model invent an answer, and it also pulls search toward the report's opening: with top-k = 1 the
# model only sees the wrong chunk; with top-k = 3 it gets the right one (both verified by tests).
PROBLEM_QUESTION = QuestionSpec(
    "When and where is the Millbrook River Watch annual meeting?",
    ["March 14, 2026", "Millbrook Public Library"],
)

# On topic, but the report does not say: a good test of "I don't know".
OUT_OF_DOC_QUESTION = "How much does it cost to become a member of Millbrook River Watch?"

# Chunk sizes (in words) that the "Try this" exercises refer to. All verified by tests/test_effects.py.
DEMO_TINY_SIZE = 5    # chunks shorter than the answer itself: no overlap can save it
DEMO_SMALL_SIZE = 35  # a chunk boundary falls between the two sentences of the van answer...
DEMO_OVERLAP = 15     # ...and this much overlap puts them back together
DEMO_GOOD_SIZE = 60
# At DEMO_SMALL_SIZE words, one chunk ends with CUT_BEFORE and the next starts with CUT_AFTER (tested).
CUT_BEFORE = "by the Harlow Valley"
CUT_AFTER = "Community Fund."

# ---------------------------------------------------------------- short real passages (search section)
PASSAGES = [
    "Retrieval-Augmented Generation (RAG) combines a language model with a search step. Instead of relying only on what the model memorized during training, the system first retrieves relevant documents from a collection you control, then asks the model to answer using those documents. This grounds answers in your own sources and reduces made-up information.",
    "An embedding is a list of numbers that represents the meaning of a piece of text. Texts with similar meanings have embeddings that point in similar directions, so a computer can find which stored document is most relevant to a question even when they share no exact words.",
    "Ollama is a tool that runs large language models directly on your own computer. Because the model runs locally, the text you send it never leaves your machine, and you do not need an internet connection once the model is downloaded.",
    "Cosine similarity measures how close two embeddings are by looking at the angle between them. A value near 1 means the two texts are very similar in meaning, and a value near 0 means they are unrelated. RAG uses it to rank stored documents against a question.",
    "Running AI models locally matters for data sovereignty. When a community runs its own models on its own hardware, it keeps control over its data and decides who can access it, rather than sending sensitive material to servers owned by outside companies.",
    "Te Hiku Media, a Maori organization in New Zealand, built a speech recognition system for the Maori language. They release their data under a Kaitiakitanga License, which treats data as cared for under guardianship rather than owned, and ensures any benefit derived from the data flows back to the people it came from.",
    "A vector store keeps the embeddings of all your documents so they can be searched quickly. In a small project, a simple list in memory is enough. For larger collections, specialised tools can store and search millions of embeddings in a fraction of a second.",
    "Chunking means splitting long documents into smaller passages before embedding them. Smaller chunks make retrieval more precise, because the system can return just the relevant passage instead of an entire document. Overlapping chunks prevent key sentences from being lost at boundaries.",
]

SEARCH_EXAMPLE = "Who benefits when Maori speech data is shared?"
# The passage about working offline (Ollama) is NOT ranked first for this one, but is in the top 3 (tested).
SEARCH_MISS_EXAMPLE = "Can I use AI without the internet?"

# ---------------------------------------------------------------- embedding exercises
SIMILARITY_PAIRS = [
    (  # same meaning, almost no shared words
        "Communities have the right to control data collected about them.",
        "Indigenous peoples should govern how their information is stored and used.",
    ),
    (  # shared word, different meaning
        "The bank raised its interest rates again this year.",
        "We had a picnic on the grassy bank of the river.",
    ),
    (  # unrelated
        "Communities have the right to control data collected about them.",
        "I love to ride my bike on Sunday mornings.",
    ),
]

MAP_SENTENCES = [
    ("The river flooded the fields after the storm.", "rivers and water"),
    ("Fish need cold, clean water to lay their eggs.", "rivers and water"),
    ("The lake froze completely in January.", "rivers and water"),
    ("Rain fell on the mountains and filled the streams.", "rivers and water"),
    ("Simmer the soup slowly with onions and garlic.", "food and cooking"),
    ("Fresh bread is best eaten warm from the oven.", "food and cooking"),
    ("She added a pinch of salt to the sauce.", "food and cooking"),
    ("We roasted vegetables for the family dinner.", "food and cooking"),
    ("Communities should decide who can use their data.", "data and privacy"),
    ("Passwords protect your personal information online.", "data and privacy"),
    ("The app shared users' locations without asking.", "data and privacy"),
    ("Medical records must be kept confidential.", "data and privacy"),
    ("He rode his bicycle up the steep mountain pass.", "sport and exercise"),
    ("The team trained every morning before the match.", "sport and exercise"),
    ("She ran her first marathon in under four hours.", "sport and exercise"),
    ("Swimming laps is a gentle way to stay fit.", "sport and exercise"),
]
