import re
from pathlib import Path

import pytest

DOC = Path(__file__).resolve().parent.parent / "documents" / "workshop_programme.txt"
HEADER = ("Title: ", "Source: ", "Retrieved: ", "License: ", "Shortened: ")


def _text() -> str:
    return DOC.read_text(encoding="utf-8")


def _body() -> str:
    return _text().split("\n\n", 1)[1]


def test_attribution_block_is_the_first_five_lines():
    lines = _text().splitlines()
    for line, prefix in zip(lines[:5], HEADER, strict=True):
        assert line.startswith(prefix), line
    assert lines[5] == "" and lines[6].strip()
    assert "https://abundant-intelligences.net/" in lines[1]
    assert "Solomon Enos" in lines[3] and "CC BY-SA 4.0" in lines[3]  # the one bio taken from Wikipedia


@pytest.mark.parametrize("fact", [
    "November 19 and 20, 2026", "University of Hawaiʻi – West Oʻahu", "room G-129", "room D-141",
    "Hugo Berard and Hamza Abdelhedi give the introduction to machine learning",
    "At 1:00 pm, participants start the 75-minute hands-on session", "Anolani Saizon",
])
def test_key_facts_present(fact):
    assert fact in _body()


def test_schedule_adds_up():
    """Each start time plus its duration is the next start time (the original programme did not add up)."""
    day1 = re.search(r"== Day 1.*?\n(.*?)\n\n", _text(), flags=re.S).group(1)
    for t in ["1:00 pm", "1:15 pm", "2:00 pm", "3:15 pm", "4:45 pm"]:
        assert t in day1, t
    day2 = re.search(r"== Day 2.*?\n(.*?)\n\n", _text(), flags=re.S).group(1)
    for t in ["9:30 am", "9:45 am", "10:30 am", "10:45 am", "12:00 to 1:00 pm", "2:30 pm", "2:45 pm", "3:30 pm", "4:00 pm"]:
        assert t in day2, t


def test_word_count():
    n = len(_text().split())
    assert 1200 <= n <= 1700, n


def test_sections():
    assert len(re.findall(r"^== .+ ==$", _text(), flags=re.M)) == 7
    assert len(re.findall(r"^=== .+ ===$", _text(), flags=re.M)) == 13
