import re
from pathlib import Path

import pytest

DOC = Path(__file__).resolve().parent.parent / "documents" / "2026_world_cup_final.txt"
URL_RE = re.compile(
    r"https://en\.wikipedia\.org/w/index\.php\?title=2026_FIFA_World_Cup_final&oldid=\d+"
)
HEADER = ("Title: ", "Source: ", "Retrieved: ", "License: ", "Shortened: ")


def _text() -> str:
    return DOC.read_text(encoding="utf-8")


def _body() -> str:
    return _text().split("\n\n", 1)[1]


def test_attribution_block():
    head = "\n".join(_text().splitlines()[:12])
    assert "2026 FIFA World Cup final" in head
    assert URL_RE.search(head)
    assert "CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/" in head
    assert "Shortened: some sections removed." in head
    assert re.search(r"Retrieved:? .*20\d\d", head)


def test_attribution_block_is_the_first_five_lines():
    lines = _text().splitlines()
    for line, prefix in zip(lines[:5], HEADER, strict=True):
        assert line.startswith(prefix), line
    assert lines[5] == "" and lines[6].strip()


@pytest.mark.parametrize("fact", ["Spain", "Argentina", "Ferran Torres", "80,663", "MetLife Stadium"])
def test_key_facts_present(fact):
    assert fact in _body()


def test_no_glued_sentences():
    """An image between two sentences on Wikipedia is dropped from the extract and glues them ("dive.In")."""
    assert not re.search(r"[a-z][.!?][A-Z][a-z]", _text())


def test_word_count():
    n = len(_text().split())
    assert 2000 <= n <= 3000, n


def test_sections():
    sections = re.findall(r"^== .+ ==$", _text(), flags=re.M)
    assert len(sections) >= 4, sections


def test_no_leftover_markup():
    t = _text()
    assert "[edit]" not in t
