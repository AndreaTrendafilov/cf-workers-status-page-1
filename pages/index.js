import { Store } from 'laco'
import { useStore } from 'laco-react'
import Head from 'flareact/head'

import { getKVMonitors, useKeyPress } from '../src/functions/helpers'
import { groupMonitorsForDisplay } from '../src/functions/groupMonitors'
import config from '../config.yaml'
import MonitorCard from '../src/components/monitorCard'
import MonitorFilter from '../src/components/monitorFilter'
import MonitorStatusHeader from '../src/components/monitorStatusHeader'
import ThemeSwitcher from '../src/components/themeSwitcher'

const MonitorStore = new Store({
  monitors: config.monitors,
  visible: config.monitors,
})

const filterByTerm = (term) =>
  MonitorStore.set((state) => ({
    visible: state.monitors.filter((monitor) =>
      monitor.name.toLowerCase().includes(term),
    ),
  }))

export async function getEdgeProps() {
  // get KV data
  const kvMonitors = await getKVMonitors()

  return {
    props: {
      config,
      kvMonitors: kvMonitors ? kvMonitors.monitors : {},
      kvMonitorsLastUpdate: kvMonitors ? kvMonitors.lastUpdate : {},
    },
    // Revalidate these props once every x seconds
    revalidate: 5,
  }
}

export default function Index({ config, kvMonitors, kvMonitorsLastUpdate }) {
  const state = useStore(MonitorStore)
  const slash = useKeyPress('/')

  return (
    <div className="min-h-screen selection:bg-gruv-accent-yellow selection:text-gruv-l-fg dark:selection:bg-gruv-accent-yellow dark:selection:text-gruv-d-bg">
      <Head>
        <title>{config.settings.title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Source+Sans+3:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="./style.css" />
        <script>
          {`
          function setTheme(theme) {
            document.documentElement.classList.remove("dark", "light")
            document.documentElement.classList.add(theme)
            localStorage.theme = theme
          }
          (() => {
            const query = window.matchMedia("(prefers-color-scheme: dark)")
            query.addListener(() => {
              setTheme(query.matches ? "dark" : "light")
            })
            if (["dark", "light"].includes(localStorage.theme)) {
              setTheme(localStorage.theme)
            } else {
              setTheme(query.matches ? "dark" : "light")
            }
          })()
          `}
        </script>
      </Head>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <header className="flex flex-row flex-wrap gap-4 justify-between items-center py-6 sm:py-8 border-b border-gruv-l-border dark:border-gruv-d-border">
          <div className="flex flex-row items-center gap-4 min-w-0">
            <img
              className="h-9 w-auto rounded-lg ring-1 ring-gruv-l-border dark:ring-gruv-d-border"
              alt=""
              src={config.settings.logo}
            />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gruv-l-fg dark:text-gruv-d-fg">
              {config.settings.title}
            </h1>
          </div>
          <div className="flex flex-row items-center shrink-0 gap-1">
            {typeof window !== 'undefined' && <ThemeSwitcher />}
            <MonitorFilter active={slash} callback={filterByTerm} />
          </div>
        </header>
        <MonitorStatusHeader kvMonitorsLastUpdate={kvMonitorsLastUpdate} />
        {groupMonitorsForDisplay(
          state.visible,
          config.settings.defaultMonitorGroup,
        ).map(({ name, monitors }) => (
          <section key={name} className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gruv-l-muted dark:text-gruv-d-muted mb-3 px-1">
              {name}
            </h2>
            {monitors.map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                data={kvMonitors[monitor.id]}
              />
            ))}
          </section>
        ))}
        <footer className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-10 pt-6 border-t border-gruv-l-border dark:border-gruv-d-border text-sm text-gruv-l-muted dark:text-gruv-d-muted">
          <div>
            Powered by{' '}
            <a href="https://workers.cloudflare.com/" target="_blank">
              Cloudflare Workers{' '}
            </a>
            &{' '}
            <a href="https://flareact.com/" target="_blank">
              Flareact{' '}
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
