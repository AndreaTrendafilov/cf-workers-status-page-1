import config from '../../config.yaml'
import { computeUptimeStats } from '../functions/monitorSeries'

const s = config.settings

export default function MonitorStatsRow({ kvMonitor }) {
  const days = s.daysInHistogram
  const stats = computeUptimeStats(kvMonitor, days)

  const last = kvMonitor?.lastCheck
  const hasLast =
    last &&
    typeof last.status === 'number' &&
    typeof last.operational === 'boolean'

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 dark:text-gray-300 mb-3 border-b border-gray-100 dark:border-gray-600 pb-3">
      <div>
        <span className="text-gray-400 dark:text-gray-500 mr-1">
          {s.graphUptimeLabel ?? 'Uptime'}
        </span>
        {stats.uptimePercent != null ? (
          <span className="font-semibold text-gray-800 dark:text-gray-100">
            {stats.uptimePercent}%
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
        {stats.daysWithData > 0 && (
          <span className="text-gray-400 dark:text-gray-500 ml-1">
            ({stats.daysWithData} {s.graphDaysSampledLabel ?? 'days with data'})
          </span>
        )}
      </div>

      <div>
        <span className="text-gray-400 dark:text-gray-500 mr-1">
          {s.graphIncidentsLabel ?? 'Days with failures'}
        </span>
        <span className="font-semibold tabular-nums">
          {stats.incidentDays}
        </span>
        {stats.totalFails > 0 && (
          <span className="text-gray-400 dark:text-gray-500 ml-1">
            ({stats.totalFails} {s.graphFailedChecksLabel ?? 'failed checks'})
          </span>
        )}
      </div>

      <div>
        <span className="text-gray-400 dark:text-gray-500 mr-1">
          {s.graphLastCheckLabel ?? 'Last check'}
        </span>
        {hasLast ? (
          <>
            <span className="font-mono tabular-nums">HTTP {last.status}</span>
            {typeof last.responseTimeMs === 'number' && (
              <span className="ml-2">{last.responseTimeMs} ms</span>
            )}
            {last.degraded && (
              <span className="ml-2 text-orange-600 dark:text-orange-400">
                ({s.graphSlowResponseHint ?? 'above threshold'})
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </div>
    </div>
  )
}
