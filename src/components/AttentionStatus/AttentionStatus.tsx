import type { SessionDisplayStatus } from '../../hooks/useMonitoringSession'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AttentionStatus.css'

type AttentionStatusProps = {
  sessionStatus: SessionDisplayStatus
}

const sessionCopy = {
  UNKNOWN: {
    message: 'Monitoring session state unavailable.',
    description: 'Attention monitoring remains on standby.',
    footnote: 'Awaiting authoritative session state',
  },
  NONE: {
    message: 'Monitoring has not started.',
    description: 'Start a session to prepare attention monitoring.',
    footnote: 'Awaiting a monitoring session',
  },
  ACTIVE: {
    message: 'Monitoring session is active.',
    description: 'Awaiting attention telemetry.',
    footnote: 'Attention Core is not connected',
  },
  COMPLETED: {
    message: 'Monitoring session is completed.',
    description: 'Start a new session to continue monitoring.',
    footnote: 'Attention Core is not connected',
  },
} satisfies Record<SessionDisplayStatus, {
  message: string
  description: string
  footnote: string
}>

export function AttentionStatus({ sessionStatus }: AttentionStatusProps) {
  const copy = sessionCopy[sessionStatus]

  return (
    <section className="panel attention-status" aria-labelledby="attention-title">
      <div className="panel__header">
        <h2 id="attention-title" className="panel__title">Attention status</h2>
        <StatusBadge label="STANDBY" />
      </div>
      <div className="attention-status__body">
        <span className="attention-status__symbol" aria-hidden="true">
          <span /><span />
        </span>
        <p className="attention-status__state">STANDBY</p>
        <p className="attention-status__message">{copy.message}</p>
        <p className="panel__description">{copy.description}</p>
      </div>
      <p className="attention-status__footnote">{copy.footnote}</p>
    </section>
  )
}
