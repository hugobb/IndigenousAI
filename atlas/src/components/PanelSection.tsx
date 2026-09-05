/** A titled group of fields. The panels grew past the point where one flat
 *  `<dl>` was scannable; each section owns its own list so the heading and its
 *  fields are associated structurally, not just visually. */
export default function PanelSection({
  title, children,
}: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="panel__section">
      <h3 className="panel__section-title">{title}</h3>
      <dl>{children}</dl>
    </section>
  )
}
