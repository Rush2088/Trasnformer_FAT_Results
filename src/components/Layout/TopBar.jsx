export default function TopBar({ step, onReset }) {
  const steps = ['Config', 'Extract', 'Results']

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 18px', borderRadius: '10px',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.15s', border: 'none', whiteSpace: 'nowrap',
  }

  return (
    <header className="no-print sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ background: '#EFF6FF', borderBottom: '1px solid #BFDBFE' }}>

      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
          style={{ background: '#2563EB' }}>⚡</div>
        <div>
          <span className="font-bold text-sm tracking-wide" style={{ color: '#1E3A5F' }}>TX FAT</span>
          <span className="text-xs ml-2 hidden sm:inline" style={{ color: '#64A0D4' }}>
            3-Winding Transformer
          </span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={i === step
                ? { background: '#2563EB', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }
                : i < step
                  ? { background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }
                  : { background: 'white', color: '#94A3B8', border: '1px solid #E2E8F0' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: i === step ? 'rgba(255,255,255,0.25)' : i < step ? '#86EFAC' : '#F1F5F9', color: i === step ? 'white' : i < step ? '#15803D' : '#94A3B8' }}>
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i < 2 && (
              <div className="w-5 h-px mx-1" style={{ background: i < step ? '#86EFAC' : '#CBD5E1' }} />
            )}
          </div>
        ))}
      </div>

      {/* New batch button — matches Results page button style */}
      <button onClick={onReset}
        style={{ ...btnBase, background: 'white', color: '#475569', border: '1.5px solid #CBD5E1' }}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#F8FAFC', borderColor: '#94A3B8' })}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'white', borderColor: '#CBD5E1' })}>
        ↺ New batch
      </button>
    </header>
  )
}
