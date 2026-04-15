import { useMemo } from 'react'
import config from '../generated/config.json'
import {
  aggregateFailsPerDay,
  aggregateMeanLatencyPerDay,
  summarizeMonitorStates,
} from '../functions/monitorSeries'

const W = 400
const H = 100
const PAD_L = 44
const PAD_R = 8
const PAD_T = 8
const PAD_B = 20
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
      className="w-full h-auto block text-gruv-l-fg dark:text-gruv-d-fg"
      role="img"
      aria-label="Fleet failed checks per day"
    >
      <line
        x1={PAD_L}
        y1={PAD_T + INNER_H}
        x2={W - PAD_R}
        y2={PAD_T + INNER_H}
        stroke="#928374"
        strokeOpacity="0.45"
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
              fill={hot ? '#fb4934' : '#928374'}
              fillOpacity={hot ? 0.85 : 0.25}
            />
            <title>{`${p.day}: ${p.totalFails} failed check(s) fleet-wide`}</title>
          </g>
        )
      })}
      <text
        x={PAD_L}
        y={H - 5}
        className="fill-current text-[9px] opacity-80 font-mono"
      >
        {series[0]?.day ?? ''}
      </text>
      <text
        x={W / 2}
        y={H - 5}
        textAnchor="middle"
        className="fill-current text-[9px] opacity-80 font-mono"
      >
        {n >= 3 ? series[Math.floor(n / 2)]?.day : ''}
      </text>
      <text
        x={W - PAD_R}
        y={H - 5}
        textAnchor="end"
        className="fill-current text-[9px] opacity-80 font-mono"
      >
        {series[n - 1]?.day ?? ''}
      </text>
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
  const tickVals = [0, 0.5, 1].map((t) => Math.round(yMax - t * (yMax - yMin)))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto block text-gruv-l-fg dark:text-gruv-d-fg"
      role="img"
      aria-label="Fleet mean latency"
    >
      <defs>
        <linearGradient id="fleet-lat-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d3869b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d3869b" stopOpacity="0.05" />
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
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      ))}
      {tickVals.map((tv, ti) => (
        <text
          key={`tk-${ti}`}
          x={PAD_L - 6}
          y={gridYs[ti] + 4}
          textAnchor="end"
          className="fill-current text-[9px] font-mono tabular-nums opacity-70"
        >
          {tv}
        </text>
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
              stroke="#d3869b"
              strokeWidth="2"
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
            <circle cx={xAt(i)} cy={yAt(avgMs)} r="3" fill="#d3869b" />
            <title>{`${day}\n${avgMs} ms mean (monitors with data)`}</title>
          </g>
        )
      })}
      <text
        x={PAD_L}
        y={H - 5}
        className="fill-current text-[9px] opacity-80 font-mono"
      >
        {series[0]?.day ?? ''}
      </text>
      <text
        x={W / 2}
        y={H - 5}
        textAnchor="middle"
        className="fill-current text-[9px] opacity-80 font-mono"
      >
        {n >= 3 ? series[Math.floor(n / 2)]?.day : ''}
      </text>
      <text
        x={W - PAD_R}
        y={H - 5}
        textAnchor="end"
        className="fill-current text-[9px] opacity-80 font-mono"
      >
        {series[n - 1]?.day ?? ''}
      </text>
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
      className="mb-6 md:mb-8 rounded-xl border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg-soft dark:bg-gruv-d-bg-soft/80 overflow-hidden"
      aria-label={s.dashboardSectionTitle ?? 'Fleet overview'}
    >
      <div className="px-4 py-3 sm:px-5 border-b border-gruv-l-border dark:border-gruv-d-border">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gruv-l-muted dark:text-gruv-d-muted">
          {s.dashboardSectionTitle ?? 'Fleet overview'}
        </h2>
      </div>

      <div className="p-4 sm:p-5 space-y-6">
        <div>
          <div className="text-xs font-medium text-gruv-l-muted dark:text-gruv-d-muted mb-2">
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
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gruv-l-fg dark:text-gruv-d-fg">
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
          className={`grid grid-cols-1 gap-6 ${collect ? 'lg:grid-cols-2' : ''}`}
        >
          <div className="min-w-0">
            <div className="flex flex-row justify-between items-baseline text-xs mb-1 font-medium text-gruv-l-muted dark:text-gruv-d-muted">
              <span>
                {s.dashboardFleetFailsTitle ?? 'Failed checks per day (fleet)'}
              </span>
              <span className="font-mono tabular-nums text-[10px] opacity-80">
                Σ {failSeries.reduce((a, p) => a + p.totalFails, 0)}{' '}
                {s.dashboardFleetFailsTotalHint ?? 'in window'}
              </span>
            </div>
            <div className="rounded-lg border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-surface-2 dark:bg-gruv-d-surface-2 overflow-hidden">
              <FleetFailsBars series={failSeries} />
            </div>
          </div>

          {collect && (
            <div className="min-w-0">
              <div className="text-xs mb-1 font-medium text-gruv-l-muted dark:text-gruv-d-muted">
                {s.dashboardFleetLatencyTitle ??
                  'Mean response time (monitors with data)'}
              </div>
              <div className="rounded-lg border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-surface-2 dark:bg-gruv-d-surface-2 overflow-hidden">
                <FleetLatencyLine series={latencySeries} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
