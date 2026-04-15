/**
 * Astro's adapter writes dist/server/wrangler.json with kv_namespaces: [].
 * `wrangler deploy` prefers that file over wrangler.toml bindings, so CI must
 * inject KV_STATUS_PAGE here after the namespace id is known.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const id = process.env.KV_NAMESPACE_ID?.trim()
if (!id) {
  console.error('inject-kv-binding: KV_NAMESPACE_ID is not set')
  process.exit(1)
}

const path = resolve('dist/server/wrangler.json')
const j = JSON.parse(readFileSync(path, 'utf8'))
j.kv_namespaces = [
  { binding: 'KV_STATUS_PAGE', id, preview_id: id },
]
writeFileSync(path, JSON.stringify(j, null, 2))
console.log('inject-kv-binding: KV_STATUS_PAGE -> dist/server/wrangler.json')
