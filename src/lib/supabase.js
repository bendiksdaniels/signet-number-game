import { createClient } from '@supabase/supabase-js'

// Lazy singleton. Returns null when no keys are configured, which makes the
// app fall back to the local (offline/demo) backend automatically.
let _client = null
let _resolved = false

export function getSupabase() {
  if (_resolved) return _client
  _resolved = true
  const url = import.meta.env?.VITE_SUPABASE_URL || ''
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || ''
  _client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  return _client
}

export function backendMode() {
  return getSupabase() ? 'supabase' : 'local'
}
