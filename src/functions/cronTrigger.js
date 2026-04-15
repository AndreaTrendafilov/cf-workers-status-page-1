import config from '../../config.yaml'

import {
  notifySlack,
  notifyTelegram,
  getCheckLocation,
  getKVMonitors,
  setKVMonitors,
  notifyDiscord,
} from './helpers'

function getDate() {
  return new Date().toISOString().split('T')[0]
}

export async function processCronTrigger(event) {
  // Get Worker PoP and save it to monitorsStateMetadata
  const checkLocation = await getCheckLocation()
  const checkDay = getDate()

  // Get monitors state from KV
  let monitorsState = await getKVMonitors()

  // Create empty state objects if not exists in KV storage yet
  if (!monitorsState) {
    monitorsState = { lastUpdate: {}, monitors: {} }
  }

  // Reset default all monitors state to true
  monitorsState.lastUpdate.allOperational = true

  for (const monitor of config.monitors) {
    // Create default monitor state if does not exist yet
    if (typeof monitorsState.monitors[monitor.id] === 'undefined') {
      monitorsState.monitors[monitor.id] = {
        firstCheck: checkDay,
        lastCheck: {},
        checks: {},
      }
    }

    console.log(`Checking ${monitor.name} ...`)

    // Fetch the monitors URL
    const init = {
      method: monitor.method || 'GET',
      redirect: monitor.followRedirect ? 'follow' : 'manual',
      headers: {
        'User-Agent': config.settings.user_agent || 'cf-worker-status-page',
      },
    }

    // Perform a check and measure time
    const requestStartTime = Date.now()
    const checkResponse = await fetch(monitor.url, init)
    const requestTime = Math.round(Date.now() - requestStartTime)

    let monitorOperational =
      checkResponse.status === (monitor.expectStatus || 200)

    // Optional: body must contain substring (like Uptime Kuma HTTP(s) Keyword). Skip for HEAD.
    const keyword = monitor.responseContains
    if (keyword && monitorOperational) {
      const method = (monitor.method || 'GET').toUpperCase()
      if (method !== 'HEAD') {
        const maxRead = 500_000
        const body = (await checkResponse.clone().text()).slice(0, maxRead)
        if (!body.includes(keyword)) {
          monitorOperational = false
        }
      }
    }

    // Optional: slow but "up" — flag degraded (does not flip global allOperational)
    let degraded = false
    if (
      monitorOperational &&
      typeof monitor.maxResponseTimeMs === 'number' &&
      requestTime > monitor.maxResponseTimeMs
    ) {
      degraded = true
    }

    const monitorStatusChanged =
      monitorsState.monitors[monitor.id].lastCheck.operational !==
      monitorOperational

    const prevLc = monitorsState.monitors[monitor.id].lastCheck || {}
    const checkedAt = Date.now()

    // Save monitor's last check response status
    monitorsState.monitors[monitor.id].lastCheck = {
      status: checkResponse.status,
      statusText: checkResponse.statusText,
      operational: monitorOperational,
      degraded,
      responseTimeMs: requestTime,
      checkedAt,
      lastSeenUpAt: monitorOperational ? checkedAt : prevLc.lastSeenUpAt,
      lastSeenDownAt: !monitorOperational ? checkedAt : prevLc.lastSeenDownAt,
    }

    // Send Slack message on monitor change
    if (
      monitorStatusChanged &&
      typeof SECRET_SLACK_WEBHOOK_URL !== 'undefined' &&
      SECRET_SLACK_WEBHOOK_URL !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifySlack(monitor, monitorOperational))
    }

    // Send Telegram message on monitor change
    if (
      monitorStatusChanged &&
      typeof SECRET_TELEGRAM_API_TOKEN !== 'undefined' &&
      SECRET_TELEGRAM_API_TOKEN !== 'default-gh-action-secret' &&
      typeof SECRET_TELEGRAM_CHAT_ID !== 'undefined' &&
      SECRET_TELEGRAM_CHAT_ID !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyTelegram(monitor, monitorOperational))
    }

    // Send Discord message on monitor change
    if (
      monitorStatusChanged &&
      typeof SECRET_DISCORD_WEBHOOK_URL !== 'undefined' &&
      SECRET_DISCORD_WEBHOOK_URL !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyDiscord(monitor, monitorOperational))
    }

    // make sure checkDay exists in checks in cases when needed
    if (
      (config.settings.collectResponseTimes || !monitorOperational) &&
      !monitorsState.monitors[monitor.id].checks.hasOwnProperty(checkDay)
    ) {
      monitorsState.monitors[monitor.id].checks[checkDay] = {
        fails: 0,
        res: {},
      }
    }

    if (config.settings.collectResponseTimes && monitorOperational) {
      // make sure location exists in current checkDay
      if (
        !monitorsState.monitors[monitor.id].checks[checkDay].res.hasOwnProperty(
          checkLocation,
        )
      ) {
        monitorsState.monitors[monitor.id].checks[checkDay].res[
          checkLocation
        ] = {
          n: 0,
          ms: 0,
          a: 0,
        }
      }

      // increment number of checks and sum of ms
      const no = ++monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].n
      const ms = (monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].ms += requestTime)

      // save new average ms
      monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].a = Math.round(ms / no)
    } else if (!monitorOperational) {
      // Save allOperational to false
      monitorsState.lastUpdate.allOperational = false

      // Increment failed checks on status change or first fail of the day (maybe call it .incidents instead?)
      if (monitorStatusChanged || monitorsState.monitors[monitor.id].checks[checkDay].fails == 0) {
        monitorsState.monitors[monitor.id].checks[checkDay].fails++
      }
    }
  }

  // Save last update information
  monitorsState.lastUpdate.time = Date.now()
  monitorsState.lastUpdate.loc = checkLocation

  // Save monitorsState to KV storage
  await setKVMonitors(monitorsState)

  return new Response('OK')
}
