import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import AnalyticsSection from '../components/eu-strategy/AnalyticsSection';
import RegulationMap from '../components/eu-strategy/RegulationMap';
import ScoreHighlights from '../components/eu-strategy/ScoreHighlights';
import StrategyInputPanel from '../components/eu-strategy/StrategyInputPanel';
import StrategySectionCard from '../components/eu-strategy/StrategySectionCard';
import Seo from '../components/Seo';
import {
  collectRegulations,
  generateStrategy,
  getAuthorizedFetchHeaders,
  isEuStrategyUnlocked,
  resolveReportUrl,
  setEuStrategyAccessPassword,
  validateEuStrategyPassword,
  type CollectRegulationsResponse,
  type StrategyResponse,
} from '../services/euStrategyApi';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error occurred while processing your request.';
}

export default function EUMarketStrategyDashboard() {
  const [isUnlocked, setIsUnlocked] = useState(isEuStrategyUnlocked());
  const [accessPassword, setAccessPassword] = useState('');
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [businessIdea, setBusinessIdea] = useState('AI SaaS startup entering the German market');
  const [marketFocus, setMarketFocus] = useState('Germany + EU');
  const [collectQuery, setCollectQuery] = useState(
    'EU and German regulations for AI SaaS, GDPR, AI Act, startup compliance',
  );

  const [strategyResponse, setStrategyResponse] = useState<StrategyResponse | null>(null);
  const [collectResult, setCollectResult] = useState<CollectRegulationsResponse | null>(null);

  const [isCollecting, setIsCollecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [collectError, setCollectError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const scores = useMemo(() => {
    const strategy = strategyResponse?.strategy;
    if (!strategy) {
      return {
        complianceAdvantage: 0,
        marketOpportunity: 0,
        regulatoryRisk: 0,
      };
    }

    const complianceAdvantage = clamp(
      30 + strategy.compliance_checklist.length * 10 + strategy.key_regulations.length * 6,
      0,
      100,
    );

    const marketOpportunity = clamp(
      25 + strategy.business_opportunities.length * 12 + strategy.marketing_strategy.length * 6,
      0,
      100,
    );

    const regulatoryRisk = clamp(
      80 + strategy.key_regulations.length * 3 - strategy.compliance_checklist.length * 8,
      0,
      100,
    );

    return {
      complianceAdvantage,
      marketOpportunity,
      regulatoryRisk,
    };
  }, [strategyResponse]);

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    setAccessError(null);

    const candidate = accessPassword.trim();
    if (!candidate) {
      setAccessError('Please enter password.');
      return;
    }

    setIsVerifyingAccess(true);
    try {
      const allowed = await validateEuStrategyPassword(candidate);
      if (!allowed) {
        setAccessError('Invalid password.');
        return;
      }

      setIsUnlocked(true);
      setAccessPassword('');
      window.umami?.track('eu_strategy:unlock_success');
    } catch {
      setAccessError('Unable to verify password right now.');
    } finally {
      setIsVerifyingAccess(false);
    }
  };

  const handleLock = () => {
    setEuStrategyAccessPassword('');
    setIsUnlocked(false);
    setStrategyResponse(null);
    setCollectResult(null);
    setCollectError(null);
    setGenerateError(null);
    setAccessError(null);
  };

  const handleCollectRegulations = async () => {
    setCollectError(null);
    setIsCollecting(true);

    try {
      const result = await collectRegulations({
        query: collectQuery.trim() || `${businessIdea} ${marketFocus}`,
        max_results: 8,
      });
      setCollectResult(result);
      window.umami?.track('eu_strategy:collect_regulations');
    } catch (error) {
      setCollectError(normalizeError(error));
    } finally {
      setIsCollecting(false);
    }
  };

  const handleGenerateStrategy = async () => {
    if (businessIdea.trim().length < 10) {
      setGenerateError('Please enter a more detailed business idea (minimum 10 characters).');
      return;
    }

    setGenerateError(null);
    setIsGenerating(true);

    try {
      const response = await generateStrategy({
        business_idea: businessIdea.trim(),
        market_focus: marketFocus.trim() || 'Germany + EU',
      });
      setStrategyResponse(response);
      window.umami?.track('eu_strategy:generate_strategy');
    } catch (error) {
      setGenerateError(normalizeError(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const reportUrl = strategyResponse ? resolveReportUrl(strategyResponse.pdf_report) : '';

  const handleDownloadReport = async () => {
    if (!reportUrl) return;
    try {
      const response = await fetch(reportUrl, {
        headers: getAuthorizedFetchHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Report download failed (${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
    } catch (error) {
      setGenerateError(normalizeError(error));
    }
  };

  if (!isUnlocked) {
    return (
      <div className="container">
        <Seo
          title="EU Market Strategy AI Dashboard | Raghvendra.cloud"
          description="Protected EU strategy workspace for regulation-aware market planning."
          path="/models/eu-market-strategy-ai"
        />

        <section className="eu-grid-bg mx-auto max-w-xl rounded-3xl border border-indigo-900/80 bg-gradient-to-br from-black via-blue-950/70 to-indigo-950/70 p-6 shadow-[0_20px_60px_-24px_rgba(79,70,229,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">Protected App</p>
          <h1 className="mt-2 text-2xl font-bold text-blue-100">EU Market Strategy AI</h1>
          <p className="mt-2 text-sm text-blue-200">
            Enter access password to open this app.
          </p>

          <form className="mt-5 space-y-3" onSubmit={handleUnlock}>
            <input
              type="password"
              value={accessPassword}
              onChange={(event) => setAccessPassword(event.target.value)}
              placeholder="Enter app password"
              className="w-full rounded-xl border border-blue-900 bg-black/70 px-4 py-3 text-sm text-blue-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={isVerifyingAccess}
              className="w-full rounded-xl border border-indigo-500/60 bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isVerifyingAccess ? 'Verifying...' : 'Unlock App'}
            </button>
          </form>

          {accessError ? (
            <p className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-3 text-sm text-indigo-100">
              {accessError}
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="container">
      <Seo
        title="EU Market Strategy AI Dashboard | Raghvendra.cloud"
        description="Generate regulation-aware market strategy for EU and Germany using AI multi-agent RAG workflows."
        path="/models/eu-market-strategy-ai"
      />

      <section className="eu-grid-bg rounded-3xl border border-indigo-900/80 bg-gradient-to-br from-black via-blue-950/70 to-indigo-950/70 p-6 shadow-[0_20px_60px_-24px_rgba(79,70,229,0.45)]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
              EU Market Strategy AI
            </p>
            <h1 className="mt-2 text-3xl font-bold text-blue-100">Regulation-Driven Growth Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-blue-200">
              Convert EU and German regulations into growth strategy, compliance priorities, and execution roadmap.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLock}
              className="rounded-xl border border-blue-700 bg-black/60 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-950/50"
            >
              Lock App
            </button>

            {reportUrl ? (
              <button
                type="button"
                onClick={handleDownloadReport}
                className="rounded-xl border border-indigo-500/60 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Download Strategy Report
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <StrategyInputPanel
            businessIdea={businessIdea}
            marketFocus={marketFocus}
            collectQuery={collectQuery}
            isCollecting={isCollecting}
            isGenerating={isGenerating}
            onBusinessIdeaChange={setBusinessIdea}
            onMarketFocusChange={setMarketFocus}
            onCollectQueryChange={setCollectQuery}
            onCollectRegulations={handleCollectRegulations}
            onGenerateStrategy={handleGenerateStrategy}
          />

          <ScoreHighlights
            complianceAdvantageScore={scores.complianceAdvantage}
            marketOpportunityScore={scores.marketOpportunity}
            regulatoryRiskScore={scores.regulatoryRisk}
            ingestedChunks={collectResult?.ingested_chunks ?? 0}
          />
        </div>

        {collectError ? (
          <p className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-3 text-sm text-indigo-100">
            Regulation ingestion failed: {collectError}
          </p>
        ) : null}

        {generateError ? (
          <p className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-3 text-sm text-indigo-100">
            Strategy generation failed: {generateError}
          </p>
        ) : null}

        {collectResult ? (
          <div className="mt-4 rounded-xl border border-blue-500/40 bg-blue-500/15 px-4 py-3 text-sm text-blue-100">
            Indexed {collectResult.ingested_chunks} chunks from {collectResult.tavily_documents_ingested} Tavily
            sources and {collectResult.local_documents_ingested} local documents.
          </div>
        ) : null}

        {isGenerating ? (
          <div className="mt-6 rounded-2xl border border-blue-900 bg-black/60 p-6 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-900 border-t-indigo-400" />
            <p className="text-sm text-blue-200">Analyzing regulations and generating strategy...</p>
          </div>
        ) : null}

        {strategyResponse ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-blue-900/80 bg-black/60 p-4 text-sm text-blue-200">
              <p>
                <span className="font-semibold text-blue-100">Optimized Query: </span>
                {strategyResponse.rewritten_query}
              </p>
            </div>

            <AnalyticsSection
              complianceAdvantageScore={scores.complianceAdvantage}
              marketOpportunityScore={scores.marketOpportunity}
              regulatoryRiskScore={scores.regulatoryRisk}
            />

            <RegulationMap
              keyRegulations={strategyResponse.strategy.key_regulations}
              complianceChecklist={strategyResponse.strategy.compliance_checklist}
              marketFocus={marketFocus}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <StrategySectionCard
                title="Key Regulations"
                items={strategyResponse.strategy.key_regulations}
                accentClassName="bg-blue-500"
              />
              <StrategySectionCard
                title="Business Opportunities"
                items={strategyResponse.strategy.business_opportunities}
                accentClassName="bg-indigo-400"
              />
              <StrategySectionCard
                title="Marketing Strategy"
                items={strategyResponse.strategy.marketing_strategy}
                accentClassName="bg-blue-400"
              />
              <StrategySectionCard
                title="Compliance Checklist"
                items={strategyResponse.strategy.compliance_checklist}
                accentClassName="bg-indigo-500"
              />
              <StrategySectionCard
                title="Implementation Roadmap"
                items={strategyResponse.strategy.implementation_roadmap}
                accentClassName="bg-blue-600"
              />
              <section className="rounded-2xl border border-blue-900/80 bg-black/60 p-5 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-blue-100">Retrieved Sources</h3>
                <ul className="space-y-2 text-xs text-blue-200">
                  {strategyResponse.retrieved_sources.length === 0 ? (
                    <li className="text-indigo-200">No source URLs were returned by the retriever.</li>
                  ) : (
                    strategyResponse.retrieved_sources.map((source) => (
                      <li key={source} className="break-all rounded-lg border border-indigo-900/60 bg-indigo-950/40 px-3 py-2">
                        {source}
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
