import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AnalyticsSectionProps {
  complianceAdvantageScore: number;
  marketOpportunityScore: number;
  regulatoryRiskScore: number;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function AnalyticsSection({
  complianceAdvantageScore,
  marketOpportunityScore,
  regulatoryRiskScore,
}: AnalyticsSectionProps) {
  const chartData = [
    { metric: 'Compliance Advantage', score: clampScore(complianceAdvantageScore), fill: '#2563eb' },
    { metric: 'Market Opportunity', score: clampScore(marketOpportunityScore), fill: '#4f46e5' },
    { metric: 'Regulatory Risk', score: clampScore(regulatoryRiskScore), fill: '#312e81' },
  ];

  return (
    <section className="rounded-2xl border border-blue-900/80 bg-black/60 p-5 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-blue-100">Analytics</h3>
        <span className="rounded-full border border-indigo-500/50 bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200">
          Recharts Insights
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-black/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
              <XAxis
                dataKey="metric"
                tick={{ fill: '#bfdbfe', fontSize: 12 }}
                angle={-10}
                textAnchor="end"
                height={48}
              />
              <YAxis domain={[0, 100]} tick={{ fill: '#bfdbfe', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #3730a3',
                  borderRadius: '10px',
                  color: '#dbeafe',
                }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.metric} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-64 rounded-xl bg-black/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="#1e3a8a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#bfdbfe', fontSize: 12 }} />
              <Radar
                name="Strategy Signal"
                dataKey="score"
                stroke="#4f46e5"
                fill="#2563eb"
                fillOpacity={0.45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #3730a3',
                  borderRadius: '10px',
                  color: '#dbeafe',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
