// =============================================================================
// SAFE BY DESIGN - FACILITATOR DEBRIEF VIEW
// Adapted from Pitch Perfect
// =============================================================================

import { useState } from 'react';

// Types (duplicated from server for client use)
interface DebriefQuestion {
  id: string;
  text: string;
  theme: string;
  triggers: string[];
  priority: number;
  scope: 'team' | 'all';
  followUp?: string;
}

interface TriggerResult {
  type: string;
  fired: boolean;
  intensity: number;
  context: string;
  cycles?: number[];
}

interface TeamAnalysis {
  teamId: string;
  teamName: string;
  triggers: TriggerResult[];
  keyObservations: string[];
  suggestedQuestions: DebriefQuestion[];
}

interface FacilitatorPrompts {
  gameNarrative: string;
  allTeams: DebriefQuestion[];
  perTeam: TeamAnalysis[];
}

interface CyclePrompts {
  cycle: number;
  perTeam: {
    teamId: string;
    teamName: string;
    keyObservations: string[];
    suggestedQuestions: DebriefQuestion[];
  }[];
  allTeams: DebriefQuestion[];
}

interface Props {
  prompts: FacilitatorPrompts | CyclePrompts;
  mode: 'end_of_game' | 'cycle';
}

export default function FacilitatorDebriefView({ prompts, mode }: Props) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    setAskedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const isEndOfGame = (p: FacilitatorPrompts | CyclePrompts): p is FacilitatorPrompts => {
    return 'gameNarrative' in p;
  };

  return (
    <div className="text-white h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-primary-400 mb-1">
          {mode === 'cycle'
            ? `Cycle ${(prompts as CyclePrompts).cycle} Debrief`
            : 'Final Debrief'}
        </h2>
        {isEndOfGame(prompts) && prompts.gameNarrative && (
          <p className="text-slate-400 text-sm italic">{prompts.gameNarrative}</p>
        )}
      </div>

      {/* All Teams Section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Ask All Teams
        </h3>
        <div className="space-y-2">
          {prompts.allTeams.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              isAsked={askedQuestions.has(question.id)}
              onToggle={() => toggleQuestion(question.id)}
            />
          ))}
        </div>
      </section>

      {/* Per Team Section */}
      <section>
        <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          Team-Specific Questions
        </h3>

        <div className="space-y-2">
          {prompts.perTeam.map(team => (
            <div key={team.teamId} className="bg-slate-700/50 rounded-lg overflow-hidden">
              {/* Team Header */}
              <button
                onClick={() => setExpandedTeam(
                  expandedTeam === team.teamId ? null : team.teamId
                )}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{team.teamName}</span>
                  <span className="text-xs text-slate-500">
                    {team.suggestedQuestions.length} questions
                  </span>
                </div>
                <span className="text-slate-400 text-xs">
                  {expandedTeam === team.teamId ? '▼' : '▶'}
                </span>
              </button>

              {/* Team Details */}
              {expandedTeam === team.teamId && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Observations */}
                  {team.keyObservations.length > 0 && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                        Key Observations
                      </p>
                      <ul className="space-y-0.5">
                        {team.keyObservations.map((obs, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-1">
                            <span className="text-amber-500">•</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Triggers (end of game only) */}
                  {'triggers' in team && team.triggers.length > 0 && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                        Notable Patterns
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {team.triggers
                          .sort((a, b) => b.intensity - a.intensity)
                          .slice(0, 5)
                          .map((trigger, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-slate-600 rounded text-xs text-slate-200"
                              title={trigger.context}
                            >
                              {formatTriggerName(trigger.type)}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  <div className="space-y-1">
                    {team.suggestedQuestions.map(question => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        isAsked={askedQuestions.has(`${team.teamId}-${question.id}`)}
                        onToggle={() => toggleQuestion(`${team.teamId}-${question.id}`)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// QUESTION CARD COMPONENT
// =============================================================================

interface QuestionCardProps {
  question: DebriefQuestion;
  isAsked: boolean;
  onToggle: () => void;
  compact?: boolean;
}

function QuestionCard({
  question,
  isAsked,
  onToggle,
  compact
}: QuestionCardProps) {
  return (
    <div
      className={`
        rounded p-2 transition-all cursor-pointer
        ${isAsked
          ? 'bg-slate-700/30 border border-slate-600'
          : 'bg-slate-800 border border-transparent hover:border-slate-600'
        }
        ${compact ? 'text-xs' : 'text-sm'}
      `}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <div className={`
          mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
          ${isAsked
            ? 'bg-green-500 border-green-500'
            : 'border-slate-500'
          }
        `}>
          {isAsked && <span className="text-white text-xs">✓</span>}
        </div>

        <div className="flex-1">
          {/* Question Text */}
          <p className={isAsked ? 'text-slate-400 line-through' : 'text-white'}>
            "{question.text}"
          </p>

          {/* Follow-up */}
          {question.followUp && !compact && (
            <p className="text-slate-500 text-xs mt-1 italic">
              Follow-up: {question.followUp}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${getThemeColor(question.theme)}`}>
              {formatTheme(question.theme)}
            </span>
            {!compact && (
              <span className="text-xs text-slate-500">
                {'●'.repeat(question.priority)}{'○'.repeat(5 - question.priority)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTriggerName(trigger: string): string {
  return trigger
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTheme(theme: string): string {
  const labels: Record<string, string> = {
    story: 'Story',
    decision_quality: 'Decisions',
    systems_thinking: 'Systems',
    team_dynamics: 'Team',
    strategy: 'Strategy',
    lessons: 'Lessons',
    safety_culture: 'Safety',
    equity_access: 'Equity',
    staff_wellbeing: 'Staff',
    resilience: 'Resilience'
  };
  return labels[theme] || theme;
}

function getThemeColor(theme: string): string {
  const colors: Record<string, string> = {
    story: 'bg-purple-500/20 text-purple-300',
    decision_quality: 'bg-amber-500/20 text-amber-300',
    systems_thinking: 'bg-cyan-500/20 text-cyan-300',
    team_dynamics: 'bg-pink-500/20 text-pink-300',
    strategy: 'bg-emerald-500/20 text-emerald-300',
    lessons: 'bg-indigo-500/20 text-indigo-300',
    safety_culture: 'bg-blue-500/20 text-blue-300',
    equity_access: 'bg-purple-500/20 text-purple-300',
    staff_wellbeing: 'bg-green-500/20 text-green-300',
    resilience: 'bg-amber-500/20 text-amber-300'
  };
  return colors[theme] || 'bg-slate-500/20 text-slate-300';
}
