"""The interactive panels, one per workshop section. Each show_*() displays its panel and returns it."""

import html
import io
import time

import ipywidgets as widgets
from matplotlib.figure import Figure
from IPython.display import display

from content import (
    CARE_PAPER,
    CHARTER,
    CHARTER_QUESTIONS,
    CHARTER_SECTIONS,
    CHARTER_TITLE,
    DEMO_GOOD_SIZE,
    DEMO_OVERLAP,
    MAP_SENTENCES,
    PROBLEM_QUESTION,
    SEARCH_EXAMPLE,
    SIMILARITY_PAIRS,
)
from toolkit import (
    Models,
    answer,
    build_prompt,
    cosine,
    make_chunks,
    project_2d,
    rank,
    similarity_label,
)

# Mid-tone backgrounds with dark text set explicitly, so they read on light and dark themes.
CHUNK_COLOURS = ["#cfe3ff", "#ffe0b3"]
OVERLAP_COLOUR = "#c8efc4"
TEXT = "color:#111"
WIDE = widgets.Layout(width="100%")


def _panel(children: list, controls: dict) -> widgets.VBox:
    box = widgets.VBox(children, layout=widgets.Layout(width="100%", max_width="900px"))
    box.controls = controls
    display(box)
    return box


def _note(message: str) -> str:
    return f'<div style="padding:8px 12px;border-radius:6px;background:#fff3bf;{TEXT}">{html.escape(message)}</div>'


def _bar(score: float, label: str = "") -> str:
    pct = max(0, min(100, round(score * 100)))
    return (
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
        f'<div style="width:160px;height:14px;background:#e3e3e3;border-radius:7px;overflow:hidden">'
        f'<div style="width:{pct}%;height:100%;background:#3b82f6"></div></div>'
        f"<b>{score:.2f}</b> {html.escape(label)}</div>"
    )


def _box(inner: str, background: str = "#f4f4f5") -> str:
    return f'<div style="padding:10px 12px;border-radius:6px;background:{background};{TEXT};white-space:pre-wrap">{inner}</div>'


def _once(button: widgets.Button, handler):
    """Attach `handler` to the button, ignoring clicks that were queued while it was busy."""
    state = {"finished": 0.0}

    def on_click(_):
        if time.monotonic() - state["finished"] < 0.5:
            return
        try:
            handler(_)
        finally:
            state["finished"] = time.monotonic()

    button.on_click(on_click)


def _stream_into(target: widgets.HTML, pieces, button: widgets.Button | None = None, background: str = "#eef6ee") -> None:
    """Write the model's answer into `target` as it arrives. The button stays disabled meanwhile."""
    if button is not None:
        button.disabled = True
    text = ""
    target.value = _box("The AI is writing...", background)
    try:
        for piece in pieces:
            text += piece
            target.value = _box(html.escape(text), background)
    except Exception as error:  # noqa: BLE001 - show a plain message instead of a stack trace
        target.value = _box(
            html.escape(text) + "<br><br>⚠️ Something went wrong. Click the button again. "
            "If it happens again, raise your hand."
            f"<br><small>({html.escape(str(error))})</small>",
            "#fdecec",
        )
        return
    finally:
        if button is not None:
            button.disabled = False
    if not text.strip():
        target.value = _box("(The AI gave an empty answer. Click the button again.)", background)


def collection_chunks() -> list[str]:
    """Both documents (the charter and the CARE paper) cut into chunks of DEMO_GOOD_SIZE words, with overlap."""
    return [chunk for doc in (CHARTER, CARE_PAPER) for chunk in make_chunks(doc, "overlap", DEMO_GOOD_SIZE, DEMO_OVERLAP)]


_COLLECTION: dict = {}


def retrieve(m: Models, question: str, k: int) -> list[str]:
    """The k chunks of the two documents closest to the question."""
    key = id(m.embedder)
    if key not in _COLLECTION:
        chunks = collection_chunks()
        _COLLECTION[key] = (chunks, m.embedder.embed(chunks))
    chunks, vecs = _COLLECTION[key]
    hits = rank(m.embedder.embed([question])[0], vecs, k)
    return [chunks[i] for i, _ in hits]


