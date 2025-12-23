import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, PlayCircle } from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [numberOfTeams, setNumberOfTeams] = useState(4);
  const [facilitatorName, setFacilitatorName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (!numberOfTeams || numberOfTeams < 2 || numberOfTeams > 6) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfTeams, facilitatorName }),
      });
      
      const data = await response.json();
      if (data.success) {
        navigate(`/facilitator/${data.data.gameCode}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (!gameCode || !teamName) return;
    navigate(`/team/${gameCode}`, { state: { teamName } });
  };

  return (
    <div className="home-page min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-primary-50/20 text-slate-900">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-xl">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-balance bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            Safe by Design
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto text-balance">
            Managing a Maternity System Under Pressure
          </p>
          <p className="text-sm text-slate-500 mt-2">
            A face-to-face simulation for midwives and specialist teams
          </p>
        </div>

        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => setMode('create')}
              className="card p-8 hover:scale-105 transition-transform group"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Facilitator</h2>
              <p className="text-slate-600">
                Create a new game session and manage teams through 6 cycles of decision-making
              </p>
            </button>

            <button
              onClick={() => setMode('join')}
              className="card p-8 hover:scale-105 transition-transform group"
            >
              <div className="w-16 h-16 bg-accent-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent-200 transition-colors">
                <PlayCircle className="w-8 h-8 text-accent-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Join as Team</h2>
              <p className="text-slate-600">
                Enter a game code to join an existing session with your team
              </p>
            </button>
          </div>
        )}

        {/* Create Game Form */}
        {mode === 'create' && (
          <div className="card max-w-2xl mx-auto p-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Create New Game</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Teams</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setNumberOfTeams(num)}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        numberOfTeams === num
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Facilitator Name (Optional)</label>
                <input
                  type="text"
                  value={facilitatorName}
                  onChange={(e) => setFacilitatorName(e.target.value)}
                  placeholder="Your name"
                  className="input"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setMode('select')}
                  className="btn btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateGame}
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Creating...' : 'Create Game'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Game Form */}
        {mode === 'join' && (
          <div className="card max-w-2xl mx-auto p-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Join Game</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Game Code</label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="input text-center text-2xl tracking-wider font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Team Alpha, Blue Team"
                  className="input"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setMode('select')}
                  className="btn btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinGame}
                  disabled={!gameCode || !teamName}
                  className="btn btn-primary flex-1"
                >
                  Join Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-slate-500">
          <p>Built for specialist midwives and clinical teams</p>
          <p className="mt-1">6 cycles • 4 pillars • Real-time facilitation</p>
        </div>
      </div>
    </div>
  );
}
