import config from '../generated/config.json'
import {
  averageRecentLatencyMs,
  computeLatencySeries,
} from '../functions/monitorSeries'

const W = 400
const H = 112
const PAD_L = 44
const PAD_R = 8
const PAD_T = 10
const PAD_B = 22
const INNER_W = W - PAD_L - PAD_R
const INNER_H = H - PAD_T - PAD_B

export default function MonitorLatencySparkline({ monitorId, kvMonitor }) {
  const days = config.settings.daysInHistogram
  const collect = config.settings.collectResponseTimes
  const series = computeLatencySeries(kvMonitor, days)
  const recent7 = averageRecentLatencyMs(series, 7)

  if (!collect) {
    return null
  }

  const values = series.map((p) => p.avgMs).filter((v) => v != null)
  const rawMin = values.length ? Math.min(...values) : 0
  const rawMax = values.length ? Math.max(...values) : 0
  const padMs = Math.max(8, Math.round((rawMax - rawMin) * 0.08 + 4))
  const yMin = values.length ? Math.max(0, rawMin - padMs) : 0
  const yMax = values.length ? rawMax + padMs : 1
  const ySpan = Math.max(yMax - yMin, 1)

  const n = series.length
  const xAt = (i) =>
    n <= 1 ? PAD_L + INNER_W / 2 : PAD_L + (i / (n - 1)) * INNER_W

  const yAt = (ms) => {
    if (ms == null) return null
    const t = (ms - yMin) / ySpan
    return PAD_T + INNER_H - t * INNER_H
  }

  const segments = []
  let current = []
  for (let i = 0; i < series.length; i++) {
    const pt = series[i]
    if (pt.avgMs != null) {
      current.push({ i, x: xAt(i), y: yAt(pt.avgMs), ...pt })
    } else if (current.length) {
      segments.push(current)
      current = []
    }
  }
  if (current.length) segments.push(current)

  const linePaths = []
  const areaPaths = []
  const baselineY = PAD_T + INNER_H

  for (const seg of segments) {
    if (seg.length === 0) continue
    let d = `M ${seg[0].x} ${seg[0].y}`
    for (let k = 1; k < seg.length; k++) {
      d += ` L ${seg[k].x} ${seg[k].y}`
    }
    linePaths.push({ d, key: `ln-${seg[0].i}` })
    const last = seg[seg.length - 1]
    const first = seg[0]
    areaPaths.push({
      d: `${d} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`,
      key: `ar-${first.i}`,
    })
  }

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => PAD_T + t * INNER_H)
  const tickVals = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(yMax - t * (yMax - yMin)),
  )

  return (
    <div className="mb-1 mt-3">
      <div className="flex flex-row justify-between items-center text-gruv-l-muted dark:text-gruv-d-muted text-xs mb-1 font-medium">
        <span>
          {config.settings.graphSectionLatency ??
            config.settings.graphLatencyTitle ??
            'Response time'}
        </span>
        {recent7 != null && (
          <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gruv-l-muted dark:text-gruv-d-muted leading-tight">
              {config.settings.graphRecentLatencyLabel ?? 'Last 7d avg'}
            </span>
            <div className="flex flex-row items-baseline justify-end gap-1.5">
              <span className="font-semibold font-mono text-base tabular-nums leading-none text-gruv-accent-aqua dark:text-gruv-accent-aqua">
                {recent7}
              </span>
              <span className="text-xs font-medium text-gruv-l-muted dark:text-gruv-d-muted">
                ms
              </span>
            </div>
          </div>
        )}
      </div>
      <div
        key={`${monitorId}-latency`}
        className="w-full min-w-0 mx-auto rounded-lg border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-surface-2 dark:bg-gruv-d-surface-2 overflow-hidden"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block text-gruv-l-fg dark:text-gruv-d-fg"
          role="img"
          aria-label="Latency over time"
        >
          <defs>
            <linearGradient
              id={`lat-fill-${String(monitorId).replace(/[^a-zA-Z0-9_-]/g, '-')}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#458588" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#458588" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {gridYs.map((gy, gi) => (
            <line
              key={`g-${gi}`}
              x1={PAD_L}
              y1={gy}
              x2={W - PAD_R}
              y2={gy}
              stroke="#928374"
              strokeOpacity="0.45"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {tickVals.map((tv, ti) => (
            <text
              key={`tk-${ti}`}
              x={PAD_L - 6}
              y={gridYs[ti] + 4}
              textAnchor="end"
              className="fill-current text-[8px] font-mono tabular-nums opacity-75"
            >
              {tv}
            </text>
          ))}

          {areaPaths.map(({ d, key }) => (
            <path
              key={key}
              d={d}
              fill={`url(#lat-fill-${String(monitorId).replace(/[^a-zA-Z0-9_-]/g, '-')})`}
              stroke="none"
            />
          ))}

          {linePaths.map(({ d, key }) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="#458588"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {series.map(({ day, avgMs }, i) => {
            if (avgMs == null) return null
            const cx = xAt(i)
            const cy = yAt(avgMs)
            const fails = kvMonitor?.checks?.[day]?.fails
            const warn =
              typeof fails === 'number' && fails > 0
            const hot = avgMs > yMin + ySpan * 0.65
            const fill = warn
              ? 'rgb(250 189 47)'
              : hot
                ? 'rgb(254 128 25)'
                : 'rgb(69 133 136)'

            return (
              <g key={`pt-${i}`} className="group">
                <circle
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill={fill}
                  className="opacity-95"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="12"
                  fill="transparent"
                  className="cursor-default"
                />
                <title>
                  {`${day}\n${avgMs} ms avg${
                    warn
                      ? `\n${fails} ${config.settings.graphLatencyFailHint ?? 'failed check(s)'}`
                      : ''
                  }`}
                </title>
              </g>
            )
          })}

          {n > 0 && series[0]?.day && series[n - 1]?.day && (
            <text
              x={W / 2}
              y={H - 5}
              textAnchor="middle"
              className="fill-current text-[8px] opacity-85 font-mono tabular-nums"
            >
              {series[0].day === series[n - 1].day
                ? series[0].day
                : `${series[0].day} → ${series[n - 1].day}`}
            </text>
          )}
        </svg>
      </div>
    </div>
  )
}
