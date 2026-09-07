import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { glottologResolutionFileStatus, loadGlottologResolution } from '../scripts/lib/load-glottolog-resolution.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const FILE = url('../data/glottolog-resolution.yml')

describe('the Glottolog resolution record', () => {
  const rows = loadGlottologResolution(FILE)

  it('the file exists and is non-empty', () => {
    expect(glottologResolutionFileStatus(FILE)).toBe('ok')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('resolves each searched name at most once', () => {
    const seen = new Set<string>()
    expect(rows.map((r) => r.searched).filter((s) => (seen.has(s) ? true : (seen.add(s), false)))).toEqual([])
  })

  it('gives every family-level row a note explaining the cover term (D8)', () => {
    expect(rows.filter((r) => r.level === 'family' && r.note === null).map((r) => r.searched)).toEqual([])
  })

  it('never records coordinates for a family-level row', () => {
    // Glottolog returns latitude: null for families — verified against
    // quec1387, azte1234, maya1287, chat1268, otom1299, tupi1275. A family row
    // carrying coordinates means they came from somewhere else.
    expect(rows.filter((r) => r.level === 'family' && (r.latitude !== null || r.longitude !== null))
      .map((r) => r.searched)).toEqual([])
  })
})
