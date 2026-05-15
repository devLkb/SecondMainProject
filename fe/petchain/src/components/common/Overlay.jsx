export default function Overlay({ title, sub, onClose, children }) {
  return (
    <div
      className="overlay-bg"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="overlay-box">
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 18,
            background: 'none', border: 'none', fontSize: 22,
            color: '#a8a29e', cursor: 'pointer', lineHeight: 1,
          }}
        >
          ✕
        </button>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{sub}</div>}
        {children}
      </div>
    </div>
  )
}
