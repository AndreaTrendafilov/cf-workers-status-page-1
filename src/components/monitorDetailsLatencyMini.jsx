import config from '../generated/config.json'
import {
  averageRecentLatencyMs,
  computeLatencySeries,
} from '../functions/monitorSeries'

function barTitle(day, avgMs, fails, s) {
  if (avgMs == null) {
    return `${day}: ${s.dayInHistogramNoData ?? 'No data'}`
  }
  let t = `${day}: ${avgMs} ms avg`
  if (typeof fails === 'number' && fails > 0) {
    t += ` · ${fails} ${s.graphLatencyFailHint ?? 'failed check(s)'}`
  }
  return t
}

/**
 * Compact response-time bars for the details drawer, shown next to the availability pie.
 * Uses native `title` tooltips only — avoids overlapping absolutely-positioned popups
 * when many narrow bars are shown (e.g. 90+ days).
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
        className="flex-1 min-w-0 h-full flex flex-col justify-end"
        title={barTitle(day, avgMs, fails, s)}
      >
        <div
          className={barClass}
          style={{ height: avgMs != null ? `${heightPct}%` : '3px' }}
        />
      </div>
    )
  })

  return (
    <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-xl min-h-0">
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
      <div className="overflow-x-auto overflow-y-hidden rounded-md border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg-soft dark:bg-gruv-d-bg-soft">
        <div className="flex flex-row items-end h-24 min-w-full w-max sm:w-full px-0.5 pb-0.5 gap-px">
          {content}
        </div>
      </div>
    </div>
  )
}
