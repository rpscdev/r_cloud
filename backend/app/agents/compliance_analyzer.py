"""Agent that extracts compliance obligations and risks."""

from __future__ import annotations

from app.agents.gemini_client import GeminiClient
from app.agents.json_utils import extract_json


class ComplianceAnalyzerAgent:
    """Converts regulation context into obligations and risks."""

    def __init__(self, llm_client: GeminiClient) -> None:
        self._llm = llm_client

    async def run(self, user_query: str, context: str) -> dict:
        prompt = f"""
You are a compliance analyst.
Given the business idea and regulation context, extract:
- key_regulations (list)
- obligations (list)
- risks (list)

Return valid JSON only:
{{
  "key_regulations": [],
  "obligations": [],
  "risks": []
}}

Business idea:
{user_query}

Regulation context:
{context}
""".strip()

        response = await self._llm.generate(
            prompt,
            agent_name="compliance_analyzer",
            response_mime_type="application/json",
            temperature=0.1,
            max_output_tokens=1800,
        )
        parsed = extract_json(response)

        return {
            "key_regulations": parsed.get("key_regulations", []),
            "obligations": parsed.get("obligations", []),
            "risks": parsed.get("risks", []),
        }
