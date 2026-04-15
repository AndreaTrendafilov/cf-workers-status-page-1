import config from '../generated/config.json'
import {
  averageRecentLatencyMs,
  computeLatencySeries,
} from '../functions/monitorSeries'

/**
 * Latency stats for the details drawer (next to availability pie) — text only, no chart.
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

  const hasSamples = values.length > 0
  const rangeLabel =
    hasSamples && (min !== max || values.length > 1)
      ? `${min}–${max} ms`
      : hasSamples
        ? `${min} ms`
        : null

  const samplesLabel =
    values.length === 1
      ? (s.graphLatencySamplesLabelSingular ?? 'day sampled')
      : (s.graphLatencySamplesLabel ?? 'days sampled')

  return (
    <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-xl min-h-0">
      <div className="rounded-xl border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-surface/80 dark:bg-gruv-d-surface/60 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight text-gruv-l-fg dark:text-gruv-d-fg min-w-0 shrink">
              {title}
            </h4>
            {recent7 != null && (
              <div className="flex flex-col items-end gap-1 rounded-lg border border-gruv-accent-aqua/35 dark:border-gruv-accent-aqua/25 bg-gruv-accent-aqua/10 dark:bg-gruv-accent-aqua/5 px-2.5 py-2 shrink-0 max-w-full text-right">
                <span className="block text-[10px] font-medium uppercase tracking-wide text-gruv-l-muted dark:text-gruv-d-muted leading-tight">
                  {s.graphRecentLatencyLabel ?? 'Last 7d avg'}
                </span>
                <div className="flex flex-row items-baseline justify-end gap-1.5">
                  <span className="font-mono text-lg sm:text-xl font-semibold tabular-nums leading-none text-gruv-accent-blue dark:text-gruv-accent-aqua">
                    {recent7}
                  </span>
                  <span className="text-xs font-medium text-gruv-l-muted dark:text-gruv-d-muted">
                    ms
                  </span>
                </div>
              </div>
            )}
          </div>
          {rangeLabel && (
            <p className="text-xs leading-snug text-gruv-l-muted dark:text-gruv-d-muted min-w-0 break-words">
              <span className="font-medium text-gruv-l-fg/85 dark:text-gruv-d-fg/85">
                {s.monitorDetailsLatencyRangeTitle ?? 'Range'}
              </span>{' '}
              <span className="font-mono tabular-nums text-gruv-l-fg dark:text-gruv-d-fg">
                {rangeLabel}
              </span>
              {values.length > 0 && (
                <span className="text-gruv-l-muted dark:text-gruv-d-muted">
                  {' '}
                  · {values.length} {samplesLabel}
                </span>
              )}
            </p>
          )}
        </div>

        {!hasSamples && (
          <p className="mt-3 rounded-lg border border-dashed border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg-soft/80 dark:bg-gruv-d-bg-soft/50 px-3 py-4 text-center text-sm text-gruv-l-muted dark:text-gruv-d-muted">
            {s.monitorDetailsLatencyEmpty ?? 'No latency samples in this window yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
