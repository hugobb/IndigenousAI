import type { Initiative, Language } from '../schema/index.js'
import { locationConfidence } from '../lib/confidence.js'

export interface PointFeature {
  type: 'Feature'
  id: string
  properties: Record<string, string | number | boolean | null>
  geometry: { type: 'Point'; coordinates: [number, number] }
}

export interface PointCollection {
  type: 'FeatureCollection'
  features: PointFeature[]
}

const collection = (features: PointFeature[]): PointCollection => ({
  type: 'FeatureCollection',
  features,
})

const hasCentre = (l: Language): l is Language & { centre: NonNullable<Language['centre']> } =>
  l.centre !== null

/** One point per language that has a centre. A language without one is NOT
 *  placed at a default coordinate — it is omitted here and surfaced by
 *  `unmappedLanguages`, so a gap in the data reads as a gap. */
export function languageFields(languages: Language[]): PointCollection {
  return collection(
    languages.filter(hasCentre).map((l) => ({
      type: 'Feature' as const,
      id: l.id,
      properties: {
        id: l.id,
        name: l.name,
        tier: l.tier,
        confidence: locationConfidence(l.centre),
      },
      geometry: { type: 'Point' as const, coordinates: [l.centre.lon, l.centre.lat] as [number, number] },
    })),
  )
}

/** One point per initiative. `site` is not nullable, so every initiative is
 *  drawn — but an `approximate` one is drawn out of focus. */
export function initiativeSites(initiatives: Initiative[]): PointCollection {
  return collection(
    initiatives.map((i) => ({
      type: 'Feature' as const,
      id: i.id,
      properties: {
        id: i.id,
        name: i.name,
        tier: i.tier,
        kind: i.kind,
        confidence: locationConfidence(i.site),
        started: i.started,
        ended: i.ended,
      },
      geometry: { type: 'Point' as const, coordinates: [i.site.lon, i.site.lat] as [number, number] },
    })),
  )
}

/** What the map cannot show faithfully. Rendered beside it so a reader can
 *  tell "we found nothing" from "there is nothing". */
export function unmappedLanguages(languages: Language[]): {
  notMapped: Language[]
  approximate: Language[]
} {
  return {
    notMapped: languages.filter((l) => locationConfidence(l.centre) === 'absent'),
    approximate: languages.filter((l) => locationConfidence(l.centre) === 'approximate'),
  }
}
