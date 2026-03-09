"""Async Groq API client wrapper for agent prompts."""

from __future__ import annotations

import json
import logging
from time import perf_counter
from typing import Any

import httpx

from app.core.config import Settings
from app.observability.metrics import LLM_INFERENCE_TIME_SECONDS

logger = logging.getLogger(__name__)


class GeminiClient:
    """Handles text generation via Groq REST API (drop-in Gemini replacement)."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model_name = settings.gemini_model
        self._base_url = "https://api.groq.com/openai/v1/chat/completions"
        self._api_key = settings.gemini_api_key

    async def generate(
        self,
        prompt: str,
        *,
        agent_name: str,
        response_mime_type: str = "text/plain",
        temperature: float = 0.2,
        max_output_tokens: int | None = None,
    ) -> str:
        """Generate model output and track inference latency."""

        payload: dict[str, Any] = {
            "model": self._model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_output_tokens or self._settings.gemini_max_output_tokens,
        }

        if response_mime_type == "application/json":
            payload["response_format"] = {"type": "json_object"}

        started_at = perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self._settings.gemini_timeout_seconds) as client:
                response = await client.post(
                    self._base_url,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("Groq call failed for agent '%s': %s", agent_name, exc)
            raise RuntimeError("Groq request failed") from exc
        finally:
            LLM_INFERENCE_TIME_SECONDS.labels(agent_name).observe(perf_counter() - started_at)

        return self._extract_text(response.json())

    @staticmethod
    def _extract_text(response_payload: dict[str, Any]) -> str:
        choices = response_payload.get("choices") or []
        if not choices:
            return ""
        message = choices[0].get("message") or {}
        return (message.get("content") or "").strip()
