import { useState } from 'react'
import { apiPost, apiGet, getSessionId } from '../../utils/api'

/**
 * results shape from /api/normalise/{sid}:
 * {
 *   excel_url: "/api/download/{sid}",
 *   transformers: [
 *     {
 *       serial: "B456-0001",
 *       params: {
 *         xht_pu: 0.0542, xlt1_pu: 0.0218, xlt2_pu: 0.0231,
 *         rht_pu: 0.00142, rlt1_pu: 0.00061, rlt2_pu: 0.00058,
 *         p0_kw: 3.2, i0_pct: 0.31,
 *       }
 *     }
 *   ],
 *   summary: { count: 48, excluded: 2 }
 * }
 */

const PF_PARAMS = [
  { key: 'xht_pu',   label: 'x_hv (pu)',   group: 'T-Equiv' },
  { key: 'xlt1_pu',  label: 'x_lv1 (pu)',  group: 'T-Equiv' },
  { key: 'xlt2_pu',  label: 'x_lv2 (pu)',  group: 'T-Equiv' },
  { key: 'rht_pu',   label: 'r_hv (pu)',   group: 'T-Equiv' },
  { key: 'rlt1_pu',  label: 'r_lv1 (pu)',  group: 'T-Equiv' },
  { key: 'rlt2_pu',  label: 'r_lv2 (pu)',  group: 'T-Equiv' },
  { key: 'p0_kw',    label: 'P0 (kW)',     group: 'Losses' },
  { key: 'i0_pct',   label: 'I0 (%)',      group: 'Losses' },
]

export default function Results({ onNormalised, qaData }) {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [results,  setResults]  = useState(null)
  const [started,  setStarted]  = useState(false)

  const handleRun = async () => {
    setLoading(true); setError(null); setStarted(true)
    try {
      const sid  = getSessionId()
      const data = await apiPost(`/v1/normalise/${sid}`, {})
      setResults(data)
      onNormalised(data)
    } catch (e) {
      setError(e.message)
      setStarted(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    const sid = getSessionId()
    // Open download in new tab — browser handles the file save
    window.open(`${import.meta.env.VITE_API_BASE || 'https://rashmil888-tx-fat-reports.hf.space'}/v1/download/${sid}`, '_blank')
  }

  if (!started) {
    return (
      <div className="max-w-xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Step 2 — Normalise</h2>
          <p className="text-sm text-gray-500 mb-6">
            Calculate T-equivalent impedances and normalise all parameters to the rated MVA base.
            Results will be saved to an Excel workbook ready for PowerFactory import.
          </p>
          {qaData && (
            <p className="text-xs text-gray-400 mb-5">
              {qaData.extracted} transformers extracted · {qaData.failed} excluded
            </p>
          )}
          <button
            onClick={handleRun}
            disabled={loading}
            className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#375623' }}>
            ▶ Run Normalisation
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    )
  }

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

  if (!results) return null

  const { transformers = [], summary = {} } = results
  // Show first transformer as a preview
  const preview = transformers[0]

  return (
    <div className="max-w-4xl mx-auto mt-6 px-4 space-y-4">
      {/* Success banner */}
      <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
        <div className="text-4xl">✅</div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">Normalisation complete</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {summary.count ?? transformers.length} transformers normalised
            {summary.excluded ? ` · ${summary.excluded} excluded` : ''}.
            Excel file is ready to download.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 whitespace-nowrap"
          style={{ background: '#375623' }}>
          ⬇ Download Excel
        </button>
      </div>

      {/* Preview table — first transformer */}
      {preview && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Sample result — <span className="font-mono text-blue-700">{preview.serial}</span>
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1F497D' }}>
                  <th className="text-white text-left px-3 py-2">Parameter</th>
                  <th className="text-white text-right px-3 py-2 w-36">Value</th>
                </tr>
              </thead>
              <tbody>
                {PF_PARAMS.map((p, i) => {
                  const val = preview.params?.[p.key]
                  const isTeq = p.group === 'T-Equiv'
                  return (
                    <tr
                      key={p.key}
                      style={{
                        background: isTeq ? (i % 2 === 0 ? '#E2EFDA' : '#EBF1DE') : (i % 2 === 0 ? '#FFF2CC' : '#FFFBE6'),
                        borderBottom: '1px solid #E5E7EB'
                      }}>
                      <td className="px-3 py-1.5 text-xs font-semibold text-gray-700">{p.label}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-gray-800">
                        {val !== undefined && val !== null
                          ? typeof val === 'number' ? val.toFixed(5) : val
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Showing parameters for the first transformer. Full dataset in the Excel file.
          </p>
        </div>
      )}

      {/* All serials list */}
      {transformers.length > 1 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">All normalised transformers ({transformers.length})</h3>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {transformers.map(t => (
              <span
                key={t.serial}
                className="px-2 py-0.5 rounded text-xs font-mono"
                style={{ background: '#E2EFDA', color: '#375623' }}>
                {t.serial}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Download again */}
      <div className="flex justify-center pb-4">
        <button
          onClick={handleDownload}
          className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#375623' }}>
          ⬇ Download FAT_Results_Summary.xlsx
        </button>
      </div>
    </div>
  )
}
