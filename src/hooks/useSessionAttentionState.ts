import { useEffect, useState } from 'react'
import {
  getSessionAttentionState,
  SessionAttentionStateApiError,
} from '../api/monitoringApi'
import type {
  ApiStatus,
  AttentionEventResponse,
  MonitoringSessionResponse,
} from '../api/monitoringApi'

export type AttentionTelemetryStatus = 'UNKNOWN' | 'NO_DATA' | 'AVAILABLE' | 'UNAVAILABLE'

type AttentionResolution = {
  sessionId: string
  status: AttentionTelemetryStatus
  latestEvent: AttentionEventResponse | null
  error: string | null
}

const POLL_INTERVAL_MS = 1_000

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getAttentionError(error: unknown): string {
  if (error instanceof SessionAttentionStateApiError) {
    return error.message
  }

  return 'Could not load attention telemetry.'
}

export function useSessionAttentionState(
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
    && sessionStatus === 'ACTIVE'
  )
  const [resolution, setResolution] = useState<AttentionResolution | null>(null)
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

    async function loadAttentionState() {
      try {
        const loaded = await getSessionAttentionState(ownedSessionId, controller.signal)

        if (!isCurrent) {
          return
        }

        setResolution({
          sessionId: ownedSessionId,
          status: loaded.availability,
          latestEvent: loaded.latest_event,
          error: null,
        })
      } catch (loadError: unknown) {
        if (!isCurrent || isAbortError(loadError)) {
          return
        }

        setResolution((previous) => ({
          sessionId: ownedSessionId,
          status: 'UNAVAILABLE',
          latestEvent: previous?.sessionId === ownedSessionId ? previous.latestEvent : null,
          error: getAttentionError(loadError),
        }))
      } finally {
        if (isCurrent && sessionStatus === 'ACTIVE') {
          timerId = window.setTimeout(loadAttentionState, POLL_INTERVAL_MS)
        }
      }
    }

    void loadAttentionState()

    return () => {
      isCurrent = false
      controller.abort()

      if (timerId !== null) {
        window.clearTimeout(timerId)
      }
    }
  }, [canLoad, sessionId, sessionStatus])

  const isCompleted = sessionStatus === 'COMPLETED'
  const displayStatus: AttentionTelemetryStatus = isCompleted
    ? 'UNKNOWN'
    : (
        apiStatus === 'OFFLINE'
          ? 'UNAVAILABLE'
          : !isSessionStateResolved || sessionId === null
            ? 'UNKNOWN'
            : currentResolution?.status ?? 'UNKNOWN'
      )

  return {
    displayStatus,
    latestEvent: isCompleted ? null : currentResolution?.latestEvent ?? null,
    error: isCompleted ? null : currentResolution?.error ?? null,
  }
}
