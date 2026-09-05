#!/usr/bin/env bash
# The single command Vercel runs, and the same one CI runs. Builds the MkDocs
# guide, then the atlas, and merges them into one output tree.
#
# The draft-record gate is held DIFFERENTLY here than in CI, on purpose
# (spec D2): a failing `build:data` must NOT fail the deploy, because the guide
# is published and should not wait on unrelated record review. CI fails loudly
# on the same fact. Both postures are correct for their own job.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${SITE_OUT:-$REPO/docs/site}"

# A virtualenv, not the system interpreter. On this developer's machine `python3`
# is 3.9.6 from the Command Line Tools, where `pip install` either fails under
# PEP 668 or quietly pollutes a system Python — and mkdocs is not installed at
# all. Vercel's image has 3.12 and would have tolerated a bare pip install, so
# this would have worked in CI and broken locally, which is the worse way round.
PY_BIN="${PY_BIN:-$(command -v python3.13 || command -v python3.12 || command -v python3)}"
VENV="$REPO/docs/.venv"
if [ ! -d "$VENV" ]; then
  # Said out loud because this is the ONE step of the deploy that has never run
  # on the deployment image (spec D1). Some Debian-based images ship Python
  # without `ensurepip`, where `-m venv` fails with a message about
  # python3-venv that reads like a local misconfiguration rather than a build
  # step to fix. Naming the alternative here is not the same as taking it: a
  # silent fallback to a bare `pip install` is what this line exists to avoid.
  "$PY_BIN" -m venv "$VENV" || {
    echo "build-site.sh: '$PY_BIN -m venv' failed, so MkDocs cannot be installed." >&2
    echo "  The build image needs a Python with venv support (Debian: python3-venv)," >&2
    echo "  or PY_BIN set to an interpreter that has it. Do NOT switch to a bare" >&2
    echo "  'pip install' without reading the note above this line." >&2
    exit 1
  }
fi
"$VENV/bin/pip" install --quiet --disable-pip-version-check -r "$REPO/docs/requirements.txt"

# One install for the whole script. Everything below that needs node_modules —
# the summaries copy, the data and app builds, the link check — runs from
# atlas/. This used to run twice; idempotent, but the second one is latency on
# every deploy.
( cd "$REPO/atlas" && pnpm install --frozen-lockfile )

# The 92 paper summaries MkDocs will build, copied from litterature_review/
# (the source of truth, never edited) into docs/docs/summaries — gitignored,
# rebuilt every time, the one permitted write under docs/docs/. Must run
# before `mkdocs build` or the site ships without them.
( cd "$REPO/atlas" && pnpm copy:summaries )

"$VENV/bin/mkdocs" build --site-dir "$OUT" --config-file "$REPO/docs/mkdocs.yml"

cd "$REPO/atlas"

mkdir -p "$OUT/atlas"
# `build:data` exits non-zero while any record is still `status: draft`. That is
# the design, so it is tolerated here and NEVER worked around: no fixture, and
# no ATLAS_ALLOW_NO_BUNDLE, which compiles an app carrying no data at all.
if pnpm build:data && pnpm build:app; then
  cp -R dist/. "$OUT/atlas/"
  echo "atlas: shipped with reviewed records"
else
  # Copied from holding/, NOT from public/: Vite copies public/ into dist/, so a
  # holding page kept there would also ship beside the real app on the first
  # successful build — a live "nothing has been signed off yet" page published at
  # the moment that became false. See atlas/holding/README.md.
  cp holding/atlas-pending.html "$OUT/atlas/index.html"
  echo "atlas: records still under review — holding page served"
fi

# Every paper citation and every method link in the atlas is a promise that a
# page exists. This walks all of them against the tree that is about to be
# deployed and fails the build if one does not resolve — a citation that 404s is
# the one defect this artifact cannot ship, and it is the only defect no other
# test can see (a summary that failed to copy, a slug that does not match its
# file, a subtly wrong site_url).
#
# It walks data/derived/*.json until the records are promoted and the real
# bundle afterwards — the same 131 real routes either way, because `bundle.ts`
# copies both derived files into the bundle verbatim. Deliberately NOT the
# fixture, whose one paper and one method are invented and could never resolve.
# Do not pipe this line into `head`. Measured 5/5: `pnpm run` returns 0 when a pipe
# consumer closes stdin early, so `| head` disarms the gate — while `| tee` and
# `| cat` correctly return 1. `pipefail` is on and works; it is pnpm losing its
# child's status, not the shell. Unpiped is the only form measured safe.
( cd "$REPO/atlas" && SITE_OUT="$OUT" pnpm check:links )
