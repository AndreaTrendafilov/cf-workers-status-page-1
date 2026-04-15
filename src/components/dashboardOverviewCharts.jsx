import { useMemo } from 'react'
import config from '../generated/config.json'
import {
  aggregateFailsPerDay,
  aggregateMeanLatencyPerDay,
  summarizeMonitorStates,
} from '../functions/monitorSeries'

const W = 400
const H = 72
const PAD_L = 36
const PAD_R = 6
const PAD_T = 6
const PAD_B = 14
const INNER_W = W - PAD_L - PAD_R
const INNER_H = H - PAD_T - PAD_B

function FleetFailsBars({ series }) {
  const n = series.length
  const maxFails = Math.max(1, ...series.map((p) => p.totalFails))
  const slotW = n > 0 ? INNER_W / n : 1
  const gap = n > 1 ? Math.min(2, slotW * 0.15) : 0
  const barWidth = Math.max(1, slotW - gap)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto block text-gruv-l-border dark:text-gruv-d-border"
      role="img"
      aria-label="Fleet failed checks per day"
    >
      <line
        x1={PAD_L}
        y1={PAD_T + INNER_H}
        x2={W - PAD_R}
        y2={PAD_T + INNER_H}
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="1"
      />
      {series.map((p, i) => {
        const h = (p.totalFails / maxFails) * INNER_H
        const x = PAD_L + i * slotW + gap / 2
        const y = PAD_T + INNER_H - h
        const hot = p.totalFails > 0
        return (
          <g key={p.day}>
            <rect
              x={x}
              y={hot ? y : PAD_T + INNER_H - 2}
              width={barWidth}
              height={hot ? h : 2}
              rx="1"
              fill={hot ? '#fb4934' : '#665c54'}
              fillOpacity={hot ? 0.88 : 0.32}
            />
            <title>{`${p.day}: ${p.totalFails} failed check(s) fleet-wide`}</title>
          </g>
        )
      })}
      {n > 0 && series[0]?.day && series[n - 1]?.day && (
        <text
          x={W / 2}
          y={H - 3}
          textAnchor="middle"
          className="font-mono tabular-nums"
        >
          {series[0].day === series[n - 1].day
            ? series[0].day
            : `${series[0].day} → ${series[n - 1].day}`}
        </text>
      )}
    </svg>
  )
}

