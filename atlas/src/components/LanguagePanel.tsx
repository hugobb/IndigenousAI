import type { Initiative, Language } from '../schema/index.js'
import Field from './Field.js'

export default function LanguagePanel({
  language, initiatives,
}: { language: Language; initiatives: Initiative[] }): React.JSX.Element {
  const s = language.speakers
  return (
    <aside aria-label={`Language: ${language.name}`}>
      <h2>{language.name}</h2>
      <dl>
        <Field label="Also known as" testId="field-aka">{language.also_known_as.join(', ')}</Field>
        <Field label="Family" testId="field-family">{language.family}</Field>
        <Field label="Typology" testId="field-typology">{language.typology.join(', ')}</Field>
        <Field label="Endangerment" testId="field-endangerment">{language.endangerment?.status}</Field>
        <Field label="Speakers" testId="field-speakers">
          {s === null ? null : (
            <>
              <span>{s.value.toLocaleString('en')}</span>
              {s.conflicts.length > 0 && (
                <p>
                  Sources disagree. Also reported:{' '}
                  {s.conflicts.map((c) => c.value.toLocaleString('en')).join(', ')}
                </p>
              )}
            </>
          )}
        </Field>
        <Field label="Centre" testId="field-centre">
          {language.centre === null ? null : (
            <>
              {language.centre.lat.toFixed(2)}, {language.centre.lon.toFixed(2)}
              {language.centre.confidence === 'approximate' && <strong> — approximate</strong>}
            </>
          )}
        </Field>
        <Field label="Note" testId="field-caveat">{language.caveat}</Field>
        <Field label="Initiatives" testId="field-initiatives">
          {initiatives.length === 0 ? null : <ul>{initiatives.map((i) => <li key={i.id}>{i.name}</li>)}</ul>}
        </Field>
      </dl>
    </aside>
  )
}
