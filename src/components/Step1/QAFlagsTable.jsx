import { useState } from 'react'
import { apiPost, getSessionId } from '../../utils/api'

/**
 * qaData shape returned from /api/extract/{sid}/run:
 * {
 *   total: 50,
 *   extracted: 48,
 *   failed: 2,
 *   results: [
 *     { serial: "B456-0001", status: "ok",      flags: [] },
 *     { serial: "B456-0023", status: "warning", flags: ["imp_total MISSING", "load_loss out of range"] },
 *     { serial: "B456-0037", status: "failed",  flags: ["PDF not found"] },
 *   ]
 * }
 */

const STATUS_STYLE = {
  ok:      { bg: '#E2EFDA', text: '#375623', label: '✓ OK' },
  warning: { bg: '#FFF2CC', text: '#7D5A00', label: '⚠ Warning' },
  failed:  { bg: '#FCE4D6', text: '#9C2A00', label: '✗ Failed' },
}

export default function QAFlagsTable({ qaData, onConfirmed }) {
  const [excluded, setExcluded] = useState(
    () => new Set(qaData.results.filter(r => r.status === 'failed').map(r => r.serial))
  )
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [filter, setFilter]   = useState('all')  // all | warning | failed

  const toggleExclude = (serial) => {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(serial) ? next.delete(serial) : next.add(serial)
      return next
    })
  }

  const handleConfirm = async () => {
    setSaving(true); setError(null)
    try {
      const sid = getSessionId()
      await apiPost(`/v1/extract/${sid}/confirm`, { exclude: [...excluded], include: [] })
      onConfirmed(qaData)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const visible = qaData.results.filter(r => {
    if (filter === 'all') return true
    return r.status === filter
  })

  const warnCount   = qaData.results.filter(r => r.status === 'warning').length
  const failedCount = qaData.results.filter(r => r.status === 'failed').length

  return (
    <div className="max-w-4xl mx-auto mt-6 px-4">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Step 1 — QA Review</h2>
        <p className="text-sm text-gray-500 mb-4">
          Extracted <strong>{qaData.extracted}</strong> of <strong>{qaData.total}</strong> transformers.
          {warnCount > 0 && <span className="ml-2 text-amber-600">{warnCount} warning{warnCount !== 1 ? 's' : ''}</span>}
          {failedCount > 0 && <span className="ml-2 text-red-600">{failedCount} failed</span>}
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Extracted', value: qaData.extracted, bg: '#E2EFDA', text: '#375623' },
            { label: 'Warnings',  value: warnCount,        bg: '#FFF2CC', text: '#7D5A00' },
            { label: 'Failed',    value: failedCount,      bg: failedCount ? '#FCE4D6' : '#F2F2F2', text: failedCount ? '#9C2A00' : '#595959' },
          ].map(c => (
            <div key={c.label} className="rounded-lg p-3 text-center" style={{ background: c.bg }}>
              <div className="text-2xl font-bold" style={{ color: c.text }}>{c.value}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: c.text }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-3">
          {[['all', 'All'], ['warning', 'Warnings only'], ['failed', 'Failed only']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors
                ${filter === val ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr style={{ background: '#1F497D' }}>
                <th className="text-white text-left px-3 py-2">Serial</th>
                <th className="text-white text-center px-3 py-2 w-28">Status</th>
                <th className="text-white text-left px-3 py-2">Flags</th>
                <th className="text-white text-center px-3 py-2 w-20">Exclude</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const st = STATUS_STYLE[r.status] || STATUS_STYLE.ok
                const isExcluded = excluded.has(r.serial)
                return (
                  <tr
                    key={r.serial}
                    style={{ background: isExcluded ? '#F2F2F2' : st.bg, borderBottom: '1px solid #E5E7EB' }}
                    className={isExcluded ? 'opacity-50' : ''}>
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-gray-700">{r.serial}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.text}` }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {r.flags.length === 0
                        ? <span className="text-gray-300">—</span>
                        : r.flags.map((f, fi) => (
                          <span key={fi} className="inline-block mr-2 mb-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                            {f}
                          </span>
                        ))
                      }
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        onChange={() => toggleExclude(r.serial)}
                        className="w-4 h-4 accent-red-500 cursor-pointer"
                        title={isExcluded ? 'Click to include' : 'Click to exclude from results'}
                      />
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-sm text-gray-400">
                    No {filter !== 'all' ? filter : ''} results to show
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {excluded.size > 0 && (
          <p className="mt-2 text-xs text-red-600">
            {excluded.size} transformer{excluded.size !== 1 ? 's' : ''} will be excluded from the final Excel output.
          </p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-between items-center">
          <p className="text-xs text-gray-400">
            Uncheck to include a previously-failed transformer if the data looks usable
          </p>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:bg-gray-300"
            style={{ background: saving ? undefined : '#375623' }}>
            {saving ? 'Saving…' : 'Confirm & run Step 2 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
