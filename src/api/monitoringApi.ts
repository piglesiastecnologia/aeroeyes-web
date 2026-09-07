export type HealthResponse = {
  status: 'ok'
  service: 'aeroeyes-monitoring-api'
}

export type ApiStatus = 'UNKNOWN' | 'CHECKING' | 'ONLINE' | 'OFFLINE'

export type MonitoringSessionStatus = 'ACTIVE' | 'COMPLETED'

export type MonitoringSessionResponse = {
  session_id: string
  status: MonitoringSessionStatus
  started_at: string
  ended_at: string | null
}

export type SessionContextResponse = {
  session_id: string
  flight_number: string | null
  departure_icao: string | null
  destination_icao: string | null
}

export type SessionContextReplaceRequest = {
  flight_number: string | null
  departure_icao: string | null
  destination_icao: string | null
}

type MonitoringApiErrorDetail = {
  code: string
  message: string
}

export class SessionContextApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'SessionContextApiError'
    this.status = status
    this.code = code
  }
}

const TIMEZONE_AWARE_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[zZ]|[+-]\d{2}:\d{2})$/

function buildMonitoringApiUrl(path: string): string {
  const configuredBaseUrl: unknown = import.meta.env.VITE_MONITORING_API_URL

  if (typeof configuredBaseUrl !== 'string' || configuredBaseUrl.trim() === '') {
    throw new Error('Monitoring API URL is not configured')
  }

  const baseUrl = new URL(configuredBaseUrl.trim())

  if (
    !['http:', 'https:'].includes(baseUrl.protocol)
    || baseUrl.username !== ''
    || baseUrl.password !== ''
    || baseUrl.search !== ''
    || baseUrl.hash !== ''
  ) {
    throw new Error('Monitoring API URL is invalid')
  }

  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/${path}`

  return baseUrl.toString()
}

function isValidDateTime(value: unknown): value is string {
  return (
    typeof value === 'string'
    && TIMEZONE_AWARE_DATETIME_PATTERN.test(value)
    && Number.isFinite(Date.parse(value))
  )
}

function isHealthResponse(payload: unknown): payload is HealthResponse {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'status' in payload
    && payload.status === 'ok'
    && 'service' in payload
    && payload.service === 'aeroeyes-monitoring-api'
  )
}

function isMonitoringSessionResponse(payload: unknown): payload is MonitoringSessionResponse {
  if (
    typeof payload !== 'object'
    || payload === null
    || !('session_id' in payload)
    || typeof payload.session_id !== 'string'
    || payload.session_id.trim() === ''
    || !('status' in payload)
    || (payload.status !== 'ACTIVE' && payload.status !== 'COMPLETED')
    || !('started_at' in payload)
    || !isValidDateTime(payload.started_at)
    || !('ended_at' in payload)
  ) {
    return false
  }

  return payload.status === 'ACTIVE'
    ? payload.ended_at === null
    : isValidDateTime(payload.ended_at)
}

function isMonitoringApiErrorDetail(payload: unknown): payload is MonitoringApiErrorDetail {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'code' in payload
    && typeof payload.code === 'string'
    && 'message' in payload
    && typeof payload.message === 'string'
  )
}

function isSessionContextResponse(payload: unknown): payload is SessionContextResponse {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'session_id' in payload
    && typeof payload.session_id === 'string'
    && payload.session_id.trim() !== ''
    && 'flight_number' in payload
    && (typeof payload.flight_number === 'string' || payload.flight_number === null)
    && 'departure_icao' in payload
    && (payload.departure_icao === null
      || (typeof payload.departure_icao === 'string' && /^[A-Z]{4}$/.test(payload.departure_icao)))
    && 'destination_icao' in payload
    && (payload.destination_icao === null
      || (typeof payload.destination_icao === 'string' && /^[A-Z]{4}$/.test(payload.destination_icao)))
  )
}

async function readErrorDetail(response: Response): Promise<MonitoringApiErrorDetail | null> {
  try {
    const payload: unknown = await response.json()

    if (
      typeof payload === 'object'
      && payload !== null
      && 'detail' in payload
      && isMonitoringApiErrorDetail(payload.detail)
    ) {
      return payload.detail
    }
  } catch {
    // A malformed error body is handled as an unclassified API failure.
  }

  return null
}

async function readSessionContext(
  response: Response,
  requestedSessionId: string,
): Promise<SessionContextResponse> {
  const payload: unknown = await response.json()

  if (!isSessionContextResponse(payload) || payload.session_id !== requestedSessionId) {
    throw new Error('Monitoring API returned an unexpected session context response')
  }

  return payload
}

async function readMonitoringSession(response: Response): Promise<MonitoringSessionResponse> {
  const payload: unknown = await response.json()

  if (!isMonitoringSessionResponse(payload)) {
    throw new Error('Monitoring API returned an unexpected session response')
  }

  return payload
}

export async function getMonitoringApiHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(buildMonitoringApiUrl('health'), { signal })

  if (!response.ok) {
    throw new Error('Monitoring API health request failed')
  }

  const payload: unknown = await response.json()

  if (!isHealthResponse(payload)) {
    throw new Error('Monitoring API returned an unexpected health response')
  }

  return payload
}

export async function createMonitoringSession(
  signal?: AbortSignal,
): Promise<MonitoringSessionResponse> {
  const response = await fetch(buildMonitoringApiUrl('sessions'), {
    method: 'POST',
    signal,
  })

  if (response.status !== 201) {
    throw new Error('Monitoring session creation failed')
  }

  const session = await readMonitoringSession(response)

  if (session.status !== 'ACTIVE') {
    throw new Error('Monitoring API returned an unexpected created session status')
  }

  return session
}

export async function getMonitoringSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<MonitoringSessionResponse | null> {
  const response = await fetch(
    buildMonitoringApiUrl(`sessions/${encodeURIComponent(sessionId)}`),
    { signal },
  )

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new Error('Monitoring session request failed')
  }

  const session = await readMonitoringSession(response)

  if (session.session_id !== sessionId) {
    throw new Error('Monitoring API returned an unexpected session identity')
  }

  return session
}

export async function completeMonitoringSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<MonitoringSessionResponse> {
  const response = await fetch(
    buildMonitoringApiUrl(`sessions/${encodeURIComponent(sessionId)}/complete`),
    {
      method: 'POST',
      signal,
    },
  )

  if (response.status !== 200) {
    throw new Error('Monitoring session completion failed')
  }

  const session = await readMonitoringSession(response)

  if (session.session_id !== sessionId || session.status !== 'COMPLETED') {
    throw new Error('Monitoring API returned an unexpected completed session status')
  }

  return session
}

export async function getSessionContext(
  sessionId: string,
  signal?: AbortSignal,
): Promise<SessionContextResponse | null> {
  const response = await fetch(
    buildMonitoringApiUrl(`sessions/${encodeURIComponent(sessionId)}/context`),
    { signal },
  )

  if (response.status === 404) {
    const detail = await readErrorDetail(response)

    if (detail?.code === 'SESSION_CONTEXT_NOT_FOUND') {
      return null
    }

    throw new SessionContextApiError(
      detail?.code === 'SESSION_NOT_FOUND'
        ? 'The owning monitoring session no longer exists.'
        : 'Flight context request failed.',
      response.status,
      detail?.code ?? null,
    )
  }

  if (response.status !== 200) {
    throw new SessionContextApiError('Flight context request failed.', response.status)
  }

  return readSessionContext(response, sessionId)
}

export async function replaceSessionContext(
  sessionId: string,
  context: SessionContextReplaceRequest,
  signal?: AbortSignal,
): Promise<SessionContextResponse> {
  const response = await fetch(
    buildMonitoringApiUrl(`sessions/${encodeURIComponent(sessionId)}/context`),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal,
    },
  )

  if (response.status === 422) {
    const detail = await readErrorDetail(response)

    throw new SessionContextApiError(
      detail?.code === 'INVALID_SESSION_CONTEXT' && detail.message.trim() !== ''
        ? detail.message.slice(0, 240)
        : 'Flight context is invalid.',
      response.status,
      detail?.code ?? null,
    )
  }

  if (response.status === 404) {
    const detail = await readErrorDetail(response)

    throw new SessionContextApiError(
      detail?.code === 'SESSION_NOT_FOUND'
        ? 'The owning monitoring session no longer exists.'
        : 'Flight context could not be saved.',
      response.status,
      detail?.code ?? null,
    )
  }

  if (response.status !== 200) {
    throw new SessionContextApiError('Flight context could not be saved.', response.status)
  }

  return readSessionContext(response, sessionId)
}

export async function deleteSessionContext(
  sessionId: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(
    buildMonitoringApiUrl(`sessions/${encodeURIComponent(sessionId)}/context`),
    { method: 'DELETE', signal },
  )

  if (response.status === 204) {
    return
  }

  if (response.status === 404) {
    const detail = await readErrorDetail(response)

    throw new SessionContextApiError(
      detail?.code === 'SESSION_NOT_FOUND'
        ? 'The owning monitoring session no longer exists.'
        : 'Flight context could not be cleared.',
      response.status,
      detail?.code ?? null,
    )
  }

  throw new SessionContextApiError('Flight context could not be cleared.', response.status)
}
