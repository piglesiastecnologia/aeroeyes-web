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
