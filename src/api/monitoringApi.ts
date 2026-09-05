export type HealthResponse = {
  status: 'ok'
  service: 'aeroeyes-monitoring-api'
}

export type ApiStatus = 'UNKNOWN' | 'CHECKING' | 'ONLINE' | 'OFFLINE'

function buildHealthUrl(configuredBaseUrl: unknown): string {
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

  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/health`

  return baseUrl.toString()
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

export async function getMonitoringApiHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(buildHealthUrl(import.meta.env.VITE_MONITORING_API_URL), { signal })

  if (!response.ok) {
    throw new Error('Monitoring API health request failed')
  }

  const payload: unknown = await response.json()

  if (!isHealthResponse(payload)) {
    throw new Error('Monitoring API returned an unexpected health response')
  }

  return payload
}
