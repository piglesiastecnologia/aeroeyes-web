import type { ApiStatus } from '../../api/monitoringApi'
import type { SessionDisplayStatus } from '../../hooks/useMonitoringSession'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AppHeader.css'

type AppHeaderProps = {
  apiStatus: ApiStatus
  sessionStatus: SessionDisplayStatus
}

const apiStatusVariants = {
  UNKNOWN: 'neutral',
  CHECKING: 'neutral',
  ONLINE: 'normal',
  OFFLINE: 'critical',
} as const satisfies Record<ApiStatus, 'neutral' | 'normal' | 'critical'>

const sessionStatusVariants = {
  UNKNOWN: 'neutral',
  NONE: 'neutral',
  ACTIVE: 'normal',
  COMPLETED: 'neutral',
} as const satisfies Record<SessionDisplayStatus, 'neutral' | 'normal'>

export function AppHeader({ apiStatus, sessionStatus }: AppHeaderProps) {
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
        <div>
          <dt>API</dt>
          <dd aria-live="polite" aria-atomic="true">
            <StatusBadge label={apiStatus} variant={apiStatusVariants[apiStatus]} />
          </dd>
        </div>
        <div>
          <dt>Session</dt>
          <dd aria-live="polite" aria-atomic="true">
            <StatusBadge label={sessionStatus} variant={sessionStatusVariants[sessionStatus]} />
          </dd>
        </div>
      </dl>
    </header>
  )
}
