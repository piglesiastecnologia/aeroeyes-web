import type { AttentionEventResponse, AttentionState } from '../../api/monitoringApi'
import type { AttentionEventsStatus } from '../../hooks/useSessionAttentionEvents'
import type { SessionDisplayStatus } from '../../hooks/useMonitoringSession'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AttentionEvents.css'

type AttentionEventsProps = {
  sessionStatus: SessionDisplayStatus
  status: AttentionEventsStatus
  events: AttentionEventResponse[]
  error: string | null
}

type BadgeVariant = 'neutral' | 'normal' | 'attention' | 'critical'

const eventVariants: Record<AttentionState, BadgeVariant> = {
  NORMAL: 'normal',
  ATTENTION: 'attention',
  CRITICAL: 'critical',
  NO_FACE: 'attention',
}

function formatUtcDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(value))
}

function formatEyeState(value: AttentionEventResponse['eye_state']): string {
  return value?.replaceAll('_', ' ') ?? 'NOT REPORTED'
}

function getEmptyMessage(
  sessionStatus: SessionDisplayStatus,
  status: AttentionEventsStatus,
): { title: string; description: string } {
  if (sessionStatus === 'UNKNOWN') {
    return {
      title: 'Event history unavailable',
      description: 'Waiting for the monitoring session state to be confirmed.',
    }
  }

  if (sessionStatus === 'NONE') {
    return {
      title: 'No active monitoring session',
      description: 'Recent attention events will appear after a session starts.',
    }
  }

  if (status === 'UNAVAILABLE') {
    return {
      title: 'Recent events unavailable',
      description: 'No event history is inferred while the API response is unavailable.',
    }
  }

  if (status === 'NO_DATA') {
    return {
      title: 'No attention events recorded',
      description: 'The active session is ready to receive its first semantic transition.',
    }
  }

  return {
    title: 'Loading recent events',
    description: 'Checking the current session event history.',
  }
}

export function AttentionEvents({
  sessionStatus,
  status,
  events,
  error,
}: AttentionEventsProps) {
  const hasEvents = events.length > 0
  const badgeLabel = status === 'AVAILABLE'
    ? `${events.length} EVENT${events.length === 1 ? '' : 'S'}`
    : status === 'UNAVAILABLE' && hasEvents
      ? 'LAST KNOWN'
      : status === 'NO_DATA'
        ? 'EMPTY'
        : sessionStatus === 'NONE'
          ? 'STANDBY'
          : status
  const emptyMessage = getEmptyMessage(sessionStatus, status)

  return (
    <section className="panel attention-events" aria-labelledby="attention-events-title">
      <div className="panel__header">
        <h2 id="attention-events-title" className="panel__title">Recent attention events</h2>
        <StatusBadge label={badgeLabel} variant="neutral" />
      </div>

      {hasEvents ? (
        <ol className="attention-events__list" aria-live="polite">
          {events.map((event) => (
            <li className={`attention-events__item attention-events__item--${event.state.toLowerCase()}`} key={event.event_id}>
              <div className="attention-events__primary">
                <StatusBadge label={event.state.replaceAll('_', ' ')} variant={eventVariants[event.state]} />
                <time dateTime={event.occurred_at}>{formatUtcDateTime(event.occurred_at)}</time>
              </div>
              <dl className="attention-events__details">
                <div>
                  <dt>Severity</dt>
                  <dd>{event.severity}</dd>
                </div>
                <div>
                  <dt>Eye state</dt>
                  <dd>{formatEyeState(event.eye_state)}</dd>
                </div>
                <div>
                  <dt>Face</dt>
                  <dd>{event.face_detected ? 'DETECTED' : 'NOT DETECTED'}</dd>
                </div>
                <div>
                  <dt>Closed</dt>
                  <dd>{event.closed_duration_ms === null ? '—' : `${event.closed_duration_ms} ms`}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      ) : (
        <div className="attention-events__empty" aria-live="polite">
          <p className="panel__message">{emptyMessage.title}</p>
          <p className="panel__description">{emptyMessage.description}</p>
        </div>
      )}

      {error !== null && <p className="attention-events__error" role="status">{error}</p>}
      {status === 'UNAVAILABLE' && hasEvents && (
        <p className="attention-events__footnote">Showing the last event list confirmed by the Monitoring API.</p>
      )}
    </section>
  )
}
