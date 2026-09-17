import type {
  ApiStatus,
  MonitoringSessionResponse,
} from '../../api/monitoringApi'
import type {
  MonitoringSessionOperation,
  SessionDisplayStatus,
} from '../../hooks/useMonitoringSession'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './MonitoringSession.css'

type MonitoringSessionProps = {
  apiStatus: ApiStatus
  session: MonitoringSessionResponse | null
  sessionStatus: SessionDisplayStatus
  operation: MonitoringSessionOperation
  error: string | null
  isSessionStateResolved: boolean
  onStart: () => void
  onComplete: () => void
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatUtcTimestamp(value: string): string {
  const timestamp = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')

  return `${pad(timestamp.getUTCDate())} ${monthNames[timestamp.getUTCMonth()]} ${timestamp.getUTCFullYear()} · ${pad(timestamp.getUTCHours())}:${pad(timestamp.getUTCMinutes())}:${pad(timestamp.getUTCSeconds())} UTC`
}

const sessionStatusVariants = {
  UNKNOWN: 'neutral',
  NONE: 'neutral',
  ACTIVE: 'normal',
  COMPLETED: 'neutral',
} as const satisfies Record<SessionDisplayStatus, 'normal' | 'neutral'>

export function MonitoringSession({
  apiStatus,
  session,
  sessionStatus,
  operation,
  error,
  isSessionStateResolved,
  onStart,
  onComplete,
}: MonitoringSessionProps) {
  const isOnline = apiStatus === 'ONLINE'
  const isIdle = operation === 'IDLE'
  const actionLabel = operation === 'STARTING'
    ? 'Starting...'
    : operation === 'COMPLETING'
      ? 'Completing...'
      : session?.status === 'ACTIVE'
        ? 'Complete monitoring'
        : session?.status === 'COMPLETED'
          ? 'Start new session'
          : operation === 'RESTORING' && isOnline
            ? 'Restoring...'
            : 'Start monitoring'
  const actionDisabled = !isOnline || !isIdle || !isSessionStateResolved
  const actionNote = !isOnline
    ? 'Monitoring API unavailable'
    : operation === 'RESTORING'
      ? 'Restoring saved session'
      : !isSessionStateResolved
        ? 'Session state could not be restored'
        : session?.status === 'ACTIVE'
          ? 'Completes the current session'
          : session?.status === 'COMPLETED'
            ? 'Creates a new monitoring session'
            : 'Creates a monitoring session'

  return (
    <section className="panel monitoring-session" aria-labelledby="session-title">
      <div className="panel__header">
        <h2 id="session-title" className="panel__title">Monitoring session</h2>
        <StatusBadge
          label={sessionStatus}
          variant={sessionStatusVariants[sessionStatus]}
        />
      </div>
      <div className="monitoring-session__content">
        <div className="monitoring-session__summary" aria-live="polite" aria-atomic="true">
          <p className="panel__message">
            {sessionStatus === 'UNKNOWN'
              ? 'Monitoring session state unavailable'
              : session?.status === 'ACTIVE'
                ? 'Monitoring session active'
                : session?.status === 'COMPLETED'
                  ? 'Monitoring session completed'
                  : 'No active session'}
          </p>
          {session ? (
            <dl className="monitoring-session__metadata">
              <div>
                <dt>Session ID</dt>
                <dd className="monitoring-session__id">{session.session_id}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>{formatUtcTimestamp(session.started_at)}</dd>
              </div>
              {session.ended_at !== null && (
                <div>
                  <dt>Ended</dt>
                  <dd>{formatUtcTimestamp(session.ended_at)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="panel__description">
              {sessionStatus === 'UNKNOWN'
                ? 'Saved session state could not be confirmed.'
                : 'Attention monitoring is on standby.'}
            </p>
          )}
          {error && <p className="monitoring-session__error">{error}</p>}
        </div>
        <div className="monitoring-session__action">
          <button
            className="console-button"
            type="button"
            disabled={actionDisabled}
            aria-describedby="session-action-note"
            onClick={session?.status === 'ACTIVE' ? onComplete : onStart}
          >
            {actionLabel}
          </button>
          <p id="session-action-note" className="action-note">{actionNote}</p>
        </div>
      </div>
    </section>
  )
}
