import { useEffect, useMemo, useState } from 'react'
import config from '../generated/config.json'
import {
  computeLatencyAggregateStats,
  computeUptimeStats,
} from '../functions/monitorSeries'
import { formatRelativeFromMs } from '../functions/relativeTime'

const s = config.settings

export default function MonitorStatsRow({ kvMonitor }) {
  const days = s.daysInHistogram
  const stats = computeUptimeStats(kvMonitor, days)
  const latAgg = computeLatencyAggregateStats(kvMonitor, days)
  const collectRt = s.collectResponseTimes

  const last = kvMonitor?.lastCheck
  const hasLast =
    last &&
    typeof last.status === 'number' &&
    typeof last.operational === 'boolean'

  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const probeAge = useMemo(() => {
    if (typeof window === 'undefined' || !last?.checkedAt) {
      return null
    }
    return formatRelativeFromMs(last.checkedAt)
  }, [last?.checkedAt, tick])

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gruv-l-fg dark:text-gruv-d-fg mb-4 border-b border-gruv-l-border dark:border-gruv-d-border pb-4">
      <div>
        <span className="text-gruv-l-muted dark:text-gruv-d-muted mr-1">
          {s.graphUptimeLabel ?? 'Uptime'}
        </span>
        {stats.uptimePercent != null ? (
          <span className="font-semibold tabular-nums text-gruv-accent-aqua dark:text-gruv-accent-aqua">
            {stats.uptimePercent}%
          </span>
        ) : (
          <span className="text-gruv-l-muted dark:text-gruv-d-muted">—</span>
        )}
        {stats.daysWithData > 0 && (
          <span className="text-gruv-l-muted dark:text-gruv-d-muted ml-1">
            ({stats.daysWithData} {s.graphDaysSampledLabel ?? 'days with data'})
          </span>
        )}
      </div>

      <div>
        <span className="text-gruv-l-muted dark:text-gruv-d-muted mr-1">
          {s.graphIncidentsLabel ?? 'Days with failures'}
        </span>
        <span className="font-semibold tabular-nums text-gruv-accent-yellow dark:text-gruv-accent-yellow">
          {stats.incidentDays}
        </span>
        {stats.totalFails > 0 && (
          <span className="text-gruv-l-muted dark:text-gruv-d-muted ml-1">
            ({stats.totalFails} {s.graphFailedChecksLabel ?? 'failed checks'})
          </span>
        )}
      </div>

      {collectRt && latAgg.samples > 0 && (
        <div>
          <span className="text-gruv-l-muted dark:text-gruv-d-muted mr-1">
            {s.graphLatencyAggregateLabel ?? 'Latency (window)'}
          </span>
          <span className="font-mono tabular-nums font-semibold text-gruv-accent-blue dark:text-gruv-accent-aqua">
            avg {latAgg.avgMs} ms
          </span>
          <span className="text-gruv-l-muted dark:text-gruv-d-muted ml-1 font-mono text-xs tabular-nums">
            ({s.graphLatencyRangeLabel ?? 'min–max'} {latAgg.minMs}–{latAgg.maxMs}{' '}
            ms, {latAgg.samples} {s.graphLatencySamplesLabel ?? 'days'})
          </span>
        </div>
      )}

      <div>
        <span className="text-gruv-l-muted dark:text-gruv-d-muted mr-1">
          {s.graphLastCheckLabel ?? 'Last check'}
        </span>
        {hasLast ? (
          <>
            <span className="font-mono tabular-nums">HTTP {last.status}</span>
            {typeof last.responseTimeMs === 'number' && (
              <span className="ml-2 font-mono tabular-nums">
                {last.responseTimeMs} ms
              </span>
            )}
            {last.degraded && (
              <span className="ml-2 text-gruv-accent-orange dark:text-gruv-accent-orange">
                ({s.graphSlowResponseHint ?? 'above threshold'})
              </span>
            )}
          </>
        ) : (
          <span className="text-gruv-l-muted dark:text-gruv-d-muted">—</span>
        )}
      </div>

      {probeAge && (
        <div>
          <span className="text-gruv-l-muted dark:text-gruv-d-muted mr-1">
            {s.statsProbeAgeLabel ?? 'Probe age'}
          </span>
          <span className="font-mono tabular-nums text-gruv-l-fg dark:text-gruv-d-fg">
            {probeAge}
          </span>
        </div>
      )}

      {typeof last?.failureStreak === 'number' && last.failureStreak > 0 && (
        <div>
          <span className="text-gruv-l-muted dark:text-gruv-d-muted mr-1">
            {s.statsFailStreakLabel ?? 'Fail streak'}
          </span>
          <span className="font-semibold tabular-nums text-gruv-accent-yellow dark:text-gruv-accent-yellow">
            {last.failureStreak}
          </span>
        </div>
      )}
    </div>
  )
}
