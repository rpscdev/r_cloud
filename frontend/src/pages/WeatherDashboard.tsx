import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Seo from '../components/Seo';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

const DEFAULT_LOCATION = {
  name: 'New York, US',
  latitude: 40.7128,
  longitude: -74.0060,
  timezone: 'auto',
};

type GeoResult = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type ForecastResponse = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
};

type BalloonSample = {
  timestamp: string;
  temp: number;
  hum: number;
  pres: number;
  uv: number;
  ozone: number;
  alt: number;
  gps_fix: number;
  lat: number;
  lon: number;
};

type BalloonRange = { min: number; max: number; avg: number };

type BalloonStats = {
  samples: number;
  start: string;
  end: string;
  duration_minutes: number;
  altitude: BalloonRange;
  temp: BalloonRange;
  humidity: BalloonRange;
  pressure: BalloonRange;
  uv_max: number;
  ozone: BalloonRange;
  gps_fix_count: number;
  gps_fix_ratio: number;
  bounds: { lat_min: number; lat_max: number; lon_min: number; lon_max: number } | null;
};

type BalloonFlightResponse = {
  stats: BalloonStats;
  series: BalloonSample[];
};

function uvCategory(uv: number) {
  if (uv >= 11) return 'Extreme';
  if (uv >= 8) return 'Very High';
  if (uv >= 6) return 'High';
  if (uv >= 3) return 'Moderate';
  return 'Low';
}

function weatherCodeToLabel(code: number) {
  if ([0].includes(code)) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([71, 73, 75].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Mixed';
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildSparkline(values: number[], min?: number, max?: number) {
  const vMin = min ?? Math.min(...values);
  const vMax = max ?? Math.max(...values);
  const range = vMax - vMin || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - vMin) / range) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return points;
}

