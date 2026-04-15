/**
 * Same calendar window as the availability histogram: `daysInHistogram` days ending today.
 */
export function buildHistogramDateRange(daysInHistogram) {
  const dates = []
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - daysInHistogram)
  for (let i = 0; i < daysInHistogram; i++) {
    cursor.setDate(cursor.getDate() + 1)
    dates.push(cursor.toISOString().split('T')[0])
  }
  return dates
}

function dayHasChecks(kvMonitor, day) {
  return (
    kvMonitor &&
    kvMonitor.checks &&
    Object.prototype.hasOwnProperty.call(kvMonitor.checks, day)
  )
}

/**
 * Mean of per-PoP rolling averages for a day (when response times are collected).
 */
export function averageLatencyForDay(kvMonitor, day) {
  if (!dayHasChecks(kvMonitor, day)) {
    return null
  }
  const res = kvMonitor.checks[day].res
  const locs = res && typeof res === 'object' ? Object.keys(res) : []
  if (locs.length === 0) {
    return null
  }
  let sum = 0
  let n = 0
  for (const loc of locs) {
    const a = res[loc]?.a
    if (typeof a === 'number' && !Number.isNaN(a)) {
      sum += a
      n += 1
    }
  }
  return n > 0 ? Math.round(sum / n) : null
}

/**
 * Uptime over days that have at least one stored check in the window (after firstCheck).
 */
export function computeUptimeStats(kvMonitor, daysInHistogram) {
  const range = buildHistogramDateRange(daysInHistogram)
  if (!kvMonitor || !kvMonitor.firstCheck) {
    return {
      uptimePercent: null,
      daysWithData: 0,
      downDays: 0,
      incidentDays: 0,
      totalFails: 0,
    }
  }

  let daysWithData = 0
  let downDays = 0
  let totalFails = 0

  for (const day of range) {
    if (day < kvMonitor.firstCheck) {
      continue
    }
    if (!dayHasChecks(kvMonitor, day)) {
      continue
    }
    daysWithData += 1
    const fails = kvMonitor.checks[day].fails
    if (typeof fails === 'number' && fails > 0) {
      downDays += 1
      totalFails += fails
    }
  }

  const upDays = daysWithData - downDays
  const uptimePercent =
    daysWithData > 0 ? Math.round((upDays / daysWithData) * 1000) / 10 : null

  return {
    uptimePercent,
    daysWithData,
    downDays,
    incidentDays: downDays,
    totalFails,
  }
}

/**
 * Days in the histogram window (after firstCheck) split into all-good, any failure, or no KV row.
 */
export function computeDayBuckets(kvMonitor, daysInHistogram) {
  const range = buildHistogramDateRange(daysInHistogram)
  let good = 0
  let bad = 0
  let noData = 0

  if (!kvMonitor || !kvMonitor.firstCheck) {
    return { good, bad, noData, eligible: 0 }
  }

  for (const day of range) {
    if (day < kvMonitor.firstCheck) {
      continue
    }
    if (!dayHasChecks(kvMonitor, day)) {
      noData++
      continue
    }
    const fails = kvMonitor.checks[day].fails
    if (typeof fails === 'number' && fails > 0) {
      bad++
    } else {
      good++
    }
  }

  return {
    good,
    bad,
    noData,
    eligible: good + bad + noData,
  }
}

export function computeLatencySeries(kvMonitor, daysInHistogram) {
  const range = buildHistogramDateRange(daysInHistogram)
  return range.map((day) => ({
    day,
    avgMs:
      kvMonitor && kvMonitor.firstCheck && day >= kvMonitor.firstCheck
        ? averageLatencyForDay(kvMonitor, day)
        : null,
  }))
}

export function averageRecentLatencyMs(series, maxDays) {
  const slice = series.filter((p) => p.avgMs != null).slice(-maxDays)
  if (slice.length === 0) {
    return null
  }
  const sum = slice.reduce((acc, p) => acc + p.avgMs, 0)
  return Math.round(sum / slice.length)
}
