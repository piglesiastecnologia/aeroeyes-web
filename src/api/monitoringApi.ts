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

export type AttentionState = 'NORMAL' | 'ATTENTION' | 'CRITICAL' | 'NO_FACE'

export type AttentionSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH'

export type EyeState = 'OPEN' | 'CLOSED' | 'PROLONGED_CLOSURE'

export type AttentionEventResponse = {
  event_id: string
  session_id: string
  occurred_at: string
  received_at: string
  state: AttentionState
  severity: AttentionSeverity
  face_detected: boolean
  eye_state: EyeState | null
  closed_duration_ms: number | null
  schema_version: 1
}

export type SessionAttentionStateResponse = {
  session_id: string
  availability: 'NO_DATA' | 'AVAILABLE'
  latest_event: AttentionEventResponse | null
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

export type MetarReportType = 'METAR' | 'SPECI'

export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR'

export type MetarObservationResponse = {
  station_icao: string
  report_type: MetarReportType
  observed_at: string
  raw_text: string
  flight_category: FlightCategory | null
  temperature_c: number | null
  dewpoint_c: number | null
  wind_direction_deg: number | null
  wind_variable: boolean
  wind_speed_kt: number | null
  wind_gust_kt: number | null
  visibility_sm: number | null
  visibility_greater_than: boolean
  weather: string | null
  ceiling_ft_agl: number | null
  altimeter_hpa: number | null
}

export type AirportWeatherResponse = {
  station_icao: string
  observation: MetarObservationResponse | null
}

export type SessionWeatherResponse = {
  session_id: string
  departure: AirportWeatherResponse | null
  destination: AirportWeatherResponse | null
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

export class SessionWeatherApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'SessionWeatherApiError'
    this.status = status
    this.code = code
  }
}

export class SessionAttentionStateApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'SessionAttentionStateApiError'
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

function isAttentionEventResponse(
  payload: unknown,
  requestedSessionId: string,
): payload is AttentionEventResponse {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'event_id' in payload
    && typeof payload.event_id === 'string'
    && payload.event_id.trim() !== ''
    && 'session_id' in payload
    && payload.session_id === requestedSessionId
    && 'occurred_at' in payload
    && isValidDateTime(payload.occurred_at)
    && 'received_at' in payload
    && isValidDateTime(payload.received_at)
    && 'state' in payload
    && (
      payload.state === 'NORMAL'
      || payload.state === 'ATTENTION'
      || payload.state === 'CRITICAL'
      || payload.state === 'NO_FACE'
    )
    && 'severity' in payload
    && (
      payload.severity === 'INFO'
      || payload.severity === 'LOW'
      || payload.severity === 'MEDIUM'
      || payload.severity === 'HIGH'
    )
    && 'face_detected' in payload
    && typeof payload.face_detected === 'boolean'
    && 'eye_state' in payload
    && (
      payload.eye_state === null
      || payload.eye_state === 'OPEN'
      || payload.eye_state === 'CLOSED'
      || payload.eye_state === 'PROLONGED_CLOSURE'
    )
    && 'closed_duration_ms' in payload
    && (
      payload.closed_duration_ms === null
      || (
        typeof payload.closed_duration_ms === 'number'
        && Number.isInteger(payload.closed_duration_ms)
        && payload.closed_duration_ms >= 0
      )
    )
    && 'schema_version' in payload
    && payload.schema_version === 1
  )
}

function isSessionAttentionStateResponse(
  payload: unknown,
  requestedSessionId: string,
): payload is SessionAttentionStateResponse {
  if (
    typeof payload !== 'object'
    || payload === null
    || !('session_id' in payload)
    || payload.session_id !== requestedSessionId
    || !('availability' in payload)
    || !('latest_event' in payload)
  ) {
    return false
  }

  return payload.availability === 'NO_DATA'
    ? payload.latest_event === null
    : payload.availability === 'AVAILABLE'
      && isAttentionEventResponse(payload.latest_event, requestedSessionId)
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isNullableNonNegativeNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
}

