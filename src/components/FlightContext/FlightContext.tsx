import { StatusBadge } from '../StatusBadge/StatusBadge'
import './FlightContext.css'

export function FlightContext() {
  return (
    <section className="panel flight-context" aria-labelledby="context-title">
      <div className="panel__header">
        <h2 id="context-title" className="panel__title">Flight context</h2>
        <StatusBadge label="EMPTY" />
      </div>
      <div className="flight-context__body">
        <svg className="flight-context__symbol" viewBox="0 0 48 32" fill="none" aria-hidden="true">
          <circle cx="7" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 24h9a7 7 0 0 0 7-7v-2a7 7 0 0 1 7-7h3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="41" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="panel__message">No flight context configured</p>
        <p className="panel__description">Flight and route details will appear here.</p>
      </div>
      <div className="flight-context__action">
        <button className="console-button" type="button" disabled aria-describedby="context-action-note">Edit context</button>
        <p id="context-action-note" className="action-note">Not available yet</p>
      </div>
    </section>
  )
}
