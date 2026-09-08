import type {
  AirportWeatherResponse,
  MetarObservationResponse,
  SessionWeatherResponse,
} from '../../api/monitoringApi'
import type {
  WeatherDisplayStatus,
  WeatherOperation,
} from '../../hooks/useSessionWeather'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './WeatherPanel.css'

type WeatherPanelProps = {
  weather: SessionWeatherResponse | null
  status: WeatherDisplayStatus
  operation: WeatherOperation
  error: string | null
  canRefresh: boolean
  onRefresh: () => Promise<boolean>
}

const STATUS_COPY: Record<WeatherDisplayStatus, string> = {
  UNKNOWN: 'Weather state has not been resolved.',
  EMPTY: 'Configure departure or destination to retrieve current METAR.',
  AVAILABLE: 'Current airport weather is available.',
  NO_DATA: 'No current METAR is reported for the configured airport route.',
  UNAVAILABLE: 'Current aviation weather is unavailable.',
}

const COMPACT_NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const INTEGER_NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

function formatObservedAt(value: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) => (
    parts.find((candidate) => candidate.type === type)?.value ?? ''
  )

  return `${part('day')} ${part('month')} · ${part('hour')}:${part('minute')} UTC`
}

function formatWind(observation: MetarObservationResponse): string {
  if (observation.wind_speed_kt === null) {
    return '—'
  }

  const direction = observation.wind_variable
    ? 'VRB'
    : observation.wind_direction_deg === null
      ? null
      : `${String(observation.wind_direction_deg).padStart(3, '0')}°`

  if (direction === null) {
    return '—'
  }

  const gust = observation.wind_gust_kt === null
    ? ''
    : ` G${COMPACT_NUMBER.format(observation.wind_gust_kt)}`

  return `${direction} / ${COMPACT_NUMBER.format(observation.wind_speed_kt)} kt${gust}`
}

function formatVisibility(observation: MetarObservationResponse): string {
  if (observation.visibility_sm === null) {
    return '—'
  }

  const qualifier = observation.visibility_greater_than ? '> ' : ''
  return `${qualifier}${COMPACT_NUMBER.format(observation.visibility_sm)} SM`
}

function formatTemperature(observation: MetarObservationResponse): string {
  const temperature = observation.temperature_c === null
    ? '—'
    : COMPACT_NUMBER.format(observation.temperature_c)
  const dewpoint = observation.dewpoint_c === null
    ? '—'
    : COMPACT_NUMBER.format(observation.dewpoint_c)

  return `${temperature} / ${dewpoint} °C`
}

function WeatherValue({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="weather-panel__metric">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function AirportSlot({
  label,
  airport,
}: {
  label: 'DEPARTURE' | 'DESTINATION'
  airport: AirportWeatherResponse | null
}) {
  const observation = airport?.observation ?? null

  return (
    <article className="weather-panel__airport" aria-label={`${label.toLowerCase()} weather`}>
      <header className="weather-panel__airport-header">
        <span className="weather-panel__slot-label">{label}</span>
        <strong className="weather-panel__station">{airport?.station_icao ?? 'Not configured'}</strong>
      </header>

      {airport === null ? (
        <p className="weather-panel__slot-message">Not configured</p>
      ) : observation === null ? (
        <p className="weather-panel__slot-message">No current METAR reported</p>
      ) : (
        <>
          <div className="weather-panel__observation-line">
            <span>{observation.report_type}</span>
            <time dateTime={observation.observed_at}>{formatObservedAt(observation.observed_at)}</time>
            {observation.flight_category === null ? (
              <span className="weather-panel__category">CATEGORY —</span>
            ) : (
              <span
                className="weather-panel__category"
                aria-label={`Flight category ${observation.flight_category}`}
              >
                {observation.flight_category}
              </span>
            )}
          </div>

          <dl className="weather-panel__metrics">
            <WeatherValue label="Wind">{formatWind(observation)}</WeatherValue>
            <WeatherValue label="Visibility">{formatVisibility(observation)}</WeatherValue>
            <WeatherValue label="Temp / dewpoint">{formatTemperature(observation)}</WeatherValue>
            <WeatherValue label="Ceiling">
              {observation.ceiling_ft_agl === null
                ? '—'
                : `${INTEGER_NUMBER.format(observation.ceiling_ft_agl)} ft AGL`}
            </WeatherValue>
            <WeatherValue label="Altimeter">
              {observation.altimeter_hpa === null
                ? '—'
                : `${COMPACT_NUMBER.format(observation.altimeter_hpa)} hPa`}
            </WeatherValue>
            <WeatherValue label="Weather">{observation.weather || '—'}</WeatherValue>
          </dl>

          <div className="weather-panel__raw">
            <span>RAW METAR</span>
            <code>{observation.raw_text}</code>
          </div>
        </>
      )}
    </article>
  )
}

export function WeatherPanel({
  weather,
  status,
  operation,
  error,
  canRefresh,
  onRefresh,
}: WeatherPanelProps) {
  const badgeLabel = operation === 'LOADING'
    ? 'CHECKING'
    : status === 'NO_DATA'
      ? 'NO DATA'
      : status
  const showAirportSlots = weather !== null || (status === 'EMPTY' && operation === 'IDLE')
  const stateCopy = status === 'UNAVAILABLE' && error !== null ? error : STATUS_COPY[status]

  return (
    <section className="panel weather-panel" aria-labelledby="weather-title">
      <div className="panel__header weather-panel__header">
        <div>
          <h2 id="weather-title" className="panel__title">Weather / METAR</h2>
          <p className="weather-panel__scope">Current METAR</p>
        </div>
        <div className="weather-panel__header-actions">
          <StatusBadge
            label={badgeLabel}
            variant={status === 'AVAILABLE' && operation === 'IDLE' ? 'normal' : 'neutral'}
          />
          <button
            className="console-button weather-panel__refresh"
            type="button"
            disabled={!canRefresh}
            aria-label="Refresh current METAR"
            onClick={() => { void onRefresh() }}
          >
            Refresh METAR
          </button>
        </div>
      </div>

      <p
        className="weather-panel__announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {operation === 'LOADING' ? 'Checking current METAR.' : stateCopy}
      </p>

      <div className="weather-panel__body">
        {operation === 'LOADING' && weather === null ? (
          <p className="panel__message">Checking current airport weather…</p>
        ) : (
          <>
            {status !== 'AVAILABLE' && (
              <p className="weather-panel__state-copy">{stateCopy}</p>
            )}
            {showAirportSlots && (
              <div className="weather-panel__airports">
                <AirportSlot label="DEPARTURE" airport={weather?.departure ?? null} />
                <AirportSlot label="DESTINATION" airport={weather?.destination ?? null} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
