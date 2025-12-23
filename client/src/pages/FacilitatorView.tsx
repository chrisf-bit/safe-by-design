import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { Game, Team, CycleResults } from '@safe-by-design/shared';
import FacilitatorDebriefView from '../components/FacilitatorDebriefView';
import Leaderboard from '../components/Leaderboard';
import ConnectionStatus from '../components/ConnectionStatus';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  ChevronRight,
  Copy,
  Download,
  Bell
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LeaderboardEntry {
  teamName: string;
  teamId: string;
  scores: {
    safety: number;
    equity: number;
    staff: number;
    resilience: number;
    total: number;
  };
  score: number;
  rank: number;
  previousRank?: number;
  previousTotal?: number;
}

interface RandomEvent {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  effect: string;
}

interface FacilitatorViewProps {
  socket: Socket | null;
}

export default function FacilitatorView({ socket }: FacilitatorViewProps) {
  const { gameCode } = useParams<{ gameCode: string }>();
  console.log('🟢 FacilitatorView RENDER, gameCode:', gameCode, 'socket:', socket ? (socket.connected ? 'connected' : 'connecting') : 'null');
  
  const [isConnected, setIsConnected] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<CycleResults[]>([]);
  const [submittedTeams, setSubmittedTeams] = useState<Set<string>>(new Set());
  const [currentBrief, setCurrentBrief] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'prompts' | 'charts'>('overview');
  const [selectedTeamForPrompts, setSelectedTeamForPrompts] = useState<string | null>(null);
  const [debriefPrompts, setDebriefPrompts] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [cycleEvents, setCycleEvents] = useState<RandomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join game when socket connects (Market Masters pattern) + HTTP fallback
  useEffect(() => {
    let dataLoaded = false;
    console.log('🔵 FacilitatorView useEffect running, socket:', socket ? 'exists' : 'null', 'gameCode:', gameCode);
    
    // HTTP API fallback - always works, doesn't depend on socket timing
    const fetchViaAPI = async () => {
      if (dataLoaded) return;
      
      try {
        console.log('📡 Fetching game via API:', gameCode);
        const gameRes = await fetch(`/api/games/${gameCode}`);
        const gameData = await gameRes.json();
        console.log('📡 API response:', gameData);
        
        if (gameData.data && !dataLoaded) {
          console.log('✅ Got game via API:', gameData.data.id);
          setGame(gameData.data);
          
          const teamsRes = await fetch(`/api/games/${gameData.data.id}/teams`);
          const teamsData = await teamsRes.json();
          
          if (teamsData.data && !dataLoaded) {
            console.log('✅ Got teams via API:', teamsData.data.length);
            setTeams(teamsData.data);
          }
          
          dataLoaded = true;
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ API fetch failed:', err);
      }
    };
    
    // Start API fetch immediately (doesn't need socket)
    fetchViaAPI();
    
    // Socket approach (for real-time updates and joining rooms)
    if (!socket) return;

    const joinGame = () => {
      console.log('🎮 Joining game as facilitator:', gameCode);
      socket.emit('join_facilitator', { gameCode }, (response: any) => {
        console.log('📦 join_facilitator callback:', response);
        
        if (response?.error) {
          setError(response.error);
          setLoading(false);
          return;
        }
        
        if (response?.game && !dataLoaded) {
          console.log('✅ Got game via socket:', response.game.id);
          setGame(response.game);
          dataLoaded = true;
        }
        if (response?.teams && !dataLoaded) {
          console.log('✅ Got teams via socket:', response.teams.length);
          setTeams(response.teams);
        }
        setLoading(false);
      });
    };

    // If already connected, join immediately
    if (socket.connected) {
      setIsConnected(true);
      joinGame();
    }

    // Handle connection
    const onConnect = () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      joinGame();
    };

    const onDisconnect = () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Real-time event listeners
    socket.on('game_updated', (updatedGame: Game) => {
      console.log('Facilitator received game_updated:', updatedGame.status);
      setGame(updatedGame);
    });

    socket.on('team_joined', (team: Team) => {
      console.log('Facilitator received team_joined:', team.name);
      setTeams(prev => {
        if (prev.find(t => t.id === team.id)) return prev;
        return [...prev, team];
      });
    });

    socket.on('team_submitted', ({ teamId }: { teamId: string }) => {
      console.log('Facilitator received team_submitted:', teamId);
      setSubmittedTeams(prev => new Set([...prev, teamId]));
    });

    socket.on('cycle_started', ({ brief, events }: { brief: any; events?: RandomEvent[] }) => {
      console.log('Facilitator received cycle_started');
      setCurrentBrief(brief);
      setSubmittedTeams(new Set());
      setDebriefPrompts(null);
      setCycleEvents(events || []);
    });

    socket.on('results_ready', ({ results: cycleResults }: { results: CycleResults[] }) => {
      console.log('Facilitator received results_ready:', cycleResults?.length, 'results');
      setResults(cycleResults);
    });

    socket.on('debrief_prompts', (prompts: any) => {
      console.log('📋 Facilitator received debrief_prompts');
      setDebriefPrompts(prompts);
    });

    socket.on('leaderboard_updated', ({ leaderboard: lb }: { leaderboard: LeaderboardEntry[] }) => {
      console.log('📊 Facilitator received leaderboard_updated');
      setLeaderboard(lb);
    });

    socket.on('cycle_advanced', () => {
      console.log('Facilitator received cycle_advanced');
      setSubmittedTeams(new Set());
      setResults([]);
      setDebriefPrompts(null);
      setCycleEvents([]);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_updated');
      socket.off('team_joined');
      socket.off('team_submitted');
      socket.off('cycle_started');
      socket.off('results_ready');
      socket.off('debrief_prompts');
      socket.off('leaderboard_updated');
      socket.off('cycle_advanced');
    };
  }, [socket, gameCode]);

  const handleStartCycle = () => {
    if (game && socket) {
      console.log('=== EMITTING start_cycle ===');
      console.log('Game ID:', game.id);
      console.log('Cycle:', game.currentCycle);
      socket.emit('start_cycle', { gameId: game.id, cycle: game.currentCycle });
    } else {
      console.log('ERROR: game or socket is null, cannot start cycle');
    }
  };

  const handleCloseSubmissions = () => {
    if (game && socket) {
      socket.emit('close_submissions', { gameId: game.id, cycle: game.currentCycle });
    }
  };

  const handleAdvanceCycle = () => {
    if (game && socket) {
      socket.emit('advance_cycle', { gameId: game.id });
    }
  };

  const copyGameCode = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
      alert('Game code copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <ConnectionStatus socket={socket} />
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <ConnectionStatus socket={socket} />
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <ConnectionStatus socket={socket} />
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading game...</p>
        </div>
      </div>
    );
  }

  const allTeamsSubmitted = teams.length > 0 && teams.every(t => submittedTeams.has(t.id));
  const submissionProgress = teams.length > 0 ? (submittedTeams.size / teams.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <ConnectionStatus socket={socket} />
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 border-b border-primary-500/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Facilitator Control Room</h1>
              <p className="text-primary-100 text-sm">Cycle {game.currentCycle} of 6</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={copyGameCode}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span className="font-mono font-bold">{gameCode}</span>
            </button>
            
            <div className="px-4 py-2 bg-white/10 rounded-lg">
              <div className="text-xs text-primary-100">Teams Joined</div>
              <div className="text-xl font-bold">{teams.length} / {game.numberOfTeams}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Controls */}
          <div className="col-span-3 space-y-4">
            <div className="card bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-primary-400" />
                Game Control
              </h2>

              {game.status === 'lobby' && (
                <div>
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                    <p className="mb-2">✓ Game created</p>
                    <p>Waiting for teams to join ({teams.length}/{game.numberOfTeams})</p>
                    {teams.length >= 2 && (
                      <p className="mt-2 text-blue-200 font-medium">Ready to start!</p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleStartCycle}
                    disabled={teams.length < 2}
                    className="btn btn-primary w-full mb-3"
                  >
                    {teams.length < 2 ? `Need ${2 - teams.length} More Team(s)` : 'Start Game'}
                  </button>
                  
                  <p className="text-xs text-slate-400 text-center">
                    This will start Cycle 1. Teams will automatically advance when all submit.
                  </p>
                </div>
              )}

              {game.status === 'in_cycle' && (
                <div>
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-sm font-medium text-blue-300 mb-2">
                      Cycle {game.currentCycle} in Progress
                    </div>
                    <div className="text-xs text-blue-200">
                      Waiting for team decisions...
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-2">Submission Progress</div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary-500 h-full transition-all duration-500"
                        style={{ width: `${submissionProgress}%` }}
                      />
                    </div>
                    <div className="text-sm text-center mt-2 text-slate-300">
                      {submittedTeams.size} / {teams.length} teams submitted
                    </div>
                  </div>

                  {allTeamsSubmitted && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                      <div className="text-sm text-green-300">
                        ✓ All teams submitted!
                      </div>
                      <div className="text-xs text-green-200 mt-1">
                        Calculating results...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {game.status === 'results' && (
                <div>
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <div className="text-sm font-medium text-green-300 mb-1">
                      ✓ Cycle {game.currentCycle} Complete
                    </div>
                    <div className="text-xs text-green-200">
                      Review results and prompts, then advance when ready
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAdvanceCycle}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {game.currentCycle < 6 ? (
                      <>
                        Next Cycle ({game.currentCycle + 1} of 6)
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      'End Game'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Teams List */}
            <div className="card bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-400" />
                Teams ({teams.length})
              </h2>
              
              <div className="space-y-2">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <span className="font-medium">{team.name}</span>
                    {submittedTeams.has(team.id) && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Panel - Main Content */}
          <div className="col-span-6 space-y-4">
            {/* Cycle Brief */}
            {currentBrief && game.status === 'in_cycle' && (
              <div className="card bg-gradient-to-br from-primary-900 to-primary-800 border-primary-700 p-6">
                <h2 className="text-2xl font-bold mb-2">{currentBrief.title}</h2>
                <p className="text-primary-100 mb-4">{currentBrief.description}</p>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-primary-200">Key Signals:</div>
                  {currentBrief.signals.map((signal: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-primary-100">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Random Events Display */}
            {cycleEvents.length > 0 && game.status === 'in_cycle' && (
              <div className="card bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-amber-500/50 p-4">
                <h3 className="font-bold text-amber-200 mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Events This Cycle
                </h3>
                <div className="space-y-2">
                  {cycleEvents.map(event => (
                    <div 
                      key={event.id}
                      className={`p-3 rounded-lg border ${
                        event.severity === 'critical' 
                          ? 'bg-red-900/30 border-red-500/50'
                          : event.severity === 'warning'
                          ? 'bg-amber-900/30 border-amber-500/50'
                          : 'bg-blue-900/30 border-blue-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-bold text-sm ${
                            event.severity === 'critical' ? 'text-red-300' :
                            event.severity === 'warning' ? 'text-amber-300' : 'text-blue-300'
                          }`}>
                            {event.title}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">{event.description}</p>
                        </div>
                        <span className="text-xs text-slate-400">{event.effect}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <Leaderboard 
                teams={leaderboard} 
                cycle={game.currentCycle}
                showPillars={game.status === 'results'}
              />
            )}

            {/* Results Display */}
            {game.status === 'results' && results.length > 0 && (
              <div className="card bg-slate-800 border-slate-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Cycle {game.currentCycle} Results</h2>
                
                <div className="space-y-6">
                  {results.map(result => {
                    const team = teams.find(t => t.id === result.teamId);
                    if (!team) return null;

                    return (
                      <div key={result.id} className="border-b border-slate-700 last:border-0 pb-6 last:pb-0">
                        <h3 className="text-xl font-bold text-white mb-4">{team.name}</h3>
                        
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                            <div className="text-sm text-blue-300 mb-1">Safety</div>
                            <div className="text-3xl font-bold text-blue-400">
                              {result.scores?.safety != null ? Math.round(result.scores.safety) : '-'}
                            </div>
                          </div>
                          
                          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                            <div className="text-sm text-purple-300 mb-1">Equity</div>
                            <div className="text-3xl font-bold text-purple-400">
                              {result.scores?.equity != null ? Math.round(result.scores.equity) : '-'}
                            </div>
                          </div>
                          
                          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                            <div className="text-sm text-green-300 mb-1">Staff</div>
                            <div className="text-3xl font-bold text-green-400">
                              {result.scores?.staff != null ? Math.round(result.scores.staff) : '-'}
                            </div>
                          </div>
                          
                          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
                            <div className="text-sm text-amber-300 mb-1">Resilience</div>
                            <div className="text-3xl font-bold text-amber-400">
                              {result.scores?.resilience != null ? Math.round(result.scores.resilience) : '-'}
                            </div>
                          </div>
                        </div>

                        {result.incidents && result.incidents.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="font-bold text-red-400 mb-2">Incidents ({result.incidents.length})</div>
                            {result.incidents.map((incident, idx) => (
                              <div key={idx} className="text-sm text-slate-300">
                                • {incident.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading Results State */}
            {game.status === 'results' && results.length === 0 && (
              <div className="card bg-slate-800 border-slate-700 p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-white mb-2">Loading Results...</h2>
                <p className="text-slate-400">Results are being calculated</p>
              </div>
            )}

            {/* Waiting State */}
            {game.status === 'lobby' && teams.length < 2 && (
              <div className="card bg-slate-800 border-slate-700 p-12 text-center">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Waiting for Teams</h2>
                <p className="text-slate-400">Share the game code with teams to begin</p>
              </div>
            )}
          </div>

          {/* Right Panel - Prompts & Analysis */}
          <div className="col-span-3 space-y-4">
            <div className="card bg-slate-800 border-slate-700 p-6 h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-400" />
                Facilitation Tools
              </h2>
              
              <div className="flex-1 overflow-y-auto">
                {game.status === 'lobby' && (
                  <div className="text-center text-slate-400 py-12">
                    Start the cycle to enable facilitation tools
                  </div>
                )}
                
                {game.status === 'in_cycle' && (
                  <div className="text-center text-slate-400 py-12">
                    Prompts will be available once results are calculated
                  </div>
                )}
                
                {game.status === 'results' && debriefPrompts && (
                  <FacilitatorDebriefView 
                    prompts={debriefPrompts} 
                    mode="cycle" 
                  />
                )}
                
                {game.status === 'results' && !debriefPrompts && (
                  <div className="text-center text-slate-400 py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    Loading discussion prompts...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
