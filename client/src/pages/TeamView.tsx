import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { Game, CycleResults } from '@safe-by-design/shared';
import TeamGameView from '../components/TeamGameView';
import TeamResults from '../components/TeamResults';
import ConnectionStatus from '../components/ConnectionStatus';
import { Activity, Loader2 } from 'lucide-react';

interface RandomEvent {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  effect: string;
}

interface LeaderboardEntry {
  teamName: string;
  score: number;
  rank: number;
}

interface SystemState {
  backlog: number;
  dnaRate: number;
  staffSickness: number;
  staffMorale: number;
  highRiskShare: number;
  incidents: number;
}

interface TeamViewProps {
  socket: Socket | null;
}

export default function TeamView({ socket }: TeamViewProps) {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [game, setGame] = useState<Game | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState((location.state as any)?.teamName || '');
  const [joined, setJoined] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [currentResults, setCurrentResults] = useState<CycleResults | null>(null);
  const [previousResults, setPreviousResults] = useState<CycleResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cycleEvents, setCycleEvents] = useState<RandomEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);

  useEffect(() => {
    if (!socket) return;
    
    fetchDecisions();

    socket.on('game_updated', (updatedGame: Game) => {
      setGame(updatedGame);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    });

    socket.on('cycle_started', ({ brief, events, systemState: state }: { brief: any; events?: RandomEvent[]; systemState?: SystemState }) => {
      console.log('Cycle started with events:', events);
      setCurrentBrief(brief);
      setSubmitted(false);
      setCurrentResults(null);
      setCycleEvents(events || []);
      if (state) setSystemState(state);
    });

    socket.on('leaderboard_updated', ({ leaderboard: lb }: { leaderboard: LeaderboardEntry[] }) => {
      console.log('Leaderboard updated:', lb);
      setLeaderboard(lb);
    });

    socket.on('submissions_closed', () => {
      // Results will come via results_ready
    });

    socket.on('results_ready', ({ results }: { results: CycleResults[] }) => {
      const myResult = results.find(r => r.teamId === teamId);
      if (myResult) {
        setPreviousResults(currentResults);
        setCurrentResults(myResult);
        // Update system state from results
        setSystemState({
          backlog: myResult.metrics.backlog,
          dnaRate: myResult.metrics.dnaRate,
          staffSickness: myResult.metrics.staffSickness,
          staffMorale: 72, // TODO: track this properly
          highRiskShare: myResult.metrics.highRiskShare,
          incidents: myResult.metrics.incidents,
        });
      }
    });

    socket.on('cycle_advanced', () => {
      setSubmitted(false);
      setPreviousResults(currentResults);
      setCurrentResults(null);
      setCycleEvents([]);
    });

    socket.on('game_ended', () => {
      // Navigate to summary or show ended state
    });

    return () => {
      socket.off('game_updated');
      socket.off('error');
      socket.off('cycle_started');
      socket.off('leaderboard_updated');
      socket.off('submissions_closed');
      socket.off('results_ready');
      socket.off('cycle_advanced');
      socket.off('game_ended');
    };
  }, [socket, teamId, currentResults]);

  const fetchDecisions = async () => {
    try {
      const response = await fetch('/api/decisions');
      const data = await response.json();
      setDecisions(data.data);
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
    }
  };

  const handleJoinGame = () => {
    if (!socket) return;
    
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    socket.emit('join_game', {
      gameCode,
      teamName: teamName.trim(),
    });

    // Listen for team_joined event
    socket.once('team_joined', (team) => {
      console.log('Team joined:', team);
      if (team.name === teamName.trim()) {
        setTeamId(team.id);
        setJoined(true);
      }
    });
    
    // Listen for game state
    socket.once('game_updated', (updatedGame) => {
      console.log('Game updated after join:', updatedGame);
      setGame(updatedGame);
    });
  };

  const handleSubmitDecisions = (selectedDecisions: string[]) => {
    if (!socket || !teamId) return;

    socket.emit('submit_decisions', {
      teamId,
      decisions: selectedDecisions,
    });

    setSubmitted(true);
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Activity className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Join Game</h1>
            <p className="text-slate-300">Safe by Design: Managing a Maternity System</p>
            <div className="mt-4 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-lg inline-block">
              <span className="text-xs text-primary-300">Game Code:</span>
              <div className="font-mono font-bold text-xl text-primary-400">{gameCode}</div>
            </div>
          </div>

          <div className="card bg-slate-800 border-slate-700 p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your team name"
                maxLength={30}
              />
            </div>

            <button
              onClick={handleJoinGame}
              disabled={!teamName.trim()}
              className="btn btn-primary w-full"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading game...</p>
          <p className="text-xs text-slate-500 mt-2">Joined: {joined ? 'Yes' : 'No'} | Team ID: {teamId || 'none'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <ConnectionStatus socket={socket} />
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 border-b border-primary-500/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">{teamName}</h1>
              <p className="text-primary-100 text-sm">Cycle {game.currentCycle} of 6</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-primary-100">Game Status</div>
            <div className="text-lg font-bold capitalize">{game.status.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        {game.status === 'lobby' && (
          <div className="max-w-6xl mx-auto p-6">
            <div className="card bg-slate-800 border-slate-700 p-12 text-center">
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Waiting for Game to Start</h2>
              <p className="text-slate-400">The facilitator will begin the cycle shortly...</p>
            </div>
          </div>
        )}

        {game.status === 'in_cycle' && currentBrief && (
          <TeamGameView
            gameId={game.id}
            teamId={teamId!}
            teamName={teamName}
            cycle={game.currentCycle}
            brief={currentBrief}
            decisions={decisions}
            systemState={systemState || undefined}
            events={cycleEvents}
            leaderboard={leaderboard}
            onSubmit={handleSubmitDecisions}
            submitted={submitted}
          />
        )}

        {game.status === 'results' && currentResults && (
          <TeamResults
            cycle={game.currentCycle}
            scores={currentResults.scores}
            previousScores={previousResults?.scores}
            metrics={currentResults.metrics}
            previousMetrics={previousResults?.metrics}
            incidents={currentResults.incidents}
            reflectiveQuestions={[
              'What trade-offs did your team prioritize this cycle?',
              'How did your decisions impact different stakeholder groups?',
              'What would you do differently if you could repeat this cycle?',
            ]}
          />
        )}

        {game.status === 'ended' && (
          <div className="max-w-6xl mx-auto p-6">
            <div className="card bg-slate-800 border-slate-700 p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Game Complete!</h2>
              <p className="text-slate-400 mb-6">
                Thank you for participating. The facilitator will review the final results.
              </p>
              {currentResults && (
                <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-sm text-blue-300">Total Safety</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {Math.round(currentResults.scores.safety)}
                    </div>
                  </div>
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-sm text-purple-300">Total Equity</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {Math.round(currentResults.scores.equity)}
                    </div>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <div className="text-sm text-green-300">Total Staff</div>
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(currentResults.scores.staff)}
                    </div>
                  </div>
                  <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
                    <div className="text-sm text-amber-300">Total Resilience</div>
                    <div className="text-2xl font-bold text-amber-400">
                      {Math.round(currentResults.scores.resilience)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
