import { useEffect, useState } from 'react'
import config from '../generated/config.json'
import MonitorAvailabilityPie from './monitorAvailabilityPie'

function formatTimestamp(ms) {
  if (ms == null || typeof ms !== 'number' || Number.isNaN(ms)) {
    return null
  }
  try {
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return null
  }
}

function formatRelative(ms) {
  if (ms == null || typeof ms !== 'number' || Number.isNaN(ms)) {
    return null
  }
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 45) {
    return 'just now'
  }
  const min = Math.floor(sec / 60)
  if (min < 60) {
    return `${min}m ago`
  }
  const h = Math.floor(min / 60)
  if (h < 48) {
    return `${h}h ago`
  }
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function LogRow({ label, absolute, relative }) {
  const hasAbs = absolute != null
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 text-xs py-1.5 border-b border-gruv-l-border dark:border-gruv-d-border last:border-0">
      <span className="text-gruv-l-muted dark:text-gruv-d-muted shrink-0 w-40">
        {label}
      </span>
      <span className="text-gruv-l-fg dark:text-gruv-d-fg font-mono tabular-nums">
        {hasAbs ? absolute : '—'}
        {hasAbs && relative && (
          <span className="text-gruv-l-muted dark:text-gruv-d-muted font-sans ml-2">
            ({relative})
          </span>
        )}
      </span>
    </div>
  )
}

export default function MonitorDetailsPanel({ kvMonitor }) {
  const s = config.settings
  const title = s.monitorDetailsTitle ?? 'Details & history'
  const last = kvMonitor?.lastCheck
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const checkedAt = last?.checkedAt
  const upAt = last?.lastSeenUpAt
  const downAt = last?.lastSeenDownAt

  const relChecked =
    typeof window !== 'undefined' && checkedAt
      ? formatRelative(checkedAt)
      : null
  const relUp =
    typeof window !== 'undefined' && upAt ? formatRelative(upAt) : null
  const relDown =
    typeof window !== 'undefined' && downAt ? formatRelative(downAt) : null

  const statusLine =
    last &&
    typeof last.operational === 'boolean' &&
    typeof last.status === 'number'
      ? `${last.operational ? (s.monitorLabelOperational ?? 'Operational') : (s.monitorLabelNotOperational ?? 'Down')} · HTTP ${last.status}${last.statusText ? ` ${last.statusText}` : ''}${typeof last.responseTimeMs === 'number' ? ` · ${last.responseTimeMs} ms` : ''}${last.degraded ? ` · ${s.monitorLabelDegraded ?? 'Degraded'}` : ''}`
      : null

  return (
    <details className="monitor-details mt-4 pt-3 border-t border-gruv-l-border dark:border-gruv-d-border">
      <summary className="cursor-pointer list-none flex items-center gap-2 text-sm text-gruv-l-muted dark:text-gruv-d-muted hover:text-gruv-l-fg dark:hover:text-gruv-d-fg select-none transition-colors">
        <svg
          className="monitor-details-chevron h-4 w-4 shrink-0 transition-transform text-gruv-accent-blue-dim dark:text-gruv-accent-blue"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>{title}</span>
      </summary>

      <div className="mt-3 space-y-4 min-w-0 overflow-x-hidden" data-relative-tick={tick}>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-gruv-l-muted dark:text-gruv-d-muted mb-2">
            {s.monitorDetailsPieSection ?? 'Days in the bar chart window'}
          </div>
          <MonitorAvailabilityPie kvMonitor={kvMonitor} />
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gruv-l-muted dark:text-gruv-d-muted mb-1">
            {s.monitorDetailsLogSection ?? 'Recent checks'}
          </div>
          <div className="rounded-lg bg-gruv-l-bg-soft dark:bg-gruv-d-bg-soft border border-gruv-l-border dark:border-gruv-d-border px-3 py-2">
            {statusLine && (
              <p className="text-xs text-gruv-l-fg dark:text-gruv-d-fg mb-2 pb-2 border-b border-gruv-l-border dark:border-gruv-d-border">
                {statusLine}
              </p>
            )}
            <LogRow
              label={s.logLastCheckAtLabel ?? 'Last probe'}
              absolute={formatTimestamp(checkedAt)}
              relative={relChecked}
            />
            <LogRow
              label={s.logLastSeenUpLabel ?? 'Last time up'}
              absolute={formatTimestamp(upAt)}
              relative={relUp}
            />
            <LogRow
              label={s.logLastSeenDownLabel ?? 'Last time down'}
              absolute={formatTimestamp(downAt)}
              relative={relDown}
            />
          </div>
        </div>
      </div>
    </details>
  )
}
