"""Agent that maps compliance context to competitive opportunities."""

from __future__ import annotations

from app.agents.gemini_client import GeminiClient
from app.agents.json_utils import extract_json


class OpportunityExtractionAgent:
    """Derives market opportunities from obligations and regulations."""

    def __init__(self, llm_client: GeminiClient) -> None:
        self._llm = llm_client

    async def run(self, user_query: str, compliance: dict, context: str) -> list[str]:
        prompt = f"""
You are a market strategist.
Convert the compliance constraints into business opportunities for the idea.
Output JSON only:
{{"business_opportunities": []}}

Business idea:
{user_query}

Compliance summary:
{compliance}

Regulation context:
{context}
""".strip()

        response = await self._llm.generate(
            prompt,
            agent_name="opportunity_extractor",
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=1600,
        )
        parsed = extract_json(response)
        return parsed.get("business_opportunities", [])
