export default function TopBar({ step, onReset }) {
  const steps = ['Config', 'Extract', 'Results']

  return (
    <header className="no-print sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ background: '#0F172A', borderBottom: '1px solid #1E293B' }}>

      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: '#3B82F6' }}>⚡</div>
        <div>
          <span className="text-white font-bold text-sm tracking-wide">TX FAT</span>
          <span className="text-slate-400 text-xs ml-2 hidden sm:inline">3-Winding Transformer</span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={i === step
                ? { background: '#3B82F6', color: 'white' }
                : i < step
                  ? { background: '#1E3A5F', color: '#60A5FA' }
                  : { background: 'transparent', color: '#475569' }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                style={{ background: i <= step ? 'rgba(255,255,255,0.2)' : '#1E293B' }}>
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i < 2 && (
              <div className="w-6 h-px mx-1" style={{ background: i < step ? '#3B82F6' : '#1E293B' }} />
            )}
          </div>
        ))}
      </div>

      {/* New batch */}
      <button onClick={onReset}
        className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
        style={{ color: '#94A3B8', border: '1px solid #1E293B' }}
        onMouseEnter={e => { e.target.style.color = '#F1F5F9'; e.target.style.borderColor = '#334155' }}
        onMouseLeave={e => { e.target.style.color = '#94A3B8'; e.target.style.borderColor = '#1E293B' }}>
        ↺ New batch
      </button>
    </header>
  )
}
