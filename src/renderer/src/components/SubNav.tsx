type SubPage = 'general' | 'behavior'

interface Props {
  activeSub: SubPage
  onNavigate: (sub: SubPage) => void
}

const ITEMS: { sub: SubPage; label: string; detail: string }[] = [
  { sub: 'general', label: 'General', detail: 'Paths, polling, color' },
  { sub: 'behavior', label: 'Behavior', detail: 'Monitoring and startup' }
]

export function SubNav({ activeSub, onNavigate }: Props) {
  return (
    <aside className="subnav">
      <div className="subnav-eyebrow">Settings</div>
      <nav className="subnav-list">
        {ITEMS.map(({ sub, label, detail }) => (
          <button
            key={sub}
            className={`subnav-item ${activeSub === sub ? 'active' : ''}`.trim()}
            onClick={() => onNavigate(sub)}
          >
            <span>{label}</span>
            <small>{detail}</small>
          </button>
        ))}
      </nav>
    </aside>
  )
}
