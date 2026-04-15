/**
 * Group monitors by optional `monitor.group` for section headings (Uptime Kuma–style).
 */
export function groupMonitorsForDisplay(monitors, defaultGroupName) {
  const fallback = defaultGroupName || 'Monitors'
  const order = []
  const map = new Map()

  for (const m of monitors) {
    const g =
      m.group && String(m.group).trim() ? String(m.group).trim() : fallback
    if (!map.has(g)) {
      map.set(g, [])
      order.push(g)
    }
    map.get(g).push(m)
  }

  return order.map((name) => ({ name, monitors: map.get(name) }))
}
