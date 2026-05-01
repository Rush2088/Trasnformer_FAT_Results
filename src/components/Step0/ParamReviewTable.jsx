import { useState } from 'react'
import { apiPost, getSessionId } from '../../utils/api'

const GROUP_COLORS = {
  imp:     { bg: '#E2EFDA', border: '#A9D18C', label: 'Impedance' },
  loss:    { bg: '#E2EFDA', border: '#A9D18C', label: 'Losses' },
  ins:     { bg: '#EBF1DE', border: '#C4D79B', label: 'Insulation' },
  temp:    { bg: '#EBF1DE', border: '#C4D79B', label: 'Temperature' },
  hv_res:  { bg: '#FFF2CC', border: '#FFD966', label: 'HV Resistance' },
  lv1_res: { bg: '#DEEBF7', border: '#9DC3E6', label: 'LV1 Resistance' },
  lv2_res: { bg: '#FCE4D6', border: '#F4B183', label: 'LV2 Resistance' },
  meta:    { bg: '#F2F2F2', border: '#BFBFBF', label: 'Nameplate' },
}

function groupOf(param) {
  const role = param.role || ''
  if (role.startsWith('imp'))   return 'imp'
  if (role === 'load_loss' || role === 'no_load' || role === 'mag_curr') return 'loss'
  if (param.key?.includes('ins')) return 'ins'
  if (param.key?.includes('temp')) return 'temp'
  if (param.key?.startsWith('hv_res')) return 'hv_res'
  if (param.key?.startsWith('lv1_res')) return 'lv1_res'
  if (param.key?.startsWith('lv2_res')) return 'lv2_res'
  return 'meta'
}

export default function ParamReviewTable({ detected, onConfirmed }) {
  const { params: initial, sample_filenames: sampleFiles = [] } = detected
  const [params, setParams]   = useState(initial)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [batchInfo, setBatch] = useState({ rated_mva: 4.6, split_mva: 2.3 })

  const removeParam = (i) => setParams(ps => ps.filter((_, idx) => idx !== i))

  const updateParam = (i, field, val) =>
    setParams(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: val } : p))

  const handleConfirm = async () => {
    setSaving(true); setError(null)
    try {
      const config = { ...batchInfo, parameters: params }
      // Save to backend
      await apiPost(`/v1/config/${getSessionId()}`, { config })
      // Also save locally for future sessions
      localStorage.setItem('fat_config', JSON.stringify(params))
      onConfirmed(config)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const shortName = (fname) => fname?.replace('Routine Test Report ', '').replace('.pdf', '') || fname

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <div className="bg-white rounded-xl shadow p-6 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Step 0 — Parameter Review</h2>
        <p className="text-sm text-gray-500 mb-4">
          Review the detected parameters. Check the sample values match what you expect.
          Remove rows you don't need, then click <strong>Confirm & proceed</strong>.
        </p>

        {/* Batch info */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-4 bg-blue-50 rounded-lg">
          <p className="col-span-2 text-xs text-gray-500 -mb-1">
            Unit IDs are read automatically from each PDF. Files that don't contain a recognisable serial will use the filename as the identifier.
          </p>
          {[
            ['Rated MVA', 'rated_mva', '4.6'],
            ['Split MVA', 'split_mva', '2.3'],
          ].map(([label, key, placeholder]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-600">{label}</span>
              <input
                type="number"
                value={batchInfo[key]}
                placeholder={placeholder}
                onChange={e => setBatch(b => ({ ...b, [key]: parseFloat(e.target.value) || 0 }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
              />
            </label>
          ))}
        </div>

        {/* Parameter table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#1F497D' }}>
                <th className="text-white text-left px-3 py-2 w-8">#</th>
                <th className="text-white text-left px-3 py-2">Parameter</th>
                {sampleFiles.map(f => (
                  <th key={f} className="text-white text-center px-3 py-2 w-28">{shortName(f)}</th>
                ))}
                <th className="text-white text-center px-3 py-2 w-10">Del</th>
              </tr>
            </thead>
            <tbody>
              {params.map((p, i) => {
                const grp = GROUP_COLORS[groupOf(p)] || GROUP_COLORS.meta
                return (
                  <tr key={i} style={{ background: grp.bg, borderBottom: `1px solid ${grp.border}` }}>
                    <td className="px-3 py-1.5 font-bold text-xs text-gray-500 text-center">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <div className="font-semibold text-gray-800 text-xs">{p.label}</div>
                      <div className="text-gray-400 text-xs font-mono">{p.extract} · {p.unit}</div>
                    </td>
                    {sampleFiles.map(f => {
                      const val = p.samples?.[f]
                      return (
                        <td key={f} className="px-3 py-1.5 text-center">
                          {val === null || val === undefined
                            ? <span className="text-red-500 font-bold text-xs">MISSING</span>
                            : <span className="text-gray-800 text-xs font-mono">{typeof val === 'number' ? val.toFixed(4) : val}</span>
                          }
                        </td>
                      )
                    })}
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => removeParam(i)}
                        className="text-red-400 hover:text-red-600 font-bold text-base leading-none">×</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-between items-center">
          <p className="text-xs text-gray-400">{params.length} parameters · Remove any that look wrong, then proceed</p>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:bg-gray-300"
            style={{ background: saving ? undefined : '#375623' }}>
            {saving ? 'Saving…' : 'Confirm & proceed to Step 1 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
