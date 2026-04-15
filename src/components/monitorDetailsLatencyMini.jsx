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
 * Compact response-time bars for the details drawer (next to availability pie).
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
      'lat-bar-inner lat-mini-bar bg-gruv-l-border/80 dark:bg-gruv-d-surface-2/90'

    const fails = kvMonitor?.checks?.[day]?.fails
    if (avgMs != null) {
      const norm = (avgMs - min) / span
      heightPct = 12 + Math.round(norm * 88)
      if (typeof fails === 'number' && fails > 0) {
        barClass =
          'lat-bar-inner lat-mini-bar bg-gruv-accent-yellow shadow-sm dark:shadow-none'
      } else if (avgMs > min + span * 0.65) {
        barClass =
          'lat-bar-inner lat-mini-bar bg-gruv-accent-orange shadow-sm dark:shadow-none'
      } else {
        barClass =
          'lat-bar-inner lat-mini-bar bg-gruv-accent-blue dark:bg-gruv-accent-aqua shadow-sm dark:shadow-none'
      }
    }

    return (
      <div
        key={key}
        className="flex-1 min-w-0 h-full flex flex-col justify-end group"
        title={barTitle(day, avgMs, fails, s)}
      >
        <div
          className={barClass}
          style={{ height: avgMs != null ? `${heightPct}%` : '5px' }}
        />
      </div>
    )
  })

  const hasSamples = values.length > 0
  const rangeLabel =
    hasSamples && (min !== max || values.length > 1)
      ? `${min}–${max} ms`
      : hasSamples
        ? `${min} ms`
        : null

  return (
    <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-xl min-h-0">
      <div className="rounded-xl border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-surface/80 dark:bg-gruv-d-surface/60 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            <h4 className="text-sm font-semibold tracking-tight text-gruv-l-fg dark:text-gruv-d-fg">
              {title}
            </h4>
            {rangeLabel && (
              <p className="text-xs leading-relaxed text-gruv-l-muted dark:text-gruv-d-muted">
                <span className="font-medium text-gruv-l-fg/85 dark:text-gruv-d-fg/85">
                  {s.monitorDetailsLatencyRangeTitle ?? 'Range'}
                </span>{' '}
                <span className="font-mono tabular-nums text-gruv-l-fg dark:text-gruv-d-fg">
                  {rangeLabel}
                </span>
                {values.length > 0 && (
                  <span className="text-gruv-l-muted dark:text-gruv-d-muted">
                    {' '}
                    · {values.length}{' '}
                    {s.graphLatencySamplesLabel ?? 'days with samples'}
                  </span>
                )}
              </p>
            )}
          </div>
          {recent7 != null && (
            <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-1 rounded-lg border border-gruv-accent-aqua/35 dark:border-gruv-accent-aqua/25 bg-gruv-accent-aqua/10 dark:bg-gruv-accent-aqua/5 px-3 py-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gruv-l-muted dark:text-gruv-d-muted">
                {s.graphRecentLatencyLabel ?? 'Last 7d avg'}
              </span>
              <span className="font-mono text-2xl font-semibold leading-none tabular-nums text-gruv-accent-blue dark:text-gruv-accent-aqua">
                {recent7}
                <span className="ml-1 text-base font-medium text-gruv-l-muted dark:text-gruv-d-muted">
                  ms
                </span>
              </span>
            </div>
          )}
        </div>

        {!hasSamples ? (
          <p className="mt-4 rounded-lg border border-dashed border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg-soft/80 dark:bg-gruv-d-bg-soft/50 px-3 py-6 text-center text-sm text-gruv-l-muted dark:text-gruv-d-muted">
            {s.monitorDetailsLatencyEmpty ?? 'No latency samples in this window yet.'}
          </p>
        ) : (
          <div className="mt-4">
            <div className="relative overflow-hidden rounded-lg border border-gruv-l-border/90 dark:border-gruv-d-border bg-gruv-l-bg-soft dark:bg-gruv-d-bg-soft">
              <div
                className="pointer-events-none absolute inset-x-0 top-2 bottom-9 flex flex-col justify-between z-0"
                aria-hidden
              >
                <div className="h-px bg-gruv-l-border/70 dark:bg-gruv-d-border/60" />
                <div className="h-px bg-gruv-l-border/50 dark:bg-gruv-d-border/45" />
                <div className="h-px bg-gruv-l-border/50 dark:bg-gruv-d-border/45" />
                <div className="h-px bg-gruv-l-border/70 dark:bg-gruv-d-border/60" />
              </div>
              <div className="relative z-[1] flex flex-row items-end min-h-[7rem] h-28 w-full px-1 pt-2 pb-8 gap-px overflow-x-auto overflow-y-hidden">
                {content}
              </div>
              <div className="absolute bottom-1.5 left-0 right-0 z-[2] flex justify-between px-2 text-[10px] font-medium uppercase tracking-wide text-gruv-l-muted dark:text-gruv-d-muted">
                <span>{s.monitorDetailsLatencyAxisOld ?? 'Older'}</span>
                <span>{s.monitorDetailsLatencyAxisNew ?? 'Recent'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
