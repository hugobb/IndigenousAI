# holding/

`atlas-pending.html` is what `scripts/build-site.sh` publishes at `/atlas/` while
`pnpm build:data` exits non-zero — that is, while any record is still
`status: draft`. It is a hand-written static page: no build step, no script tag,
no data.

**It lives here and not in `public/` on purpose.** Vite copies `public/` verbatim
into `dist/`, so a holding page kept there would be published *alongside* the
real app on the first successful build after records are verified — a live page
at `/atlas/atlas-pending.html` asserting, in the present tense, that nothing has
been signed off yet, at the exact moment that stopped being true. `public/` means
"part of the app bundle"; this file is a *substitute for* the bundle.
`tests/build-artifact.test.ts` holds that line.
