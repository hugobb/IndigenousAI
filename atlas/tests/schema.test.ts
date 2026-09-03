import { describe, expect, it } from 'vitest'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const src = { kind: 'url', ref: 'https://example.test', retrieved: '2026-09-03' }

const language = {
  id: 'kanienkeha',
  name: "Kanien'kéha",
  tier: 'indigenous',
  family: 'Iroquoian',
  typology: ['polysynthetic'],
  region: 'north-america',
  countries: ['CA', 'US'],
  endangerment: { status: 'definitely-endangered', scale: 'unesco-2010', source: src },
  centre: { lat: 43.0, lon: -74.5, source: src },
  status: 'verified',
}

const initiative = {
  id: 'te-hiku-media',
  name: 'Te Hiku Media',
  kind: 'organisation',
  tier: 'indigenous',
  languages: ['te-reo-maori'],
  started: 2016,
  ended: null,
  site: { lat: -35.11, lon: 173.26, place: 'Kaitaia', source: src },
  applications: ['asr', 'tts'],
  methods: [],
  data_regime: '1k-10k',
  governance: { posture: 'community-controlled', licence: 'Kaitiakitanga', source: src },
  status: 'verified',
}

describe('LanguageSchema', () => {
  it('accepts a well-formed indigenous language', () => {
    expect(LanguageSchema.safeParse(language).success).toBe(true)
  })

  it('keeps a speaker-count conflict instead of resolving it', () => {
    const r = LanguageSchema.safeParse({
      ...language,
      speakers: { value: 9600, as_of: 2015, source: src, conflicts: [{ value: 1000, source: src }] },
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.speakers?.conflicts).toHaveLength(1)
  })

  it('rejects an adjacent-tier language carrying a centre (spec D5)', () => {
    const r = LanguageSchema.safeParse({ ...language, id: 'manchu', tier: 'adjacent' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/adjacent/i)
  })

  it('accepts an adjacent-tier language with no centre', () => {
    const { centre: _centre, ...rest } = language
    const r = LanguageSchema.safeParse({ ...rest, id: 'manchu', tier: 'adjacent' })
    expect(r.success).toBe(true)
  })

  it('rejects an out-of-range centre latitude', () => {
    const r = LanguageSchema.safeParse({
      ...language,
      centre: { lat: 143.0, lon: -74.5, source: src },
    })
    expect(r.success).toBe(false)
  })
})

describe('InitiativeSchema', () => {
  it('accepts a well-formed indigenous initiative', () => {
    expect(InitiativeSchema.safeParse(initiative).success).toBe(true)
  })

  it('rejects an adjacent initiative with no transferability note (spec D2)', () => {
    const r = InitiativeSchema.safeParse({ ...initiative, id: 'masakhane', tier: 'adjacent' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/transferability/i)
  })

  it('accepts an adjacent initiative that answers the transferability question', () => {
    const r = InitiativeSchema.safeParse({
      ...initiative,
      id: 'masakhane',
      tier: 'adjacent',
      transferability: {
        transfers: ['participatory corpus building'],
        does_not_transfer: ['open web-scale scraping'],
        note: 'Open release conflicts with OCAP.',
      },
    })
    expect(r.success).toBe(true)
  })

  it('rejects a transferability note on an indigenous-tier initiative', () => {
    const r = InitiativeSchema.safeParse({
      ...initiative,
      transferability: { transfers: [], does_not_transfer: [], note: 'n/a' },
    })
    expect(r.success).toBe(false)
  })

  it('rejects an end year before the start year', () => {
    expect(InitiativeSchema.safeParse({ ...initiative, started: 2020, ended: 2016 }).success).toBe(false)
  })
})

describe('honest absence', () => {
  it('keeps a curator caveat through a round-trip on both record types', () => {
    const note = 'Centre is Glottolog\'s round (40.0, -90.0) — a placeholder, not a researched location.'

    const l = LanguageSchema.safeParse({ ...language, caveat: note })
    expect(l.success).toBe(true)
    if (l.success) expect(l.data.caveat).toBe(note)

    const i = InitiativeSchema.safeParse({ ...initiative, caveat: note })
    expect(i.success).toBe(true)
    if (i.success) expect(i.data.caveat).toBe(note)

    // Absent means absent, not undefined: the bundle carries an explicit null.
    const bare = LanguageSchema.safeParse(language)
    expect(bare.success).toBe(true)
    if (bare.success) expect(bare.data.caveat).toBeNull()
  })

  it('lets a language say its family and region are unknown rather than guessing', () => {
    const { family: _f, region: _r, ...rest } = language
    const r = LanguageSchema.safeParse(rest)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.family).toBeNull()
      expect(r.data.region).toBeNull()
    }
  })

  it('lets an initiative say its start year is unknown', () => {
    const r = InitiativeSchema.safeParse({ ...initiative, started: null })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.started).toBeNull()
  })

  it('does not fire the ended-before-started check when started is unknown', () => {
    // There is nothing to compare against; the refinement must neither throw
    // nor invent an ordering problem.
    const r = InitiativeSchema.safeParse({ ...initiative, started: null, ended: 2016 })
    expect(r.success).toBe(true)
  })

  it('holds links[].retrieved to the same YYYY-MM-DD rule as a source', () => {
    const link = (retrieved: string) => ({
      ...initiative,
      links: [{ label: 'About', url: 'https://tehiku.nz/about/', retrieved }],
    })
    expect(InitiativeSchema.safeParse(link('last spring')).success).toBe(false)
    expect(InitiativeSchema.safeParse(link('2026-09-03')).success).toBe(true)
  })
})
