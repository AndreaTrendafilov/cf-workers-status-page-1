import { env } from 'cloudflare:workers'
import { processCronTrigger } from '../../functions/cronTrigger.js'

/** Manual cron run for debugging. Protect or remove in production. */
export async function GET() {
  const event = {
    waitUntil(promise) {
      return promise
    },
  }
  return processCronTrigger(event, env)
}
