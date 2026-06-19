import { getSupabase } from './supabase.js'

// One interface, two implementations:
//   • LocalBackend   — localStorage; runs fully offline for demos. Seeds a
//                      believable room so the first player isn't alone.
//   • SupabaseBackend— real shared room across every device; talks ONLY through
//                      SECURITY DEFINER rpcs so the browser never reads raw emails.
//
//   submitEntry(entry) -> { total, percentile, rank, top }   (adds to the room)
//   getLeaderboard(n)  -> [{ name, target }]
//   getStats(target)   -> { total, percentile, rank, top }
//   saveLead(lead)     -> { ok }                              (PII, write-only)

const LS_KEY = 'wyn_entries_v1'

const SEED = [
  { name: 'Marta', target: 5_000_000 },
  { name: 'Jaan', target: 3_200_000 },
  { name: 'Līga', target: 2_500_000 },
  { name: 'Tomas', target: 2_000_000 },
  { name: 'Kristel', target: 1_500_000 },
  { name: 'Rasa', target: 1_200_000 },
  { name: 'Mehis', target: 900_000 },
  { name: 'Anete', target: 600_000 },
  { name: 'Pavel', target: 400_000 },
  { name: 'Eva', target: 250_000 },
].map((e, i) => ({ ...e, ts: i }))

function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}
function lsWrite(a) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(a)) } catch { /* private mode */ }
}

function statsFrom(all, target) {
  const total = all.length || 1
  const below = all.filter((e) => e.target < target).length
  const percentile = Math.round((below / total) * 100) // % of the room you out-dream
  const sorted = [...all].sort((a, b) => b.target - a.target)
  let rank = sorted.findIndex((e) => e.target <= target) + 1
  if (rank <= 0) rank = total
  return { total, percentile, rank, top: Math.max(1, 100 - percentile) }
}

function makeLocalBackend() {
  if (lsRead().length === 0) lsWrite(SEED.slice())
  return {
    mode: 'local',
    async submitEntry(entry) {
      const all = lsRead()
      all.push({ name: entry.name, target: entry.target, ts: Date.now() })
      lsWrite(all)
      return statsFrom(all, entry.target)
    },
    async getLeaderboard(limit = 8) {
      return lsRead()
        .sort((a, b) => b.target - a.target)
        .slice(0, limit)
        .map((e) => ({ name: e.name, target: e.target }))
    },
    async getStats(target) {
      return statsFrom(lsRead(), target)
    },
    async saveLead() {
      // Nothing to send offline; surfaced to the UI so it can note demo mode.
      return { ok: true, stored: 'local' }
    },
  }
}

function makeSupabaseBackend(client) {
  return {
    mode: 'supabase',
    async submitEntry(entry) {
      const { data, error } = await client.rpc('submit_entry', {
        p_name: entry.name,
        p_country: entry.country,
        p_age: entry.age,
        p_retire: entry.retire,
        p_target: entry.target,
        p_monthly: Math.round(entry.monthly),
      })
      if (error) throw error
      return data
    },
    async getLeaderboard(limit = 8) {
      const { data, error } = await client.rpc('get_leaderboard', { p_limit: limit })
      if (error) throw error
      return data || []
    },
    async getStats(target) {
      const { data, error } = await client.rpc('get_stats', { p_target: target })
      if (error) throw error
      return data
    },
    async saveLead(lead) {
      const { data, error } = await client.rpc('save_lead', {
        p_email: lead.email,
        p_consent: !!lead.consent,
        p_name: lead.name ?? null,
        p_target: lead.target ?? null,
        p_country: lead.country ?? null,
      })
      if (error) throw error
      return data ?? { ok: true }
    },
  }
}

export function createBackend() {
  const client = getSupabase()
  return client ? makeSupabaseBackend(client) : makeLocalBackend()
}
