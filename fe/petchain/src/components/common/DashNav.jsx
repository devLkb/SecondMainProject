import { ROLE_META } from '../../context/AppContext'

export default function DashNav({ role, tab, setTab, onLogout }) {
  const meta = ROLE_META[role]
  return (
    <div className="dash-gnb">
      <div className="dash-logo">🐾 Pet<span>Chain</span></div>
      {meta.tabs.map(t => (
        <div
          key={t.id}
          className={`dash-nav-item ${tab === t.id ? 'on' : ''}`}
          onClick={() => setTab(t.id)}
        >
          {t.lbl}
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{meta.name}</span>
          <span
            className="badge"
            style={{ background: meta.bg, color: meta.color, fontSize: 11 }}
          >
            {meta.label}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
