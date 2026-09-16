import type { AttentionEventResponse, AttentionState } from '../../api/monitoringApi'
import type { SessionDisplayStatus } from '../../hooks/useMonitoringSession'
import type { AttentionTelemetryStatus } from '../../hooks/useSessionAttentionState'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AttentionStatus.css'

type AttentionStatusProps = {
  sessionStatus: SessionDisplayStatus
  attentionStatus: AttentionTelemetryStatus
  latestEvent: AttentionEventResponse | null
  error: string | null
}

type BadgeVariant = 'neutral' | 'normal' | 'attention' | 'critical'

type AttentionView = {
  badge: string
  badgeVariant: BadgeVariant
  colorVariant: 'neutral' | 'normal' | 'attention' | 'critical'
  state: string
  eyebrow: string
  message: string
  description: string
  telemetry: string
  footnote: string
}

const stateCopy: Record<AttentionState, {
  message: string
  description: string
  variant: BadgeVariant
}> = {
  NORMAL: {
    message: 'Attention indicators are within configured limits.',
    description: 'The latest state reported by the Attention Core is normal.',
    variant: 'normal',
  },
  ATTENTION: {
    message: 'Attention degradation detected.',
    description: 'The latest state reported by the Attention Core requires awareness.',
    variant: 'attention',
  },
  CRITICAL: {
    message: 'Critical attention condition detected.',
    description: 'The latest state reported by the Attention Core requires immediate awareness.',
    variant: 'critical',
  },
  NO_FACE: {
    message: 'Face tracking is unavailable.',
    description: 'The latest event indicates that the operator face was not detected.',
    variant: 'attention',
  },
}

function formatUtcDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

function getEventView(
  event: AttentionEventResponse,
  attentionStatus: AttentionTelemetryStatus,
  sessionStatus: SessionDisplayStatus,
): AttentionView {
  const copy = stateCopy[event.state]
  const isUnavailable = attentionStatus === 'UNAVAILABLE'
  const isCompleted = sessionStatus === 'COMPLETED'

  return {
    badge: isCompleted ? 'COMPLETED' : isUnavailable ? 'LAST KNOWN' : event.severity,
    badgeVariant: isUnavailable || isCompleted ? 'neutral' : copy.variant,
    colorVariant: copy.variant,
    state: event.state.replaceAll('_', ' '),
    eyebrow: isCompleted
      ? 'Final recorded attention state'
      : isUnavailable
        ? 'Last known attention state'
        : 'Latest attention state',
    message: copy.message,
    description: isUnavailable
      ? 'New telemetry is currently unavailable. This value is retained from the last valid response.'
      : isCompleted
        ? 'This is the final event recorded before the monitoring session was completed.'
        : copy.description,
    telemetry: isUnavailable ? 'UNAVAILABLE' : 'RECEIVED',
    footnote: isCompleted
      ? 'Session completed — this state is historical, not live'
      : isUnavailable
        ? 'Showing last known event; current Core availability is not inferred'
        : 'Event-driven telemetry — timestamp indicates the last state change',
  }
}

