import config from '../../config.yaml'

const classes = {
  gray:
    'bg-gruv-l-surface-2 dark:bg-gruv-d-surface-2 text-gruv-l-muted dark:text-gruv-d-muted',
  green:
    'bg-gruv-accent-green bg-opacity-20 dark:bg-opacity-25 text-gruv-l-fg dark:text-gruv-accent-green border border-gruv-accent-green border-opacity-35',
  orange:
    'bg-gruv-accent-orange bg-opacity-20 dark:bg-opacity-25 text-gruv-l-fg dark:text-gruv-accent-orange border border-gruv-accent-orange border-opacity-35',
  yellow:
    'bg-gruv-accent-yellow bg-opacity-20 dark:bg-opacity-20 text-gruv-l-fg dark:text-gruv-accent-yellow border border-gruv-accent-yellow border-opacity-40',
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
