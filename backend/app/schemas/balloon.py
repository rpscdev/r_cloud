"""Pydantic schemas for high-altitude balloon telemetry endpoints."""

from __future__ import annotations

from pydantic import BaseModel


class BalloonSample(BaseModel):
    """A single (possibly downsampled) telemetry reading."""

    timestamp: str
    temp: float
    hum: float
    pres: float
    uv: int
    ozone: int
    alt: float
    gps_fix: int
    lat: float
    lon: float


class BalloonRange(BaseModel):
    """Min/max/avg summary for one sensor channel."""

    min: float
    max: float
    avg: float


class BalloonBounds(BaseModel):
    """Geographic bounding box covering GPS-fixed samples, if any."""

    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


class BalloonStats(BaseModel):
    """Flight-level summary statistics."""

    samples: int
    start: str
    end: str
    duration_minutes: float
    altitude: BalloonRange
    temp: BalloonRange
    humidity: BalloonRange
    pressure: BalloonRange
    uv_max: int
    ozone: BalloonRange
    gps_fix_count: int
    gps_fix_ratio: float
    bounds: BalloonBounds | None = None


class BalloonFlightResponse(BaseModel):
    """Full payload for the balloon flight dashboard."""

    stats: BalloonStats
    series: list[BalloonSample]
