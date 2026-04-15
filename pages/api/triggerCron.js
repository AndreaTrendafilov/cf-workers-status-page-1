import { processCronTrigger } from '../../src/functions/cronTrigger'

export default async () => {
  const event = {
    waitUntil(promise) {
      return promise
    },
  }
  return processCronTrigger(event)
}
