import { useEffect, useState } from 'react'
import {
  getSessionAttentionEvents,
  SessionAttentionEventsApiError,
} from '../api/monitoringApi'
import type {
  ApiStatus,
  AttentionEventResponse,
  MonitoringSessionResponse,
} from '../api/monitoringApi'

export type AttentionEventsStatus = 'UNKNOWN' | 'NO_DATA' | 'AVAILABLE' | 'UNAVAILABLE'

type EventsResolution = {
  sessionId: string
  status: Exclude<AttentionEventsStatus, 'UNKNOWN'>
  events: AttentionEventResponse[]
  error: string | null
}

const POLL_INTERVAL_MS = 1_000
const RECENT_EVENTS_LIMIT = 10

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getEventsError(error: unknown): string {
  if (error instanceof SessionAttentionEventsApiError) {
    return error.message
  }

  return 'Could not load attention events.'
}

export function useSessionAttentionEvents(
  apiStatus: ApiStatus,
  session: MonitoringSessionResponse | null,
  isSessionStateResolved: boolean,
) {
  const sessionId = session?.session_id ?? null
  const sessionStatus = session?.status ?? null
  const canLoad = (
    apiStatus === 'ONLINE'
    && isSessionStateResolved
    && sessionId !== null
  )
  const [resolution, setResolution] = useState<EventsResolution | null>(null)
  const currentResolution = sessionId !== null && resolution?.sessionId === sessionId
    ? resolution
    : null

  useEffect(() => {
    if (!canLoad || sessionId === null || sessionStatus === null) {
      return
    }

    const ownedSessionId = sessionId
    const controller = new AbortController()
    let timerId: number | null = null
    let isCurrent = true

    async function loadEvents() {
      try {
        const loaded = await getSessionAttentionEvents(
          ownedSessionId,
          RECENT_EVENTS_LIMIT,
          controller.signal,
        )

        if (!isCurrent) {
          return
        }

        setResolution({
          sessionId: ownedSessionId,
          status: loaded.events.length === 0 ? 'NO_DATA' : 'AVAILABLE',
          events: loaded.events,
          error: null,
        })
      } catch (loadError: unknown) {
        if (!isCurrent || isAbortError(loadError)) {
          return
        }

        setResolution((previous) => ({
          sessionId: ownedSessionId,
          status: 'UNAVAILABLE',
          events: previous?.sessionId === ownedSessionId ? previous.events : [],
          error: getEventsError(loadError),
        }))
      } finally {
        if (isCurrent && sessionStatus === 'ACTIVE') {
          timerId = window.setTimeout(loadEvents, POLL_INTERVAL_MS)
        }
      }
    }

    void loadEvents()

    return () => {
      isCurrent = false
      controller.abort()

      if (timerId !== null) {
        window.clearTimeout(timerId)
      }
    }
  }, [canLoad, sessionId, sessionStatus])

  const displayStatus: AttentionEventsStatus = apiStatus === 'OFFLINE'
    ? 'UNAVAILABLE'
    : !isSessionStateResolved || sessionId === null
      ? 'UNKNOWN'
      : currentResolution?.status ?? 'UNKNOWN'

  return {
    displayStatus,
    events: currentResolution?.events ?? [],
    error: currentResolution?.error ?? null,
  }
}
