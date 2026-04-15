import { useRef } from 'react'
import { Store } from 'laco'
import { useStore } from 'laco-react'

import { useKeyPress } from '../functions/helpers'
import { groupMonitorsForDisplay } from '../functions/groupMonitors'
import MonitorCard from './monitorCard'
import MonitorFilter from './monitorFilter'
import DashboardOverviewCharts from './dashboardOverviewCharts'
import MonitorStatusHeader from './monitorStatusHeader'
import ThemeSwitcher from './themeSwitcher'

export default function StatusPage({
  config,
  kvMonitors,
  kvMonitorsLastUpdate,
}) {
  const storeRef = useRef(null)
  if (!storeRef.current) {
    storeRef.current = new Store({
      monitors: config.monitors,
      visible: config.monitors,
    })
  }
  const MonitorStore = storeRef.current

  const filterByTerm = (term) =>
    MonitorStore.set((state) => ({
      visible: state.monitors.filter((monitor) =>
        monitor.name.toLowerCase().includes(term),
      ),
    }))

  const state = useStore(MonitorStore)
  const slash = useKeyPress('/')

  return (
    <div className="min-h-screen selection:bg-gruv-accent-yellow selection:text-gruv-l-fg dark:selection:bg-gruv-accent-yellow dark:selection:text-gruv-d-bg">
      <div className="w-full max-w-[min(100%,105rem)] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 pb-16">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8 py-6 sm:py-8 lg:py-10 border-b border-gruv-l-border dark:border-gruv-d-border">
          <div className="flex flex-row items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <img
              className="h-9 sm:h-10 w-auto rounded-lg ring-1 ring-gruv-l-border dark:ring-gruv-d-border shrink-0"
              alt=""
              src={config.settings.logo}
            />
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gruv-l-fg dark:text-gruv-d-fg truncate">
              {config.settings.title}
            </h1>
          </div>
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto lg:max-w-none lg:shrink-0">
            <ThemeSwitcher />
            <div className="min-w-0 flex-1 sm:flex-initial sm:w-72 md:w-80 lg:w-96 xl:w-[28rem]">
              <MonitorFilter active={slash} callback={filterByTerm} />
            </div>
          </div>
        </header>
        <MonitorStatusHeader
          kvMonitorsLastUpdate={kvMonitorsLastUpdate}
          monitors={state.visible}
          kvMonitors={kvMonitors}
        />
        <DashboardOverviewCharts
          monitors={state.visible}
          kvMonitors={kvMonitors}
        />
        {groupMonitorsForDisplay(
          state.visible,
          config.settings.defaultMonitorGroup,
        ).map(({ name, monitors }) => (
          <section key={name} className="mb-8 md:mb-10">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gruv-l-muted dark:text-gruv-d-muted mb-3 md:mb-4 px-0.5">
              {name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 xl:gap-6 [align-items:stretch]">
              {monitors.map((monitor) => (
                <MonitorCard
                  key={monitor.id}
                  monitor={monitor}
                  data={kvMonitors[monitor.id]}
                />
              ))}
            </div>
          </section>
        ))}
        <footer className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-gruv-l-border dark:border-gruv-d-border text-sm text-gruv-l-muted dark:text-gruv-d-muted">
          <div>
            Powered by{' '}
            <a href="https://workers.cloudflare.com/" target="_blank">
              Cloudflare Workers{' '}
            </a>
            &{' '}
            <a href="https://astro.build/" target="_blank">
              Astro{' '}
            </a>
          </div>
          <div>
            <a
              href="https://github.com/eidam/cf-workers-status-page"
              target="_blank"
            >
              Get Your Status Page
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
