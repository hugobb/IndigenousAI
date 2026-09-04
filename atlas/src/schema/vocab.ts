export const TIERS = ['indigenous', 'adjacent'] as const
export type Tier = (typeof TIERS)[number]

/** Ordered from unconstrained to largest. `any` is not a size — it means the
 *  technique applies regardless of data volume (13 of the 25 technique-doc
 *  Data Regime values read this way). */
export const DATA_REGIMES = ['any', 'zero', '<1k', '1k-10k', '10k+'] as const
export type DataRegime = (typeof DATA_REGIMES)[number]

export const APPLICATIONS = [
  'asr', 'tts', 'mt', 'dictionary', 'spellcheck', 'keyboard', 'chatbot',
  'education', 'ocr', 'igt', 'corpus', 'tokenizer', 'evaluation',
] as const
export type Application = (typeof APPLICATIONS)[number]

export const GOVERNANCE_POSTURES = [
  'community-controlled', 'restricted', 'open', 'unstated',
] as const
export type GovernancePosture = (typeof GOVERNANCE_POSTURES)[number]

export const INITIATIVE_KINDS = [
  'organisation', 'project', 'shared-task', 'workshop', 'tool',
] as const
export type InitiativeKind = (typeof INITIATIVE_KINDS)[number]

export const REGIONS = [
  'north-america', 'central-america', 'south-america',
  'oceania', 'africa', 'eurasia', 'arctic',
] as const
export type Region = (typeof REGIONS)[number]

export const TYPOLOGIES = [
  'polysynthetic', 'agglutinative', 'fusional', 'isolating', 'synthetic',
] as const
export type Typology = (typeof TYPOLOGIES)[number]

/** UNESCO 2010 Atlas scale. */
export const ENDANGERMENT = [
  'safe', 'vulnerable', 'definitely-endangered',
  'severely-endangered', 'critically-endangered', 'extinct',
] as const
export type Endangerment = (typeof ENDANGERMENT)[number]

/** `draft` blocks the build. `rejected` is retained so seeding does not
 *  re-propose a record a human already excluded. */
export const RECORD_STATUS = ['draft', 'verified', 'rejected'] as const
export type RecordStatus = (typeof RECORD_STATUS)[number]

/** How much a coordinate can be trusted. `approximate` means the record's own
 *  text says so — a placeholder-looking centroid, or an organisation with no
 *  stated base. The map reads THIS, never the free-text `caveat`: a caveat may
 *  be about speaker counts rather than location. */
export const LOCATION_CONFIDENCE = ['sourced', 'approximate'] as const
export type LocationConfidence = (typeof LOCATION_CONFIDENCE)[number]
