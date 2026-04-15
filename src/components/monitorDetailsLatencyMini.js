import config from '../../config.yaml'
import {
  averageRecentLatencyMs,
  computeLatencySeries,
} from '../functions/monitorSeries'

/**
 * Compact response-time bars for the details drawer, shown next to the availability pie.
 */
export default function MonitorDetailsLatencyMini({ kvMonitor }) {
  const days = config.settings.daysInHistogram
  const collect = config.settings.collectResponseTimes
  const s = config.settings
  const title =
    s.monitorDetailsLatencySection ??
    s.graphSectionLatency ??
    s.graphLatencyTitle ??
    'Response time'

  const series = computeLatencySeries(kvMonitor, days)
  const recent7 = averageRecentLatencyMs(series, 7)

  if (!collect) {
    return null
  }

  if (typeof window === 'undefined') {
    return (
      <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-xl">
        <div className="h-3 w-24 mb-2 rounded bg-gruv-l-surface-2 dark:bg-gruv-d-surface-2 animate-pulse" />
        <div className="h-24 rounded-md bg-gruv-l-surface-2 dark:bg-gruv-d-surface-2 animate-pulse" />
      </div>
    )
  }

  const values = series.map((p) => p.avgMs).filter((v) => v != null)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 0
  const span = Math.max(max - min, 1)

  const content = series.map(({ day, avgMs }, key) => {
    let heightPct = 0
    let barClass =
      'lat-bar-inner bg-gruv-l-border dark:bg-gruv-d-surface-2'

    const fails = kvMonitor?.checks?.[day]?.fails
    if (avgMs != null) {
      const norm = (avgMs - min) / span
      heightPct = 10 + Math.round(norm * 90)
      if (typeof fails === 'number' && fails > 0) {
        barClass = 'lat-bar-inner bg-gruv-accent-yellow opacity-90'
      } else if (avgMs > min + span * 0.65) {
        barClass = 'lat-bar-inner bg-gruv-accent-orange opacity-90'
      } else {
        barClass = 'lat-bar-inner bg-gruv-accent-blue opacity-90'
      }
    }

    return (
      <div
        key={key}
        className="hitbox tooltip flex-1 min-w-0 h-full flex flex-col justify-end"
      >
        <div
          className={barClass}
          style={{ height: avgMs != null ? `${heightPct}%` : '3px' }}
        />
        <div className="content text-center py-1 px-2 mt-1.5 left-1/2 -ml-20 w-40 text-xs">
          {day}
          <br />
          <span className="font-semibold">
            {avgMs != null
              ? `${avgMs} ms`
              : s.dayInHistogramNoData ?? 'No data'}
          </span>
          {kvMonitor && kvMonitor.checks?.[day]?.fails > 0 && (
            <>
              <br />
              <span className="text-gruv-accent-yellow dark:text-gruv-accent-yellow">
                {kvMonitor.checks[day].fails}{' '}
                {s.graphLatencyFailHint ?? 'failed'}
              </span>
            </>
          )}
        </div>
      </div>
    )
  })

  return (
    <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-xl">
      <div className="flex flex-row flex-wrap justify-between items-baseline gap-x-2 gap-y-1 text-xs mb-2 text-gruv-l-muted dark:text-gruv-d-muted font-medium">
        <span className="uppercase tracking-wide">{title}</span>
        {recent7 != null && (
          <span className="font-mono tabular-nums">
            {s.graphRecentLatencyLabel ?? 'Last 7d avg:'}{' '}
            <strong className="text-gruv-accent-aqua dark:text-gruv-accent-aqua">
              {recent7} ms
            </strong>
          </span>
        )}
      </div>
      <div className="flex flex-row items-end h-24 w-full min-w-0 gap-px rounded-md border border-gruv-l-border dark:border-gruv-d-border px-0.5 pb-0.5 bg-gruv-l-bg-soft/50 dark:bg-gruv-d-bg-soft/50">
        {content}
      </div>
    </div>
  )
}
