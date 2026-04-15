import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const distServer = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'server')

writeFileSync(
  join(distServer, 'cloudflare-worker.mjs'),
  `import astro from './entry.mjs';
import { processCronTrigger } from './cron-bundle.mjs';

export default {
  async fetch(request, env, ctx) {
    return astro.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    return processCronTrigger(event, env, ctx);
  },
};
`,
)
