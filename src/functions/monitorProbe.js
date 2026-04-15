/**
 * Single HTTP probe with timeout, retries, and optional body/header checks.
 */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function buildHeaders(monitor, settings) {
  const h = new Headers({
    'User-Agent': settings.user_agent || 'cf-worker-status-page',
  })
  if (monitor.headers && typeof monitor.headers === 'object') {
    for (const [k, v] of Object.entries(monitor.headers)) {
      if (v != null && k) {
        h.set(k, String(v))
      }
    }
  }
  return h
}

function statusMatches(expect, actual) {
  if (expect == null) {
    return actual === 200
  }
  if (Array.isArray(expect)) {
    return expect.includes(actual)
  }
  return actual === expect
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(id)
  }
}

/**
 * @returns {Promise<{
 *   operational: boolean,
 *   degraded: boolean,
 *   status: number,
 *   statusText: string,
 *   responseTimeMs: number,
 *   error?: string,
 *   attempts: number
 * }>}
 */
export async function probeMonitor(monitor, settings) {
  const timeoutMs = Math.min(
    Math.max(
      monitor.timeoutMs ?? settings.defaultTimeoutMs ?? 25_000,
      1000,
    ),
    120_000,
  )
  const extraRetries = Math.max(0, Math.min(monitor.retries ?? 0, 5))
  const maxAttempts = 1 + extraRetries
  const retryDelayMs = Math.max(0, monitor.retryDelayMs ?? 400)

  const method = (monitor.method || 'GET').toUpperCase()
  const initBase = {
    method,
    redirect: monitor.followRedirect ? 'follow' : 'manual',
    headers: buildHeaders(monitor, settings),
  }

  let lastStatus = 0
  let lastStatusText = ''
  let lastTime = 0
  let lastError = ''
  let attemptsUsed = 0

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptsUsed = attempt
    const start = Date.now()
    try {
      const checkResponse = await fetchWithTimeout(
        monitor.url,
        initBase,
        timeoutMs,
      )
      lastTime = Math.round(Date.now() - start)
      lastStatus = checkResponse.status
      lastStatusText = checkResponse.statusText || ''

      const expect = monitor.expectStatus
      let monitorOperational = statusMatches(expect, checkResponse.status)

      if (monitorOperational && method !== 'HEAD') {
        const mustHave = monitor.responseContains
        const mustNot = monitor.responseNotContains
        if (mustHave || mustNot) {
          const maxRead = 500_000
          const body = (await checkResponse.clone().text()).slice(0, maxRead)
          if (mustHave && !body.includes(mustHave)) {
            monitorOperational = false
          }
          if (monitorOperational && mustNot && body.includes(mustNot)) {
            monitorOperational = false
          }
        }
      }

      let degraded = false
      if (
        monitorOperational &&
        typeof monitor.maxResponseTimeMs === 'number' &&
        lastTime > monitor.maxResponseTimeMs
      ) {
        degraded = true
      }

      if (monitorOperational) {
        return {
          operational: true,
          degraded,
          status: lastStatus,
          statusText: lastStatusText,
          responseTimeMs: lastTime,
          attempts: attemptsUsed,
        }
      }

      lastError = `check failed (HTTP ${lastStatus})`
    } catch (e) {
      lastTime = Math.round(Date.now() - start)
      lastStatus = 0
      lastStatusText = ''
      if (e?.name === 'AbortError') {
        lastError = `timeout after ${timeoutMs}ms`
      } else {
        lastError = e?.message ? String(e.message) : String(e)
      }
    }

    if (attempt < maxAttempts && retryDelayMs > 0) {
      await sleep(retryDelayMs)
    }
  }

  return {
    operational: false,
    degraded: false,
    status: lastStatus,
    statusText: lastStatusText || lastError,
    responseTimeMs: lastTime,
    error: lastError || undefined,
    attempts: attemptsUsed,
  }
}
