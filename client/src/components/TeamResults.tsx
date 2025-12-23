import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Minus } from 'lucide-react';

interface ScoreData {
  safety: number;
  equity: number;
  staff: number;
  resilience: number;
}

interface Metrics {
  backlog: number;
  dnaRate: number;
  staffSickness: number;
  highRiskShare: number;
  incidents: number;
  neonatalAdmissions: number;
}

interface TeamResultsProps {
  cycle: number;
  scores: ScoreData;
  previousScores?: ScoreData;
  metrics: Metrics;
  previousMetrics?: Metrics;
  incidents: Array<{ severity: string; description: string }>;
  reflectiveQuestions: string[];
}

export default function TeamResults({
  cycle,
  scores,
  previousScores,
  metrics,
  previousMetrics,
  incidents,
  reflectiveQuestions,
}: TeamResultsProps) {
  const getDelta = (current: number, previous?: number): number | null => {
    if (previous === undefined) return null;
    return current - previous;
  };

  const renderDelta = (delta: number | null, inverse: boolean = false) => {
    if (delta === null) return null;

    const isPositive = inverse ? delta < 0 : delta > 0;
    const isNegative = inverse ? delta > 0 : delta < 0;

    if (Math.abs(delta) < 0.5) {
      return (
        <span className="flex items-center gap-1 text-slate-400 text-sm">
          <Minus className="w-3 h-3" />
          <span>No change</span>
        </span>
      );
    }

    return (
      <span
        className={`flex items-center gap-1 text-sm ${
          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'
        }`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>
          {delta > 0 ? '+' : ''}
          {Math.round(delta)}
        </span>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Cycle {cycle} Results</h2>
        <p className="text-slate-400">Your team's performance this cycle</p>
      </div>

      {/* Four Pillars */}
      {scores && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card bg-blue-500/10 border-blue-500/30 p-6">
          <div className="text-sm text-blue-300 mb-2">Safety & Outcomes</div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-4xl font-bold text-blue-400">{scores.safety != null ? Math.round(scores.safety) : '-'}</div>
            <div className="text-slate-500 text-sm">/ 100</div>
          </div>
          {renderDelta(getDelta(scores.safety, previousScores?.safety))}
        </div>

        <div className="card bg-purple-500/10 border-purple-500/30 p-6">
          <div className="text-sm text-purple-300 mb-2">Equity & Access</div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-4xl font-bold text-purple-400">{scores.equity != null ? Math.round(scores.equity) : '-'}</div>
            <div className="text-slate-500 text-sm">/ 100</div>
          </div>
          {renderDelta(getDelta(scores.equity, previousScores?.equity))}
        </div>

        <div className="card bg-green-500/10 border-green-500/30 p-6">
          <div className="text-sm text-green-300 mb-2">Staff Sustainability</div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-4xl font-bold text-green-400">{scores.staff != null ? Math.round(scores.staff) : '-'}</div>
            <div className="text-slate-500 text-sm">/ 100</div>
          </div>
          {renderDelta(getDelta(scores.staff, previousScores?.staff))}
        </div>

        <div className="card bg-amber-500/10 border-amber-500/30 p-6">
          <div className="text-sm text-amber-300 mb-2">System Resilience</div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-4xl font-bold text-amber-400">{scores.resilience != null ? Math.round(scores.resilience) : '-'}</div>
            <div className="text-slate-500 text-sm">/ 100</div>
          </div>
          {renderDelta(getDelta(scores.resilience, previousScores?.resilience))}
        </div>
      </div>
      )}

      {/* Operational Metrics */}
      {metrics && (
      <div className="card bg-slate-800 border-slate-700 p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Operational Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Clinic Backlog</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metrics.backlog ?? '-'}</span>
              <span className="text-slate-400 text-sm">patients</span>
              {renderDelta(getDelta(metrics.backlog, previousMetrics?.backlog), true)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-300 mb-1">DNA Rate</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metrics.dnaRate != null ? Math.round(metrics.dnaRate) : '-'}%</span>
              {renderDelta(getDelta(metrics.dnaRate, previousMetrics?.dnaRate), true)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-300 mb-1">Staff Sickness</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metrics.staffSickness != null ? Math.round(metrics.staffSickness) : '-'}%</span>
              {renderDelta(getDelta(metrics.staffSickness, previousMetrics?.staffSickness), true)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-300 mb-1">High-Risk Proportion</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metrics.highRiskShare != null ? Math.round(metrics.highRiskShare) : '-'}%</span>
              {renderDelta(getDelta(metrics.highRiskShare, previousMetrics?.highRiskShare))}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-300 mb-1">Incidents</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metrics.incidents ?? '-'}</span>
              {renderDelta(getDelta(metrics.incidents, previousMetrics?.incidents), true)}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-300 mb-1">Neonatal Admissions</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metrics.neonatalAdmissions ?? '-'}</span>
              {renderDelta(getDelta(metrics.neonatalAdmissions, previousMetrics?.neonatalAdmissions), true)}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Incidents */}
      {incidents && incidents.length > 0 && (
        <div className="card bg-red-500/10 border-red-500/30 p-6 mb-8">
          <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Incidents ({incidents.length})
          </h3>
          <div className="space-y-3">
            {incidents.map((incident, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    incident.severity === 'high'
                      ? 'bg-red-500 text-white'
                      : incident.severity === 'medium'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {incident.severity.toUpperCase()}
                </div>
                <p className="text-slate-300 flex-1">{incident.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Incidents */}
      {(!incidents || incidents.length === 0) && (
        <div className="card bg-green-500/10 border-green-500/30 p-6 mb-8 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-green-400">No Incidents This Cycle</h3>
          <p className="text-slate-300 text-sm">Your team maintained safety standards</p>
        </div>
      )}

      {/* Reflective Questions */}
      {reflectiveQuestions && reflectiveQuestions.length > 0 && (
        <div className="card bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Reflect on Your Decisions</h3>
          <div className="space-y-3">
            {reflectiveQuestions.map((question, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <p className="text-white">{question}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
