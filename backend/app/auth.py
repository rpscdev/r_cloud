"""Access control dependency for sensitive AI routes."""

from __future__ import annotations

import hmac
import logging

from fastapi import Header, HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def verify_access(x_app_password: str | None = Header(default=None, alias="x-app-password")) -> None:
    """Validate internal API access password from request header."""

    expected_password = get_settings().app_access_password

    if not x_app_password:
        logger.warning("Blocked request: missing x-app-password header")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if not hmac.compare_digest(x_app_password, expected_password):
        logger.warning("Blocked request: invalid x-app-password header")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
