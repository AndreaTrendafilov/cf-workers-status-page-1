import config from '../../config.yaml'

const classes = {
  gray: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  green: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200',
  orange:
    'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100',
  yellow:
    'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
}

export default function MonitorStatusLabel({ kvMonitor }) {
  let color = 'gray'
  let text = 'No data'

  if (kvMonitor?.lastCheck && typeof kvMonitor.lastCheck.operational === 'boolean') {
    if (kvMonitor.lastCheck.operational) {
      if (kvMonitor.lastCheck.degraded) {
        color = 'orange'
        text = config.settings.monitorLabelDegraded ?? 'Degraded'
      } else {
        color = 'green'
        text = config.settings.monitorLabelOperational
      }
    } else {
      color = 'yellow'
      text = config.settings.monitorLabelNotOperational
    }
  }

  return <div className={`pill leading-5 ${classes[color]}`}>{text}</div>
}
