// ── API base URL ──────────────────────────────────────────────────────────────
// Points to the HF Spaces backend. Update this if the Space URL changes.
export const API_BASE = 'https://rashmil888-tx-fat-reports.hf.space'

// ── Session ID ────────────────────────────────────────────────────────────────
// A UUID generated once per browser session, stored in localStorage so the
// user can refresh the page without losing their session files on the backend.
export function getSessionId() {
  let id = localStorage.getItem('fat_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('fat_session_id', id)
  }
  return id
}

export function resetSession() {
  const id = crypto.randomUUID()
  localStorage.setItem('fat_session_id', id)
  // Note: fat_config is intentionally kept so "Use saved config" works across batches
  return id
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `POST ${path} → ${res.status}`)
  }
  return res.json()
}

export async function apiPostForm(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `POST ${path} → ${res.status}`)
  }
  return res.json()
}

// Keep the Space warm — ping every 25 minutes while the tab is open
export function startKeepAlive() {
  setInterval(() => fetch(`${API_BASE}/health`).catch(() => {}), 25 * 60 * 1000)
}
