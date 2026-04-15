import config from '../generated/config.json'

import { getCheckLocation } from './checkLocation.js'
import { getKVMonitors, setKVMonitors } from './kv.js'
import { probeMonitor } from './monitorProbe.js'
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

  for (const monitor of config.monitors) {
    if (typeof monitorsState.monitors[monitor.id] === 'undefined') {
      monitorsState.monitors[monitor.id] = {
        firstCheck: checkDay,
        lastCheck: {},
        checks: {},
      }
    }
  }

  const probes = await Promise.all(
    config.monitors.map((monitor) => {
      console.log(`Checking ${monitor.name} ...`)
      return probeMonitor(monitor, config.settings)
    }),
  )

  const alertThresholdDefault = Math.max(
    1,
    Number(config.settings.alertAfterConsecutiveFailures) || 1,
  )

  for (let i = 0; i < config.monitors.length; i++) {
    const monitor = config.monitors[i]
    const probe = probes[i]

    const prevLc = monitorsState.monitors[monitor.id].lastCheck || {}
    const prevOp = prevLc.operational
    const prevStreak = prevLc.failureStreak ?? 0

    const failureStreak = probe.operational ? 0 : prevStreak + 1
    const threshold = Math.max(
      1,
      Number(monitor.alertAfterConsecutiveFailures) ||
        alertThresholdDefault,
    )

    const checkedAt = Date.now()

    monitorsState.monitors[monitor.id].lastCheck = {
      status: probe.status,
      statusText: probe.statusText,
      operational: probe.operational,
      degraded: probe.degraded,
      responseTimeMs: probe.responseTimeMs,
      checkedAt,
      lastSeenUpAt: probe.operational ? checkedAt : prevLc.lastSeenUpAt,
      lastSeenDownAt: !probe.operational ? checkedAt : prevLc.lastSeenDownAt,
      failureStreak,
      probeError: probe.error,
      attempts: probe.attempts,
    }

    const shouldNotifyDown = !probe.operational && failureStreak === threshold
    const shouldNotifyUp = probe.operational && prevOp === false

    const slackUrl = env.SECRET_SLACK_WEBHOOK_URL
    if (
      (shouldNotifyDown || shouldNotifyUp) &&
      typeof slackUrl === 'string' &&
      slackUrl !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifySlack(monitor, probe.operational, env))
    }

    const tgToken = env.SECRET_TELEGRAM_API_TOKEN
    const tgChat = env.SECRET_TELEGRAM_CHAT_ID
    if (
      (shouldNotifyDown || shouldNotifyUp) &&
      typeof tgToken === 'string' &&
      tgToken !== 'default-gh-action-secret' &&
      typeof tgChat === 'string' &&
      tgChat !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyTelegram(monitor, probe.operational, env))
    }

    const discordUrl = env.SECRET_DISCORD_WEBHOOK_URL
    if (
      (shouldNotifyDown || shouldNotifyUp) &&
      typeof discordUrl === 'string' &&
      discordUrl !== 'default-gh-action-secret'
    ) {
      event.waitUntil(notifyDiscord(monitor, probe.operational, env))
    }

    const opChanged = prevOp !== probe.operational

    if (
      (config.settings.collectResponseTimes || !probe.operational) &&
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

    if (config.settings.collectResponseTimes && probe.operational) {
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
      ].ms += probe.responseTimeMs)

      monitorsState.monitors[monitor.id].checks[checkDay].res[
        checkLocation
      ].a = Math.round(ms / no)
    } else if (!probe.operational) {
      if (
        opChanged ||
        monitorsState.monitors[monitor.id].checks[checkDay].fails === 0
      ) {
        monitorsState.monitors[monitor.id].checks[checkDay].fails++
      }
    }
  }

  monitorsState.lastUpdate.allOperational = config.monitors.every(
    (m) => monitorsState.monitors[m.id]?.lastCheck?.operational === true,
  )

  monitorsState.lastUpdate.time = Date.now()
  monitorsState.lastUpdate.loc = checkLocation

  await setKVMonitors(monitorsState, env)

  return new Response('OK')
}
