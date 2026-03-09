"""LangGraph workflow orchestrating EU strategy generation agents."""

from __future__ import annotations

from typing import TypedDict

from fastapi.concurrency import run_in_threadpool
from langgraph.graph import END, START, StateGraph

from app.agents.compliance_analyzer import ComplianceAnalyzerAgent
from app.agents.opportunity_extractor import OpportunityExtractionAgent
from app.agents.query_rewriter import QueryRewriterAgent
from app.agents.strategy_generator import StrategyGeneratorAgent
from app.rag.chroma_store import ChromaRegulationStore
from app.rag.types import RegulationChunk
from app.schemas.strategy import StrategyPayload


class StrategyState(TypedDict, total=False):
    """Shared state passed across LangGraph nodes."""

    user_query: str
    rewritten_query: str
    retrieved_chunks: list[RegulationChunk]
    retrieved_context: str
    compliance_analysis: dict
    opportunities: list[str]
    strategy: StrategyPayload


class StrategyWorkflow:
    """Compiles and executes the multi-agent LangGraph workflow."""

    def __init__(
        self,
        store: ChromaRegulationStore,
        query_rewriter: QueryRewriterAgent,
        compliance_analyzer: ComplianceAnalyzerAgent,
        opportunity_extractor: OpportunityExtractionAgent,
        strategy_generator: StrategyGeneratorAgent,
        context_char_limit: int = 24000,
    ) -> None:
        self._store = store
        self._query_rewriter = query_rewriter
        self._compliance_analyzer = compliance_analyzer
        self._opportunity_extractor = opportunity_extractor
        self._strategy_generator = strategy_generator
        self._context_char_limit = context_char_limit
        self._graph = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(StrategyState)
        graph.add_node("query_rewriter", self._query_rewriter_node)
        graph.add_node("regulation_retrieval", self._regulation_retrieval_node)
        graph.add_node("compliance_analyzer", self._compliance_analyzer_node)
        graph.add_node("opportunity_extractor", self._opportunity_extractor_node)
        graph.add_node("strategy_generator", self._strategy_generator_node)

        graph.add_edge(START, "query_rewriter")
        graph.add_edge("query_rewriter", "regulation_retrieval")
        graph.add_edge("regulation_retrieval", "compliance_analyzer")
        graph.add_edge("compliance_analyzer", "opportunity_extractor")
        graph.add_edge("opportunity_extractor", "strategy_generator")
        graph.add_edge("strategy_generator", END)

        return graph.compile()

    async def _query_rewriter_node(self, state: StrategyState) -> StrategyState:
        rewritten_query = await self._query_rewriter.run(state["user_query"])
        return {"rewritten_query": rewritten_query}

    async def _regulation_retrieval_node(self, state: StrategyState) -> StrategyState:
        query = state.get("rewritten_query") or state["user_query"]
        chunks = await run_in_threadpool(self._store.retrieve, query, 8)
        context = "\n\n".join(chunk.text for chunk in chunks)
        return {
            "retrieved_chunks": chunks,
            "retrieved_context": context[: self._context_char_limit],
        }

    async def _compliance_analyzer_node(self, state: StrategyState) -> StrategyState:
        compliance = await self._compliance_analyzer.run(
            user_query=state["user_query"],
            context=state.get("retrieved_context", ""),
        )
        return {"compliance_analysis": compliance}

    async def _opportunity_extractor_node(self, state: StrategyState) -> StrategyState:
        opportunities = await self._opportunity_extractor.run(
            user_query=state["user_query"],
            compliance=state.get("compliance_analysis", {}),
            context=state.get("retrieved_context", ""),
        )
        return {"opportunities": opportunities}

    async def _strategy_generator_node(self, state: StrategyState) -> StrategyState:
        strategy = await self._strategy_generator.run(
            user_query=state["user_query"],
            compliance=state.get("compliance_analysis", {}),
            opportunities=state.get("opportunities", []),
            context=state.get("retrieved_context", ""),
        )
        return {"strategy": strategy}

    async def arun(self, user_query: str) -> StrategyState:
        """Execute the graph asynchronously and return the final state."""

        return await self._graph.ainvoke({"user_query": user_query})

    def run(self, user_query: str) -> StrategyState:
        """Synchronous compatibility wrapper."""

        return self._graph.invoke({"user_query": user_query})