# ---------------------------------------------------------------- 1. the problem
def show_problem(m: Models) -> widgets.VBox:
    question = widgets.HTML(_box(f"<b>Question:</b> {html.escape(PROBLEM_QUESTION.question)}"))
    ask = widgets.Button(description="Ask the AI", button_style="primary", icon="comment")
    out = widgets.HTML()
    _once(ask, lambda _: _stream_into(out, m.generator.generate(PROBLEM_QUESTION.question), ask))
    return _panel([question, ask, out], {"ask": ask, "answer": out})


# ---------------------------------------------------------------- 2a. similarity
def show_similarity(m: Models) -> widgets.VBox:
    labels = ["Same meaning, different words", "Same word, different meaning", "Unrelated"]
    pair = widgets.Dropdown(options=[(lab, i) for i, lab in enumerate(labels)], value=0, description="Example")
    a = widgets.Textarea(value=SIMILARITY_PAIRS[0][0], description="Sentence A", layout=WIDE)
    b = widgets.Textarea(value=SIMILARITY_PAIRS[0][1], description="Sentence B", layout=WIDE)
    compare = widgets.Button(description="Compare", button_style="primary", icon="balance-scale")
    result = widgets.HTML()

    def on_pair(change):
        a.value, b.value = SIMILARITY_PAIRS[change["new"]]
        on_compare(None)

    def on_compare(_):
        if not a.value.strip() or not b.value.strip():
            result.value = _note("Type a sentence first.")
            return
        va, vb = m.embedder.embed([a.value, b.value])
        score = cosine(va, vb)
        result.value = f"Score {_bar(score, '→ ' + similarity_label(score))}"

    pair.observe(on_pair, names="value")
    compare.on_click(on_compare)
    on_compare(None)
    return _panel([pair, a, b, compare, result], {"pair": pair, "a": a, "b": b, "compare": compare, "result": result})


# ---------------------------------------------------------------- 2b. map of meaning
MAP_COLOURS = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b"]


def _short(sentence: str, words: int = 4) -> str:
    parts = sentence.split()
    return " ".join(parts[:words]) + (" …" if len(parts) > words else "")


def show_meaning_map(m: Models) -> widgets.VBox:
    base = list(MAP_SENTENCES)
    mine: list[str] = []
    sentence = widgets.Text(placeholder="Type any sentence, then click Add", layout=WIDE)
    add = widgets.Button(description="Add to map", button_style="primary", icon="plus")
    reset = widgets.Button(description="Reset", icon="undo")
    message = widgets.HTML()
    plot = widgets.Image(format="png", layout=widgets.Layout(width="100%", max_width="900px"))
    state: dict = {}

    def redraw():
        # A plain PNG picture: it shows everywhere (Colab, Jupyter, VS Code), with no JavaScript.
        texts = [s for s, _ in base] + mine
        points = project_2d(m.embedder.embed(texts))
        fig = Figure(figsize=(9, 6), dpi=100)
        ax = fig.add_subplot()
        topics = list(dict.fromkeys(t for _, t in base))
        span = points.max(axis=0) - points.min(axis=0) + 1e-9
        placed: list[tuple[float, float]] = []  # label anchors already to the right of their dot

        def label(i: int, text: str, **style) -> None:
            x, y = (points[i] - points.min(axis=0)) / span
            crowded = any(abs(x - px) < 0.25 and abs(y - py) < 0.05 for px, py in placed)
            if not crowded:
                placed.append((x, y))
            ax.annotate(text, points[i], xytext=(-6 if crowded else 6, 4), textcoords="offset points",
                        ha="right" if crowded else "left", **style)

        for topic, colour in zip(topics, MAP_COLOURS):
            idx = [i for i, (_, t) in enumerate(base) if t == topic]
            ax.scatter(points[idx, 0], points[idx, 1], s=70, color=colour, label=topic)
            for i in idx:
                label(i, _short(base[i][0]), fontsize=8, color=colour)
        n = len(base)
        if mine:
            ax.scatter(points[n:, 0], points[n:, 1], s=220, marker="*", color="#111", label="your sentences")
            for i, s in enumerate(mine):
                label(n + i, _short(s), fontsize=9, fontweight="bold", color="#111")
        ax.set_xticks([])
        ax.set_yticks([])
        ax.margins(0.25, 0.12)
        ax.set_title("Each dot is a sentence. Dots close together have similar meanings.", fontsize=11)
        ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.02), ncol=5, frameon=False, fontsize=9)
        fig.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format="png")
        plot.value = buf.getvalue()
        state["points"] = points
        state["mine"] = list(mine)

    def on_add(_):
        if not sentence.value.strip():
            message.value = _note("Type a sentence first.")
            return
        mine.append(sentence.value.strip())
        sentence.value = ""
        message.value = ""
        redraw()

    def on_reset(_):
        mine.clear()
        message.value = ""
        redraw()

    add.on_click(on_add)
    reset.on_click(on_reset)
    redraw()
    box = _panel([widgets.HBox([add, reset]), sentence, message, plot],
                 {"sentence": sentence, "add": add, "reset": reset, "message": message, "plot": plot})
    box.map_state = state
    return box


