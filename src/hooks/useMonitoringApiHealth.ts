import { useEffect, useState } from 'react'
import { getMonitoringApiHealth } from '../api/monitoringApi'
import type { ApiStatus } from '../api/monitoringApi'

export function useMonitoringApiHealth() {
  const [status, setStatus] = useState<ApiStatus>('UNKNOWN')

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    queueMicrotask(() => {
      if (!isMounted) {
        return
      }

      setStatus('CHECKING')

      getMonitoringApiHealth(controller.signal)
        .then(() => {
          if (isMounted) {
            setStatus('ONLINE')
          }
        })
        .catch(() => {
          if (isMounted) {
            setStatus('OFFLINE')
          }
        })
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  return { status }
}
