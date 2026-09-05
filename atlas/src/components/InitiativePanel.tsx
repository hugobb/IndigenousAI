import type { Initiative, Method } from '../schema/index.js'
import Field from './Field.js'
import PanelSection from './PanelSection.js'

export default function InitiativePanel({
  initiative, methods,
}: { initiative: Initiative; methods: Method[] }): React.JSX.Element {
  const mine = methods.filter((m) => initiative.methods.includes(m.id))
  const years =
    initiative.started === null
      ? null
      : `${initiative.started}–${initiative.ended === null ? 'ongoing' : initiative.ended}`
  return (
    <aside className="card panel" aria-label={`Initiative: ${initiative.name}`}>
      <h2>{initiative.name}</h2>
      <PanelSection title="Work">
        <Field label="Years" testId="field-years">{years}</Field>
        <Field label="Applications" testId="field-applications">{initiative.applications.join(', ')}</Field>
        <Field label="Methods" testId="field-methods">
          {mine.length === 0 ? null : (
            <ul>{mine.map((m) => <li key={m.id}><a href={m.doc_url}>{m.name}</a></li>)}</ul>
          )}
        </Field>
        <Field label="Models" testId="field-models">{initiative.models.join(', ')}</Field>
      </PanelSection>
      <PanelSection title="Governance">
        <Field label="Governance" testId="field-governance">{initiative.governance?.posture}</Field>
      </PanelSection>
      <PanelSection title="Place">
        <Field label="Location" testId="field-site">
          {initiative.site.place}
          {initiative.site.confidence === 'approximate' && <strong> — approximate</strong>}
        </Field>
      </PanelSection>
      <PanelSection title="Note">
        <Field label="Note" testId="field-caveat">{initiative.caveat}</Field>
        {initiative.transferability !== null && (
          <Field label="Does this transfer?" testId="field-transferability">
            <p>{initiative.transferability.note}</p>
            <p>Transfers: {initiative.transferability.transfers.join(', ')}</p>
            <p>Does not transfer: {initiative.transferability.does_not_transfer.join(', ')}</p>
          </Field>
        )}
      </PanelSection>
    </aside>
  )
}