function FleetLatencyLine({ series }) {
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
  let cur = []
  for (let i = 0; i < series.length; i++) {
    const pt = series[i]
    if (pt.avgMs != null) {
      cur.push({ i, x: xAt(i), y: yAt(pt.avgMs) })
    } else if (cur.length) {
      segments.push(cur)
      cur = []
    }
  }
  if (cur.length) segments.push(cur)

  const gridYs = [0, 0.5, 1].map((t) => PAD_T + t * INNER_H)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto block text-gruv-l-border dark:text-gruv-d-border"
      role="img"
      aria-label="Fleet mean latency"
    >
      <defs>
        <linearGradient id="fleet-lat-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d3869b" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#d3869b" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      {gridYs.map((gy, gi) => (
        <line
          key={`g-${gi}`}
          x1={PAD_L}
          y1={gy}
          x2={W - PAD_R}
          y2={gy}
          stroke="currentColor"
          strokeOpacity="0.32"
          strokeWidth="1"
        />
      ))}
      {segments.map((seg) => {
        if (seg.length === 0) return null
        let d = `M ${seg[0].x} ${seg[0].y}`
        for (let k = 1; k < seg.length; k++) {
          d += ` L ${seg[k].x} ${seg[k].y}`
        }
        const last = seg[seg.length - 1]
        const first = seg[0]
        const baseline = PAD_T + INNER_H
        const area = `${d} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
        return (
          <g key={`seg-${first.i}`}>
            <path d={area} fill="url(#fleet-lat-fill)" stroke="none" />
            <path
              d={d}
              fill="none"
              stroke="#c27d9e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )
      })}
      {series.map(({ day, avgMs }, i) => {
        if (avgMs == null) return null
        return (
          <g key={`pt-${day}`}>
            <circle cx={xAt(i)} cy={yAt(avgMs)} r="2.25" fill="#c27d9e" />
            <title>{`${day}\n${avgMs} ms mean (monitors with data)`}</title>
          </g>
        )
      })}
      {n > 0 && series[0]?.day && series[n - 1]?.day && (
        <text
          x={W / 2}
          y={H - 3}
          textAnchor="middle"
          className="font-mono tabular-nums"
        >
          {series[0].day === series[n - 1].day
            ? series[0].day
            : `${series[0].day} → ${series[n - 1].day}`}
        </text>
      )}
    </svg>
  )
}

export default function DashboardOverviewCharts({ monitors, kvMonitors }) {
  const s = config.settings
  const days = s.daysInHistogram
  const collect = s.collectResponseTimes

  const summary = useMemo(
    () => summarizeMonitorStates(monitors ?? [], kvMonitors ?? {}),
    [monitors, kvMonitors],
  )

  const failSeries = useMemo(
    () => aggregateFailsPerDay(monitors ?? [], kvMonitors ?? {}, days),
    [monitors, kvMonitors, days],
  )

  const latencySeries = useMemo(
    () => aggregateMeanLatencyPerDay(monitors ?? [], kvMonitors ?? {}, days),
    [monitors, kvMonitors, days],
  )

  if (!monitors?.length) {
    return null
  }

  const { up, degraded, down, noData, total } = summary
  const t = Math.max(total, 1)

  return (
    <section
      className="fleet-overview-shell"
      aria-label={s.dashboardSectionTitle ?? 'Fleet overview'}
    >
      <div className="px-3 py-2 sm:px-4 border-b border-gruv-l-border dark:border-gruv-d-border">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gruv-l-muted dark:text-gruv-d-muted leading-tight">
          {s.dashboardSectionTitle ?? 'Fleet overview'}
        </h2>
      </div>

      <div className="p-3 sm:p-4 space-y-4">
        <div>
          <div className="text-[10px] font-medium text-gruv-l-muted dark:text-gruv-d-muted mb-1.5 leading-snug">
            {s.dashboardStatusMixLabel ?? 'Current monitor mix (filtered)'}
          </div>
          <div
            className="w-full h-3 rounded overflow-hidden flex border border-gruv-l-border dark:border-gruv-d-border"
            title={`${up} up · ${degraded} degraded · ${down} down · ${noData} no data`}
          >
            {up > 0 && (
              <div
                className="h-full bg-gruv-accent-green"
                style={{ width: `${(up / t) * 100}%` }}
              />
            )}
            {degraded > 0 && (
              <div
                className="h-full bg-gruv-accent-orange"
                style={{ width: `${(degraded / t) * 100}%` }}
              />
            )}
            {down > 0 && (
              <div
                className="h-full bg-gruv-accent-yellow"
                style={{ width: `${(down / t) * 100}%` }}
              />
            )}
            {noData > 0 && (
              <div
                className="h-full bg-gruv-l-border dark:bg-gruv-d-muted opacity-90"
                style={{ width: `${(noData / t) * 100}%` }}
              />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] leading-tight text-gruv-l-fg dark:text-gruv-d-fg">
            <span>
              <span className="text-gruv-accent-green">●</span> {up}{' '}
              {s.summaryMonitorsUp ?? 'up'}
            </span>
            <span>
              <span className="text-gruv-accent-orange">●</span> {degraded}{' '}
              {s.summaryMonitorsDegraded ?? 'degraded'}
            </span>
            <span>
              <span className="text-gruv-accent-yellow">●</span> {down}{' '}
              {s.summaryMonitorsDown ?? 'down'}
            </span>
            {noData > 0 && (
              <span className="text-gruv-l-muted dark:text-gruv-d-muted">
                {noData} {s.summaryMonitorsNoData ?? 'no data'}
              </span>
            )}
          </div>
        </div>

        <div
          className={`grid grid-cols-1 gap-4 ${collect ? 'lg:grid-cols-2' : ''}`}
        >
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-medium text-gruv-l-muted dark:text-gruv-d-muted leading-snug">
              {s.dashboardFleetFailsTitle ?? 'Failed checks per day (fleet)'}
            </div>
            <div className="fleet-chart-wrap rounded-lg border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg dark:bg-gruv-d-bg-soft">
              <FleetFailsBars series={failSeries} />
            </div>
          </div>

          {collect && (
            <div className="min-w-0">
              <div className="text-[10px] mb-1 font-medium text-gruv-l-muted dark:text-gruv-d-muted leading-snug">
                {s.dashboardFleetLatencyTitle ??
                  'Mean response time (monitors with data)'}
              </div>
              <div className="fleet-chart-wrap rounded-lg border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg dark:bg-gruv-d-bg-soft">
                <FleetLatencyLine series={latencySeries} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
