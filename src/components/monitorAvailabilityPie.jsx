import config from '../generated/config.json'
import { computeDayBuckets } from '../functions/monitorSeries'
import MonitorDetailsLatencyMini from './monitorDetailsLatencyMini'

/** Gruvbox bright palette (matches tailwind theme.extend) */
const COLORS = {
  good: '#b8bb26',
  bad: '#fb4934',
  empty: '#bdae93',
}

function donutStyle(buckets) {
  const { good, bad, noData, eligible } = buckets
  if (eligible === 0) {
    return { background: `conic-gradient(${COLORS.empty} 0deg 360deg)` }
  }
  const g = (good / eligible) * 360
  const b = (bad / eligible) * 360
  const n = (noData / eligible) * 360
  let start = 0
  const parts = []
  if (g > 0) {
    parts.push(`${COLORS.good} ${start}deg ${start + g}deg`)
    start += g
  }
  if (b > 0) {
    parts.push(`${COLORS.bad} ${start}deg ${start + b}deg`)
    start += b
  }
  if (n > 0) {
    parts.push(`${COLORS.empty} ${start}deg ${start + n}deg`)
  }
  return { background: `conic-gradient(${parts.join(', ')})` }
}

export default function MonitorAvailabilityPie({ kvMonitor }) {
  const days = config.settings.daysInHistogram
  const buckets = computeDayBuckets(kvMonitor, days)
  const style = donutStyle(buckets)

  const s = config.settings
  const labelGood = s.pieGoodDaysLabel ?? 'All clear'
  const labelBad = s.pieBadDaysLabel ?? 'With incidents'
  const labelNone = s.pieNoDataDaysLabel ?? 'No data'

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8 min-w-0">
        <div className="flex flex-row items-center gap-4 flex-wrap shrink-0 min-w-0">
          <div className="relative h-28 w-28 shrink-0">
            <div
              className="absolute inset-0 rounded-full shadow-inner"
              style={style}
            />
            <div className="absolute inset-[14%] rounded-full bg-gruv-l-bg dark:bg-gruv-d-bg border border-gruv-l-border dark:border-gruv-d-border" />
          </div>
          <ul className="text-xs text-gruv-l-fg dark:text-gruv-d-fg space-y-1 min-w-[10rem]">
            <li className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS.good }}
              />
              <span>
                {labelGood}: <strong className="tabular-nums">{buckets.good}</strong>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS.bad }}
              />
              <span>
                {labelBad}: <strong className="tabular-nums">{buckets.bad}</strong>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS.empty }}
              />
              <span>
                {labelNone}: <strong className="tabular-nums">{buckets.noData}</strong>
              </span>
            </li>
            {buckets.eligible > 0 && (
              <li className="text-gruv-l-muted dark:text-gruv-d-muted pt-1">
                {s.pieWindowHint ?? 'Days in chart window (after monitoring started)'}
              </li>
            )}
          </ul>
        </div>
        <MonitorDetailsLatencyMini kvMonitor={kvMonitor} />
      </div>

      {buckets.eligible > 0 && (
        <div>
          <div className="text-xs text-gruv-l-muted dark:text-gruv-d-muted mb-1">
            {s.pieStackBarLabel ?? 'Day mix (same window)'}
          </div>
          <div
            className="w-full max-w-md h-3 rounded overflow-hidden flex border border-gruv-l-border dark:border-gruv-d-border"
            title={`${buckets.good} / ${buckets.bad} / ${buckets.noData}`}
          >
            <div
              className="h-full bg-gruv-accent-green"
              style={{ width: `${(buckets.good / buckets.eligible) * 100}%` }}
            />
            <div
              className="h-full bg-gruv-accent-red"
              style={{ width: `${(buckets.bad / buckets.eligible) * 100}%` }}
            />
            <div
              className="h-full bg-gruv-l-border dark:bg-gruv-d-muted opacity-80"
              style={{ width: `${(buckets.noData / buckets.eligible) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
