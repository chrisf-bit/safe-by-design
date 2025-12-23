// =============================================================================
// SAFE BY DESIGN - LEADERBOARD COMPONENT
// Shows team rankings with pillar breakdowns
// =============================================================================

import { Trophy, TrendingUp, TrendingDown, Minus, Shield, Heart, Users, Activity } from 'lucide-react';

interface TeamScore {
  teamId: string;
  teamName: string;
  scores?: {
    safety: number;
    equity: number;
    staff: number;
    resilience: number;
    total: number;
  };
  score?: number; // Alternative simple score
  previousTotal?: number;
  rank?: number;
  previousRank?: number;
}

interface LeaderboardProps {
  teams: TeamScore[];
  cycle: number;
  showPillars?: boolean;
}

export default function Leaderboard({ teams, cycle, showPillars = true }: LeaderboardProps) {
  // Handle empty or invalid teams
  if (!teams || teams.length === 0) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </h3>
        </div>
        <div className="p-4 text-center text-slate-400">
          No scores yet
        </div>
      </div>
    );
  }

  // Safely handle different data structures
  const sortedTeams = [...teams]
    .filter(t => t && (t.scores || t.score !== undefined)) // Filter out invalid entries
    .sort((a, b) => {
      const aTotal = a.scores?.total ?? a.score ?? 0;
      const bTotal = b.scores?.total ?? b.score ?? 0;
      return bTotal - aTotal;
    });

  // If no valid teams after filtering, show empty state
  if (sortedTeams.length === 0) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </h3>
        </div>
        <div className="p-4 text-center text-slate-400">
          Waiting for scores...
        </div>
      </div>
    );
  }

  // Helper to get total score from different structures
  const getTotal = (team: any) => team.scores?.total ?? team.score ?? 0;
  const getSafety = (team: any) => team.scores?.safety ?? 0;
  const getEquity = (team: any) => team.scores?.equity ?? 0;
  const getStaff = (team: any) => team.scores?.staff ?? 0;
  const getResilience = (team: any) => team.scores?.resilience ?? 0;

  const getRankChange = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    return previous - current; // Positive = moved up
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-slate-500 font-bold">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/50';
    return 'bg-slate-800/50 border-slate-700';
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </h3>
          <span className="text-sm text-primary-100">After Cycle {cycle}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="divide-y divide-slate-700/50">
        {sortedTeams.map((team, idx) => {
          const rank = idx + 1;
          const rankChange = getRankChange(rank, team.previousRank);
          const totalScore = getTotal(team);
          const scoreDelta = team.previousTotal !== undefined 
            ? totalScore - team.previousTotal 
            : null;

          return (
            <div 
              key={team.teamId}
              className={`p-4 border-l-4 ${getRankBg(rank)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getRankIcon(rank)}
                  <span className="font-bold text-white">{team.teamName}</span>
                  
                  {/* Rank change indicator */}
                  {rankChange !== null && rankChange !== 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${
                      rankChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {rankChange > 0 
                        ? <TrendingUp className="w-3 h-3" /> 
                        : <TrendingDown className="w-3 h-3" />
                      }
                      {Math.abs(rankChange)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Score delta */}
                  {scoreDelta !== null && (
                    <span className={`text-sm flex items-center gap-1 ${
                      scoreDelta > 0 ? 'text-green-400' : 
                      scoreDelta < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {scoreDelta > 0 ? '+' : ''}{Math.round(scoreDelta)}
                    </span>
                  )}
                  
                  {/* Total score */}
                  <span className="text-2xl font-bold text-white">
                    {Math.round(totalScore)}
                  </span>
                </div>
              </div>

              {/* Pillar breakdown */}
              {showPillars && (
                <div className="flex gap-4 mt-3">
                  <PillarScore 
                    icon={<Shield className="w-3 h-3" />}
                    label="Safety"
                    value={getSafety(team)}
                    color="blue"
                  />
                  <PillarScore 
                    icon={<Heart className="w-3 h-3" />}
                    label="Equity"
                    value={getEquity(team)}
                    color="purple"
                  />
                  <PillarScore 
                    icon={<Users className="w-3 h-3" />}
                    label="Staff"
                    value={getStaff(team)}
                    color="green"
                  />
                  <PillarScore 
                    icon={<Activity className="w-3 h-3" />}
                    label="Resilience"
                    value={getResilience(team)}
                    color="amber"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PillarScoreProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'green' | 'amber';
}

function PillarScore({ icon, label, value, color }: PillarScoreProps) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    green: 'text-green-400 bg-green-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
  };

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${colors[color]}`}>
      {icon}
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{Math.round(value)}</span>
    </div>
  );
}
