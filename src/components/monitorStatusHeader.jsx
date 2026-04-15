import { useEffect, useMemo, useState } from 'react'
import config from '../generated/config.json'
import { locations } from '../functions/locations'
import { summarizeMonitorStates } from '../functions/monitorSeries'
import { formatShortDurationSince } from '../functions/relativeTime'

const classes = {
  green:
    'bg-gruv-accent-aqua bg-opacity-20 dark:bg-opacity-25 text-gruv-l-fg dark:text-gruv-accent-aqua border border-gruv-accent-aqua border-opacity-35 dark:border-opacity-45',
  yellow:
    'bg-gruv-accent-yellow bg-opacity-20 dark:bg-opacity-20 text-gruv-l-fg dark:text-gruv-accent-yellow border border-gruv-accent-yellow border-opacity-40 dark:border-opacity-45',
}

export default function MonitorStatusHeader({
  kvMonitorsLastUpdate,
  monitors,
  kvMonitors,
}) {
  const s = config.settings
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const id = window.setInterval(() => setTick((t) => t + 1), 15_000)
    return () => window.clearInterval(id)
  }, [])

  let color = 'green'
  let text = s.allmonitorsOperational

  if (kvMonitorsLastUpdate.allOperational === false) {
    color = 'yellow'
    text = s.notAllmonitorsOperational
  }

  const summary = useMemo(
    () => summarizeMonitorStates(monitors ?? [], kvMonitors ?? {}),
    [monitors, kvMonitors],
  )

  const batchAge = useMemo(() => {
    if (!kvMonitorsLastUpdate?.time || typeof window === 'undefined') {
      return null
    }
    return formatShortDurationSince(kvMonitorsLastUpdate.time)
  }, [kvMonitorsLastUpdate?.time, tick])

  return (
    <div
      className={`card mt-8 sm:mt-10 mb-6 md:mb-8 font-semibold ${classes[color]}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
        <div className="min-w-0 space-y-2">
          <div>{text}</div>
          {summary.total > 0 && (
            <div className="text-xs font-normal font-medium text-gruv-l-fg/90 dark:text-gruv-d-fg/90 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                <span className="text-gruv-accent-green dark:text-gruv-accent-green">
                  ●
                </span>{' '}
                {summary.up}{' '}
                {s.summaryMonitorsUp ?? 'up'}
              </span>
              <span>
                <span className="text-gruv-accent-orange dark:text-gruv-accent-orange">
                  ●
                </span>{' '}
                {summary.degraded}{' '}
                {s.summaryMonitorsDegraded ?? 'degraded'}
              </span>
              <span>
                <span className="text-gruv-accent-yellow dark:text-gruv-accent-yellow">
                  ●
                </span>{' '}
                {summary.down}{' '}
                {s.summaryMonitorsDown ?? 'down'}
              </span>
              {summary.noData > 0 && (
                <span className="text-gruv-l-muted dark:text-gruv-d-muted">
                  {summary.noData} {s.summaryMonitorsNoData ?? 'no data yet'}
                </span>
              )}
            </div>
          )}
        </div>
        {batchAge && typeof window !== 'undefined' && (
          <div className="text-xs font-normal text-gruv-l-muted dark:text-gruv-d-muted font-mono shrink-0">
            {s.summaryGlobalProbeLabel ?? 'Last cron run'}{' '}
            {batchAge}
            {kvMonitorsLastUpdate.loc && (
              <>
                {' '}
                ({locations[kvMonitorsLastUpdate.loc] || kvMonitorsLastUpdate.loc}
                )
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
