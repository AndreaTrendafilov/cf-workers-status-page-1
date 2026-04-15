import config from '../../config.yaml'
import { buildHistogramDateRange } from '../functions/monitorSeries'
import MonitorDayAverage from './monitorDayAverage'

export default function MonitorHistogram({ monitorId, kvMonitor }) {
  const days = buildHistogramDateRange(config.settings.daysInHistogram)

  let content = null

  if (typeof window !== 'undefined') {
    content = days.map((dayInHistogram, key) => {
      let bg = ''
      let dayInHistogramLabel = config.settings.dayInHistogramNoData

      if (kvMonitor && kvMonitor.firstCheck <= dayInHistogram) {
        if (
          kvMonitor.checks.hasOwnProperty(dayInHistogram) &&
          kvMonitor.checks[dayInHistogram].fails > 0
        ) {
          bg = 'yellow'
          dayInHistogramLabel = `${kvMonitor.checks[dayInHistogram].fails} ${config.settings.dayInHistogramNotOperational}`
        } else {
          bg = 'green'
          dayInHistogramLabel = config.settings.dayInHistogramOperational
        }
      }

      return (
        <div key={key} className="hitbox tooltip">
          <div className={`${bg} bar`} />
          <div className="content text-center py-1 px-2 mt-2 left-1/2 -ml-20 w-40 text-xs">
            {dayInHistogram}
            <br />
            <span className="font-semibold text-sm">
              {dayInHistogramLabel}
            </span>
            {kvMonitor &&
              kvMonitor.checks.hasOwnProperty(dayInHistogram) &&
              Object.keys(kvMonitor.checks[dayInHistogram].res).map((locKey) => {
                return (
                  <MonitorDayAverage
                    key={locKey}
                    location={locKey}
                    avg={kvMonitor.checks[dayInHistogram].res[locKey].a}
                  />
                )
              })}
          </div>
        </div>
      )
    })
  }

  return (
    <div
      key={`${monitorId}-histogram`}
      className="flex flex-row items-center histogram"
    >
      {content}
    </div>
  )
}
