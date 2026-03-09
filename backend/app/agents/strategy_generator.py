"""Agent that builds final structured strategy JSON."""

from __future__ import annotations

from app.agents.gemini_client import GeminiClient
from app.agents.json_utils import extract_json
from app.schemas.strategy import StrategyPayload


class StrategyGeneratorAgent:
    """Generates consulting-style strategy fields for report rendering."""

    def __init__(self, llm_client: GeminiClient) -> None:
        self._llm = llm_client

    async def run(
        self,
        user_query: str,
        compliance: dict,
        opportunities: list[str],
        context: str,
    ) -> StrategyPayload:
        prompt = f"""
You are a European market-entry consultant.
Create a concise, actionable strategy for the business idea.
Use only evidence in the provided regulation context.

Return JSON only with this exact schema:
{{
  "key_regulations": [],
  "business_opportunities": [],
  "marketing_strategy": [],
  "compliance_checklist": [],
  "implementation_roadmap": []
}}

Quality constraints:
- Return at least 4 items in every list.
- Keep each item one clear sentence.
- Do not return markdown.

Business idea:
{user_query}

Compliance findings:
{compliance}

Identified opportunities:
{opportunities}

Regulation context:
{context}
""".strip()

        response = await self._llm.generate(
            prompt,
            agent_name="strategy_generator",
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=4096,
        )

        parsed = extract_json(response)

        fallback = {
            "key_regulations": compliance.get("key_regulations", []),
            "business_opportunities": opportunities,
            "marketing_strategy": [
                "Lead with a compliance-first value proposition tailored for EU customers.",
                "Publish transparent documentation for data handling and AI usage limits.",
                "Use trust signals such as policy pages and security commitments in all campaigns.",
                "Run country-specific acquisition pilots before scaling across the EU.",
            ],
            "compliance_checklist": compliance.get("obligations", []),
            "implementation_roadmap": [
                "Month 1: map applicable regulations and assign compliance ownership.",
                "Month 2: close policy gaps and establish evidence-ready documentation.",
                "Month 3: launch controlled pilot in one EU market with KPI tracking.",
                "Month 4: review legal feedback and expand go-to-market channels.",
            ],
        }

        payload = {
            "key_regulations": self._ensure_min_items(parsed.get("key_regulations"), fallback["key_regulations"], "Identify and review all core EU and German obligations relevant to this business model."),
            "business_opportunities": self._ensure_min_items(parsed.get("business_opportunities"), fallback["business_opportunities"], "Turn regulatory readiness into a trust advantage in customer acquisition and partnerships."),
            "marketing_strategy": self._ensure_min_items(parsed.get("marketing_strategy"), fallback["marketing_strategy"], "Position the product around verified compliance and transparent governance."),
            "compliance_checklist": self._ensure_min_items(parsed.get("compliance_checklist"), fallback["compliance_checklist"], "Document legal basis, processing records, and risk controls before launch."),
            "implementation_roadmap": self._ensure_min_items(parsed.get("implementation_roadmap"), fallback["implementation_roadmap"], "Execute phased rollout with legal checkpoints and measurable milestones."),
        }

        return StrategyPayload(**payload)

    @staticmethod
    def _ensure_min_items(primary: object, fallback: object, default_item: str, min_items: int = 4) -> list[str]:
        source: list[str] = []
        if isinstance(primary, list):
            source.extend(str(item).strip() for item in primary if str(item).strip())
        if isinstance(fallback, list):
            source.extend(str(item).strip() for item in fallback if str(item).strip())

        deduped: list[str] = []
        seen: set[str] = set()
        for item in source:
            if item not in seen:
                deduped.append(item)
                seen.add(item)
            if len(deduped) >= min_items:
                break

        while len(deduped) < min_items:
            deduped.append(default_item)

        return deduped
