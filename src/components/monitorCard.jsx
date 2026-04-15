import config from '../generated/config.json'
import MonitorFailureBars from './monitorFailureBars'
import MonitorHistogram from './monitorHistogram'
import MonitorLatencySparkline from './monitorLatencySparkline'
import MonitorStatsRow from './monitorStatsRow'
import MonitorStatusLabel from './monitorStatusLabel'
import MonitorDetailsPanel from './monitorDetailsPanel'

/** Globe — clearer than “info” for URL / website monitors (Heroicons 20 solid GlobeAlt). */
const monitorDescriptionHintIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-5 w-5 mr-2 shrink-0 text-gruv-accent-blue-dim dark:text-gruv-accent-blue"
    aria-hidden
  >
    <path d="M16.555 5.412a8.028 8.028 0 00-3.503-2.81 14.899 14.899 0 011.663 4.472 8.547 8.547 0 001.84-1.662zM13.326 7.825a13.43 13.43 0 00-2.413-5.773 8.087 8.087 0 00-1.826 0 13.43 13.43 0 00-2.413 5.773A8.473 8.473 0 0010 8.5c1.18 0 2.304-.24 3.326-.675zM6.514 9.376A9.98 9.98 0 0010 10c1.226 0 2.4-.22 3.486-.624a13.54 13.54 0 01-.351 3.759A13.54 13.54 0 0110 13.5c-1.079 0-2.128-.127-3.134-.366a13.538 13.538 0 01-.352-3.758zM5.285 7.074a14.9 14.9 0 011.663-4.471 8.028 8.028 0 00-3.503 2.81c.529.638 1.149 1.199 1.84 1.66zM17.334 6.798a7.973 7.973 0 01.614 4.115 13.47 13.47 0 01-3.178 1.72 15.093 15.093 0 00.174-3.939 10.043 10.043 0 002.39-1.896zM2.666 6.798a10.042 10.042 0 002.39 1.896 15.196 15.196 0 00.174 3.94 13.472 13.472 0 01-3.178-1.72 7.973 7.973 0 01.615-4.115zM10 15c.898 0 1.778-.079 2.633-.23a13.473 13.473 0 01-1.72 3.178 8.099 8.099 0 01-1.826 0 13.47 13.47 0 01-1.72-3.178c.855.151 1.735.23 2.633.23zM14.357 14.357a14.912 14.912 0 01-1.305 3.04 8.027 8.027 0 004.345-4.345c-.953.542-1.971.981-3.04 1.305zM6.948 17.397a8.027 8.027 0 01-4.345-4.345c.953.542 1.971.981 3.04 1.305a14.912 14.912 0 001.305 3.04z" />
  </svg>
)

export default function MonitorCard({ monitor, data }) {
  return (
    <div className="card h-full flex flex-col min-h-0">
      <div className="flex flex-row justify-between items-center mb-2">
        <div className="flex flex-row items-center align-center">
          {monitor.description && (
            <div className="tooltip">
              {monitorDescriptionHintIcon}
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

      <MonitorFailureBars monitorId={monitor.id} kvMonitor={data} />

      <MonitorLatencySparkline monitorId={monitor.id} kvMonitor={data} />

      <div className="flex flex-row justify-between items-center text-gruv-l-muted dark:text-gruv-d-muted text-xs font-mono mt-3">
        <div>{config.settings.daysInHistogram} days ago</div>
        <div>Today</div>
      </div>

      <MonitorDetailsPanel kvMonitor={data} />
    </div>
  )
}
