import { useState, useEffect } from 'react'
import { startKeepAlive } from './utils/api'
import { useSession } from './hooks/useSession'

import TopBar           from './components/Layout/TopBar'
import SampleUpload     from './components/Step0/SampleUpload'
import ParamReviewTable from './components/Step0/ParamReviewTable'
import PdfUpload        from './components/Step1/PdfUpload'
import QAFlagsTable     from './components/Step1/QAFlagsTable'
import Results          from './components/Step2/Results'

// Keep the HF Space warm while the tab is open
startKeepAlive()

export default function App() {
  const {
    sessionId,
    step,
    config,
    qa,
    reset,
    confirmConfig,
    confirmExtract,
    confirmNormalise,
  } = useSession()

  // Step 0 sub-states: detect → review
  const [detected, setDetected] = useState(null)
  // Step 1 sub-states: upload → qa_review
  const [qaData, setQaData]     = useState(null)

  // Reset sub-states when session is reset
  useEffect(() => {
    setDetected(null)
    setQaData(null)
  }, [sessionId])

  // ── Step 0 handlers ──────────────────────────────────────────────────────
  const handleDetected         = (data) => setDetected(data)
  const handleConfigConfirmed  = (cfg)  => { confirmConfig(cfg); setDetected(null) }

  // ── Step 1 handlers ──────────────────────────────────────────────────────
  const handleExtracted  = (data) => setQaData(data)
  const handleQAConfirmed = (data) => { confirmExtract(data); setQaData(null) }

  return (
    <div className="min-h-screen" style={{ background: '#F4F6FA' }}>
      <TopBar step={step} onReset={reset} />

      <main className="pb-12">

        {/* ── STEP 0 ── Config & detect ─────────────────────────────────── */}
        {step === 0 && !detected && (
          <SampleUpload onDetected={handleDetected} />
        )}
        {step === 0 && detected && (
          <ParamReviewTable
            detected={detected}
            onConfirmed={handleConfigConfirmed}
          />
        )}

        {/* ── STEP 1 ── Upload batch PDFs + QA ─────────────────────────── */}
        {step === 1 && !qaData && (
          <PdfUpload
            config={config}
            onExtracted={handleExtracted}
          />
        )}
        {step === 1 && qaData && (
          <QAFlagsTable
            qaData={qaData}
            onConfirmed={handleQAConfirmed}
          />
        )}

        {/* ── STEP 2 ── Normalise & download ───────────────────────────── */}
        {step === 2 && (
          <Results
            qaData={qa}
            onNormalised={confirmNormalise}
          />
        )}

      </main>
    </div>
  )
}
