import { AppHeader } from '../../components/AppHeader/AppHeader'
import { AttentionStatus } from '../../components/AttentionStatus/AttentionStatus'
import { MonitoringSession } from '../../components/MonitoringSession/MonitoringSession'
import { FlightContext } from '../../components/FlightContext/FlightContext'
import { WeatherPanel } from '../../components/WeatherPanel/WeatherPanel'
import { useMonitoringApiHealth } from '../../hooks/useMonitoringApiHealth'
import { useMonitoringSession } from '../../hooks/useMonitoringSession'
import './MonitoringConsole.css'

export function MonitoringConsole() {
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
        <FlightContext />
        <WeatherPanel />
      </main>
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
