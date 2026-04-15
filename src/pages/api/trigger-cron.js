import { env } from 'cloudflare:workers'
import { processCronTrigger } from '../../functions/cronTrigger.js'

/** Manual trigger (same behavior as the old Flareact API route). Protect in production. */
export async function GET() {
  const event = {
    waitUntil(promise) {
      return promise
    },
  }
  return processCronTrigger(event, env)
}
