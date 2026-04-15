/** Short age for cron batch time — seconds when recent, else coarser. */
export function formatShortDurationSince(ms) {
  if (ms == null || typeof ms !== 'number' || Number.isNaN(ms)) {
    return null
  }
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 120) {
    return `${sec}s ago`
  }
  return formatRelativeFromMs(ms)
}

/** Human-readable age for a past timestamp (ms since epoch). */
export function formatRelativeFromMs(ms) {
  if (ms == null || typeof ms !== 'number' || Number.isNaN(ms)) {
    return null
  }
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 45) {
    return 'just now'
  }
  const min = Math.floor(sec / 60)
  if (min < 60) {
    return `${min}m ago`
  }
  const h = Math.floor(min / 60)
  if (h < 48) {
    return `${h}h ago`
  }
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
