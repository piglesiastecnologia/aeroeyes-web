import { AppHeader } from '../../components/AppHeader/AppHeader'
import { AttentionStatus } from '../../components/AttentionStatus/AttentionStatus'
import { MonitoringSession } from '../../components/MonitoringSession/MonitoringSession'
import { FlightContext } from '../../components/FlightContext/FlightContext'
import { WeatherPanel } from '../../components/WeatherPanel/WeatherPanel'
import './MonitoringConsole.css'

export function MonitoringConsole() {
  return (
    <div className="monitoring-console">
      <a className="skip-link" href="#monitoring-main">Skip to monitoring console</a>
      <AppHeader />
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