# ---------------------------------------------------------------- 3. search
def show_search(m: Models) -> widgets.VBox:
    question = widgets.Text(value=SEARCH_EXAMPLE, description="Question", layout=WIDE)
    search = widgets.Button(description="Search", button_style="primary", icon="search")
    results = widgets.HTML()
    passage_vecs = m.embedder.embed(CHARTER_SECTIONS)

    def on_search(_):
        if not question.value.strip():
            results.value = _note("Type a question first.")
            return
        hits = rank(m.embedder.embed([question.value])[0], passage_vecs, len(CHARTER_SECTIONS))
        rows = []
        for place, (i, score) in enumerate(hits, start=1):
            bg = "#dbeafe" if place <= 3 else "#f4f4f5"
            rows.append(
                f'<div class="rag-row" style="padding:8px 10px;margin:4px 0;border-radius:6px;background:{bg};{TEXT}">'
                f"<b>#{place}</b> {_bar(score, '→ ' + similarity_label(score))}"
                f'<div style="margin-top:4px">{html.escape(CHARTER_SECTIONS[i])}</div></div>'
            )
        results.value = "<div>The 3 sections in blue are the ones RAG would give to the AI.</div>" + "".join(rows)

    search.on_click(on_search)
    on_search(None)
    return _panel([question, search, results], {"question": question, "search": search, "results": results})


# ---------------------------------------------------------------- 4. chunking
def _render_chunks(words: list[str], strategy: str, chunks: list[str], size: int, overlap: int, winner: int) -> str:
    """The report with each chunk in alternating colours; words shared by two chunks in green."""
    owners: list[list[int]] = [[] for _ in words]
    if strategy == "overlap":
        step = size - max(0, min(overlap, size - 1))
        for ci in range(len(chunks)):
            for w in range(ci * step, min(ci * step + size, len(words))):
                owners[w].append(ci)
    else:
        pos = 0
        for ci, chunk in enumerate(chunks):
            for w in range(pos, min(pos + len(chunk.split()), len(words))):
                owners[w].append(ci)
            pos += len(chunk.split())
    parts = []
    for word, own in zip(words, owners):
        colour = OVERLAP_COLOUR if len(own) > 1 else CHUNK_COLOURS[own[0] % 2] if own else "transparent"
        style = f"background:{colour};{TEXT}"
        if winner in own:
            style += ";font-weight:bold;text-decoration:underline"
        parts.append(f'<span style="{style}">{html.escape(word)}</span>')
    return (
        f'<div style="max-height:320px;overflow-y:auto;padding:10px;border:1px solid #ccc;border-radius:6px;'
        f'background:#fff;{TEXT};line-height:1.7">' + " ".join(parts) + "</div>"
    )


