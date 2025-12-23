// =============================================================================
// SAFE BY DESIGN - TEAM GAME VIEW
// Redesigned with tabs, tiles, events, and rich metrics
// =============================================================================

import { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, Clock, X, ChevronRight,
  Shield, Heart, Users, Activity, Zap, AlertTriangle,
  TrendingUp, TrendingDown, Calendar, DollarSign,
  Baby, UserPlus, BookOpen,
  Bell, Target, Award
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface Decision {
  id: string;
  name: string;
  description: string;
  category: string;
  costs: {
    capacityPoints: number;
    staffEnergy: number;
    cashBudget: number;
  };
  effects?: string[];
  effectTags?: string[];
  timing: 'immediate' | 'delayed' | 'both';
}

interface Budget {
  capacityPoints: number;
  staffEnergy: number;
  cashBudget: number;
}

interface SystemState {
  backlog: number;
  dnaRate: number;
  staffSickness: number;
  staffMorale: number;
  highRiskShare: number;
  incidents: number;
}

interface RandomEvent {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  effect: string;
}

interface TeamGameViewProps {
  gameId: string;
  teamId: string;
  teamName: string;
  cycle: number;
  brief: any;
  decisions: Decision[];
  systemState?: SystemState;
  events?: RandomEvent[];
  leaderboard?: Array<{ teamName: string; score: number; rank: number }>;
  onSubmit: (selectedDecisions: string[]) => void;
  submitted: boolean;
}

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const CATEGORIES = [
  { id: 'pathway_access', label: 'Pathway & Access', icon: Heart, color: 'purple' },
  { id: 'clinical_safety', label: 'Clinical Safety', icon: Shield, color: 'blue' },
  { id: 'workforce_wellbeing', label: 'Workforce', icon: Users, color: 'green' },
  { id: 'digital_monitoring', label: 'Digital & Tech', icon: Activity, color: 'cyan' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TeamGameView({
  gameId,
  teamId,
  teamName,
  cycle,
  brief,
  decisions,
  systemState,
  events = [],
  leaderboard = [],
  onSubmit,
  submitted,
}: TeamGameViewProps) {
  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('pathway_access');
  const [showEventModal, setShowEventModal] = useState(false);
  const [remainingBudget, setRemainingBudget] = useState<Budget>({
    capacityPoints: 10,
    staffEnergy: 10,
    cashBudget: 10,
  });

  const maxBudget: Budget = {
    capacityPoints: 10,
    staffEnergy: 10,
    cashBudget: 10,
  };

  // Default system state
  const state: SystemState = systemState || {
    backlog: 35,
    dnaRate: 8,
    staffSickness: 12,
    staffMorale: 72,
    highRiskShare: 28,
    incidents: 0,
  };

  useEffect(() => {
    calculateRemainingBudget();
  }, [selectedDecisions]);

  // Show event modal when new events arrive
  useEffect(() => {
    if (events.length > 0 && !submitted) {
      setShowEventModal(true);
    }
  }, [events]);

  const calculateRemainingBudget = () => {
    let capacity = maxBudget.capacityPoints;
    let energy = maxBudget.staffEnergy;
    let cash = maxBudget.cashBudget;

    selectedDecisions.forEach(id => {
      const decision = decisions.find(d => d.id === id);
      if (decision) {
        capacity -= decision.costs.capacityPoints;
        energy -= decision.costs.staffEnergy;
        cash -= decision.costs.cashBudget;
      }
    });

    setRemainingBudget({ capacityPoints: capacity, staffEnergy: energy, cashBudget: cash });
  };

  const toggleDecision = (id: string) => {
    if (submitted) return;
    const decision = decisions.find(d => d.id === id);
    if (!decision) return;

    const newSelected = new Set(selectedDecisions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (!canAfford(decision)) return;
      newSelected.add(id);
    }
    setSelectedDecisions(newSelected);
  };

  const canAfford = (decision: Decision): boolean => {
    return (
      remainingBudget.capacityPoints >= decision.costs.capacityPoints &&
      remainingBudget.staffEnergy >= decision.costs.staffEnergy &&
      remainingBudget.cashBudget >= decision.costs.cashBudget
    );
  };

  const handleSubmit = () => {
    if (selectedDecisions.size === 0) {
      if (!confirm('Submit with no decisions selected?')) return;
    }
    onSubmit(Array.from(selectedDecisions));
  };

  const selectedDecisionsList = decisions.filter(d => selectedDecisions.has(d.id));
  const activeDecisions = decisions.filter(d => d.category === activeTab);

  // Submitted state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Decisions Submitted!</h2>
            <p className="text-green-200 mb-6">Waiting for other teams to complete Cycle {cycle}...</p>
            
            {selectedDecisionsList.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-4 text-left">
                <h3 className="text-sm font-bold text-slate-300 mb-3">Your {selectedDecisionsList.length} Selections:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedDecisionsList.map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-sm text-white bg-slate-700/50 rounded-lg px-3 py-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Event Modal */}
      {showEventModal && events.length > 0 && (
        <EventModal events={events} onClose={() => setShowEventModal(false)} />
      )}

      {/* Top Bar - Team Info & Cycle */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-500/20 px-4 py-2 rounded-lg">
                <span className="text-primary-400 font-bold">{teamName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Cycle {cycle}</span>
              </div>
            </div>
            
            {/* Mini Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-amber-400" />
                <div className="flex gap-2">
                  {leaderboard.slice(0, 3).map((team, idx) => (
                    <div 
                      key={team.teamName}
                      className={`text-xs px-2 py-1 rounded ${
                        team.teamName === teamName 
                          ? 'bg-primary-500/30 text-primary-300' 
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {idx + 1}. {team.teamName}: {team.score}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Cycle Brief Card */}
        {brief && (
          <div className="bg-gradient-to-r from-primary-900/80 to-primary-800/60 border border-primary-700/50 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-500/30 p-3 rounded-lg">
                <Bell className="w-6 h-6 text-primary-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">{brief.title}</h2>
                <p className="text-primary-100 text-sm mb-4">{brief.description}</p>
                <div className="flex flex-wrap gap-2">
                  {brief.signals?.map((signal: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs text-primary-200 bg-primary-800/50 px-3 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Random Events Banner */}
        {events.length > 0 && (
          <div 
            className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-500/50 rounded-xl p-4 mb-6 cursor-pointer hover:border-amber-400 transition-colors"
            onClick={() => setShowEventModal(true)}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-200">{events.length} Event{events.length > 1 ? 's' : ''} This Cycle</h3>
                <p className="text-sm text-amber-300/80">Click to view details and impacts</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - System Status */}
          <div className="col-span-3">
            <div className="sticky top-24 space-y-4">
              {/* System Health */}
              <SystemStatusPanel state={state} />
              
              {/* Budget Display */}
              <BudgetPanel 
                remaining={remainingBudget} 
                max={maxBudget} 
              />

              {/* Selected Decisions */}
              <SelectedDecisionsPanel 
                decisions={selectedDecisionsList}
                onRemove={(id) => toggleDecision(id)}
              />

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Submit Decisions
              </button>
            </div>
          </div>

          {/* Right Column - Decision Tabs & Tiles */}
          <div className="col-span-9">
            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const count = decisions.filter(d => d.category === cat.id).length;
                const selectedCount = decisions.filter(d => d.category === cat.id && selectedDecisions.has(d.id)).length;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                      activeTab === cat.id
                        ? `bg-${cat.color}-500/20 text-${cat.color}-400 border border-${cat.color}-500/50`
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedCount > 0 
                          ? 'bg-primary-500/30 text-primary-300' 
                          : 'bg-slate-700 text-slate-500'
                      }`}>
                        {selectedCount}/{count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Decision Tiles Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDecisions.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No decisions available in this category
                </div>
              ) : (
                activeDecisions.map(decision => (
                  <DecisionTile
                    key={decision.id}
                    decision={decision}
                    isSelected={selectedDecisions.has(decision.id)}
                    canAfford={selectedDecisions.has(decision.id) || canAfford(decision)}
                    onToggle={() => toggleDecision(decision.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DECISION TILE COMPONENT
// =============================================================================

interface DecisionTileProps {
  decision: Decision;
  isSelected: boolean;
  canAfford: boolean;
  onToggle: () => void;
}

function DecisionTile({ decision, isSelected, canAfford, onToggle }: DecisionTileProps) {
  const effects = decision.effects || decision.effectTags || [];
  
  const getEffectIcon = (effect: string) => {
    if (effect.includes('safety')) return <Shield className="w-3 h-3" />;
    if (effect.includes('equity')) return <Heart className="w-3 h-3" />;
    if (effect.includes('staff')) return <Users className="w-3 h-3" />;
    if (effect.includes('resilience')) return <Activity className="w-3 h-3" />;
    return null;
  };

  const getEffectColor = (effect: string) => {
    if (effect.includes('safety')) return 'text-blue-400 bg-blue-500/20';
    if (effect.includes('equity')) return 'text-purple-400 bg-purple-500/20';
    if (effect.includes('staff')) return 'text-green-400 bg-green-500/20';
    if (effect.includes('resilience')) return 'text-amber-400 bg-amber-500/20';
    return 'text-slate-400 bg-slate-500/20';
  };

  return (
    <div
      onClick={onToggle}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border-2 ${
        isSelected
          ? 'bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/20'
          : canAfford
          ? 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
          : 'bg-slate-800/40 border-slate-700/50 opacity-50 cursor-not-allowed'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="w-5 h-5 text-primary-400" />
        </div>
      )}

      {/* Title */}
      <h4 className="font-bold text-white text-sm mb-2 pr-6">{decision.name}</h4>
      
      {/* Description */}
      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{decision.description}</p>

      {/* Costs */}
      <div className="flex gap-2 mb-3">
        {decision.costs.capacityPoints > 0 && (
          <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {decision.costs.capacityPoints}
          </span>
        )}
        {decision.costs.staffEnergy > 0 && (
          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
            <Users className="w-3 h-3" />
            {decision.costs.staffEnergy}
          </span>
        )}
        {decision.costs.cashBudget > 0 && (
          <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {decision.costs.cashBudget}
          </span>
        )}
      </div>

      {/* Effect Tags */}
      {effects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {effects.slice(0, 3).map((effect, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getEffectColor(effect)}`}
            >
              {getEffectIcon(effect)}
              <span className="capitalize">{effect}</span>
            </span>
          ))}
        </div>
      )}

      {/* Timing indicator */}
      <div className="absolute bottom-3 right-3">
        <span className={`text-xs px-2 py-0.5 rounded ${
          decision.timing === 'immediate' 
            ? 'bg-green-500/20 text-green-400' 
            : decision.timing === 'delayed'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {decision.timing === 'immediate' ? '⚡ Now' : decision.timing === 'delayed' ? '🕐 Later' : '⚡🕐 Both'}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// SYSTEM STATUS PANEL
// =============================================================================

interface SystemStatusPanelProps {
  state: SystemState;
}

function SystemStatusPanel({ state }: SystemStatusPanelProps) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary-400" />
        System Status
      </h3>
      
      <div className="space-y-3">
        <StatusRow 
          label="Backlog" 
          value={`${state.backlog} patients`}
          status={state.backlog < 30 ? 'good' : state.backlog < 50 ? 'warning' : 'critical'}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatusRow 
          label="DNA Rate" 
          value={`${state.dnaRate}%`}
          status={state.dnaRate < 8 ? 'good' : state.dnaRate < 12 ? 'warning' : 'critical'}
          icon={<Target className="w-4 h-4" />}
        />
        <StatusRow 
          label="Staff Sickness" 
          value={`${state.staffSickness}%`}
          status={state.staffSickness < 10 ? 'good' : state.staffSickness < 18 ? 'warning' : 'critical'}
          icon={<Users className="w-4 h-4" />}
        />
        <StatusRow 
          label="Staff Morale" 
          value={`${state.staffMorale}%`}
          status={state.staffMorale > 70 ? 'good' : state.staffMorale > 50 ? 'warning' : 'critical'}
          icon={<Heart className="w-4 h-4" />}
        />
        <StatusRow 
          label="High-Risk Share" 
          value={`${state.highRiskShare}%`}
          status={state.highRiskShare < 25 ? 'good' : state.highRiskShare < 35 ? 'warning' : 'critical'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        
        {state.incidents > 0 && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mt-2">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{state.incidents} Incident{state.incidents > 1 ? 's' : ''} Last Cycle</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

function StatusRow({ label, value, status, icon }: StatusRowProps) {
  const colors = {
    good: 'text-green-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-sm font-bold ${colors[status]}`}>{value}</span>
    </div>
  );
}

// =============================================================================
// BUDGET PANEL
// =============================================================================

interface BudgetPanelProps {
  remaining: Budget;
  max: Budget;
}

function BudgetPanel({ remaining, max }: BudgetPanelProps) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        Budget Remaining
      </h3>
      
      <div className="space-y-3">
        <BudgetBar 
          label="Capacity" 
          value={remaining.capacityPoints} 
          max={max.capacityPoints}
          color="blue"
          icon={<Zap className="w-3 h-3" />}
        />
        <BudgetBar 
          label="Staff Energy" 
          value={remaining.staffEnergy} 
          max={max.staffEnergy}
          color="green"
          icon={<Users className="w-3 h-3" />}
        />
        <BudgetBar 
          label="Cash" 
          value={remaining.cashBudget} 
          max={max.cashBudget}
          color="amber"
          icon={<DollarSign className="w-3 h-3" />}
        />
      </div>
    </div>
  );
}

