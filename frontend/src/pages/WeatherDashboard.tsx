import { useEffect, useState } from 'react';
import Seo from '../components/Seo';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

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

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const [balloon, setBalloon] = useState<BalloonFlightResponse | null>(null);
  const [balloonError, setBalloonError] = useState<string | null>(null);

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

  return (
    <div className="weather-shell">
      <Seo
        title="Balloon Flight Telemetry | Raghvendra.cloud"
        description="High-altitude balloon flight telemetry dashboard — altitude, temperature, humidity, UV, ozone, and GPS lock from an onboard sensor payload."
        path="/models/weather-dashboard"
      />
      <div className="weather-hero">
        <div className="weather-hero-content">
          <div>
            <p className="weather-eyebrow">Onboard Payload</p>
            <h2>Balloon Flight Telemetry</h2>
            <p className="weather-subtitle">
              Sensor readings recorded during a high-altitude balloon flight — temperature,
              humidity, pressure, UV, ozone, and GPS lock across the ascent.
            </p>
          </div>
          {balloonError && <p className="weather-error">{balloonError}</p>}
        </div>
      </div>

      <div className="weather-container">
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

        <p className="weather-credit">
          Balloon flight telemetry data © {new Date().getFullYear()} Technische Hochschule Mittelhessen.
          All rights reserved.
        </p>
      </div>
    </div>
  );
}
