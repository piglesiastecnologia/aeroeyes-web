import { useState } from 'react'
import { AppHeader } from '../../components/AppHeader/AppHeader'
import { AttentionStatus } from '../../components/AttentionStatus/AttentionStatus'
import { MonitoringSession } from '../../components/MonitoringSession/MonitoringSession'
import { FlightContext } from '../../components/FlightContext/FlightContext'
import { FlightContextDrawer } from '../../components/FlightContextDrawer/FlightContextDrawer'
import { WeatherPanel } from '../../components/WeatherPanel/WeatherPanel'
import { useMonitoringApiHealth } from '../../hooks/useMonitoringApiHealth'
import { useMonitoringSession } from '../../hooks/useMonitoringSession'
import { useSessionContext } from '../../hooks/useSessionContext'
import { useSessionWeather } from '../../hooks/useSessionWeather'
import './MonitoringConsole.css'

export function MonitoringConsole() {
  const [drawerSessionId, setDrawerSessionId] = useState<string | null>(null)
  const { status: apiStatus } = useMonitoringApiHealth()
  const {
    session,
    sessionDisplayStatus,
    operation,
    error,
    isSessionStateResolved,
    startSession,
    completeSession,
  } = useMonitoringSession(apiStatus)
  const {
    context,
    displayStatus: contextDisplayStatus,
    operation: contextOperation,
    error: contextError,
    saveContext,
    clearContext,
    clearError: clearContextError,
  } = useSessionContext(apiStatus, session, isSessionStateResolved)
  const {
    weather,
    displayStatus: weatherDisplayStatus,
    operation: weatherOperation,
    error: weatherError,
    canRefresh: canRefreshWeather,
    refreshWeather,
  } = useSessionWeather(
    apiStatus,
    session,
    isSessionStateResolved,
    context,
    contextDisplayStatus,
  )
  const canEditContext = (
    apiStatus === 'ONLINE'
    && isSessionStateResolved
    && session?.status === 'ACTIVE'
    && contextOperation === 'IDLE'
    && (contextDisplayStatus === 'EMPTY' || contextDisplayStatus === 'AVAILABLE')
  )
  const isDrawerOpen = (
    drawerSessionId !== null
    && drawerSessionId === session?.session_id
    && apiStatus === 'ONLINE'
    && (contextDisplayStatus === 'EMPTY' || contextDisplayStatus === 'AVAILABLE')
  )

  function openContextDrawer() {
    if (!canEditContext || session === null) {
      return
    }

    clearContextError()
    setDrawerSessionId(session.session_id)
  }

  return (
    <div className="monitoring-console">
      <a className="skip-link" href="#monitoring-main">Skip to monitoring console</a>
      <AppHeader apiStatus={apiStatus} sessionStatus={sessionDisplayStatus} />
      <main id="monitoring-main" className="monitoring-console__grid" tabIndex={-1}>
        <AttentionStatus sessionStatus={sessionDisplayStatus} />
        <MonitoringSession
          apiStatus={apiStatus}
          session={session}
          sessionStatus={sessionDisplayStatus}
          operation={operation}
          error={error}
          isSessionStateResolved={isSessionStateResolved}
          onStart={startSession}
          onComplete={completeSession}
        />
        <FlightContext
          context={context}
          status={contextDisplayStatus}
          operation={contextOperation}
          error={contextError}
          sessionStatus={sessionDisplayStatus}
          canEdit={canEditContext}
          onEdit={openContextDrawer}
        />
        <WeatherPanel
          weather={weather}
          status={weatherDisplayStatus}
          operation={weatherOperation}
          error={weatherError}
          canRefresh={canRefreshWeather}
          onRefresh={refreshWeather}
        />
      </main>
      {isDrawerOpen && (
        <FlightContextDrawer
          key={drawerSessionId}
          context={context}
          operation={contextOperation}
          error={contextError}
          onSave={saveContext}
          onClear={clearContext}
          onClose={() => setDrawerSessionId(null)}
        />
      )}
      <footer className="monitoring-console__footer">
        <span>AeroEyes <span aria-hidden="true">/</span> EFB Monitoring Console</span>
        <span>
          {sessionDisplayStatus === 'UNKNOWN'
            ? 'Monitoring session state unavailable'
            : sessionDisplayStatus === 'ACTIVE'
              ? 'Monitoring session active'
              : sessionDisplayStatus === 'COMPLETED'
                ? 'Monitoring session completed'
                : 'Monitoring has not started'}
        </span>
      </footer>
    </div>
  )
}
