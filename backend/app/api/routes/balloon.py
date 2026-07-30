"""Endpoint serving processed high-altitude balloon telemetry for the dashboard."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool

from app.schemas.balloon import (
    BalloonBounds,
    BalloonFlightResponse,
    BalloonRange,
    BalloonSample,
    BalloonStats,
)

router = APIRouter(prefix="/balloon", tags=["balloon"])

MAX_SERIES_POINTS = 220
VALID_PRESSURE_RANGE = (500.0, 1100.0)


def _load_flight(data_path: Path) -> BalloonFlightResponse:
    if not data_path.exists():
        raise FileNotFoundError(data_path)

    readings: list[dict] = []
    with data_path.open("rb") as handle:
        for raw_line in handle.read().split(b"\n"):
            line = raw_line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except (json.JSONDecodeError, UnicodeDecodeError):
                continue
            pres = record.get("pres")
            if pres is None or not (VALID_PRESSURE_RANGE[0] <= pres <= VALID_PRESSURE_RANGE[1]):
                continue
            readings.append(record)

    if not readings:
        raise ValueError("No valid balloon telemetry readings found")

    readings.sort(key=lambda r: r["timestamp"])

    temps = [r["temp"] for r in readings]
    hums = [r["hum"] for r in readings]
    press = [r["pres"] for r in readings]
    alts = [r["alt"] for r in readings]
    uvs = [r["uv"] for r in readings]
    ozones = [r["ozone"] for r in readings]
    fixed = [r for r in readings if r.get("gps_fix") == 1 and (r["lat"] or r["lon"])]

    start = readings[0]["timestamp"]
    end = readings[-1]["timestamp"]
    from datetime import datetime

    duration_minutes = (datetime.fromisoformat(end) - datetime.fromisoformat(start)).total_seconds() / 60

    def _range(values: list[float]) -> BalloonRange:
        return BalloonRange(min=min(values), max=max(values), avg=sum(values) / len(values))

    bounds = None
    if fixed:
        lats = [r["lat"] for r in fixed]
        lons = [r["lon"] for r in fixed]
        bounds = BalloonBounds(lat_min=min(lats), lat_max=max(lats), lon_min=min(lons), lon_max=max(lons))

    stats = BalloonStats(
        samples=len(readings),
        start=start,
        end=end,
        duration_minutes=round(duration_minutes, 1),
        altitude=_range(alts),
        temp=_range(temps),
        humidity=_range(hums),
        pressure=_range(press),
        uv_max=max(uvs),
        ozone=_range(ozones),
        gps_fix_count=len(fixed),
        gps_fix_ratio=round(len(fixed) / len(readings), 4),
        bounds=bounds,
    )

    step = max(1, len(readings) // MAX_SERIES_POINTS)
    sampled = readings[::step]
    if sampled[-1] is not readings[-1]:
        sampled.append(readings[-1])

    series = [
        BalloonSample(
            timestamp=r["timestamp"],
            temp=r["temp"],
            hum=r["hum"],
            pres=r["pres"],
            uv=r["uv"],
            ozone=r["ozone"],
            alt=r["alt"],
            gps_fix=r["gps_fix"],
            lat=r["lat"],
            lon=r["lon"],
        )
        for r in sampled
    ]

    return BalloonFlightResponse(stats=stats, series=series)


@router.get("/flight", response_model=BalloonFlightResponse)
async def get_flight(request: Request) -> BalloonFlightResponse:
    """Return summary stats and a downsampled time series for the latest balloon flight."""

    data_path = request.app.state.settings.resolved_balloon_data_path
    try:
        return await run_in_threadpool(_load_flight, data_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Balloon telemetry data not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
