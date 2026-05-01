import { useState } from 'react'
import { apiPost, apiGet, getSessionId, API_BASE } from '../../utils/api'

const PF_PARAMS = [
  { key: 'xht_pu',  label: 'x_hv (pu)',  group: 'T-Equiv' },
  { key: 'xlt1_pu', label: 'x_lv1 (pu)', group: 'T-Equiv' },
  { key: 'xlt2_pu', label: 'x_lv2 (pu)', group: 'T-Equiv' },
  { key: 'rht_pu',  label: 'r_hv (pu)',  group: 'T-Equiv' },
  { key: 'rlt1_pu', label: 'r_lv1 (pu)', group: 'T-Equiv' },
  { key: 'rlt2_pu', label: 'r_lv2 (pu)', group: 'T-Equiv' },
  { key: 'p0_kw',   label: 'P0 (kW)',    group: 'Losses'  },
  { key: 'i0_pct',  label: 'I0 (%)',     group: 'Losses'  },
]

function DownloadBtn({ onClick, label, icon = '⬇', secondary = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
      style={secondary
        ? { border: '1.5px solid #1F497D', color: '#1F497D', background: 'white' }
        : { background: '#375623', color: 'white' }}>
      {icon} {label}
    </button>
  )
}

export default function Results({ onNormalised, qaData }) {
  const [pfChoice,  setPfChoice]  = useState(null)   // null | 'yes' | 'no'
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [pfResults, setPfResults] = useState(null)

  const sid = getSessionId()

  // ── Downloads ──────────────────────────────────────────────────────────────
  const downloadExcel = () =>
    window.open(`${API_BASE}/v1/download/${sid}`, '_blank')

  const downloadConfig = () => {
    const saved = localStorage.getItem('fat_config')
    if (!saved) { alert('No saved config found.'); return }
    const blob = new Blob([saved], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'fat_batch_config.json'
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Normalisation ──────────────────────────────────────────────────────────
  const handleNormalise = async () => {
    setLoading(true); setError(null)
    try {
      const data = await apiPost(`/v1/normalise/${sid}`, {})
      setPfResults(data)
      onNormalised(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PHASE 1 — Extraction done, offer downloads + PF prompt
  // ══════════════════════════════════════════════════════════════════════════
  if (!pfChoice) {
    return (
      <div className="max-w-2xl mx-auto mt-8 px-4 space-y-4">

        {/* Extraction summary */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">✅</span>
            <div>
              <h2 className="text-base font-bold text-gray-800">Step 1 complete — Extraction done</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {qaData?.extracted ?? '—'} transformers extracted
                {qaData?.failed > 0 ? ` · ${qaData.failed} excluded` : ''}
              </p>
            </div>
          </div>

          {/* Download row */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
            <DownloadBtn onClick={downloadExcel}  label="Download FAT Results Excel" />
            <DownloadBtn onClick={downloadConfig} label="Download config (reuse later)" secondary />
          </div>
        </div>

        {/* PowerFactory prompt */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-1">
            Do you need PowerFactory-ready normalised data?
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            This calculates T-equivalent impedances and normalises all parameters
            to the rated MVA base for direct import into PowerFactory.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setPfChoice('yes'); handleNormalise() }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#1F497D' }}>
              ✔ Yes — generate PowerFactory data
            </button>
            <button
              onClick={() => setPfChoice('no')}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50">
              ✘ No — I'm done
            </button>
          </div>
        </div>

      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PHASE 2a — User said No
  // ══════════════════════════════════════════════════════════════════════════
  if (pfChoice === 'no') {
    return (
      <div className="max-w-xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-base font-bold text-gray-800 mb-1">All done!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your FAT Results Excel has been generated. Start a new batch whenever you're ready.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <DownloadBtn onClick={downloadExcel}  label="Download FAT Results Excel" />
            <DownloadBtn onClick={downloadConfig} label="Download config for future batches" secondary />
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PHASE 2b — Normalising…
  // ══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <div className="text-4xl mb-4 animate-spin inline-block">⚙️</div>
          <p className="text-sm text-gray-600 font-medium">Normalising results…</p>
          <p className="text-xs text-gray-400 mt-2">Calculating T-equivalent impedances</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button onClick={() => { setError(null); setPfChoice(null) }}
            className="text-blue-600 text-sm underline">← Go back</button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PHASE 2c — PowerFactory results ready
  // ══════════════════════════════════════════════════════════════════════════
  if (!pfResults) return null

  const { transformers = [], summary = {} } = pfResults
  const preview = transformers[0]

  return (
    <div className="max-w-4xl mx-auto mt-6 px-4 space-y-4">

      {/* Banner */}
      <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
        <div className="text-4xl">✅</div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">PowerFactory data ready</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {summary.count ?? transformers.length} transformers normalised
            {summary.excluded ? ` · ${summary.excluded} excluded` : ''}.
            Excel file updated with normalised parameters.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <DownloadBtn onClick={downloadExcel}  label="Download Excel" />
          <DownloadBtn onClick={downloadConfig} label="Download config" secondary />
        </div>
      </div>

      {/* Normalised results table — all transformers */}
      {transformers.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Normalised PowerFactory Parameters ({transformers.length} transformers)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
            <table className="text-xs w-full">
              <thead className="sticky top-0">
                <tr style={{ background: '#1F497D' }}>
                  <th className="text-white text-left px-3 py-2 font-semibold sticky left-0" style={{ background: '#1F497D' }}>
                    Unit ID
                  </th>
                  {PF_PARAMS.map(p => (
                    <th key={p.key} className="text-white text-right px-3 py-2 font-semibold whitespace-nowrap">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transformers.map((t, i) => (
                  <tr key={t.serial}
                    style={{ background: i % 2 === 0 ? '#F9FAFB' : 'white', borderBottom: '1px solid #E5E7EB' }}>
                    <td className="px-3 py-1.5 font-mono font-semibold text-blue-700 whitespace-nowrap">{t.serial}</td>
                    {PF_PARAMS.map(p => {
                      const val = t.params?.[p.key]
                      return (
                        <td key={p.key} className="px-3 py-1.5 text-right font-mono text-gray-700 whitespace-nowrap">
                          {val !== undefined && val !== null
                            ? typeof val === 'number' ? val.toFixed(5) : val
                            : <span className="text-gray-300">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Full dataset including raw FAT results is in the downloaded Excel file.
          </p>
        </div>
      )}

      {/* Final download row */}
      <div className="flex justify-center gap-3 pb-6">
        <DownloadBtn onClick={downloadExcel}  label="Download FAT_Results_Summary.xlsx" />
        <DownloadBtn onClick={downloadConfig} label="Save config for future batches" secondary />
      </div>

    </div>
  )
}
