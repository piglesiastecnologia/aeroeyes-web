import { AppHeader } from '../../components/AppHeader/AppHeader'
import { AttentionStatus } from '../../components/AttentionStatus/AttentionStatus'
import { MonitoringSession } from '../../components/MonitoringSession/MonitoringSession'
import { FlightContext } from '../../components/FlightContext/FlightContext'
import { WeatherPanel } from '../../components/WeatherPanel/WeatherPanel'
import { useMonitoringApiHealth } from '../../hooks/useMonitoringApiHealth'
import './MonitoringConsole.css'

export function MonitoringConsole() {
  const { status: apiStatus } = useMonitoringApiHealth()

  return (
    <div className="monitoring-console">
      <a className="skip-link" href="#monitoring-main">Skip to monitoring console</a>
      <AppHeader apiStatus={apiStatus} />
      <main id="monitoring-main" className="monitoring-console__grid" tabIndex={-1}>
        <AttentionStatus />
        <MonitoringSession />
        <FlightContext />
        <WeatherPanel />
      </main>
      <footer className="monitoring-console__footer">
        <span>AeroEyes <span aria-hidden="true">/</span> EFB Monitoring Console</span>
        <span>Monitoring has not started</span>
      </footer>
    </div>
  )
}
