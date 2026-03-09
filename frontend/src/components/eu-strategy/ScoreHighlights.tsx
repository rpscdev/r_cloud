interface ScoreHighlightsProps {
  complianceAdvantageScore: number;
  marketOpportunityScore: number;
  regulatoryRiskScore: number;
  ingestedChunks: number;
}

function scoreTone(score: number, highIsGood: boolean): string {
  const healthy = highIsGood ? score >= 70 : score <= 35;
  const warning = highIsGood ? score >= 45 : score <= 60;

  if (healthy) return 'text-indigo-300';
  if (warning) return 'text-blue-300';
  return 'text-blue-100';
}

export default function ScoreHighlights({
  complianceAdvantageScore,
  marketOpportunityScore,
  regulatoryRiskScore,
  ingestedChunks,
}: ScoreHighlightsProps) {
  const cards = [
    {
      title: 'Compliance Advantage',
      value: `${Math.round(complianceAdvantageScore)} / 100`,
      tone: scoreTone(complianceAdvantageScore, true),
      subtitle: 'How strongly compliance can become a sales differentiator.',
    },
    {
      title: 'Market Opportunity',
      value: `${Math.round(marketOpportunityScore)} / 100`,
      tone: scoreTone(marketOpportunityScore, true),
      subtitle: 'Estimated upside from regulation-led positioning.',
    },
    {
      title: 'Regulatory Risk',
      value: `${Math.round(regulatoryRiskScore)} / 100`,
      tone: scoreTone(regulatoryRiskScore, false),
      subtitle: 'Residual exposure if obligations are not implemented.',
    },
    {
      title: 'Indexed Chunks',
      value: String(ingestedChunks),
      tone: 'text-indigo-300',
      subtitle: 'Regulation context chunks currently available in RAG.',
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-xl border border-blue-900/80 bg-black/60 p-4 backdrop-blur-sm"
        >
          <p className="text-xs uppercase tracking-wide text-indigo-300">{card.title}</p>
          <p className={`mt-2 text-xl font-semibold ${card.tone}`}>{card.value}</p>
          <p className="mt-2 text-xs text-blue-200">{card.subtitle}</p>
        </article>
      ))}
    </div>
  );
}
