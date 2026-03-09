"""Helpers for robust JSON extraction from LLM text output."""

from __future__ import annotations

import json


def extract_json(text: str) -> dict:
    """Extract first JSON object from a model response."""

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return {}

    candidate = text[start : end + 1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return {}