function getEmptyView(
  sessionStatus: SessionDisplayStatus,
  attentionStatus: AttentionTelemetryStatus,
): AttentionView {
  if (sessionStatus === 'UNKNOWN') {
    return {
      badge: 'UNAVAILABLE',
      badgeVariant: 'neutral',
      colorVariant: 'neutral',
      state: 'STANDBY',
      eyebrow: 'Session state unresolved',
      message: 'Monitoring session state unavailable.',
      description: 'Attention monitoring remains on standby until the session is confirmed.',
      telemetry: 'NOT AVAILABLE',
      footnote: 'Awaiting authoritative session state',
    }
  }

  if (sessionStatus === 'NONE') {
    return {
      badge: 'STANDBY',
      badgeVariant: 'neutral',
      colorVariant: 'neutral',
      state: 'STANDBY',
      eyebrow: 'Pre-flight preparation',
      message: 'Monitoring has not started.',
      description: 'Start a session to prepare the Attention Core connection.',
      telemetry: 'NOT CONNECTED',
      footnote: 'Awaiting a monitoring session',
    }
  }

  if (attentionStatus === 'UNAVAILABLE') {
    return {
      badge: 'UNAVAILABLE',
      badgeVariant: 'neutral',
      colorVariant: 'neutral',
      state: 'UNAVAILABLE',
      eyebrow: 'Attention telemetry unavailable',
      message: 'The latest attention state could not be loaded.',
      description: 'No attention condition is inferred while telemetry is unavailable.',
      telemetry: 'UNAVAILABLE',
      footnote: 'Session state and Core availability are independent',
    }
  }

  if (sessionStatus === 'COMPLETED') {
    return {
      badge: 'COMPLETED',
      badgeVariant: 'neutral',
      colorVariant: 'neutral',
      state: 'COMPLETE',
      eyebrow: 'Session closed',
      message: 'Monitoring session completed.',
      description: 'No attention event was recorded for this session.',
      telemetry: attentionStatus === 'NO_DATA' ? 'NO DATA' : 'CHECKING',
      footnote: 'Live attention monitoring has ended',
    }
  }

  return {
    badge: attentionStatus === 'NO_DATA' ? 'WAITING' : 'CHECKING',
    badgeVariant: 'neutral',
    colorVariant: 'neutral',
    state: attentionStatus === 'NO_DATA' ? 'WAITING' : 'CHECKING',
    eyebrow: 'Monitoring session active',
    message: attentionStatus === 'NO_DATA'
      ? 'Waiting for the first attention event.'
      : 'Checking for attention telemetry.',
    description: 'The session is ready to receive event-driven attention telemetry.',
    telemetry: attentionStatus === 'NO_DATA' ? 'NO DATA' : 'CHECKING',
    footnote: attentionStatus === 'NO_DATA'
      ? 'No attention event has been received'
      : 'Confirming the latest session state',
  }
}

export function AttentionStatus({
  sessionStatus,
  attentionStatus,
  latestEvent,
  error,
}: AttentionStatusProps) {
  const view = latestEvent === null
    ? getEmptyView(sessionStatus, attentionStatus)
    : getEventView(latestEvent, attentionStatus, sessionStatus)

  return (
    <section
      className={`panel attention-status attention-status--${view.colorVariant}`}
      aria-labelledby="attention-title"
    >
      <div className="panel__header">
        <h2 id="attention-title" className="panel__title">Attention status</h2>
        <StatusBadge label={view.badge} variant={view.badgeVariant} />
      </div>
      <div className="attention-status__body">
        <p className="attention-status__eyebrow">{view.eyebrow}</p>
        <span className="attention-status__symbol" aria-hidden="true"><span /><span /></span>
        <p className="attention-status__state">{view.state}</p>
        <p className="attention-status__message">{view.message}</p>
        <p className="panel__description">{view.description}</p>
      </div>
      <dl className="attention-status__telemetry" aria-label="Attention telemetry">
        <div>
          <dt>Telemetry</dt>
          <dd>{view.telemetry}</dd>
        </div>
        <div>
          <dt>Face</dt>
          <dd>{latestEvent === null ? '—' : latestEvent.face_detected ? 'DETECTED' : 'NOT DETECTED'}</dd>
        </div>
        <div>
          <dt>Eye state</dt>
          <dd>{latestEvent === null ? '—' : formatEyeState(latestEvent.eye_state)}</dd>
        </div>
        <div>
          <dt>Closed</dt>
          <dd>{latestEvent?.closed_duration_ms == null ? '—' : `${latestEvent.closed_duration_ms} ms`}</dd>
        </div>
        <div className="attention-status__telemetry-time">
          <dt>Last state change</dt>
          <dd>{latestEvent === null ? '—' : formatUtcDateTime(latestEvent.occurred_at)}</dd>
        </div>
      </dl>
      {error !== null && <p className="attention-status__error" role="status">{error}</p>}
      <p className="attention-status__footnote">{view.footnote}</p>
    </section>
  )
}
