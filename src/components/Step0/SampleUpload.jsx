import { useState, useRef } from 'react'
import { apiPostForm, getSessionId } from '../../utils/api'

export default function SampleUpload({ onDetected }) {
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const inputRef              = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.name.endsWith('.pdf')).slice(0, 3)
    setFiles(selected)
    setError(null)
  }

  const handleDetect = async () => {
    if (!files.length) return
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      const data = await apiPostForm('/api/detect', form)
      onDetected(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // Load saved config from localStorage if available
    const saved = localStorage.getItem('fat_config')
    if (saved) {
      onDetected({ params: JSON.parse(saved), fromCache: true })
    } else {
      setError('No saved config found. Upload sample PDFs to auto-detect parameters.')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-xl shadow">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Step 0 — Config Builder</h2>
      <p className="text-sm text-gray-500 mb-6">
        Upload 3 sample PDFs (first, middle, last of your batch). The AI will detect
        all test parameters and let you review them before extraction.
      </p>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => inputRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf')).slice(0,3)
          setFiles(dropped)
        }}>
        <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFiles} />
        <div className="text-3xl mb-2">📄</div>
        {files.length
          ? <p className="text-sm font-medium text-blue-700">{files.map(f => f.name).join(', ')}</p>
          : <p className="text-sm text-gray-400">Drag & drop up to 3 PDFs, or click to browse</p>
        }
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex gap-3">
        <button
          onClick={handleDetect}
          disabled={!files.length || loading}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors
            disabled:bg-gray-300 disabled:cursor-not-allowed"
          style={{ background: files.length && !loading ? '#1F497D' : undefined }}>
          {loading ? 'Detecting parameters…' : '🔍 Auto-detect parameters'}
        </button>

        <button
          onClick={handleSkip}
          className="px-4 py-2 rounded-lg text-sm text-blue-700 border border-blue-300 hover:bg-blue-50">
          Use saved config
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Powered by HF Serverless Inference · Llama 3.2
      </p>
    </div>
  )
}
