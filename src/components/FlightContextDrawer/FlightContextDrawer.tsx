import { useEffect, useRef, useState } from 'react'
import type {
  SessionContextReplaceRequest,
  SessionContextResponse,
} from '../../api/monitoringApi'
import type { SessionContextOperation } from '../../hooks/useSessionContext'
import './FlightContextDrawer.css'

type FlightContextDrawerProps = {
  context: SessionContextResponse | null
  operation: SessionContextOperation
  error: string | null
  onSave: (context: SessionContextReplaceRequest) => Promise<boolean>
  onClear: () => Promise<boolean>
  onClose: () => void
}

function toNullableValue(value: string): string | null {
  return value.trim() === '' ? null : value
}

export function FlightContextDrawer({
  context,
  operation,
  error,
  onSave,
  onClear,
  onClose,
}: FlightContextDrawerProps) {
  const [flightNumber, setFlightNumber] = useState(context?.flight_number ?? '')
  const [departureIcao, setDepartureIcao] = useState(context?.departure_icao ?? '')
  const [destinationIcao, setDestinationIcao] = useState(context?.destination_icao ?? '')
  const drawer = useRef<HTMLElement>(null)
  const firstInput = useRef<HTMLInputElement>(null)
  const isMutating = operation === 'SAVING' || operation === 'CLEARING'

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    firstInput.current?.focus()

    return () => {
      previouslyFocused?.focus()
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && operation === 'IDLE') {
        onClose()
        return
      }

      if (event.key === 'Tab') {
        const focusableElements = drawer.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled)',
        )

        if (!focusableElements || focusableElements.length === 0) {
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, operation])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const succeeded = await onSave({
      flight_number: toNullableValue(flightNumber),
      departure_icao: toNullableValue(departureIcao),
      destination_icao: toNullableValue(destinationIcao),
    })

    if (succeeded) {
      onClose()
    }
  }

  async function handleClear() {
    if (await onClear()) {
      onClose()
    }
  }

  return (
    <div className="context-drawer-backdrop">
      <aside
        ref={drawer}
        className="context-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="context-drawer-title"
        aria-describedby="context-drawer-description"
        aria-busy={isMutating}
      >
        <header className="context-drawer__header">
          <div>
            <p className="context-drawer__eyebrow">Monitoring session</p>
            <h2 id="context-drawer-title">Flight context</h2>
          </div>
          <button
            className="context-drawer__close"
            type="button"
            disabled={isMutating}
            aria-label="Close flight context editor"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <p id="context-drawer-description" className="context-drawer__description">
          Saving replaces all flight context fields for this monitoring session.
        </p>

        <form className="context-drawer__form" onSubmit={handleSubmit}>
          <label>
            <span>Flight number</span>
            <input
              ref={firstInput}
              name="flight_number"
              value={flightNumber}
              disabled={isMutating}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setFlightNumber(event.target.value)}
            />
          </label>
          <div className="context-drawer__route-fields">
            <label>
              <span>Departure ICAO</span>
              <input
                name="departure_icao"
                value={departureIcao}
                maxLength={4}
                disabled={isMutating}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                onChange={(event) => setDepartureIcao(event.target.value)}
              />
            </label>
            <label>
              <span>Destination ICAO</span>
              <input
                name="destination_icao"
                value={destinationIcao}
                maxLength={4}
                disabled={isMutating}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                onChange={(event) => setDestinationIcao(event.target.value)}
              />
            </label>
          </div>

          <div className="context-drawer__feedback" aria-live="polite" aria-atomic="true">
            {error && <p>{error}</p>}
          </div>

          <div className="context-drawer__actions">
            <button className="console-button context-drawer__save" type="submit" disabled={isMutating}>
              {operation === 'SAVING' ? 'Saving...' : 'Save context'}
            </button>
            <button className="console-button" type="button" disabled={isMutating} onClick={onClose}>
              Cancel
            </button>
            {context !== null && (
              <button
                className="console-button context-drawer__clear"
                type="button"
                disabled={isMutating}
                onClick={handleClear}
              >
                {operation === 'CLEARING' ? 'Clearing...' : 'Clear context'}
              </button>
            )}
          </div>
        </form>
      </aside>
    </div>
  )
}
