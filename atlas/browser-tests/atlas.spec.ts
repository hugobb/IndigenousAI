import { expect, test, type Page } from '@playwright/test'

/** Basemap tiles are the only network this page needs — but the STYLE
 *  document itself (`src/map/style.ts: BASEMAP_STYLE`) is also served from
 *  `tiles.openfreemap.org`, and aborting the whole host (as an earlier
 *  version of this file did) aborts that too. MapLibre then never fires
 *  'load', our own GeoJSON sources/layers are never added, and the map pane
 *  renders nothing at all, forever — every test in this file was passing
 *  against a permanently blank canvas.
 *
 *  Fulfilling the style request with a minimal, sourceless, layerless style
 *  keeps the harness fully offline (nothing here ever leaves the browser)
 *  while letting MapLibre reach 'load' — and then 'idle' — in well under a
 *  second. Our own circle/pin layers (added programmatically in
 *  `src/map/useMap.ts`, never referenced by this stub) still need no tile,
 *  sprite or glyph request, so the second, broader route below can keep
 *  aborting everything else under the host as a defensive fallback. */
async function offline(page: Page): Promise<void> {
  await page.route('**://tiles.openfreemap.org/**', (r) => r.abort())
  await page.route('**://tiles.openfreemap.org/styles/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
    }),
  )
}

/** MapLibre fires 'idle' once every requested resource has settled and the
 *  frame is stable; `useMap.ts` mirrors that onto a DOM attribute the way
 *  jsdom-based unit tests cannot see at all. Waiting on it (rather than a
 *  fixed sleep) means this never races a slow paint, and never pads a fast
 *  one either. */
async function waitForMapIdle(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.querySelector('.atlas__canvas')?.getAttribute('data-map-idle') === 'true',
  )
}

test.beforeEach(async ({ page }) => { await offline(page) })

// SP1a's actual defect: an auto-placed `.atlas__pane` (a named grid area
// missing from one of the two grid-template-areas blocks) fell into its own,
// unrelated row instead of the row it shares with `.atlas__rail` — going from
// 705px tall to 337px, both of which would clear a fixed floor like `> 300`.
// `.atlas__rail` and `.atlas__pane` are placed by the SAME 'rail pane' row at
// this viewport width, so a correctly wired grid always renders them to the
// same height — comparing pane to its row-mate has no gap between the
// threshold and the failure it exists to detect, at any viewport size.
// Parameterised over all three view modes.
for (const view of ['map', 'initiatives', 'languages']) {
  test(`the pane has real height in ${view} view`, async ({ page }) => {
    await page.goto(view === 'map' ? '/' : `/?view=${view}`)
    const [pane, rail] = await Promise.all([
      page.locator('.atlas__pane').boundingBox(),
      page.locator('.atlas__rail').boundingBox(),
    ])
    expect(pane).not.toBeNull()
    expect(rail).not.toBeNull()
    expect(Math.abs(pane!.height - rail!.height)).toBeLessThanOrEqual(1)
  })
}

test('the body never scrolls horizontally, even with the widest table', async ({ page }) => {
  await page.goto('/?view=initiatives')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

// Vacuous at the default 1280x720 viewport: five fixture rows never come
// close to filling a ~420px-tall pane, so `.table-wrap` never needs to
// shrink below its content and the assertion holds regardless of whether
// `min-height: 0` / `overflow: auto` are even present. A short viewport
// (1280x380) leaves less room than the table's own content height, which is
// what actually gives this test something to catch.
test('the table scrolls inside its own pane rather than growing the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 380 })
  await page.goto('/?view=languages')
  const wrap = page.locator('.table-wrap')
  const [wrapH, paneH] = await Promise.all([
    wrap.evaluate((e) => e.getBoundingClientRect().height),
    page.locator('.atlas__pane').evaluate((e) => e.getBoundingClientRect().height),
  ])
  expect(wrapH).toBeLessThanOrEqual(paneH + 1)
})

test('the view switch does not wrap at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 720 })
  await page.goto('/?view=initiatives')
  const heights = await page.locator('.view-switch button').evaluateAll(
    // Rounded: sub-pixel layout jitter between buttons on the same visual row
    // is real (fractional flex remainders) and must not read as a wrap.
    (els) => els.map((e) => Math.round(e.getBoundingClientRect().top)),
  )
  expect(new Set(heights).size).toBe(1)
})

// The narrow-viewport `grid-template-areas` block re-declares `.atlas__pane`'s
// grid area on its own, single-column layout. A missing area name there does
// NOT collapse its height — `.atlas__pane` gets an explicit `height` in the
// same media query regardless of grid placement — so a height check alone
// (as above) cannot see this regression. What breaks instead is POSITION: the
// pane falls back to auto-placement and is squeezed into whatever column the
// rail occupies, far down the page, instead of spanning full width above the
// rail. This is the mutation-checked SP1a-shaped regression at narrow width.
test('the pane spans full width at a narrow viewport, not squeezed into the rail column', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 720 })
  await page.goto('/')
  const box = await page.locator('.atlas__pane').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThan(370)
})

// A named SP1b blind spot: nothing asserted the map actually repaints when a
// filter changes. A DIFFERENCE assertion, never a golden image — a golden
// would rot into flake on the first font or driver change. Screenshots
// `.atlas__canvas` specifically, not the whole `.atlas__pane`: the pane also
// contains the view-switch strip, whose language/initiative COUNTS change on
// every filter — comparing the pane would pass even if the map itself never
// repainted a single pixel, which is exactly what an earlier, broader
// `offline()` route (aborting the style document, not just tile data) was
// silently doing.
test('the map repaints when a filter removes records', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('.atlas__canvas')
  await expect(canvas).toBeVisible()
  await waitForMapIdle(page)
  const before = await canvas.screenshot()
  await page.goto('/?region=africa')
  await waitForMapIdle(page)
  const after = await canvas.screenshot()
  expect(Buffer.compare(before, after)).not.toBe(0)
})

test('a table row is reachable and openable from the keyboard', async ({ page }) => {
  await page.goto('/?view=languages')
  const firstRowName = page.locator('tbody tr td:first-child button').first()
  await firstRowName.focus()
  await expect(firstRowName).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/lang=/)
})
