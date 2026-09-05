import { StatusBadge } from '../StatusBadge/StatusBadge'
import './WeatherPanel.css'

export function WeatherPanel() {
  return (
    <section className="panel weather-panel" aria-labelledby="weather-title">
      <div className="panel__header">
        <h2 id="weather-title" className="panel__title">Weather / METAR</h2>
        <StatusBadge label="UNAVAILABLE" />
      </div>
      <div className="weather-panel__body">
        <p className="panel__message">No weather context available</p>
        <p className="panel__description">METAR reports will appear here when available.</p>
      </div>
    </section>
  )
}
