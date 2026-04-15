/**
 * Astro's adapter writes dist/server/wrangler.json with main=entry.mjs (fetch
 * only), kv_namespaces: [], triggers: {}. Wrangler deploy prefers this file, so
 * we patch: real entry must be cloudflare-worker.mjs (scheduled + fetch→Astro),
 * plus KV and cron triggers from wrangler.toml.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const id = process.env.KV_NAMESPACE_ID?.trim()
if (!id) {
  console.error('inject-kv-binding: KV_NAMESPACE_ID is not set')
  process.exit(1)
}

function cronsFromWranglerToml() {
  const tomlPath = resolve('wrangler.toml')
  let text
  try {
    text = readFileSync(tomlPath, 'utf8')
  } catch {
    return ['* * * * *']
  }
  const block = text.match(/\[triggers\]\s*([\s\S]*?)(?=\n\[|\s*$)/)
  if (!block) return ['* * * * *']
  const m = block[1].match(/crons\s*=\s*\[([\s\S]*?)\]/)
  if (!m) return ['* * * * *']
  const inner = m[1]
  const out = []
  for (const part of inner.split(',')) {
    const q = part.trim().match(/^["'](.+)["']$/)
    if (q) out.push(q[1])
  }
  return out.length ? out : ['* * * * *']
}

const path = resolve('dist/server/wrangler.json')
const j = JSON.parse(readFileSync(path, 'utf8'))
j.main = 'cloudflare-worker.mjs'
j.kv_namespaces = [
  { binding: 'KV_STATUS_PAGE', id, preview_id: id },
]
j.triggers = { ...(j.triggers || {}), crons: cronsFromWranglerToml() }
writeFileSync(path, JSON.stringify(j, null, 2))
console.log(
  'inject-kv-binding: main=cloudflare-worker.mjs, KV_STATUS_PAGE, cron triggers -> dist/server/wrangler.json',
)
