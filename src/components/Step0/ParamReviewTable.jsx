import { useState, useEffect } from 'react'
import { apiPost, getSessionId } from '../../utils/api'

function groupOf(param) {
  const role = param.role || param.key || ''
  if (role.startsWith('imp'))   return 'imp'
  if (['load_loss','no_load','mag_curr'].includes(role)) return 'loss'
  return 'meta'
}

const GROUP_BADGE = {
  imp:  { bg: '#DBEAFE', text: '#1D4ED8', label: 'Impedance' },
  loss: { bg: '#D1FAE5', text: '#065F46', label: 'Loss / Current' },
  meta: { bg: '#F1F5F9', text: '#475569', label: 'Info' },
}

export default function ParamReviewTable({ detected, onConfirmed }) {
  const { params: initial, sample_filenames: sampleFiles = [] } = detected
  const [params,    setParams]  = useState(initial)
  const [saving,    setSaving]  = useState(false)
  const [error,     setError]   = useState(null)
  const [batchInfo, setBatch]   = useState({ rated_mva: 4.6, split_mva: 2.3 })

  const removeParam = (i) => setParams(ps => ps.filter((_, idx) => idx !== i))

  const handleConfirm = async () => {
    setSaving(true); setError(null)
    try {
      const config = { ...batchInfo, parameters: params }
      await apiPost(`/v1/config/${getSessionId()}`, { config })
      localStorage.setItem('fat_config', JSON.stringify({ ...batchInfo, parameters: params }))
      onConfirmed(config)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Enter key → confirm
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Enter' && !saving) handleConfirm() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [params, batchInfo, saving])

  const shortName = (fname) => fname?.replace('Routine Test Report ', '').replace('.pdf', '') || fname

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4 pb-12">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4" style={{ border: '1px solid #E2E8F0' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Review Parameters</h2>
            <p className="text-sm text-slate-500 mt-1">
              Check sample values match expected results. Remove any incorrect rows, then confirm.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            {params.length} params
          </span>
        </div>

        {/* MVA inputs */}
        <div className="flex gap-4 mb-6 p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mr-2">
            ⚙ MVA Ratings
          </div>
          {[['Rated MVA', 'rated_mva', '4.6'], ['Split MVA', 'split_mva', '2.3']].map(([label, key, ph]) => (
            <label key={key} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{label}</span>
              <input
                type="number"
                value={batchInfo[key]}
                placeholder={ph}
                onChange={e => setBatch(b => ({ ...b, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-20 border rounded-lg px-2 py-1.5 text-sm text-center font-mono focus:outline-none focus:ring-2"
                style={{ borderColor: '#CBD5E1', focusRingColor: '#3B82F6' }}
              />
            </label>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0F172A' }}>
                <th className="text-slate-400 text-left px-4 py-3 text-xs font-semibold w-8">#</th>
                <th className="text-slate-200 text-left px-4 py-3 text-xs font-semibold">Parameter</th>
                <th className="text-slate-400 text-left px-4 py-3 text-xs font-semibold w-28">Method</th>
                {sampleFiles.map(f => (
                  <th key={f} className="text-slate-200 text-right px-4 py-3 text-xs font-semibold w-28">{shortName(f)}</th>
                ))}
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {params.map((p, i) => {
                const grp  = GROUP_BADGE[groupOf(p)] || GROUP_BADGE.meta
                const isOdd = i % 2 === 1
                return (
                  <tr key={i} style={{ background: isOdd ? '#F8FAFC' : 'white', borderBottom: '1px solid #F1F5F9' }}>
                    <td className="px-4 py-3 text-xs text-slate-400 font-medium text-center">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                          style={{ background: grp.bg, color: grp.text }}>
                          {grp.label}
                        </span>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-xs">{p.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-400">{p.extract} · {p.unit}</span>
                    </td>
                    {sampleFiles.map(f => {
                      const val = p.samples?.[f]
                      return (
                        <td key={f} className="px-4 py-3 text-right">
                          {val === null || val === undefined
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: '#FEF2F2', color: '#DC2626' }}>MISSING</span>
                            : <span className="text-xs font-mono text-slate-700">{typeof val === 'number' ? val.toFixed(4) : val}</span>
                          }
                        </td>
                      )
                    })}
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => removeParam(i)}
                        className="w-6 h-6 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors text-base leading-none flex items-center justify-center">
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm text-red-700" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex justify-between items-center">
          <p className="text-xs text-slate-400">{params.length} parameters · press Enter or click to confirm</p>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: saving ? '#CBD5E1' : '#16A34A', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Confirm & proceed to Step 1 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
