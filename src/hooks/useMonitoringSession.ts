import { useEffect, useRef, useState } from 'react'
import {
  completeMonitoringSession,
  createMonitoringSession,
  getMonitoringSession,
} from '../api/monitoringApi'
import type {
  ApiStatus,
  MonitoringSessionResponse,
  MonitoringSessionStatus,
} from '../api/monitoringApi'

export type MonitoringSessionOperation = 'IDLE' | 'RESTORING' | 'STARTING' | 'COMPLETING'
export type SessionDisplayStatus = MonitoringSessionStatus | 'NONE' | 'UNKNOWN'

const SESSION_STORAGE_KEY = 'aeroeyes.monitoringSessionId'

export function useMonitoringSession(apiStatus: ApiStatus) {
  const [session, setSession] = useState<MonitoringSessionResponse | null>(null)
  const [operation, setOperation] = useState<MonitoringSessionOperation>('RESTORING')
  const [error, setError] = useState<string | null>(null)
  const [isSessionStateResolved, setIsSessionStateResolved] = useState(false)
  const operationGuard = useRef<MonitoringSessionOperation | null>(null)
  const isMounted = useRef(true)
  const sessionDisplayStatus: SessionDisplayStatus = session?.status
    ?? (isSessionStateResolved ? 'NONE' : 'UNKNOWN')

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (apiStatus !== 'ONLINE') {
      return
    }

    const controller = new AbortController()
    let isCurrent = true

    queueMicrotask(() => {
      if (!isCurrent) {
        return
      }

      setIsSessionStateResolved(false)

      let storedSessionId: string | null

      try {
        storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
      } catch {
        setOperation('IDLE')
        setError('Could not access session storage.')
        return
      }

      if (!storedSessionId) {
        setIsSessionStateResolved(true)
        setOperation('IDLE')
        return
      }

      operationGuard.current = 'RESTORING'
      setOperation('RESTORING')
      setError(null)

      getMonitoringSession(storedSessionId, controller.signal)
        .then((restoredSession) => {
          if (!isCurrent) {
            return
          }

          if (restoredSession === null) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY)
            setSession(null)
            setIsSessionStateResolved(true)
            return
          }

          setSession(restoredSession)
          setIsSessionStateResolved(true)
        })
        .catch(() => {
          if (isCurrent) {
            setIsSessionStateResolved(false)
            setError('Could not restore monitoring session.')
          }
        })
        .finally(() => {
          if (isCurrent) {
            operationGuard.current = null
            setOperation('IDLE')
          }
        })
    })

    return () => {
      isCurrent = false
      controller.abort()

      if (operationGuard.current === 'RESTORING') {
        operationGuard.current = null
      }
    }
  }, [apiStatus])

  async function startSession() {
    if (
      apiStatus !== 'ONLINE'
      || !isSessionStateResolved
      || operationGuard.current !== null
      || operation !== 'IDLE'
    ) {
      return
    }

    operationGuard.current = 'STARTING'
    setOperation('STARTING')
    setError(null)

    try {
      const createdSession = await createMonitoringSession()

      if (!isMounted.current) {
        return
      }

      setSession(createdSession)
      setIsSessionStateResolved(true)

      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, createdSession.session_id)
      } catch {
        setError('Session started, but it could not be saved for reload.')
      }
    } catch {
      if (isMounted.current) {
        setError('Could not start monitoring session.')
      }
    } finally {
      operationGuard.current = null

      if (isMounted.current) {
        setOperation('IDLE')
      }
    }
  }

  async function completeSession() {
    if (
      apiStatus !== 'ONLINE'
      || !isSessionStateResolved
      || session?.status !== 'ACTIVE'
      || operationGuard.current !== null
      || operation !== 'IDLE'
    ) {
      return
    }

    operationGuard.current = 'COMPLETING'
    setOperation('COMPLETING')
    setError(null)

    try {
      const completedSession = await completeMonitoringSession(session.session_id)

      if (isMounted.current) {
        setSession(completedSession)
      }
    } catch {
      if (isMounted.current) {
        setError('Could not complete monitoring session.')
      }
    } finally {
      operationGuard.current = null

      if (isMounted.current) {
        setOperation('IDLE')
      }
    }
  }

  return {
    session,
    sessionDisplayStatus,
    operation,
    error,
    isSessionStateResolved,
    startSession,
    completeSession,
  }
}
