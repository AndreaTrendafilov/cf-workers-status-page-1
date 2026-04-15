import config from '../generated/config.json'
import { buildHistogramDateRange } from '../functions/monitorSeries'

const W = 400
const H = 52
const PAD_L = 36
const PAD_R = 8
const PAD_T = 6
const PAD_B = 6
const INNER_W = W - PAD_L - PAD_R
const INNER_H = H - PAD_T - PAD_B

function failureChartDateRange(series) {
  const n = series.length
  if (n === 0 || !series[0]?.day || !series[n - 1]?.day) {
    return null
  }
  const a = series[0].day
  const b = series[n - 1].day
  return a === b ? a : `${a} → ${b}`
}

export default function MonitorFailureBars({ monitorId, kvMonitor }) {
  const days = config.settings.daysInHistogram
  const range = buildHistogramDateRange(days)
  const series = range.map((day) => {
    if (
      !kvMonitor?.firstCheck ||
      day < kvMonitor.firstCheck ||
      !kvMonitor.checks?.[day]
    ) {
      return { day, fails: 0 }
    }
    const f = kvMonitor.checks[day].fails
    return { day, fails: typeof f === 'number' ? f : 0 }
  })

  const n = series.length
  const maxFails = Math.max(1, ...series.map((p) => p.fails))
  const slotW = n > 0 ? INNER_W / n : 1
  const gap = n > 1 ? Math.min(2, slotW * 0.15) : 0
  const barWidth = Math.max(1, slotW - gap)

  const anyFails = series.some((p) => p.fails > 0)
  const rangeLabel = failureChartDateRange(series)

  return (
    <div className="mb-1 mt-3">
      <div className="flex flex-row justify-between items-baseline gap-3 text-sm mb-2 font-medium leading-snug">
        <span className="min-w-0 text-gruv-l-fg dark:text-gruv-d-fg">
          {config.settings.graphSectionFailures ?? 'Failed checks per day'}
        </span>
        {anyFails && (
          <span className="shrink-0 font-mono tabular-nums text-xs text-gruv-accent-yellow">
            peak {Math.max(...series.map((p) => p.fails))}/day
          </span>
        )}
      </div>
      <div className="rounded-lg border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg dark:bg-gruv-d-bg-soft overflow-hidden">
        <div className="failure-chart-inner" key={`${monitorId}-fails`}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto block text-gruv-l-border dark:text-gruv-d-border"
            role="img"
            aria-label="Failed checks per day"
          >
            <line
              x1={PAD_L}
              y1={PAD_T + INNER_H}
              x2={W - PAD_R}
              y2={PAD_T + INNER_H}
              stroke="currentColor"
              strokeOpacity="0.38"
              strokeWidth="1"
            />
            {series.map((p, i) => {
              const h = (p.fails / maxFails) * INNER_H
              const x = PAD_L + i * slotW + gap / 2
              const hot = p.fails > 0
              return (
                <g key={p.day}>
                  <rect
                    x={x}
                    y={hot ? PAD_T + INNER_H - h : PAD_T + INNER_H - 2}
                    width={barWidth}
                    height={hot ? h : 2}
                    rx="1"
                    fill={hot ? '#fabd2f' : '#665c54'}
                    fillOpacity={hot ? 0.92 : 0.3}
                  />
                  <title>
                    {p.day}: {p.fails}{' '}
                    {config.settings.graphFailureDayHint ?? 'failed check(s)'}
                  </title>
                </g>
              )
            })}
          </svg>
        </div>
        {rangeLabel && (
          <p className="px-2 py-2 sm:py-2.5 text-center text-sm sm:text-base font-mono font-medium tabular-nums leading-snug text-gruv-l-fg dark:text-gruv-d-fg border-t border-gruv-l-border/60 dark:border-gruv-d-border/70 bg-gruv-l-surface/50 dark:bg-gruv-d-surface/40">
            {rangeLabel}
          </p>
        )}
      </div>
    </div>
  )
}
