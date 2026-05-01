import { useState, useRef } from 'react'
import { apiPost, apiPostForm, getSessionId } from '../../utils/api'

const CHUNK = 10  // PDFs per upload batch

export default function PdfUpload({ config, onExtracted }) {
  const [files,    setFiles]    = useState([])
  const [progress, setProgress] = useState(0)   // 0-100 upload
  const [phase,    setPhase]    = useState('idle')  // idle|uploading|extracting|done
  const [error,    setError]    = useState(null)
  const inputRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.name.endsWith('.pdf'))
    setFiles(selected)
    setError(null)
    setProgress(0)
    setPhase('idle')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'))
    setFiles(dropped)
    setError(null)
    setProgress(0)
    setPhase('idle')
  }

  const handleRun = async () => {
    if (!files.length) return
    setError(null)
    const sid = getSessionId()

    try {
      // ── Phase 1: chunked upload ──────────────────────────────────────────
      setPhase('uploading')
      for (let i = 0; i < files.length; i += CHUNK) {
        const batch = files.slice(i, i + CHUNK)
        const form  = new FormData()
        batch.forEach(f => form.append('files', f))
        await apiPostForm(`/api/extract/${sid}/upload`, form)
        setProgress(Math.round(Math.min(i + CHUNK, files.length) / files.length * 80))
      }

      // ── Phase 2: run extraction ──────────────────────────────────────────
      setPhase('extracting')
      setProgress(85)
      const qaData = await apiPost(`/api/extract/${sid}/run`, {})
      setProgress(100)
      setPhase('done')
      onExtracted(qaData)

    } catch (e) {
      setError(e.message)
      setPhase('idle')
    }
  }

  const phaseLabel = {
    idle:       files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'No files selected',
    uploading:  `Uploading… ${progress}%`,
    extracting: 'Extracting data from PDFs…',
    done:       'Extraction complete!',
  }

  const expectedCount = config
    ? config.range_hi - config.range_lo + 1
    : null

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Step 1 — Upload &amp; Extract</h2>
        <p className="text-sm text-gray-500 mb-1">
          Upload all FAT report PDFs for this batch.
          {expectedCount && (
            <span className="ml-1 text-blue-600 font-medium">
              Expecting {expectedCount} files (#{config.range_lo}–#{config.range_hi}).
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 mb-5">
          Files are uploaded in batches of {CHUNK} — no timeout issues with large batches.
        </p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${files.length ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
          onClick={() => inputRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <div className="text-3xl mb-2">{files.length ? '📂' : '📁'}</div>
          <p className="text-sm font-medium text-gray-600">{phaseLabel[phase]}</p>
          {files.length > 0 && phase === 'idle' && (
            <p className="text-xs text-gray-400 mt-1">Click to change selection</p>
          )}
        </div>

        {/* Progress bar */}
        {phase !== 'idle' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{phase === 'uploading' ? 'Uploading' : phase === 'extracting' ? 'Extracting' : 'Done'}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: phase === 'done' ? '#375623' : '#1F497D'
                }}
              />
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-between items-center">
          <p className="text-xs text-gray-400">
            {files.length
              ? `${files.length} PDF${files.length === 1 ? '' : 's'} ready`
              : 'Drag & drop or click to select PDFs'}
          </p>
          <button
            onClick={handleRun}
            disabled={!files.length || phase === 'uploading' || phase === 'extracting'}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            style={{ background: (files.length && phase === 'idle') ? '#1F497D' : undefined }}>
            {phase === 'idle' ? '⚡ Upload & Extract' :
             phase === 'uploading' ? 'Uploading…' :
             phase === 'extracting' ? 'Extracting…' : '✓ Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