def show_chunking(m: Models) -> widgets.VBox:
    strategy = widgets.Dropdown(
        options=[("Fixed size", "fixed"), ("Fixed size with overlap", "overlap"),
                 ("By sentences", "sentences"), ("Whole document (no chunking)", "whole")],
        value="fixed", description="How to cut",
    )
    size = widgets.IntSlider(value=DEMO_GOOD_SIZE, min=5, max=200, step=5, description="Words/chunk",
                             continuous_update=False)
    overlap = widgets.IntSlider(value=DEMO_OVERLAP, min=0, max=50, step=5, description="Overlap",
                                disabled=True, continuous_update=False)
    question = widgets.Dropdown(options=[q.question for q in CHARTER_QUESTIONS], description="Question",
                                layout=widgets.Layout(width="100%", max_width="560px"))
    count = widgets.HTML()
    text = widgets.HTML()
    top = widgets.HTML()
    ask = widgets.Button(description="Ask the AI with this chunk", button_style="primary", icon="comment",
                         layout=widgets.Layout(width="auto"))
    out = widgets.HTML()
    words = CHARTER.split()
    cache: dict = {}
    state = {"switching": False, "top": ""}

    def current_chunks():
        key = (strategy.value, size.value, overlap.value if strategy.value == "overlap" else 0)
        if key not in cache:
            chunks = make_chunks(CHARTER, strategy.value, size.value, key[2])
            cache[key] = (chunks, m.embedder.embed(chunks))
        return cache[key]

    def update(_=None):
        if state["switching"]:
            return
        overlap.disabled = strategy.value != "overlap"
        size.disabled = strategy.value == "whole"
        chunks, vecs = current_chunks()
        (i, score), = rank(m.embedder.embed([question.value])[0], vecs, 1)
        state["top"] = chunks[i]
        count.value = f"{CHARTER_TITLE}: cut into <b>{len(chunks)} chunk{'s' if len(chunks) != 1 else ''}</b>"
        text.value = _render_chunks(words, strategy.value, chunks, size.value, overlap.value, i)
        top.value = (
            f"<b>Chunk picked by search</b> (chunk {i + 1}), score {_bar(score)}"
            + _box(html.escape(chunks[i]), "#dbeafe")
        )
        out.value = ""

    def on_strategy(change):
        state["switching"] = True
        if change["new"] == "sentences":
            size.min, size.step, size.value, size.max = 1, 1, 3, 10
            size.description = "Sentences"
        elif change["old"] == "sentences":
            size.max, size.value, size.min, size.step = 200, DEMO_GOOD_SIZE, 5, 5
            size.description = "Words/chunk"
        state["switching"] = False
        update()

    def on_ask(_):
        contexts = [state["top"]]
        _stream_into(out, answer(m, question.value, contexts, allow_unknown=True), ask)

    strategy.observe(on_strategy, names="value")
    for w in (size, overlap, question):
        w.observe(update, names="value")
    _once(ask, on_ask)
    update()
    controls = {"strategy": strategy, "size": size, "overlap": overlap, "question": question,
                "count": count, "text": text, "top": top, "ask": ask, "answer": out}
    return _panel([widgets.HBox([strategy, size, overlap], layout=widgets.Layout(flex_flow="row wrap")),
                   question, count, text, top, ask, out], controls)


