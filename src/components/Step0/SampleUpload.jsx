import { useState, useRef, useEffect } from 'react'
import { apiPostForm, getSessionId } from '../../utils/api'

export default function SampleUpload({ onDetected }) {
  const [files,   setFiles]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const inputRef  = useRef()
  const configRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.name.endsWith('.pdf')).slice(0, 3)
    setFiles(selected); setError(null)
  }

  const handleDetect = async () => {
    if (!files.length || loading) return
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      const data = await apiPostForm('/v1/detect', form)
      onDetected(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    const saved = localStorage.getItem('fat_config')
    if (!saved) { setError('No saved config found. Upload a config JSON or run auto-detection.'); return }
    try {
      const cfg    = JSON.parse(saved)
      const params = Array.isArray(cfg) ? cfg : (cfg.parameters || cfg)
      onDetected({ params, sample_filenames: [], fromCache: true })
    } catch { setError('Saved config is invalid. Please re-run auto-detection.') }
  }

  const handleConfigUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const cfg    = JSON.parse(ev.target.result)
        const params = Array.isArray(cfg) ? cfg : (cfg.parameters || cfg)
        if (!params?.length) throw new Error('No parameters found in config file.')
        localStorage.setItem('fat_config', JSON.stringify(cfg))
        onDetected({ params, sample_filenames: [], fromCache: true })
      } catch (err) { setError(`Invalid config file: ${err.message}`) }
    }
    reader.readAsText(file)
  }

  // Enter key → detect
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Enter' && files.length && !loading) handleDetect() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [files, loading])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8" style={{ border: '1px solid #E2E8F0' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Configure Parameters</h2>
            <p className="text-sm text-slate-500 mt-1">
              Upload up to 3 sample PDFs (first, middle, last of your batch).
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              The AI will detect all test parameters and let you review them before extraction.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf')).slice(0, 3)
              setFiles(dropped); setError(null)
            }}
            className="cursor-pointer rounded-xl p-8 text-center transition-all"
            style={{
              border: `2px dashed ${files.length ? '#3B82F6' : '#CBD5E1'}`,
              background: files.length ? '#EFF6FF' : '#F8FAFC'
            }}>
            <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFiles} />
            <div className="text-4xl mb-3">{files.length ? '📄' : '📁'}</div>
            {files.length ? (
              <div>
                <p className="text-sm font-semibold text-blue-700 mb-1">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                {files.map(f => (
                  <p key={f.name} className="text-xs text-blue-500 truncate">{f.name}</p>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-600">Drag & drop PDFs here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse · max 3 files</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg text-sm text-red-700" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          {/* Primary action */}
          <button
            onClick={handleDetect}
            disabled={!files.length || loading}
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: files.length && !loading ? '#2563EB' : '#CBD5E1', cursor: files.length && !loading ? 'pointer' : 'not-allowed' }}>
            {loading ? '⏳ Detecting parameters…' : '🔍 Auto-detect parameters'}
            {files.length && !loading ? <span className="ml-2 text-xs opacity-70">↵ Enter</span> : null}
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or use existing config</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button onClick={handleSkip}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ border: '1.5px solid #E2E8F0', color: '#475569', background: 'white' }}>
              Use browser config
            </button>
            <button onClick={() => configRef.current.click()}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ border: '1.5px solid #E2E8F0', color: '#475569', background: 'white' }}>
              📂 Upload config JSON
            </button>
          </div>
          <input ref={configRef} type="file" accept=".json" className="hidden" onChange={handleConfigUpload} />

          <p className="mt-4 text-center text-xs text-slate-400">
            Powered by Claude AI · Config saves automatically
          </p>
        </div>
      </div>
    </div>
  )
}
