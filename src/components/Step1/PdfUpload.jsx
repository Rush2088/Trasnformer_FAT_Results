import { useState, useRef, useEffect } from 'react'
import { apiPost, apiPostForm, getSessionId } from '../../utils/api'

const CHUNK = 10

export default function PdfUpload({ config, onExtracted }) {
  const [files,    setFiles]    = useState([])
  const [progress, setProgress] = useState(0)
  const [phase,    setPhase]    = useState('idle')
  const [error,    setError]    = useState(null)
  const inputRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.name.endsWith('.pdf'))
    setFiles(selected); setError(null); setProgress(0); setPhase('idle')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'))
    setFiles(dropped); setError(null); setProgress(0); setPhase('idle')
  }

  const handleRun = async () => {
    if (!files.length || phase !== 'idle') return
    setError(null)
    const sid = getSessionId()
    try {
      setPhase('uploading')
      for (let i = 0; i < files.length; i += CHUNK) {
        const form = new FormData()
        files.slice(i, i + CHUNK).forEach(f => form.append('files', f))
        await apiPostForm(`/v1/extract/${sid}/upload`, form)
        setProgress(Math.round(Math.min(i + CHUNK, files.length) / files.length * 80))
      }
      setPhase('extracting'); setProgress(85)
      const qaData = await apiPost(`/v1/extract/${sid}/run`, {})
      setProgress(100); setPhase('done')
      onExtracted(qaData)
    } catch (e) {
      setError(e.message); setPhase('idle')
    }
  }

  // Enter key → upload & extract
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Enter') handleRun() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [files, phase])

  const busy = phase === 'uploading' || phase === 'extracting'
  const btnLabel = phase === 'idle' ? 'Upload & Extract' : phase === 'uploading' ? `Uploading… ${progress}%` : phase === 'extracting' ? 'Extracting data…' : '✓ Done'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-lg p-8" style={{ border: '1px solid #E2E8F0' }}>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Upload FAT Reports</h2>
            <p className="text-sm text-slate-500 mt-1">
              Upload all FAT report PDFs for this batch.
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Unit IDs are read automatically from each PDF — no renaming needed.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="cursor-pointer rounded-xl p-10 text-center transition-all"
            style={{
              border: `2px dashed ${files.length ? '#3B82F6' : '#CBD5E1'}`,
              background: files.length ? '#EFF6FF' : '#F8FAFC'
            }}>
            <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFiles} />
            <div className="text-4xl mb-3">{files.length ? '📂' : '📁'}</div>
            {files.length ? (
              <div>
                <p className="text-sm font-semibold text-blue-700">{files.length} PDF{files.length > 1 ? 's' : ''} selected</p>
                <p className="text-xs text-blue-400 mt-1">Click to change selection</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-600">Drag & drop all batch PDFs here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse · uploaded in batches of {CHUNK}</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {phase !== 'idle' && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>{phase === 'uploading' ? 'Uploading files' : phase === 'extracting' ? 'Extracting data from PDFs' : 'Complete'}</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: '#E2E8F0' }}>
                <div className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: phase === 'done' ? '#16A34A' : '#3B82F6' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg text-sm text-red-700" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={!files.length || busy}
            className="w-full mt-5 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: files.length && !busy ? '#2563EB' : '#CBD5E1', cursor: files.length && !busy ? 'pointer' : 'not-allowed' }}>
            ⚡ {btnLabel}
            {files.length && !busy ? <span className="ml-2 text-xs opacity-70">↵ Enter</span> : null}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Large batches are split automatically — no timeout issues
          </p>
        </div>
      </div>
    </div>
  )
}
