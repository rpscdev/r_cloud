"""Input sanitization helpers for user-provided prompts."""

from __future__ import annotations

import re

CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
WHITESPACE_RE = re.compile(r"\s+")
HTML_TAG_RE = re.compile(r"<[^>]+>")
PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+previous\s+instructions", re.IGNORECASE),
    re.compile(r"reveal\s+system\s+prompt", re.IGNORECASE),
    re.compile(r"developer\s+message", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
]


def sanitize_user_text(value: str) -> str:
    """Normalize text and remove obvious risky prompt content."""

    cleaned = CONTROL_CHARS_RE.sub(" ", value)
    cleaned = HTML_TAG_RE.sub(" ", cleaned)
    cleaned = cleaned.replace("```", " ")
    cleaned = WHITESPACE_RE.sub(" ", cleaned).strip()
    return cleaned


def has_prompt_injection_markers(value: str) -> bool:
    """Return true when known prompt-injection markers are detected."""

    return any(pattern.search(value) for pattern in PROMPT_INJECTION_PATTERNS)
