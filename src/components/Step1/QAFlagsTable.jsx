import { useState, useEffect } from 'react'
import { apiPost, getSessionId } from '../../utils/api'

const STATUS = {
  ok:      { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC', label: '✓ OK' },
  warning: { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', label: '⚠ Warning' },
  failed:  { bg: '#FEF2F2', text: '#B91C1C', border: '#FCA5A5', label: '✗ Failed' },
}

export default function QAFlagsTable({ qaData, onConfirmed }) {
  const [excluded, setExcluded] = useState(
    () => new Set(qaData.results.filter(r => r.status === 'failed').map(r => r.serial))
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const [filter, setFilter] = useState('all')

  const toggle = (serial) => setExcluded(prev => {
    const next = new Set(prev); next.has(serial) ? next.delete(serial) : next.add(serial); return next
  })

  const handleConfirm = async () => {
    setSaving(true); setError(null)
    try {
      await apiPost(`/v1/extract/${getSessionId()}/confirm`, { exclude: [...excluded], include: [] })
      onConfirmed(qaData)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Enter' && !saving) handleConfirm() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [excluded, saving])

  const warnCount   = qaData.results.filter(r => r.status === 'warning').length
  const failedCount = qaData.results.filter(r => r.status === 'failed').length
  const visible     = qaData.results.filter(r => filter === 'all' || r.status === filter)

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
      <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid #E2E8F0' }}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">QA Review</h2>
            <p className="text-sm text-slate-500 mt-1">
              Review flagged transformers. Check the box to exclude from final output.
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Extracted', value: qaData.extracted, bg: '#F0FDF4', text: '#15803D' },
            { label: 'Warnings',  value: warnCount,        bg: '#FFFBEB', text: '#B45309' },
            { label: 'Failed',    value: failedCount,      bg: failedCount ? '#FEF2F2' : '#F8FAFC', text: failedCount ? '#B91C1C' : '#94A3B8' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-4 text-center" style={{ background: c.bg }}>
              <div className="text-3xl font-bold" style={{ color: c.text }}>{c.value}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: c.text }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[['all', 'All'], ['warning', 'Warnings'], ['failed', 'Failed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={filter === val ? { background: '#0F172A', color: 'white' } : { background: '#F1F5F9', color: '#64748B' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden max-h-80 overflow-y-auto" style={{ border: '1px solid #E2E8F0' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr style={{ background: '#0F172A' }}>
                <th className="text-slate-300 text-left px-4 py-3 text-xs font-semibold">Unit ID</th>
                <th className="text-slate-300 text-center px-4 py-3 text-xs font-semibold w-28">Status</th>
                <th className="text-slate-300 text-left px-4 py-3 text-xs font-semibold">Flags</th>
                <th className="text-slate-300 text-center px-4 py-3 text-xs font-semibold w-20">Exclude</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => {
                const st = STATUS[r.status] || STATUS.ok
                const isExcl = excluded.has(r.serial)
                return (
                  <tr key={r.serial}
                    style={{ background: isExcl ? '#F8FAFC' : (i % 2 === 0 ? 'white' : '#FAFAFA'), borderBottom: '1px solid #F1F5F9', opacity: isExcl ? 0.5 : 1 }}>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-700">{r.serial}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {r.flags.length === 0
                          ? <span className="text-slate-300 text-xs">—</span>
                          : r.flags.map((f, fi) => (
                            <span key={fi} className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ background: '#FFFBEB', color: '#92400E' }}>{f}</span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input type="checkbox" checked={isExcl} onChange={() => toggle(r.serial)}
                        className="w-4 h-4 cursor-pointer accent-red-500" />
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-slate-400">No {filter !== 'all' ? filter : ''} results</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {excluded.size > 0 && (
          <p className="mt-3 text-xs text-red-500 font-medium">
            {excluded.size} transformer{excluded.size !== 1 ? 's' : ''} will be excluded from the final output.
          </p>
        )}

        {error && (
          <div className="mt-3 px-4 py-3 rounded-lg text-sm text-red-700" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-between items-center">
          <p className="text-xs text-slate-400">Press Enter or click to proceed</p>
          <button onClick={handleConfirm} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: saving ? '#CBD5E1' : '#16A34A', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Confirm & proceed to Step 2 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
