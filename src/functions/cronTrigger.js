import config from '../generated/config.json'

import { getCheckLocation } from './checkLocation.js'
import { getKVMonitors, setKVMonitors } from './kv.js'
import {
  notifyDiscord,
  notifySlack,
  notifyTelegram,
} from './notify.js'

function getDate() {
  return new Date().toISOString().split('T')[0]
}

export async function processCronTrigger(event, env) {
  const checkLocation = await getCheckLocation()
  const checkDay = getDate()

  let monitorsState = await getKVMonitors(env)

  if (!monitorsState) {
    monitorsState = { lastUpdate: {}, monitors: {} }
  }

  monitorsState.lastUpdate.allOperational = true

  for (const monitor of config.monitors) {
    if (typeof monitorsState.monitors[monitor.id] === 'undefined') {
      monitorsState.monitors[monitor.id] = {
        firstCheck: checkDay,
        lastCheck: {},
        checks: {},
      }
    }

    console.log(`Checking ${monitor.name} ...`)

    const init = {
      method: monitor.method || 'GET',
      redirect: monitor.followRedirect ? 'follow' : 'manual',
      headers: {
        'User-Agent': config.settings.user_agent || 'cf-worker-status-page',
      },
    }

    const requestStartTime = Date.now()
    const checkResponse = await fetch(monitor.url, init)
    const requestTime = Math.round(Date.now() - requestStartTime)

    let monitorOperational =
      checkResponse.status === (monitor.expectStatus || 200)

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

    const slackUrl = env.SECRET_SLACK_WEBHOOK_URL
    if (
      monitorStatusChanged &&
      typeof slackUrl === 'string' &&
      slackUrl !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifySlack(monitor, monitorOperational, env))
    }

    const tgToken = env.SECRET_TELEGRAM_API_TOKEN
    const tgChat = env.SECRET_TELEGRAM_CHAT_ID
    if (
      monitorStatusChanged &&
      typeof tgToken === 'string' &&
      tgToken !== 'default-gh-action-secret' &&
      typeof tgChat === 'string' &&
      tgChat !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyTelegram(monitor, monitorOperational, env))
    }

    const discordUrl = env.SECRET_DISCORD_WEBHOOK_URL
    if (
      monitorStatusChanged &&
      typeof discordUrl === 'string' &&
      discordUrl !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyDiscord(monitor, monitorOperational, env))
    }

    if (
      (config.settings.collectResponseTimes || !monitorOperational) &&
      !Object.prototype.hasOwnProperty.call(
        monitorsState.monitors[monitor.id].checks,
        checkDay,
      )
    ) {
      monitorsState.monitors[monitor.id].checks[checkDay] = {
        fails: 0,
        res: {},
      }
    }

    if (config.settings.collectResponseTimes && monitorOperational) {
      if (
        !Object.prototype.hasOwnProperty.call(
          monitorsState.monitors[monitor.id].checks[checkDay].res,
          checkLocation,
        )
      ) {
        monitorsState.monitors[monitor.id].checks[checkDay].res[checkLocation] =
          {
            n: 0,
            ms: 0,
            a: 0,
          }
      }

      const no = ++monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].n
      const ms = (monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].ms += requestTime)

      monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].a = Math.round(ms / no)
    } else if (!monitorOperational) {
      monitorsState.lastUpdate.allOperational = false

      if (
        monitorStatusChanged ||
        monitorsState.monitors[monitor.id].checks[checkDay].fails == 0
      ) {
        monitorsState.monitors[monitor.id].checks[checkDay].fails++
      }
    }
  }

  monitorsState.lastUpdate.time = Date.now()
  monitorsState.lastUpdate.loc = checkLocation

  await setKVMonitors(monitorsState, env)

  return new Response('OK')
}
