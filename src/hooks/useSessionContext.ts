import { useEffect, useRef, useState } from 'react'
import {
  deleteSessionContext,
  getSessionContext,
  replaceSessionContext,
  SessionContextApiError,
} from '../api/monitoringApi'
import type {
  ApiStatus,
  MonitoringSessionResponse,
  SessionContextReplaceRequest,
  SessionContextResponse,
} from '../api/monitoringApi'

export type SessionContextOperation = 'IDLE' | 'LOADING' | 'SAVING' | 'CLEARING'
export type SessionContextDisplayStatus = 'UNKNOWN' | 'EMPTY' | 'AVAILABLE'

type ContextResolution = {
  sessionId: string
  status: SessionContextDisplayStatus
  context: SessionContextResponse | null
}

type OwnedOperation = {
  sessionId: string
  operation: SessionContextOperation
}

type OwnedError = {
  sessionId: string
  message: string
}

type MutationGuard = {
  sessionId: string
  operation: 'SAVING' | 'CLEARING'
  controller: AbortController
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getLoadError(error: unknown): string {
  if (error instanceof SessionContextApiError && error.code === 'SESSION_NOT_FOUND') {
    return error.message
  }

  return 'Could not load flight context.'
}

function getMutationError(error: unknown, fallback: string): string {
  if (
    error instanceof SessionContextApiError
    && (error.code === 'INVALID_SESSION_CONTEXT' || error.code === 'SESSION_NOT_FOUND')
  ) {
    return error.message
  }

  return fallback
}

export function useSessionContext(
  apiStatus: ApiStatus,
  session: MonitoringSessionResponse | null,
  isSessionStateResolved: boolean,
) {
  const sessionId = session?.session_id ?? null

  const [resolution, setResolution] = useState<ContextResolution | null>(null)
  const [ownedOperation, setOwnedOperation] = useState<OwnedOperation | null>(null)
  const [ownedError, setOwnedError] = useState<OwnedError | null>(null)
  const mutationGuard = useRef<MutationGuard | null>(null)
  const isMounted = useRef(true)

  const currentResolution = sessionId !== null && resolution?.sessionId === sessionId
    ? resolution
    : null
  const context = currentResolution?.context ?? null
  const error = sessionId !== null && ownedError?.sessionId === sessionId
    ? ownedError.message
    : null
  const displayStatus: SessionContextDisplayStatus = !isSessionStateResolved
    ? 'UNKNOWN'
    : sessionId === null
      ? 'EMPTY'
      : currentResolution?.status ?? 'UNKNOWN'
  const operation: SessionContextOperation = sessionId !== null
    && ownedOperation?.sessionId === sessionId
    ? ownedOperation.operation
    : apiStatus === 'ONLINE'
      && isSessionStateResolved
      && sessionId !== null
      && currentResolution === null
      ? 'LOADING'
      : 'IDLE'

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
      mutationGuard.current?.controller.abort()
      mutationGuard.current = null
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let isCurrent = true

    if (apiStatus === 'ONLINE' && isSessionStateResolved && sessionId !== null) {
      queueMicrotask(() => {
        if (!isCurrent) {
          return
        }

        setOwnedOperation({ sessionId, operation: 'LOADING' })
        setOwnedError(null)

        getSessionContext(sessionId, controller.signal)
          .then((loadedContext) => {
            if (!isCurrent) {
              return
            }

            setResolution({
              sessionId,
              status: loadedContext === null ? 'EMPTY' : 'AVAILABLE',
              context: loadedContext,
            })
          })
          .catch((loadError: unknown) => {
            if (
              !isCurrent
              || isAbortError(loadError)
            ) {
              return
            }

            setResolution({ sessionId, status: 'UNKNOWN', context: null })
            setOwnedError({ sessionId, message: getLoadError(loadError) })
          })
          .finally(() => {
            if (isCurrent) {
              setOwnedOperation({ sessionId, operation: 'IDLE' })
            }
          })
      })
    }

    return () => {
      isCurrent = false
      controller.abort()

      const mutation = mutationGuard.current
      if (mutation?.sessionId === sessionId) {
        mutation.controller.abort()
        mutationGuard.current = null
      }
    }
  }, [apiStatus, isSessionStateResolved, sessionId])

  async function saveContext(contextDraft: SessionContextReplaceRequest): Promise<boolean> {
    if (
      apiStatus !== 'ONLINE'
      || !isSessionStateResolved
      || sessionId === null
      || (displayStatus !== 'EMPTY' && displayStatus !== 'AVAILABLE')
      || operation !== 'IDLE'
      || mutationGuard.current !== null
    ) {
      return false
    }

    const controller = new AbortController()
    const guard: MutationGuard = { sessionId, operation: 'SAVING', controller }
    mutationGuard.current = guard
    setOwnedOperation({ sessionId, operation: 'SAVING' })
    setOwnedError(null)

    try {
      const savedContext = await replaceSessionContext(sessionId, contextDraft, controller.signal)

      if (!isMounted.current) {
        return false
      }

      setResolution({ sessionId, status: 'AVAILABLE', context: savedContext })
      return true
    } catch (saveError: unknown) {
      if (
        isMounted.current
        && !isAbortError(saveError)
      ) {
        setOwnedError({
          sessionId,
          message: getMutationError(saveError, 'Could not save flight context.'),
        })
      }

      return false
    } finally {
      if (mutationGuard.current === guard) {
        mutationGuard.current = null
      }

      if (isMounted.current) {
        setOwnedOperation({ sessionId, operation: 'IDLE' })
      }
    }
  }

  async function clearContext(): Promise<boolean> {
    if (
      apiStatus !== 'ONLINE'
      || !isSessionStateResolved
      || sessionId === null
      || displayStatus !== 'AVAILABLE'
      || operation !== 'IDLE'
      || mutationGuard.current !== null
    ) {
      return false
    }

    const controller = new AbortController()
    const guard: MutationGuard = { sessionId, operation: 'CLEARING', controller }
    mutationGuard.current = guard
    setOwnedOperation({ sessionId, operation: 'CLEARING' })
    setOwnedError(null)

    try {
      await deleteSessionContext(sessionId, controller.signal)

      if (!isMounted.current) {
        return false
      }

      setResolution({ sessionId, status: 'EMPTY', context: null })
      return true
    } catch (clearError: unknown) {
      if (
        isMounted.current
        && !isAbortError(clearError)
      ) {
        setOwnedError({
          sessionId,
          message: getMutationError(clearError, 'Could not clear flight context.'),
        })
      }

      return false
    } finally {
      if (mutationGuard.current === guard) {
        mutationGuard.current = null
      }

      if (isMounted.current) {
        setOwnedOperation({ sessionId, operation: 'IDLE' })
      }
    }
  }

  function clearError() {
    setOwnedError(null)
  }

  return {
    context,
    displayStatus,
    operation,
    error,
    saveContext,
    clearContext,
    clearError,
  }
}
