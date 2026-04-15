const fs = require('fs')
const { parse: parseYaml } = require('yaml')

const accountId = process.env.CF_ACCOUNT_ID
const namespaceId = process.env.KV_NAMESPACE_ID
const apiToken = process.env.CF_API_TOKEN

const kvMonitorsKey = 'monitors_data_v1_1'

if (!accountId || !namespaceId || !apiToken) {
  console.error(
    'Missing required environment variables: CF_ACCOUNT_ID, KV_NAMESPACE_ID, CF_API_TOKEN',
  )
  process.exit(0)
}

async function getKvMonitors(kvMonitorsKey) {
  const init = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${kvMonitorsKey}`,
    init,
  )
  const json = await res.json()
  return json
}

async function saveKVMonitors(kvMonitorsKey, data) {
  const init = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(data),
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${kvMonitorsKey}`,
    init,
  )

  return res
}

function loadConfig() {
  const configFile = fs.readFileSync('./config.yaml', 'utf8')
  return parseYaml(configFile)
}

getKvMonitors(kvMonitorsKey)
  .then(async (kvMonitors) => {
    let stateMonitors = kvMonitors

    const config = loadConfig()
    const configMonitors = config.monitors.map((key) => {
      return key.id
    })

    Object.keys(stateMonitors.monitors).forEach((monitor) => {
      // remove monitor data from state if missing in config
      if (!configMonitors.includes(monitor)) {
        delete stateMonitors.monitors[monitor]
        return
      }

      const date = new Date()
      date.setDate(date.getDate() - config.settings.daysInHistogram)
      const cleanUpDate = date.toISOString().split('T')[0]

      Object.keys(stateMonitors.monitors[monitor].checks).forEach(
        (checkDay) => {
          if (checkDay < cleanUpDate) {
            delete stateMonitors.monitors[monitor].checks[checkDay]
          }
        },
      )
    })

    // sanity check + if good save the KV
    if (configMonitors.length === Object.keys(stateMonitors.monitors).length) {
      await saveKVMonitors(kvMonitorsKey, stateMonitors)
    }
  })
  .catch((e) => console.log(e))