# ---------------------------------------------------------------- 5. generation
def show_generation(m: Models) -> widgets.VBox:
    question = widgets.Text(value=PROBLEM_QUESTION.question, description="Question", layout=WIDE)
    topk = widgets.IntSlider(value=3, min=1, max=5, description="Passages")
    unknown = widgets.Checkbox(value=True, description="Let the AI say I don't know", indent=False)
    ask = widgets.Button(description="Ask", button_style="primary", icon="comment")
    prompt = widgets.HTML()
    rag = widgets.HTML()
    norag = widgets.HTML()
    column = widgets.Layout(flex="1 1 300px", min_width="260px", margin="4px")
    columns = widgets.Box(
        [widgets.VBox([widgets.HTML("<b>With RAG</b> (the AI read the passages)"), rag], layout=column),
         widgets.VBox([widgets.HTML("<b>Without RAG</b> (the AI's memory only)"), norag], layout=column)],
        layout=widgets.Layout(display="flex", flex_flow="row wrap", width="100%"),
    )
    controls = {"question": question, "topk": topk, "unknown": unknown, "ask": ask,
                "prompt": prompt, "rag": rag, "norag": norag, "prompt_text": ""}

    def on_ask(_):
        q = question.value.strip()
        if not q:
            prompt.value = _note("Type a question first.")
            return
        ask.disabled = True
        try:
            contexts = retrieve(m, q, topk.value)
            text = build_prompt(q, contexts, unknown.value)
            controls["prompt_text"] = text
            shown = html.escape(text)
            for ctx in contexts:
                esc = html.escape(ctx)
                shown = shown.replace(esc, f'<mark style="background:#dbeafe;{TEXT}">{esc}</mark>', 1)
            prompt.value = "<b>The message sent to the AI:</b>" + _box(shown)
            rag.value = norag.value = ""
            _stream_into(rag, m.generator.generate(text))
            _stream_into(norag, m.generator.generate(q), background="#fdecec")
        finally:
            ask.disabled = False

    _once(ask, on_ask)
    return _panel([question, widgets.HBox([topk, unknown], layout=widgets.Layout(flex_flow="row wrap")),
                   ask, prompt, columns], controls)


# ---------------------------------------------------------------- bonus: your own documents
def load_uploads(files: dict[str, bytes]) -> tuple[list[str], list[str]]:
    """Turn uploaded files into chunks. Returns (chunks, messages about skipped files)."""
    chunks, messages = [], []
    for name, data in files.items():
        if not name.lower().endswith((".txt", ".md")):
            messages.append(f"⚠️ {name} is not a .txt file (skipped). Save it as plain text (.txt) and try again.")
            continue
        try:
            text = bytes(data).decode("utf-8")
        except UnicodeDecodeError:
            messages.append(f"⚠️ {name} could not be read as text (skipped). Save it as UTF-8 plain text and try again.")
            continue
        if not text.strip():
            messages.append(f"⚠️ {name} is empty (skipped).")
            continue
        chunks += make_chunks(text, "overlap", DEMO_GOOD_SIZE, DEMO_OVERLAP)
    return chunks, messages


def files_from_widget(value) -> dict[str, bytes]:
    """FileUpload's value as {name: bytes}, for ipywidgets 8 (tuple of dicts) and 7 (dict, as in Colab)."""
    if isinstance(value, dict):
        return {name: bytes(item["content"]) for name, item in value.items()}
    return {item["name"]: bytes(item["content"]) for item in value}


def show_upload(m: Models) -> widgets.VBox:
    status = widgets.HTML()
    question = widgets.Text(placeholder="Ask a question about your files", description="Question", layout=WIDE)
    ask = widgets.Button(description="Ask", button_style="primary", icon="comment")
    out = widgets.HTML()
    store = {"chunks": [], "vecs": None}

    def take(files: dict[str, bytes]):
        chunks, messages = load_uploads(files)
        store["chunks"] = chunks
        store["vecs"] = m.embedder.embed(chunks) if chunks else None
        lines = [html.escape(msg) for msg in messages]
        lines.append(f"✅ {len(chunks)} chunks ready." if chunks else "No usable text yet.")
        status.value = _box("<br>".join(lines))

    picker = widgets.FileUpload(accept=".txt,.md", multiple=True, description="Choose .txt files")
    picker.observe(lambda change: take(files_from_widget(change["new"])), names="value")

    def on_ask(_):
        if not store["chunks"]:
            out.value = _note("Upload at least one .txt file first.")
            return
        if not question.value.strip():
            out.value = _note("Type a question first.")
            return
        hits = rank(m.embedder.embed([question.value])[0], store["vecs"], 3)
        contexts = [store["chunks"][i] for i, _ in hits]
        _stream_into(out, answer(m, question.value, contexts, allow_unknown=True), ask)

    _once(ask, on_ask)
    return _panel([picker, status, question, ask, out],
                  {"picker": picker, "status": status, "question": question, "ask": ask, "answer": out})
