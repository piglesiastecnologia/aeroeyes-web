import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AttentionStatus.css'

export function AttentionStatus() {
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
        <p className="attention-status__message">Monitoring has not started.</p>
        <p className="panel__description">Start a session to begin attention monitoring.</p>
      </div>
      <p className="attention-status__footnote">Awaiting a monitoring session</p>
    </section>
  )
}
