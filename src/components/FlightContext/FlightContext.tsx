import type { SessionContextResponse } from '../../api/monitoringApi'
import type {
  SessionContextDisplayStatus,
  SessionContextOperation,
} from '../../hooks/useSessionContext'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './FlightContext.css'

type FlightContextProps = {
  context: SessionContextResponse | null
  status: SessionContextDisplayStatus
  operation: SessionContextOperation
  error: string | null
  hasSession: boolean
  canEdit: boolean
  onEdit: () => void
}

function displayValue(value: string | null): string {
  return value ?? '—'
}

export function FlightContext({
  context,
  status,
  operation,
  error,
  hasSession,
  canEdit,
  onEdit,
}: FlightContextProps) {
  const isLoading = operation === 'LOADING'
  const actionLabel = status === 'EMPTY' ? 'Add context' : 'Edit context'
  const actionNote = !hasSession
    ? 'Requires a monitoring session'
    : status === 'UNKNOWN'
      ? isLoading ? 'Loading from Monitoring API' : 'Context state must be resolved'
      : canEdit
        ? 'Edits this monitoring session'
        : 'Monitoring API unavailable'

  return (
    <section className="panel flight-context" aria-labelledby="context-title">
      <div className="panel__header">
        <h2 id="context-title" className="panel__title">Flight context</h2>
        <StatusBadge label={status} variant={status === 'AVAILABLE' ? 'normal' : 'neutral'} />
      </div>
      <div className="flight-context__body" aria-live="polite" aria-atomic="true">
        {status === 'AVAILABLE' && context !== null ? (
          <>
            <p className="flight-context__route" aria-label="Flight route">
              <span>{displayValue(context.departure_icao)}</span>
              <span aria-hidden="true">→</span>
              <span>{displayValue(context.destination_icao)}</span>
            </p>
            <dl className="flight-context__details">
              <div>
                <dt>Flight</dt>
                <dd>{displayValue(context.flight_number)}</dd>
              </div>
              <div>
                <dt>Departure</dt>
                <dd>{displayValue(context.departure_icao)}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{displayValue(context.destination_icao)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <svg className="flight-context__symbol" viewBox="0 0 48 32" fill="none" aria-hidden="true">
              <circle cx="7" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 24h9a7 7 0 0 0 7-7v-2a7 7 0 0 1 7-7h3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="41" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p className="panel__message">
              {status === 'UNKNOWN'
                ? isLoading ? 'Loading flight context' : 'Flight context state unavailable'
                : hasSession ? 'No flight context configured' : 'No monitoring session available'}
            </p>
            <p className="panel__description">
              {status === 'UNKNOWN'
                ? 'The current session context has not been confirmed.'
                : hasSession
                  ? 'Add flight and route details for this monitoring session.'
                  : 'Start a session before configuring flight context.'}
            </p>
            {status === 'UNKNOWN' && error && (
              <p className="flight-context__error">{error}</p>
            )}
          </>
        )}
      </div>
      <div className="flight-context__action">
        <button
          className="console-button"
          type="button"
          disabled={!canEdit}
          aria-describedby="context-action-note"
          onClick={onEdit}
        >
          {actionLabel}
        </button>
        <p id="context-action-note" className="action-note">{actionNote}</p>
      </div>
    </section>
  )
}
