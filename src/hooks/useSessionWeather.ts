import { useEffect, useRef, useState } from 'react'
import {
  getSessionWeather,
  SessionWeatherApiError,
} from '../api/monitoringApi'
import type {
  ApiStatus,
  MonitoringSessionResponse,
  SessionContextResponse,
  SessionWeatherResponse,
} from '../api/monitoringApi'
import type { SessionContextDisplayStatus } from './useSessionContext'

export type WeatherDisplayStatus = 'UNKNOWN' | 'EMPTY' | 'AVAILABLE' | 'NO_DATA' | 'UNAVAILABLE'
export type WeatherOperation = 'IDLE' | 'LOADING'

type WeatherResolution = {
  ownerKey: string
  status: WeatherDisplayStatus
  weather: SessionWeatherResponse | null
}

type OwnedOperation = {
  ownerKey: string
  operation: WeatherOperation
}

type OwnedError = {
  ownerKey: string
  message: string
}

type RequestGuard = {
  ownerKey: string
  controller: AbortController
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getWeatherStatus(weather: SessionWeatherResponse): WeatherDisplayStatus {
  if (weather.departure === null && weather.destination === null) {
    return 'EMPTY'
  }

  if (weather.departure?.observation != null || weather.destination?.observation != null) {
    return 'AVAILABLE'
  }

  return 'NO_DATA'
}

function isWeatherForRoute(
  weather: SessionWeatherResponse,
  expectedDepartureIcao: string | null,
  expectedDestinationIcao: string | null,
): boolean {
  return (
    (weather.departure?.station_icao ?? null) === expectedDepartureIcao
    && (weather.destination?.station_icao ?? null) === expectedDestinationIcao
  )
}

function getWeatherError(error: unknown): string {
  if (error instanceof SessionWeatherApiError) {
    return error.message
  }

  return 'Could not load current weather.'
}

function buildOwnerKey(
  sessionId: string,
  context: SessionContextResponse,
): string {
  return JSON.stringify([
    sessionId,
    context.departure_icao,
    context.destination_icao,
  ])
}

export function useSessionWeather(
  apiStatus: ApiStatus,
  session: MonitoringSessionResponse | null,
  isSessionStateResolved: boolean,
  context: SessionContextResponse | null,
  contextDisplayStatus: SessionContextDisplayStatus,
) {
  const sessionId = session?.session_id ?? null
  const departureIcao = context?.departure_icao ?? null
  const destinationIcao = context?.destination_icao ?? null
  const canLoad = (
    apiStatus === 'ONLINE'
    && isSessionStateResolved
    && sessionId !== null
    && contextDisplayStatus === 'AVAILABLE'
    && context !== null
  )
  const ownerKey = canLoad ? buildOwnerKey(sessionId, context) : null

  const [resolution, setResolution] = useState<WeatherResolution | null>(null)
  const [ownedOperation, setOwnedOperation] = useState<OwnedOperation | null>(null)
  const [ownedError, setOwnedError] = useState<OwnedError | null>(null)
  const requestGuard = useRef<RequestGuard | null>(null)
  const isMounted = useRef(true)

  const currentResolution = ownerKey !== null && resolution?.ownerKey === ownerKey
    ? resolution
    : null
  const weather = currentResolution?.weather ?? null
  const error = ownerKey !== null && ownedError?.ownerKey === ownerKey
    ? ownedError.message
    : null
  const displayStatus: WeatherDisplayStatus = apiStatus === 'OFFLINE'
    ? 'UNAVAILABLE'
    : !isSessionStateResolved || contextDisplayStatus === 'UNKNOWN'
      ? 'UNKNOWN'
      : sessionId === null || contextDisplayStatus === 'EMPTY'
        ? 'EMPTY'
        : currentResolution?.status ?? 'UNKNOWN'
  const operation: WeatherOperation = ownerKey !== null
    && ownedOperation?.ownerKey === ownerKey
    ? ownedOperation.operation
    : canLoad && currentResolution === null
      ? 'LOADING'
      : 'IDLE'

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
      requestGuard.current?.controller.abort()
      requestGuard.current = null
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let isCurrent = true

    if (canLoad && ownerKey !== null && sessionId !== null) {
      queueMicrotask(() => {
        if (!isCurrent) {
          return
        }

        const guard: RequestGuard = { ownerKey, controller }
        requestGuard.current = guard
        setOwnedOperation({ ownerKey, operation: 'LOADING' })
        setOwnedError(null)

        getSessionWeather(sessionId, controller.signal)
          .then((loadedWeather) => {
            if (!isCurrent || requestGuard.current !== guard) {
              return
            }

            if (!isWeatherForRoute(loadedWeather, departureIcao, destinationIcao)) {
              setResolution({ ownerKey, status: 'UNAVAILABLE', weather: null })
              setOwnedError({ ownerKey, message: 'Could not load current weather.' })
              return
            }

            setResolution({
              ownerKey,
              status: getWeatherStatus(loadedWeather),
              weather: loadedWeather,
            })
          })
          .catch((loadError: unknown) => {
            if (!isCurrent || isAbortError(loadError) || requestGuard.current !== guard) {
              return
            }

            if (
              loadError instanceof SessionWeatherApiError
              && loadError.code === 'SESSION_CONTEXT_NOT_FOUND'
            ) {
              setResolution({ ownerKey, status: 'EMPTY', weather: null })
              return
            }

            setResolution({ ownerKey, status: 'UNAVAILABLE', weather: null })
            setOwnedError({ ownerKey, message: getWeatherError(loadError) })
          })
          .finally(() => {
            if (isCurrent && requestGuard.current === guard) {
              requestGuard.current = null
              setOwnedOperation({ ownerKey, operation: 'IDLE' })
            }
          })
      })
    }

    return () => {
      isCurrent = false
      controller.abort()

      if (requestGuard.current?.ownerKey === ownerKey) {
        requestGuard.current.controller.abort()
        requestGuard.current = null
      }
    }
  }, [apiStatus, canLoad, contextDisplayStatus, departureIcao, destinationIcao, isSessionStateResolved, ownerKey, sessionId])

  async function refreshWeather(): Promise<boolean> {
    if (
      !canLoad
      || ownerKey === null
      || sessionId === null
      || operation !== 'IDLE'
      || requestGuard.current !== null
    ) {
      return false
    }

    const controller = new AbortController()
    const guard: RequestGuard = { ownerKey, controller }
    requestGuard.current = guard
    setOwnedOperation({ ownerKey, operation: 'LOADING' })
    setOwnedError(null)

    try {
      const loadedWeather = await getSessionWeather(sessionId, controller.signal)

      if (!isMounted.current || requestGuard.current !== guard) {
        return false
      }

      if (!isWeatherForRoute(loadedWeather, departureIcao, destinationIcao)) {
        setResolution({ ownerKey, status: 'UNAVAILABLE', weather: null })
        setOwnedError({ ownerKey, message: 'Could not load current weather.' })
        return false
      }

      setResolution({
        ownerKey,
        status: getWeatherStatus(loadedWeather),
        weather: loadedWeather,
      })
      return true
    } catch (refreshError: unknown) {
      if (
        isMounted.current
        && !isAbortError(refreshError)
        && requestGuard.current === guard
      ) {
        if (
          refreshError instanceof SessionWeatherApiError
          && refreshError.code === 'SESSION_CONTEXT_NOT_FOUND'
        ) {
          setResolution({ ownerKey, status: 'EMPTY', weather: null })
        } else {
          setResolution({ ownerKey, status: 'UNAVAILABLE', weather: null })
          setOwnedError({ ownerKey, message: getWeatherError(refreshError) })
        }
      }

      return false
    } finally {
      if (requestGuard.current === guard) {
        requestGuard.current = null
      }

      if (isMounted.current) {
        setOwnedOperation({ ownerKey, operation: 'IDLE' })
      }
    }
  }

  return {
    weather,
    displayStatus,
    operation,
    error,
    canRefresh: canLoad && operation === 'IDLE',
    refreshWeather,
  }
}
