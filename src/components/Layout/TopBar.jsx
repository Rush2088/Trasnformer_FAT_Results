export default function TopBar({ step, onReset }) {
  const steps = ['0  Config', '1  Extract', '2  Results']

  return (
    <div className="no-print flex items-center justify-between px-4 py-2 shadow-md"
         style={{ background: '#1F497D' }}>

      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="text-white font-bold text-sm tracking-widest">⚡ TX FAT</span>
        <span className="text-blue-200 text-xs hidden sm:inline">
          3-Winding Transformer FAT Results
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className={`px-3 py-1 rounded text-xs font-semibold
              ${i === step
                ? 'bg-white text-blue-900'
                : i < step
                  ? 'bg-blue-400 text-white'
                  : 'bg-blue-900 text-blue-300'}`}>
              {label}
            </div>
            {i < 2 && <span className="text-blue-400 mx-1 text-xs">›</span>}
          </div>
        ))}
      </div>

      {/* New session */}
      <button
        onClick={onReset}
        className="text-blue-200 hover:text-white text-xs underline underline-offset-2">
        New batch
      </button>
    </div>
  )
}
