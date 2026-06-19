// Euro with space-grouped thousands: 5759 -> "€ 5 759" (matches the live design).
export function formatEur(n) {
  const v = Math.max(0, Math.round(Number(n) || 0))
  return '€ ' + groupSpaces(v)
}
export function groupSpaces(n) {
  return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
// 3.74 -> "3.7"
export function formatMultiple(x) {
  return (Number(x) || 0).toFixed(1)
}
