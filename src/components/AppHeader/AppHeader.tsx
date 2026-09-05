import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AppHeader.css'

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__identity">
        <span className="app-header__brand">
          <svg className="app-header__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M4 25 16 5l12 20M9 18h14M13 25h6" stroke="currentColor" strokeWidth="2" />
          </svg>
          AEROEYES
        </span>
        <div className="app-header__title">
          <h1>Monitoring Console</h1>
          <p>Electronic Flight Bag</p>
        </div>
      </div>
      <dl className="app-header__statuses">
        <div><dt>API</dt><dd><StatusBadge label="UNKNOWN" /></dd></div>
        <div><dt>Session</dt><dd><StatusBadge label="NONE" /></dd></div>
      </dl>
    </header>
  )
}
