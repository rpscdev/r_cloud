"""Agent that rewrites user query for better legal retrieval."""

from __future__ import annotations

from app.agents.gemini_client import GeminiClient


class QueryRewriterAgent:
    """Rewrites startup idea query for regulation-focused retrieval."""

    def __init__(self, llm_client: GeminiClient) -> None:
        self._llm = llm_client

    async def run(self, user_query: str) -> str:
        prompt = f"""
You are a legal retrieval assistant for EU market entry.
Rewrite the user query for regulation search.
Focus on GDPR, EU AI Act, consumer law, tax/commercial registration, and German compliance.
Return only one optimized search query.

User query: {user_query}
""".strip()

        rewritten = (await self._llm.generate(prompt, agent_name="query_rewriter", temperature=0.1, max_output_tokens=300)).strip()
        return rewritten or user_query
