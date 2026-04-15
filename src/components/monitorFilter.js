import { useState } from 'react'

const searchIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    className="h-7 mx-auto text-gruv-l-border dark:text-gruv-d-muted pointer-events-none"
    fill="currentColor"
  >
    <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
      clipRule="evenodd"
    />
  </svg>
)

export default function MonitorFilter({ active, callback }) {
  const [input, setInput] = useState('')

  const handleInput = (event) => {
    // ignore focus trigger
    if (event.target.value === '/') {
      return
    }
    setInput(event.target.value)
    callback(event.target.value)
  }

  const handleKeyDown = (event) => {
    // blur input field on escape
    if (event.key === 'Escape') {
      event.target.blur()
    }
  }

  return (
    <div className="relative w-full">
      <input
        className="block w-full py-2 pl-3 pr-10 border border-gruv-l-border dark:border-gruv-d-border bg-gruv-l-bg dark:bg-gruv-d-bg-soft rounded-full shadow-sm text-gruv-l-fg dark:text-gruv-d-fg placeholder-gruv-l-muted dark:placeholder-gruv-d-muted focus:outline-none focus:ring-2 focus:ring-gruv-accent-blue focus:ring-opacity-40 focus:border-gruv-accent-blue sm:text-sm transition-shadow font-mono text-sm"
        type="text"
        value={input}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Tap '/' to search"
        tabIndex={0}
        ref={(e) => e && active && e.focus()}
      />
      <div className="absolute inset-y-1 right-1 flex z-1 items-center">
        {searchIcon}
      </div>
    </div>
  )
}
