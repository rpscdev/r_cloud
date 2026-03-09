interface RegulationMapProps {
  keyRegulations: string[];
  complianceChecklist: string[];
  marketFocus: string;
}

type RegulationNode = {
  title: string;
  keywords: string[];
};

const DEFAULT_REGULATIONS: RegulationNode[] = [
  { title: 'GDPR', keywords: ['gdpr', 'privacy', 'personal data', 'consent'] },
  { title: 'EU AI Act', keywords: ['ai act', 'high-risk ai', 'algorithmic transparency'] },
  { title: 'Consumer Rights', keywords: ['consumer', 'refund', 'fair contract', 'transparency'] },
  { title: 'CSRD / ESG', keywords: ['esg', 'sustainability', 'csrd', 'reporting'] },
  { title: 'German Commercial Rules', keywords: ['germany', 'bundes', 'trade register', 'commercial code'] },
];

function buildInfluenceScore(textCorpus: string, keywords: string[]): number {
  const matches = keywords.reduce((count, keyword) => {
    return count + (textCorpus.includes(keyword) ? 1 : 0);
  }, 0);

  const score = matches * 24;
  return Math.max(6, Math.min(96, score));
}

function influenceLabel(score: number): string {
  if (score >= 70) return 'High Influence';
  if (score >= 40) return 'Moderate Influence';
  return 'Low Influence';
}

export default function RegulationMap({
  keyRegulations,
  complianceChecklist,
  marketFocus,
}: RegulationMapProps) {
  const corpus = [...keyRegulations, ...complianceChecklist, marketFocus].join(' ').toLowerCase();

  const mappedRegulations = DEFAULT_REGULATIONS.map((regulation) => {
    const influence = buildInfluenceScore(corpus, regulation.keywords);
    return {
      ...regulation,
      influence,
      label: influenceLabel(influence),
    };
  }).sort((a, b) => b.influence - a.influence);

  return (
    <section className="rounded-2xl border border-blue-900/80 bg-black/60 p-5 backdrop-blur-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-blue-100">Regulation Map</h3>
        <span className="rounded-full border border-indigo-500/50 bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200">
          EU + Germany Signals
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {mappedRegulations.map((regulation) => (
          <article
            key={regulation.title}
            className="rounded-xl border border-blue-900 bg-black/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-blue-100">{regulation.title}</h4>
              <span className="text-xs text-indigo-200">{regulation.label}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-blue-950">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-300"
                style={{ width: `${regulation.influence}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-blue-200">Influence score: {regulation.influence}/100</p>
          </article>
        ))}
      </div>
    </section>
  );
}
