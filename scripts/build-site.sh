#!/usr/bin/env bash
# The single command Vercel runs, and the same one CI runs. Builds the MkDocs
# guide, then the atlas, and merges them into one output tree.
#
# The draft-record gate is held DIFFERENTLY here than in CI, on purpose
# (spec D2): a failing `build:data` must NOT fail the deploy, because the guide
# is finished and should not wait on unrelated record review. CI fails loudly on
# the same fact. Both postures are correct for their own job.
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
[ -d "$VENV" ] || "$PY_BIN" -m venv "$VENV"
"$VENV/bin/pip" install --quiet --disable-pip-version-check -r "$REPO/docs/requirements.txt"
"$VENV/bin/mkdocs" build --site-dir "$OUT" --config-file "$REPO/docs/mkdocs.yml"

cd "$REPO/atlas"
pnpm install --frozen-lockfile

mkdir -p "$OUT/atlas"
# `build:data` exits non-zero while any record is still `status: draft`. That is
# the design, so it is tolerated here and NEVER worked around: no fixture, and
# no ATLAS_ALLOW_NO_BUNDLE, which compiles an app carrying no data at all.
if pnpm build:data && pnpm build:app; then
  cp -R dist/. "$OUT/atlas/"
  echo "atlas: shipped with reviewed records"
else
  cp public/atlas-pending.html "$OUT/atlas/index.html"
  echo "atlas: records still under review — holding page served"
fi
