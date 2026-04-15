import { useEffect, useMemo, useState } from 'react'
import config from '../generated/config.json'
import {
  computeLatencyAggregateStats,
  computeUptimeStats,
} from '../functions/monitorSeries'
import { formatRelativeFromMs } from '../functions/relativeTime'

const s = config.settings

function Row({ label, children }) {
  return (
    <>
      <dt className="text-gruv-l-muted dark:text-gruv-d-muted shrink-0 pt-0.5 leading-snug">
        {label}
      </dt>
      <dd className="min-w-0 leading-snug text-gruv-l-fg dark:text-gruv-d-fg">{children}</dd>
    </>
  )
}

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
    <dl className="grid grid-cols-[minmax(7.5rem,auto)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm mb-4 border-b border-gruv-l-border dark:border-gruv-d-border pb-4">
      <Row label={s.graphUptimeLabel ?? 'Uptime'}>
        <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {stats.uptimePercent != null ? (
            <span className="font-semibold tabular-nums text-gruv-accent-aqua dark:text-gruv-accent-aqua">
              {stats.uptimePercent}%
            </span>
          ) : (
            <span className="text-gruv-l-muted dark:text-gruv-d-muted">—</span>
          )}
          {stats.daysWithData > 0 && (
            <span className="text-gruv-l-muted dark:text-gruv-d-muted text-xs sm:text-sm">
              ({stats.daysWithData} {s.graphDaysSampledLabel ?? 'days with data'})
            </span>
          )}
        </span>
      </Row>

      <Row label={s.graphIncidentsLabel ?? 'Days with failures'}>
        <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="font-semibold tabular-nums text-gruv-accent-yellow dark:text-gruv-accent-yellow">
            {stats.incidentDays}
          </span>
          {stats.totalFails > 0 && (
            <span className="text-gruv-l-muted dark:text-gruv-d-muted text-xs sm:text-sm">
              ({stats.totalFails} {s.graphFailedChecksLabel ?? 'failed checks'})
            </span>
          )}
        </span>
      </Row>

      {collectRt && latAgg.samples > 0 && (
        <Row label={s.graphLatencyAggregateLabel ?? 'Latency (window)'}>
          <span className="block space-y-1">
            <span className="font-mono tabular-nums font-semibold text-gruv-accent-blue dark:text-gruv-accent-aqua">
              avg {latAgg.avgMs} ms
            </span>
            <span className="block text-xs text-gruv-l-muted dark:text-gruv-d-muted font-mono tabular-nums">
              {s.graphLatencyRangeLabel ?? 'min–max'} {latAgg.minMs}–{latAgg.maxMs} ms ·{' '}
              {latAgg.samples} {s.graphLatencySamplesLabel ?? 'days'}
            </span>
          </span>
        </Row>
      )}

      <Row label={s.graphLastCheckLabel ?? 'Last check'}>
        {hasLast ? (
          <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono tabular-nums whitespace-nowrap">
              HTTP {last.status}
            </span>
            {typeof last.responseTimeMs === 'number' && (
              <span className="font-mono tabular-nums whitespace-nowrap">
                {last.responseTimeMs} ms
              </span>
            )}
            {last.degraded && (
              <span className="text-gruv-accent-orange dark:text-gruv-accent-orange text-xs sm:text-sm">
                ({s.graphSlowResponseHint ?? 'above threshold'})
              </span>
            )}
          </span>
        ) : (
          <span className="text-gruv-l-muted dark:text-gruv-d-muted">—</span>
        )}
      </Row>

      {probeAge && (
        <Row label={s.statsProbeAgeLabel ?? 'Probe age'}>
          <span className="font-mono tabular-nums">{probeAge}</span>
        </Row>
      )}

      {typeof last?.failureStreak === 'number' && last.failureStreak > 0 && (
        <Row label={s.statsFailStreakLabel ?? 'Fail streak'}>
          <span className="font-semibold tabular-nums text-gruv-accent-yellow dark:text-gruv-accent-yellow">
            {last.failureStreak}
          </span>
        </Row>
      )}
    </dl>
  )
}
