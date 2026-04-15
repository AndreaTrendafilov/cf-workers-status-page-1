import config from '../../config.yaml'
import { locations } from '../functions/locations'

const classes = {
  green:
    'bg-gruv-accent-aqua bg-opacity-20 dark:bg-opacity-25 text-gruv-l-fg dark:text-gruv-accent-aqua border border-gruv-accent-aqua border-opacity-35 dark:border-opacity-45',
  yellow:
    'bg-gruv-accent-yellow bg-opacity-20 dark:bg-opacity-20 text-gruv-l-fg dark:text-gruv-accent-yellow border border-gruv-accent-yellow border-opacity-40 dark:border-opacity-45',
}

export default function MonitorStatusHeader({ kvMonitorsLastUpdate }) {
  let color = 'green'
  let text = config.settings.allmonitorsOperational

  // Only `allOperational === false` means a monitor failed. `undefined` happens
  // before the first cron run or empty KV — do not treat that as an outage.
  if (kvMonitorsLastUpdate.allOperational === false) {
    color = 'yellow'
    text = config.settings.notAllmonitorsOperational
  }

  return (
    <div className={`card mb-6 font-semibold ${classes[color]}`}>
      <div className="flex flex-row justify-between items-center">
        <div>{text}</div>
        {kvMonitorsLastUpdate.time && typeof window !== 'undefined' && (
          <div className="text-xs font-normal text-gruv-l-muted dark:text-gruv-d-muted font-mono">
            checked{' '}
            {Math.round((Date.now() - kvMonitorsLastUpdate.time) / 1000)} sec
            ago (from{' '}
            {locations[kvMonitorsLastUpdate.loc] || kvMonitorsLastUpdate.loc})
          </div>
        )}
      </div>
    </div>
  )
}
