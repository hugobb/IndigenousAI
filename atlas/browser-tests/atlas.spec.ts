import { expect, test, type Page } from '@playwright/test'

/** Basemap tiles are the only network this page needs. Blocking them makes the
 *  harness deterministic and offline: MapLibre still renders our circles and
 *  pins from GeoJSON without a single tile. */
async function offline(page: Page): Promise<void> {
  await page.route('**://tiles.openfreemap.org/**', (r) => r.abort())
}

const paneBox = async (page: Page): Promise<{ width: number; height: number }> => {
  const box = await page.locator('.atlas__pane').boundingBox()
  expect(box).not.toBeNull()
  return { width: box!.width, height: box!.height }
}

test.beforeEach(async ({ page }) => { await offline(page) })

// SP1a's actual defect: the grid collapsed the map from 705px to 337px when
// the demo banner was absent, because a named area was missing from one of the
// two grid-template-areas blocks. Parameterised over both view modes.
for (const view of ['map', 'initiatives', 'languages']) {
  test(`the pane has real height in ${view} view`, async ({ page }) => {
    await page.goto(view === 'map' ? '/' : `/?view=${view}`)
    const { height } = await paneBox(page)
    expect(height).toBeGreaterThan(300)
  })
}

test('the body never scrolls horizontally, even with the widest table', async ({ page }) => {
  await page.goto('/?view=initiatives')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the table scrolls inside its own pane rather than growing the page', async ({ page }) => {
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
    (els) => els.map((e) => e.getBoundingClientRect().top),
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
// would rot into flake on the first font or driver change.
test('the map repaints when a filter removes records', async ({ page }) => {
  await page.goto('/')
  const pane = page.locator('.atlas__pane')
  await expect(pane).toBeVisible()
  await page.waitForTimeout(1500)
  const before = await pane.screenshot()
  await page.goto('/?region=africa')
  await page.waitForTimeout(1500)
  const after = await pane.screenshot()
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
