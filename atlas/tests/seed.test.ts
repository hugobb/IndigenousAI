import { describe, expect, it } from 'vitest'
import { seedLanguagesFromDraft } from '../scripts/seed.js'

const DRAFT = `# Review Paper

## Languages

### Choctaw

Population: 195,000
Number of speakers: 9600 -> 1000 speakers cited in another paper ?
Language family: Muskogean
Morphological Typology: Polysynthetic & Agglutinative
UNESCO classification: Vulnerable

### Lakota

Population: 170,000
Number of fluent speakers: 2,000 speakers
Language family: Siouan
Morphological Typology: Synthetic and Agglutinative
UNESCO classification: Critically endangered
`

describe('seedLanguagesFromDraft', () => {
  const seeded = seedLanguagesFromDraft(DRAFT)

  it('finds each language heading', () => {
    expect(seeded.map((l) => l.id)).toEqual(['choctaw', 'lakota'])
  })

  it('marks everything draft so the gate blocks it until reviewed', () => {
    expect(seeded.every((l) => l.status === 'draft')).toBe(true)
  })

  it('parses the language family', () => {
    expect(seeded[0]?.family).toBe('Muskogean')
  })

  it('maps the UNESCO wording onto the controlled scale', () => {
    expect(seeded[0]?.endangerment?.status).toBe('vulnerable')
    expect(seeded[1]?.endangerment?.status).toBe('critically-endangered')
  })

  it('splits a compound typology into controlled terms', () => {
    expect(seeded[0]?.typology).toEqual(['polysynthetic', 'agglutinative'])
  })

  it('keeps the second speaker figure as a conflict rather than picking one', () => {
    expect(seeded[0]?.speakers?.value).toBe(9600)
    expect(seeded[0]?.speakers?.conflicts[0]?.value).toBe(1000)
  })
})
