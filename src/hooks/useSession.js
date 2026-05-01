import { useState, useCallback } from 'react'
import { getSessionId, resetSession } from '../utils/api'

/**
 * Central session state for the 3-step FAT workflow.
 *
 * step:    0 = Config/Detect, 1 = Upload/Extract, 2 = Results
 * config:  batch config confirmed in Step 0
 * qa:      QA data returned from Step 1 extraction
 * results: normalised PowerFactory params from Step 2
 */
export function useSession() {
  const [sessionId, setSessionId] = useState(getSessionId)
  const [step,      setStep]      = useState(0)
  const [config,    setConfig]    = useState(null)
  const [qa,        setQa]        = useState(null)
  const [results,   setResults]   = useState(null)

  const reset = useCallback(() => {
    const newId = resetSession()
    setSessionId(newId)
    setStep(0)
    setConfig(null)
    setQa(null)
    setResults(null)
  }, [])

  const confirmConfig = useCallback((cfg) => {
    setConfig(cfg)
    setStep(1)
  }, [])

  const confirmExtract = useCallback((qaData) => {
    setQa(qaData)
    setStep(2)
  }, [])

  const confirmNormalise = useCallback((res) => {
    setResults(res)
  }, [])

  return {
    sessionId,
    step,
    config,
    qa,
    results,
    reset,
    confirmConfig,
    confirmExtract,
    confirmNormalise,
  }
}
