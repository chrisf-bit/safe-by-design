// =============================================================================
// SAFE BY DESIGN - TEAM METRICS DASHBOARD
// Maternity system metrics display adapted from Pitch Perfect Dashboard
// =============================================================================

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface CycleResult {
  cycle: number;
  scores: {
    safety: number;
    equity: number;
    staff: number;
    resilience: number;
    total: number;
  };
  metrics: {
    backlog: number;
    dnaRate: number;
    staffSickness: number;
    highRiskShare: number;
    incidents: number;
    neonatalAdmissions: number;
  };
}

interface TeamMetricsDashboardProps {
  teamName: string;
  currentCycle: number;
  cycleResults: CycleResult[];
  cumulativeScore: {
    safety: number;
    equity: number;
    staff: number;
    resilience: number;
    total: number;
  };
}

export default function TeamMetricsDashboard({ teamName, currentCycle, cycleResults, cumulativeScore }: TeamMetricsDashboardProps) {
  // Get latest result
  const latestResult = cycleResults.length > 0 ? cycleResults[cycleResults.length - 1] : null;
  const prevResult = cycleResults.length > 1 ? cycleResults[cycleResults.length - 2] : null;

  // Prepare chart data
  const scoreData = cycleResults.map(r => ({
    cycle: `C${r.cycle}`,
    safety: r.scores.safety,
    equity: r.scores.equity,
    staff: r.scores.staff,
    resilience: r.scores.resilience,
    total: r.scores.total
  }));

  const metricsData = cycleResults.map(r => ({
    cycle: `C${r.cycle}`,
    backlog: r.metrics.backlog,
    dnaRate: r.metrics.dnaRate,
    staffSickness: r.metrics.staffSickness,
    incidents: r.metrics.incidents
  }));

  // Radar chart data for pillars
  const radarData = latestResult ? [
    { pillar: 'Safety', value: latestResult.scores.safety, fullMark: 100 },
    { pillar: 'Equity', value: latestResult.scores.equity, fullMark: 100 },
    { pillar: 'Staff', value: latestResult.scores.staff, fullMark: 100 },
    { pillar: 'Resilience', value: latestResult.scores.resilience, fullMark: 100 }
  ] : [];

  return (
    <div className="space-y-3 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-primary-400">{teamName}</h3>
            <p className="text-xs text-slate-400">Cycle {currentCycle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{Math.round(cumulativeScore.total)}</div>
            <div className="text-xs text-slate-400">Total Score</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">System Health</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Backlog"
            value={latestResult ? `${latestResult.metrics.backlog}` : '-'}
            subtext="patients"
            icon={getBacklogIcon(latestResult?.metrics.backlog || 0)}
            color={getBacklogColor(latestResult?.metrics.backlog || 0)}
          />
          
          <MetricCard
            label="DNA Rate"
            value={latestResult ? `${latestResult.metrics.dnaRate}%` : '-'}
            icon={getDnaIcon(latestResult?.metrics.dnaRate || 0)}
            color={getDnaColor(latestResult?.metrics.dnaRate || 0)}
          />
          
          <MetricCard
            label="Staff Sickness"
            value={latestResult ? `${latestResult.metrics.staffSickness}%` : '-'}
            icon={getSicknessIcon(latestResult?.metrics.staffSickness || 0)}
            color={getSicknessColor(latestResult?.metrics.staffSickness || 0)}
          />
          
          <MetricCard
            label="High-Risk Share"
            value={latestResult ? `${latestResult.metrics.highRiskShare}%` : '-'}
            color="text-amber-400"
          />
        </div>
      </div>

      {/* Pillar Scores */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Four Pillars</h4>
        
        <div className="space-y-2">
          <PillarBar 
            label="Safety" 
            value={latestResult?.scores.safety || 0}
            icon="🛡️"
            color="bg-blue-500"
          />
          <PillarBar 
            label="Equity" 
            value={latestResult?.scores.equity || 0}
            icon="⚖️"
            color="bg-purple-500"
          />
          <PillarBar 
            label="Staff" 
            value={latestResult?.scores.staff || 0}
            icon="👥"
            color="bg-green-500"
          />
          <PillarBar 
            label="Resilience" 
            value={latestResult?.scores.resilience || 0}
            icon="🏥"
            color="bg-amber-500"
          />
        </div>
      </div>

      {/* Safety Indicators */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Safety Indicators</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Incidents"
            value={latestResult ? `${latestResult.metrics.incidents}` : '0'}
            icon={latestResult?.metrics.incidents === 0 ? '✅' : '⚠️'}
            color={latestResult?.metrics.incidents === 0 ? 'text-green-400' : 'text-red-400'}
          />
          
          <MetricCard
            label="Neonatal Admissions"
            value={latestResult ? `${latestResult.metrics.neonatalAdmissions}` : '0'}
            color={getNeonatalColor(latestResult?.metrics.neonatalAdmissions || 0)}
          />
        </div>
      </div>

      {/* Score Trend Chart */}
      {scoreData.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Score Trend
          </h4>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={scoreData}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="cycle" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#totalGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pillar Radar Chart */}
      {radarData.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Pillar Balance
          </h4>
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis dataKey="pillar" stroke="#94a3b8" fontSize={10} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={8} />
              <Radar 
                name="Score" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.3} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metrics Trend Chart */}
      {metricsData.length > 1 && (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Key Metrics Trend
          </h4>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="cycle" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="backlog" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="Backlog" />
              <Line type="monotone" dataKey="staffSickness" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Sickness %" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="text-xs text-amber-400">● Backlog</span>
            <span className="text-xs text-red-400">● Sickness</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: string;
  color: string;
}

function MetricCard({ label, value, subtext, icon, color }: MetricCardProps) {
  return (
    <div className="bg-slate-700/50 rounded p-2">
      <div className="flex justify-between items-start">
        <div className="text-xs text-slate-400">{label}</div>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      {subtext && <div className="text-xs text-slate-500">{subtext}</div>}
    </div>
  );
}

interface PillarBarProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

function PillarBar({ label, value, icon, color }: PillarBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-slate-300">{label}</span>
          <span className="text-white font-medium">{Math.round(value)}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getBacklogIcon(backlog: number): string {
  if (backlog <= 20) return '✅';
  if (backlog <= 40) return '📊';
  if (backlog <= 60) return '⚠️';
  return '🚨';
}

function getBacklogColor(backlog: number): string {
  if (backlog <= 20) return 'text-green-400';
  if (backlog <= 40) return 'text-yellow-400';
  if (backlog <= 60) return 'text-orange-400';
  return 'text-red-400';
}

function getDnaIcon(dnaRate: number): string {
  if (dnaRate <= 5) return '✅';
  if (dnaRate <= 10) return '📉';
  if (dnaRate <= 15) return '⚠️';
  return '🚨';
}

function getDnaColor(dnaRate: number): string {
  if (dnaRate <= 5) return 'text-green-400';
  if (dnaRate <= 10) return 'text-yellow-400';
  if (dnaRate <= 15) return 'text-orange-400';
  return 'text-red-400';
}

function getSicknessIcon(sickness: number): string {
  if (sickness <= 5) return '😊';
  if (sickness <= 10) return '🙂';
  if (sickness <= 15) return '😓';
  if (sickness <= 25) return '😰';
  return '🔥';
}

function getSicknessColor(sickness: number): string {
  if (sickness <= 5) return 'text-green-400';
  if (sickness <= 10) return 'text-yellow-400';
  if (sickness <= 15) return 'text-orange-400';
  return 'text-red-400';
}

function getNeonatalColor(admissions: number): string {
  if (admissions <= 2) return 'text-green-400';
  if (admissions <= 4) return 'text-yellow-400';
  if (admissions <= 6) return 'text-orange-400';
  return 'text-red-400';
}
