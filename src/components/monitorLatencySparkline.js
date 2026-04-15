import config from '../../config.yaml'
import {
  averageRecentLatencyMs,
  computeLatencySeries,
} from '../functions/monitorSeries'

export default function MonitorLatencySparkline({ monitorId, kvMonitor }) {
  const days = config.settings.daysInHistogram
  const collect = config.settings.collectResponseTimes
  const series = computeLatencySeries(kvMonitor, days)
  const recent7 = averageRecentLatencyMs(series, 7)

  let content = null
  if (typeof window !== 'undefined' && collect) {
    const values = series.map((p) => p.avgMs).filter((v) => v != null)
    const min = values.length ? Math.min(...values) : 0
    const max = values.length ? Math.max(...values) : 0
    const span = Math.max(max - min, 1)

    content = series.map(({ day, avgMs }, key) => {
      let heightPct = 0
      let barClass = 'lat-bar-inner bg-gray-300 dark:bg-gray-600'

      const fails = kvMonitor?.checks?.[day]?.fails
      if (avgMs != null) {
        const norm = (avgMs - min) / span
        heightPct = 12 + Math.round(norm * 88)
        if (typeof fails === 'number' && fails > 0) {
          barClass = 'lat-bar-inner bg-yellow-500 dark:bg-yellow-700'
        } else if (avgMs > min + span * 0.65) {
          barClass = 'lat-bar-inner bg-amber-400 dark:bg-amber-600'
        } else {
          barClass = 'lat-bar-inner bg-blue-400 dark:bg-blue-600'
        }
      }

      return (
        <div key={key} className="hitbox tooltip lat-hit flex-1 min-w-0 h-full flex flex-col justify-end">
          <div
            className={barClass}
            style={{ height: avgMs != null ? `${heightPct}%` : '4px' }}
          />
          <div className="content text-center py-1 px-2 mt-2 left-1/2 -ml-24 w-48 text-xs">
            {day}
            <br />
            <span className="font-semibold">
              {avgMs != null
                ? `${avgMs} ms avg`
                : config.settings.dayInHistogramNoData}
            </span>
            {kvMonitor &&
              kvMonitor.checks?.[day]?.fails > 0 && (
                <>
                  <br />
                  <span className="text-yellow-700 dark:text-yellow-300">
                    {kvMonitor.checks[day].fails}{' '}
                    {config.settings.graphLatencyFailHint ?? 'failed check(s)'}
                  </span>
                </>
              )}
          </div>
        </div>
      )
    })
  }

  if (!collect) {
    return null
  }

  return (
    <div className="mb-1 mt-3">
      <div className="flex flex-row justify-between items-center text-gray-400 text-xs mb-1">
        <span>
          {config.settings.graphSectionLatency ??
            config.settings.graphLatencyTitle ??
            'Response time'}
        </span>
        {recent7 != null && (
          <span>
            {config.settings.graphRecentLatencyLabel ?? 'Last 7d avg:'}{' '}
            <span className="font-semibold text-gray-600 dark:text-gray-300">
              {recent7} ms
            </span>
          </span>
        )}
      </div>
      <div
        key={`${monitorId}-latency`}
        className="flex flex-row items-end sparkline h-10 w-full mx-auto gap-px"
      >
        {content}
      </div>
    </div>
  )
}
