import type { SessionDisplayStatus } from '../../hooks/useMonitoringSession'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AttentionStatus.css'

type AttentionStatusProps = {
  sessionStatus: SessionDisplayStatus
}

const sessionCopy = {
  UNKNOWN: {
    badge: 'UNAVAILABLE',
    state: 'STANDBY',
    eyebrow: 'Session state unresolved',
    message: 'Monitoring session state unavailable.',
    description: 'Attention monitoring will remain on standby until the session is confirmed.',
    connection: 'NOT AVAILABLE',
    footnote: 'Awaiting authoritative session state',
  },
  NONE: {
    badge: 'STANDBY',
    state: 'STANDBY',
    eyebrow: 'Pre-flight preparation',
    message: 'Monitoring has not started.',
    description: 'Start a session to prepare the Attention Core connection.',
    connection: 'NOT CONNECTED',
    footnote: 'Awaiting a monitoring session',
  },
  ACTIVE: {
    badge: 'WAITING',
    state: 'WAITING',
    eyebrow: 'Monitoring session active',
    message: 'Waiting for Attention Core.',
    description: 'The session is ready to receive attention telemetry.',
    connection: 'AWAITING TELEMETRY',
    footnote: 'No attention event has been received',
  },
  COMPLETED: {
    badge: 'COMPLETED',
    state: 'COMPLETE',
    eyebrow: 'Session closed',
    message: 'Monitoring session completed.',
    description: 'Start a new session to prepare another monitoring operation.',
    connection: 'DISCONNECTED',
    footnote: 'Live attention monitoring has ended',
  },
} satisfies Record<SessionDisplayStatus, {
  badge: string
  state: string
  eyebrow: string
  message: string
  description: string
  connection: string
  footnote: string
}>

export function AttentionStatus({ sessionStatus }: AttentionStatusProps) {
  const copy = sessionCopy[sessionStatus]

  return (
    <section className="panel attention-status" aria-labelledby="attention-title">
      <div className="panel__header">
        <h2 id="attention-title" className="panel__title">Attention status</h2>
        <StatusBadge label={copy.badge} />
      </div>
      <div className="attention-status__body">
        <p className="attention-status__eyebrow">{copy.eyebrow}</p>
        <span className="attention-status__symbol" aria-hidden="true"><span /><span /></span>
        <p className="attention-status__state">{copy.state}</p>
        <p className="attention-status__message">{copy.message}</p>
        <p className="panel__description">{copy.description}</p>
      </div>
      <div className="attention-status__telemetry" aria-label="Attention telemetry readiness">
        <div>
          <span>Core signal</span>
          <strong>{copy.connection}</strong>
        </div>
        <div>
          <span>Last event</span>
          <strong>—</strong>
        </div>
      </div>
      <p className="attention-status__footnote">{copy.footnote}</p>
    </section>
  )
}
