interface StrategyInputPanelProps {
  businessIdea: string;
  marketFocus: string;
  collectQuery: string;
  isCollecting: boolean;
  isGenerating: boolean;
  onBusinessIdeaChange: (value: string) => void;
  onMarketFocusChange: (value: string) => void;
  onCollectQueryChange: (value: string) => void;
  onCollectRegulations: () => void;
  onGenerateStrategy: () => void;
}

export default function StrategyInputPanel({
  businessIdea,
  marketFocus,
  collectQuery,
  isCollecting,
  isGenerating,
  onBusinessIdeaChange,
  onMarketFocusChange,
  onCollectQueryChange,
  onCollectRegulations,
  onGenerateStrategy,
}: StrategyInputPanelProps) {
  return (
    <section className="rounded-2xl border border-blue-900/80 bg-black/60 p-5 backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-blue-100">Strategy Workspace</h2>
        <p className="mt-1 text-sm text-blue-200">
          Describe your product and market. The AI workflow will map regulations into actionable strategy.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-indigo-200">Business Idea</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-blue-900 bg-black/70 p-3 text-sm text-blue-100 outline-none transition placeholder:text-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
            value={businessIdea}
            onChange={(event) => onBusinessIdeaChange(event.target.value)}
            placeholder="AI SaaS startup entering the German market"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-indigo-200">Target Market</span>
            <input
              className="w-full rounded-xl border border-blue-900 bg-black/70 p-3 text-sm text-blue-100 outline-none transition placeholder:text-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              type="text"
              value={marketFocus}
              onChange={(event) => onMarketFocusChange(event.target.value)}
              placeholder="Germany + EU"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-indigo-200">Regulation Discovery Query</span>
            <input
              className="w-full rounded-xl border border-blue-900 bg-black/70 p-3 text-sm text-blue-100 outline-none transition placeholder:text-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              type="text"
              value={collectQuery}
              onChange={(event) => onCollectQueryChange(event.target.value)}
              placeholder="EU and German AI regulations for startups"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            className="rounded-xl border border-blue-700 bg-black/50 px-4 py-2 text-sm font-medium text-blue-100 transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isCollecting || isGenerating}
            onClick={onCollectRegulations}
          >
            {isCollecting ? 'Collecting Regulations...' : 'Collect Regulations'}
          </button>

          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-blue-950 disabled:text-indigo-200"
            type="button"
            disabled={isGenerating || isCollecting}
            onClick={onGenerateStrategy}
          >
            {isGenerating ? 'Generating Market Strategy...' : 'Generate Market Strategy'}
          </button>
        </div>
      </div>
    </section>
  );
}