export default function WeatherDashboard() {
  const [query, setQuery] = useState('New York');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balloon, setBalloon] = useState<BalloonFlightResponse | null>(null);
  const [balloonError, setBalloonError] = useState<string | null>(null);
  const track = (name: string, data?: Record<string, unknown>) => window.umami?.track(name, data);

  useEffect(() => {
    const controller = new AbortController();
    async function loadBalloon() {
      try {
        const response = await fetch(`${API_BASE_URL}/balloon/flight`, { signal: controller.signal });
        if (!response.ok) throw new Error('Balloon telemetry request failed');
        const data = (await response.json()) as BalloonFlightResponse;
        setBalloon(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setBalloonError('Could not load balloon flight telemetry.');
      }
    }
    loadBalloon();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadForecast() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', String(location.latitude));
        url.searchParams.set('longitude', String(location.longitude));
        url.searchParams.set('timezone', location.timezone || 'auto');
        url.searchParams.set(
          'current',
          'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m'
        );
        url.searchParams.set(
          'hourly',
          'temperature_2m,precipitation_probability,wind_speed_10m'
        );
        url.searchParams.set(
          'daily',
          'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset'
        );

        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) throw new Error('Weather API request failed');
        const data = (await response.json()) as ForecastResponse;
        setForecast(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Could not load weather data. Try a different city.');
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
    return () => controller.abort();
  }, [location.latitude, location.longitude, location.timezone]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    track('weather:search', { query: query.trim() });
    setLoading(true);
    setError(null);
    try {
      const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geoUrl.searchParams.set('name', query.trim());
      geoUrl.searchParams.set('count', '1');
      geoUrl.searchParams.set('language', 'en');
      geoUrl.searchParams.set('format', 'json');
      const response = await fetch(geoUrl.toString());
      if (!response.ok) throw new Error('Geo lookup failed');
      const data = await response.json();
      const result = (data?.results?.[0] ?? null) as GeoResult | null;
      if (!result) {
        setError('City not found. Try another name.');
        setLoading(false);
        return;
      }
      const label = `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}, ${result.country}`;
      setLocation({
        name: label,
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone || 'auto',
      });
    } catch {
      setError('Search failed. Please try again.');
      setLoading(false);
    }
  }

  const derived = useMemo(() => {
    if (!forecast) return null;
    const current = forecast.current;
    const feelsDelta = current.apparent_temperature - current.temperature_2m;
    const comfort = clamp(100 - Math.abs(current.apparent_temperature - 22) * 3 - current.relative_humidity_2m * 0.2, 0, 100);
    const rainRisk = forecast.daily.precipitation_probability_max[0] ?? 0;
    const sunrise = forecast.daily.sunrise[0];
    const sunset = forecast.daily.sunset[0];
    const daylight = sunrise && sunset
      ? (new Date(sunset).getTime() - new Date(sunrise).getTime()) / (1000 * 60 * 60)
      : null;
    return {
      feelsDelta,
      comfort: Math.round(comfort),
      rainRisk,
      sunrise,
      sunset,
      daylight: daylight ? Math.round(daylight * 10) / 10 : null,
    };
  }, [forecast]);

  const hourlySlice = useMemo(() => {
    if (!forecast) return null;
    const hours = 12;
    return {
      times: forecast.hourly.time.slice(0, hours),
      temps: forecast.hourly.temperature_2m.slice(0, hours),
      rain: forecast.hourly.precipitation_probability.slice(0, hours),
      wind: forecast.hourly.wind_speed_10m.slice(0, hours),
    };
  }, [forecast]);

  const daily = useMemo(() => {
    if (!forecast) return null;
    return forecast.daily.time.map((time, index) => ({
      date: time,
      max: forecast.daily.temperature_2m_max[index],
      min: forecast.daily.temperature_2m_min[index],
      rain: forecast.daily.precipitation_probability_max[index],
    }));
  }, [forecast]);

  return (
    <div className="weather-shell">
      <Seo
        title="Weather Dashboard | Raghvendra.cloud"
        description="Interactive weather intelligence dashboard with live forecast analytics, trends, and insights."
        path="/models/weather-dashboard"
      />
      <div className="weather-hero">
        <div className="weather-hero-content">
          <div>
            <p className="weather-eyebrow">AI Weather Lab</p>
            <h2>Live Forecast Insights</h2>
            <p className="weather-subtitle">
              A lightweight data dashboard using Open-Meteo. Search a city, then explore
              live signals, micro-trends, and a 7-day outlook.
            </p>
          </div>
          <form className="weather-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search city (e.g. Delhi, London)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Loading…' : 'Analyze'}
            </button>
          </form>
          {error && <p className="weather-error">{error}</p>}
        </div>
      </div>

      <div className="weather-container">
        <section className="weather-kpis">
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">Current Temp</p>
              <h3>{forecast ? `${forecast.current.temperature_2m}°C` : '--'}</h3>
              <p className="weather-muted">{location.name}</p>
            </div>
            <div className="weather-pill">
              {forecast ? weatherCodeToLabel(forecast.current.weather_code) : '—'}
            </div>
          </div>
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">Feels Like</p>
              <h3>{forecast ? `${forecast.current.apparent_temperature}°C` : '--'}</h3>
              <p className="weather-muted">
                {derived ? `${derived.feelsDelta >= 0 ? '+' : ''}${derived.feelsDelta.toFixed(1)}°` : '—'}
              </p>
            </div>
            <div className="weather-stat">
              <span>Humidity</span>
              <strong>{forecast ? `${forecast.current.relative_humidity_2m}%` : '--'}</strong>
            </div>
          </div>
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">Comfort Index</p>
              <h3>{derived ? `${derived.comfort}/100` : '--'}</h3>
              <p className="weather-muted">AI-derived score</p>
            </div>
            <div className="weather-stat">
              <span>Rain Risk</span>
              <strong>{derived ? `${derived.rainRisk}%` : '--'}</strong>
            </div>
          </div>
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">Daylight</p>
              <h3>{derived?.daylight ? `${derived.daylight} hrs` : '--'}</h3>
              <p className="weather-muted">
                {derived?.sunrise && derived?.sunset
                  ? `${formatTime(derived.sunrise)} → ${formatTime(derived.sunset)}`
                  : '—'}
              </p>
            </div>
            <div className="weather-stat">
              <span>Wind</span>
              <strong>{forecast ? `${forecast.current.wind_speed_10m} km/h` : '--'}</strong>
            </div>
          </div>
        </section>

        <section className="weather-panels">
          <div className="weather-panel">
            <div className="weather-panel-header">
              <div>
                <h3>Next 12 Hours</h3>
                <p className="weather-muted">Temperature trend + precipitation odds</p>
              </div>
              <div className="weather-chip">Live</div>
            </div>
            <div className="weather-chart">
              {hourlySlice && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={buildSparkline(hourlySlice.temps)}
                    fill="none"
                    stroke="#aeb3ff"
                    strokeWidth="2"
                  />
                  <polyline
                    points={buildSparkline(hourlySlice.rain)}
                    fill="none"
                    stroke="#646cff"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                </svg>
              )}
            </div>
            <div className="weather-hour-grid">
              {hourlySlice?.times.map((time, index) => (
                <div key={time} className="weather-hour">
                  <span>{formatTime(time)}</span>
                  <strong>{hourlySlice.temps[index]}°</strong>
                  <span>{hourlySlice.rain[index]}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="weather-panel">
            <div className="weather-panel-header">
              <div>
                <h3>7-Day Outlook</h3>
                <p className="weather-muted">High/low range and rain probability</p>
              </div>
              <div className="weather-chip">Forecast</div>
            </div>
            <div className="weather-forecast">
              {daily?.map((day) => (
                <div key={day.date} className="weather-forecast-row">
                  <span>{formatDate(day.date)}</span>
                  <div className="weather-range">
                    <span>{Math.round(day.min)}°</span>
                    <div className="weather-range-bar">
                      <div
                        className="weather-range-fill"
                        style={{
                          width: `${clamp(((day.max - day.min) / 25) * 100, 20, 100)}%`,
                        }}
                      />
                    </div>
                    <span>{Math.round(day.max)}°</span>
                  </div>
                  <span className="weather-rain">{Math.round(day.rain)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="weather-panel weather-insights">
            <div className="weather-panel-header">
              <div>
                <h3>Signal Summary</h3>
                <p className="weather-muted">Auto-generated insights</p>
              </div>
              <div className="weather-chip">AI Notes</div>
            </div>
            <ul className="weather-insight-list">
              <li>
                {derived
                  ? derived.comfort > 70
                    ? 'Comfort is high today. Great for outdoor work or photo shoots.'
                    : 'Comfort is lower today. Consider indoor work or light scheduling.'
                  : 'Comfort analysis loading.'}
              </li>
              <li>
                {forecast
                  ? forecast.current.wind_speed_10m > 25
                    ? 'Wind speeds are elevated. Plan for slower commutes and secure gear.'
                    : 'Wind conditions are calm and stable.'
                  : 'Wind analysis loading.'}
              </li>
              <li>
                {derived
                  ? derived.rainRisk > 60
                    ? 'High precipitation risk. Schedule a backup plan.'
                    : 'Rain risk is low. Outdoor plans look good.'
                  : 'Rain analysis loading.'}
              </li>
            </ul>
            <div className="weather-meta">
              <div>
                <span>Updated</span>
                <strong>{forecast ? new Date(forecast.current.time).toLocaleString() : '--'}</strong>
              </div>
              <div>
                <span>Data Source</span>
                <strong>Open-Meteo API</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="weather-section-header">
          <div>
            <p className="weather-eyebrow">Onboard Payload</p>
            <h2>Balloon Flight Telemetry</h2>
            <p className="weather-subtitle">
              Sensor readings recorded during a high-altitude balloon flight — temperature,
              humidity, pressure, UV, ozone, and GPS lock across the ascent.
            </p>
          </div>
        </section>

        {balloonError && <p className="weather-error">{balloonError}</p>}

        <section className="weather-kpis">
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">Peak Altitude</p>
              <h3>{balloon ? `${Math.round(balloon.stats.altitude.max)} m` : '--'}</h3>
              <p className="weather-muted">
                {balloon ? `${balloon.stats.duration_minutes} min flight` : 'Loading…'}
              </p>
            </div>
            <div className="weather-pill">{balloon ? `${balloon.stats.samples} samples` : '—'}</div>
          </div>
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">Temperature Range</p>
              <h3>
                {balloon
                  ? `${Math.round(balloon.stats.temp.min)}° / ${Math.round(balloon.stats.temp.max)}°`
                  : '--'}
              </h3>
              <p className="weather-muted">Min / max across flight</p>
            </div>
            <div className="weather-stat">
              <span>Avg Humidity</span>
              <strong>{balloon ? `${balloon.stats.humidity.avg.toFixed(1)}%` : '--'}</strong>
            </div>
          </div>
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">UV Exposure</p>
              <h3>{balloon ? balloon.stats.uv_max : '--'}</h3>
              <p className="weather-muted">{balloon ? uvCategory(balloon.stats.uv_max) : '—'}</p>
            </div>
            <div className="weather-stat">
              <span>Ozone</span>
              <strong>
                {balloon ? `${Math.round(balloon.stats.ozone.min)}–${Math.round(balloon.stats.ozone.max)}` : '--'}
              </strong>
            </div>
          </div>
          <div className="weather-kpi-card">
            <div>
              <p className="weather-label">GPS Fix Quality</p>
              <h3>{balloon ? `${Math.round(balloon.stats.gps_fix_ratio * 100)}%` : '--'}</h3>
              <p className="weather-muted">
                {balloon ? `${balloon.stats.gps_fix_count} of ${balloon.stats.samples} samples` : 'Loading…'}
              </p>
            </div>
            <div className="weather-range-bar weather-gps-bar">
              <div
                className="weather-range-fill"
                style={{ width: `${balloon ? clamp(balloon.stats.gps_fix_ratio * 100, 4, 100) : 0}%` }}
              />
            </div>
          </div>
        </section>

        <section className="weather-panels">
          <div className="weather-panel">
            <div className="weather-panel-header">
              <div>
                <h3>Altitude Profile</h3>
                <p className="weather-muted">Height above ground across the flight</p>
              </div>
              <div className="weather-chip">Ascent</div>
            </div>
            <div className="weather-chart">
              {balloon && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={buildSparkline(balloon.series.map((s) => s.alt))}
                    fill="none"
                    stroke="#78d4ff"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>
            <div className="weather-hour-grid">
              {balloon && (
                <>
                  <div className="weather-hour">
                    <span>{formatTime(balloon.stats.start)}</span>
                    <strong>{Math.round(balloon.series[0].alt)} m</strong>
                    <span>Launch</span>
                  </div>
                  <div className="weather-hour">
                    <span>Peak</span>
                    <strong>{Math.round(balloon.stats.altitude.max)} m</strong>
                    <span>Apex</span>
                  </div>
                  <div className="weather-hour">
                    <span>{formatTime(balloon.stats.end)}</span>
                    <strong>{Math.round(balloon.series[balloon.series.length - 1].alt)} m</strong>
                    <span>Last fix</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="weather-panel">
            <div className="weather-panel-header">
              <div>
                <h3>Environmental Trend</h3>
                <p className="weather-muted">Temperature vs humidity over the flight</p>
              </div>
              <div className="weather-chip">Sensors</div>
            </div>
            <div className="weather-chart">
              {balloon && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={buildSparkline(balloon.series.map((s) => s.temp))}
                    fill="none"
                    stroke="#aeb3ff"
                    strokeWidth="2"
                  />
                  <polyline
                    points={buildSparkline(balloon.series.map((s) => s.hum))}
                    fill="none"
                    stroke="#646cff"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                </svg>
              )}
            </div>
            <div className="weather-hour-grid">
              {balloon && (
                <>
                  <div className="weather-hour">
                    <span>Temp</span>
                    <strong>{balloon.stats.temp.avg.toFixed(1)}°</strong>
                    <span>avg</span>
                  </div>
                  <div className="weather-hour">
                    <span>Humidity</span>
                    <strong>{balloon.stats.humidity.avg.toFixed(1)}%</strong>
                    <span>avg</span>
                  </div>
                  <div className="weather-hour">
                    <span>Pressure</span>
                    <strong>{balloon.stats.pressure.avg.toFixed(0)}</strong>
                    <span>hPa avg</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="weather-panel weather-insights">
            <div className="weather-panel-header">
              <div>
                <h3>Flight Insights</h3>
                <p className="weather-muted">Auto-generated from telemetry</p>
              </div>
              <div className="weather-chip">AI Notes</div>
            </div>
            <ul className="weather-insight-list">
              <li>
                {balloon
                  ? `The payload climbed to a peak altitude of ${Math.round(balloon.stats.altitude.max)} m over a ${balloon.stats.duration_minutes}-minute flight.`
                  : 'Altitude analysis loading.'}
              </li>
              <li>
                {balloon
                  ? balloon.stats.uv_max >= 8
                    ? `UV index peaked at ${balloon.stats.uv_max} (${uvCategory(balloon.stats.uv_max)}) — extreme exposure at altitude, protective shielding recommended.`
                    : `UV index stayed moderate, peaking at ${balloon.stats.uv_max}.`
                  : 'UV analysis loading.'}
              </li>
              <li>
                {balloon
                  ? `GPS fix was acquired for ${Math.round(balloon.stats.gps_fix_ratio * 100)}% of the flight (${balloon.stats.gps_fix_count} of ${balloon.stats.samples} samples).`
                  : 'GPS analysis loading.'}
              </li>
              <li>
                {balloon
                  ? `Ozone concentration ranged ${Math.round(balloon.stats.ozone.min)}–${Math.round(balloon.stats.ozone.max)} ppb across the ascent.`
                  : 'Ozone analysis loading.'}
              </li>
            </ul>
            <div className="weather-meta">
              <div>
                <span>Flight Window</span>
                <strong>
                  {balloon ? `${formatTime(balloon.stats.start)} → ${formatTime(balloon.stats.end)}` : '--'}
                </strong>
              </div>
              <div>
                <span>Data Source</span>
                <strong>Onboard Payload Sensors</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