interface BudgetBarProps {
  label: string;
  value: number;
  max: number;
  color: 'blue' | 'green' | 'amber';
  icon: React.ReactNode;
}

function BudgetBar({ label, value, max, color, icon }: BudgetBarProps) {
  const percentage = (value / max) * 100;
  const colorClasses = {
    blue: { text: 'text-blue-400', bg: 'bg-blue-500' },
    green: { text: 'text-green-400', bg: 'bg-green-500' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500' },
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={`flex items-center gap-1 ${colorClasses[color].text}`}>
          {icon}
          {label}
        </span>
        <span className="text-white font-bold">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color].bg} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// SELECTED DECISIONS PANEL
// =============================================================================

interface SelectedDecisionsPanelProps {
  decisions: Decision[];
  onRemove: (id: string) => void;
}

function SelectedDecisionsPanel({ decisions, onRemove }: SelectedDecisionsPanelProps) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        Selected ({decisions.length})
      </h3>
      
      {decisions.length === 0 ? (
        <p className="text-xs text-slate-500 italic">Click tiles to select decisions</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {decisions.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between bg-primary-500/10 border border-primary-500/30 rounded-lg px-3 py-2"
            >
              <span className="text-xs text-white truncate flex-1">{d.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(d.id); }}
                className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EVENT MODAL
// =============================================================================

interface EventModalProps {
  events: RandomEvent[];
  onClose: () => void;
}

function EventModal({ events, onClose }: EventModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Events This Cycle</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto max-h-96">
          {events.map(event => (
            <div 
              key={event.id}
              className={`p-4 rounded-xl border ${
                event.severity === 'critical' 
                  ? 'bg-red-900/30 border-red-500/50'
                  : event.severity === 'warning'
                  ? 'bg-amber-900/30 border-amber-500/50'
                  : 'bg-blue-900/30 border-blue-500/50'
              }`}
            >
              <h3 className={`font-bold mb-2 ${
                event.severity === 'critical' ? 'text-red-300' :
                event.severity === 'warning' ? 'text-amber-300' : 'text-blue-300'
              }`}>
                {event.title}
              </h3>
              <p className="text-sm text-slate-300 mb-3">{event.description}</p>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <TrendingDown className="w-3 h-3" />
                <span>Impact: {event.effect}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
          <button 
            onClick={onClose}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Understood - Continue to Decisions
          </button>
        </div>
      </div>
    </div>
  );
}
