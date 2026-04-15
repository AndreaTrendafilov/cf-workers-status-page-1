import config from '../../config.yaml'
import MonitorHistogram from './monitorHistogram'
import MonitorLatencySparkline from './monitorLatencySparkline'
import MonitorStatsRow from './monitorStatsRow'
import MonitorStatusLabel from './monitorStatusLabel'
import MonitorDetailsPanel from './monitorDetailsPanel'

const infoIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-5 mr-2 mx-auto text-gruv-accent-blue-dim dark:text-gruv-accent-blue shrink-0"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
)

export default function MonitorCard({ monitor, data }) {
  return (
    <div className="card h-full flex flex-col min-h-0">
      <div className="flex flex-row justify-between items-center mb-2">
        <div className="flex flex-row items-center align-center">
          {monitor.description && (
            <div className="tooltip">
              {infoIcon}
              <div className="content text-center transform -translate-y-1/2 top-1/2 ml-8 w-72 text-sm object-left">
                {monitor.description}
              </div>
            </div>
          )}
          {(monitor.linkable === true || monitor.linkable === undefined) ?
            (
              <a href={monitor.url} target="_blank">
                <div className="text-xl font-semibold tracking-tight">{monitor.name}</div>
              </a>
            )
            :
            (
              <span>
                <div className="text-xl font-semibold tracking-tight">{monitor.name}</div>
              </span>
            )
          }

        </div>
        <MonitorStatusLabel kvMonitor={data} />
      </div>

      <MonitorStatsRow kvMonitor={data} />

      <div className="text-xs font-medium text-gruv-l-muted dark:text-gruv-d-muted mb-1.5">
        {config.settings.graphSectionAvailability ?? 'Availability by day'}
      </div>
      <MonitorHistogram monitorId={monitor.id} kvMonitor={data} />

      <MonitorLatencySparkline monitorId={monitor.id} kvMonitor={data} />

      <div className="flex flex-row justify-between items-center text-gruv-l-muted dark:text-gruv-d-muted text-xs font-mono mt-3">
        <div>{config.settings.daysInHistogram} days ago</div>
        <div>Today</div>
      </div>

      <MonitorDetailsPanel kvMonitor={data} />
    </div>
  )
}
