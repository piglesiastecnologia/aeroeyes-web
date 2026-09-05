import { StatusBadge } from '../StatusBadge/StatusBadge'
import './MonitoringSession.css'

export function MonitoringSession() {
  return (
    <section className="panel monitoring-session" aria-labelledby="session-title">
      <div className="panel__header">
        <h2 id="session-title" className="panel__title">Monitoring session</h2>
        <StatusBadge label="NONE" />
      </div>
      <div className="monitoring-session__content">
        <div>
          <p className="panel__message">No active session</p>
          <p className="panel__description">Attention monitoring is on standby.</p>
        </div>
        <div className="monitoring-session__action">
          <button className="console-button" type="button" disabled aria-describedby="session-action-note">
            Start monitoring
          </button>
          <p id="session-action-note" className="action-note">Not available yet</p>
        </div>
      </div>
    </section>
  )
}
