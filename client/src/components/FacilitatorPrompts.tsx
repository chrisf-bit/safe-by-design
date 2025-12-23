import { useState, useEffect } from 'react';
import { MessageSquare, Users, Brain, TrendingUp, Pin, Copy, Download } from 'lucide-react';

interface Prompt {
  id: string;
  text: string;
  category: string;
  priority: number;
}

interface PromptGroup {
  teamId?: string;
  teamName?: string;
  whatHappened: string[];
  tradeoffs: string[];
  coachingQuestions: string[];
  rolePrompts: {
    diabetesSpecialist: string[];
    clinicalLead: string[];
    workforce: string[];
    pathway: string[];
  };
}

interface FacilitatorPromptsProps {
  gameId: string;
  cycle: number;
  results: any[];
  teams: any[];
}

export default function FacilitatorPrompts({ gameId, cycle, results, teams }: FacilitatorPromptsProps) {
  const [prompts, setPrompts] = useState<PromptGroup[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [pinnedPrompts, setPinnedPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, [gameId, cycle, results]);

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/games/${gameId}/prompts/${cycle}`);
      const data = await response.json();
      if (data.success && data.data) {
        setPrompts(data.data);
      } else {
        setError('Could not load prompts');
        setPrompts([]);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      setError('Failed to load prompts');
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = (promptText: string) => {
    setPinnedPrompts(prev =>
      prev.includes(promptText)
        ? prev.filter(p => p !== promptText)
        : [...prev, promptText]
    );
  };

  const copyPinned = () => {
    const text = pinnedPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n');
    navigator.clipboard.writeText(text);
    alert('Pinned prompts copied to clipboard!');
  };

  const exportPinned = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/export-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle, prompts: pinnedPrompts }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cycle-${cycle}-facilitation-prompts.pdf`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading || !prompts || prompts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400">
          {loading ? 'Generating prompts...' : error ? error : 'No prompts available yet'}
        </div>
      </div>
    );
  }

  const plenaryPrompts = prompts.find(p => !p.teamId);
  const teamPrompts = selectedTeam
    ? prompts.find(p => p.teamId === selectedTeam)
    : null;

  const renderPromptSection = (title: string, items: string[], icon: any) => {
    if (!items || items.length === 0) return null;

    const Icon = icon;
    return (
      <div className="mb-6">
        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg transition-all cursor-pointer ${
                pinnedPrompts.includes(item)
                  ? 'bg-primary-500/20 border border-primary-500/30'
                  : 'bg-slate-700/50 hover:bg-slate-700'
              }`}
              onClick={() => togglePin(item)}
            >
              <div className="flex items-start gap-2">
                <Pin
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    pinnedPrompts.includes(item) ? 'text-primary-400' : 'text-slate-500'
                  }`}
                />
                <span className="text-sm text-slate-200 flex-1">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 pb-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Facilitation Prompts</h3>
          <div className="flex gap-2">
            <button
              onClick={copyPinned}
              disabled={pinnedPrompts.length === 0}
              className="btn btn-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={exportPinned}
              disabled={pinnedPrompts.length === 0}
              className="btn btn-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {pinnedPrompts.length > 0 && (
          <div className="text-sm text-primary-400">
            {pinnedPrompts.length} prompt{pinnedPrompts.length !== 1 ? 's' : ''} pinned
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
        <button
          onClick={() => setSelectedTeam(null)}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            !selectedTeam
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Plenary
        </button>
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeam(team.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              selectedTeam === team.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {team.name}
          </button>
        ))}
      </div>

      {/* Role Filter */}
      {selectedTeam && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'diabetesSpecialist', 'clinicalLead', 'workforce', 'pathway'].map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedRole === role
                    ? 'bg-accent-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {role === 'all' ? 'All Roles' : 
                 role === 'diabetesSpecialist' ? 'Diabetes Specialist' :
                 role === 'clinicalLead' ? 'Clinical Lead' :
                 role === 'workforce' ? 'Workforce' :
                 'Pathway'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2">
        {!selectedTeam && plenaryPrompts && (
          <>
            {renderPromptSection('What Happened', plenaryPrompts.whatHappened, TrendingUp)}
            {renderPromptSection('Notable Trade-offs', plenaryPrompts.tradeoffs, Brain)}
            {renderPromptSection('Coaching Questions', plenaryPrompts.coachingQuestions, MessageSquare)}
          </>
        )}

        {selectedTeam && teamPrompts && (
          <>
            {renderPromptSection('What Happened', teamPrompts.whatHappened, TrendingUp)}
            {renderPromptSection('Notable Trade-offs', teamPrompts.tradeoffs, Brain)}
            {renderPromptSection('Coaching Questions', teamPrompts.coachingQuestions, MessageSquare)}
            
            {selectedRole !== 'all' && teamPrompts.rolePrompts && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-accent-400 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {selectedRole === 'diabetesSpecialist' ? 'Diabetes Specialist Midwife Perspective' :
                   selectedRole === 'clinicalLead' ? 'Clinical Lead Perspective' :
                   selectedRole === 'workforce' ? 'Workforce/Capacity Perspective' :
                   'Service/Pathway Perspective'}
                </h4>
                <div className="space-y-2">
                  {teamPrompts.rolePrompts[selectedRole as keyof typeof teamPrompts.rolePrompts]?.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg transition-all cursor-pointer ${
                        pinnedPrompts.includes(item)
                          ? 'bg-accent-500/20 border border-accent-500/30'
                          : 'bg-slate-700/50 hover:bg-slate-700'
                      }`}
                      onClick={() => togglePin(item)}
                    >
                      <div className="flex items-start gap-2">
                        <Pin
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            pinnedPrompts.includes(item) ? 'text-accent-400' : 'text-slate-500'
                          }`}
                        />
                        <span className="text-sm text-slate-200 flex-1">{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