function isMetarObservationResponse(
  payload: unknown,
  stationIcao: string,
): payload is MetarObservationResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  return (
    'station_icao' in payload
    && payload.station_icao === stationIcao
    && 'report_type' in payload
    && (payload.report_type === 'METAR' || payload.report_type === 'SPECI')
    && 'observed_at' in payload
    && isValidDateTime(payload.observed_at)
    && 'raw_text' in payload
    && typeof payload.raw_text === 'string'
    && payload.raw_text.trim() !== ''
    && 'flight_category' in payload
    && (
      payload.flight_category === null
      || payload.flight_category === 'VFR'
      || payload.flight_category === 'MVFR'
      || payload.flight_category === 'IFR'
      || payload.flight_category === 'LIFR'
    )
    && 'temperature_c' in payload
    && isNullableFiniteNumber(payload.temperature_c)
    && 'dewpoint_c' in payload
    && isNullableFiniteNumber(payload.dewpoint_c)
    && 'wind_direction_deg' in payload
    && (
      payload.wind_direction_deg === null
      || (
        typeof payload.wind_direction_deg === 'number'
        && Number.isInteger(payload.wind_direction_deg)
        && payload.wind_direction_deg >= 0
        && payload.wind_direction_deg <= 360
      )
    )
    && 'wind_variable' in payload
    && typeof payload.wind_variable === 'boolean'
    && 'wind_speed_kt' in payload
    && isNullableNonNegativeNumber(payload.wind_speed_kt)
    && 'wind_gust_kt' in payload
    && isNullableNonNegativeNumber(payload.wind_gust_kt)
    && 'visibility_sm' in payload
    && isNullableNonNegativeNumber(payload.visibility_sm)
    && 'visibility_greater_than' in payload
    && typeof payload.visibility_greater_than === 'boolean'
    && 'weather' in payload
    && (payload.weather === null || typeof payload.weather === 'string')
    && 'ceiling_ft_agl' in payload
    && isNullableNonNegativeNumber(payload.ceiling_ft_agl)
    && 'altimeter_hpa' in payload
    && (
      payload.altimeter_hpa === null
      || (
        typeof payload.altimeter_hpa === 'number'
        && Number.isFinite(payload.altimeter_hpa)
        && payload.altimeter_hpa > 0
      )
    )
  )
}

function isAirportWeatherResponse(payload: unknown): payload is AirportWeatherResponse {
  if (
    typeof payload !== 'object'
    || payload === null
    || !('station_icao' in payload)
    || typeof payload.station_icao !== 'string'
    || !/^[A-Z]{4}$/.test(payload.station_icao)
    || !('observation' in payload)
  ) {
    return false
  }

  return payload.observation === null
    || isMetarObservationResponse(payload.observation, payload.station_icao)
}

function isSessionWeatherResponse(payload: unknown): payload is SessionWeatherResponse {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'session_id' in payload
    && typeof payload.session_id === 'string'
    && payload.session_id.trim() !== ''
    && 'departure' in payload
    && (payload.departure === null || isAirportWeatherResponse(payload.departure))
    && 'destination' in payload
    && (payload.destination === null || isAirportWeatherResponse(payload.destination))
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

async function readSessionWeather(
  response: Response,
  requestedSessionId: string,
): Promise<SessionWeatherResponse> {
  const payload: unknown = await response.json()

  if (!isSessionWeatherResponse(payload) || payload.session_id !== requestedSessionId) {
    throw new SessionWeatherApiError(
      'Could not load current weather.',
      response.status,
    )
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

export async function getSessionWeather(
  sessionId: string,
  signal?: AbortSignal,
): Promise<SessionWeatherResponse> {
  const response = await fetch(
    buildMonitoringApiUrl(`sessions/${encodeURIComponent(sessionId)}/weather`),
    { signal },
  )

  if (response.status === 404) {
    const detail = await readErrorDetail(response)

    throw new SessionWeatherApiError(
      detail?.code === 'SESSION_CONTEXT_NOT_FOUND'
        ? 'No weather context is currently available.'
        : detail?.code === 'SESSION_NOT_FOUND'
          ? 'The owning monitoring session no longer exists.'
          : 'Could not load current weather.',
      response.status,
      detail?.code ?? null,
    )
  }

  if (response.status === 502) {
    const detail = await readErrorDetail(response)

    throw new SessionWeatherApiError(
      'Weather data could not be validated.',
      response.status,
      detail?.code ?? null,
    )
  }

  if (response.status === 503) {
    const detail = await readErrorDetail(response)

    throw new SessionWeatherApiError(
      'Current aviation weather is temporarily unavailable.',
      response.status,
      detail?.code ?? null,
    )
  }

  if (response.status !== 200) {
    throw new SessionWeatherApiError('Could not load current weather.', response.status)
  }

  return readSessionWeather(response, sessionId)
}

export async function getSessionAttentionState(
  sessionId: string,
  signal?: AbortSignal,
): Promise<SessionAttentionStateResponse> {
  const response = await fetch(
    buildMonitoringApiUrl(`sessions/${encodeURIComponent(sessionId)}/attention-state`),
    { signal },
  )

  if (response.status === 404) {
    const detail = await readErrorDetail(response)

    throw new SessionAttentionStateApiError(
      detail?.code === 'SESSION_NOT_FOUND'
        ? 'The owning monitoring session no longer exists.'
        : 'Could not load attention telemetry.',
      response.status,
      detail?.code ?? null,
    )
  }

  if (response.status !== 200) {
    throw new SessionAttentionStateApiError(
      'Could not load attention telemetry.',
      response.status,
    )
  }

  const payload: unknown = await response.json()

  if (!isSessionAttentionStateResponse(payload, sessionId)) {
    throw new SessionAttentionStateApiError(
      'Monitoring API returned an unexpected attention state response.',
      response.status,
    )
  }

  return payload
}
