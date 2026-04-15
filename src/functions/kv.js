const kvDataKey = 'monitors_data_v1_1'

export async function getKVMonitors(env) {
  return env.KV_STATUS_PAGE.get(kvDataKey, 'json')
}

export async function setKVMonitors(data, env) {
  return setKV(kvDataKey, JSON.stringify(data), undefined, undefined, env)
}

export async function setKV(key, value, metadata, expirationTtl, env) {
  return env.KV_STATUS_PAGE.put(key, value, { metadata, expirationTtl })
}
