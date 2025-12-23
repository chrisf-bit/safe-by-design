import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingDown, TrendingUp, Heart, Shield, Users as UsersIcon, Activity, X } from 'lucide-react';

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

interface TeamDashboardProps {
  gameId: string;
  teamId: string;
  cycle: number;
  brief: any;
  decisions: Decision[];
  onSubmit: (selectedDecisions: string[]) => void;
  submitted: boolean;
}

export default function TeamDashboard({
  gameId,
  teamId,
  cycle,
  brief,
  decisions,
  onSubmit,
  submitted,
}: TeamDashboardProps) {
  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    calculateRemainingBudget();
  }, [selectedDecisions]);

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

    setRemainingBudget({
      capacityPoints: capacity,
      staffEnergy: energy,
      cashBudget: cash,
    });
  };

  const toggleDecision = (id: string) => {
    if (submitted) return;

    const decision = decisions.find(d => d.id === id);
    if (!decision) return;

    const newSelected = new Set(selectedDecisions);
    
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      // Check if we can afford it
      if (!canAfford(decision)) return;
      newSelected.add(id);
    }

    setSelectedDecisions(newSelected);
  };

  const handleSubmit = () => {
    if (selectedDecisions.size === 0) {
      if (!confirm('Submit with no decisions selected?')) return;
    }
    onSubmit(Array.from(selectedDecisions));
  };

  const canAfford = (decision: Decision): boolean => {
    return (
      remainingBudget.capacityPoints >= decision.costs.capacityPoints &&
      remainingBudget.staffEnergy >= decision.costs.staffEnergy &&
      remainingBudget.cashBudget >= decision.costs.cashBudget
    );
  };

  const getEffectIcon = (effect: string) => {
    if (effect.includes('safety')) return <Shield className="w-3 h-3" />;
    if (effect.includes('equity')) return <Heart className="w-3 h-3" />;
    if (effect.includes('staff')) return <UsersIcon className="w-3 h-3" />;
    if (effect.includes('resilience')) return <Activity className="w-3 h-3" />;
    return null;
  };

  const getEffectColor = (effect: string) => {
    if (effect.includes('safety')) return 'text-blue-400';
    if (effect.includes('equity')) return 'text-purple-400';
    if (effect.includes('staff')) return 'text-green-400';
    if (effect.includes('resilience')) return 'text-amber-400';
    return 'text-slate-400';
  };

  const categories = Array.from(new Set(decisions.map(d => d.category)));
  const selectedDecisionsList = decisions.filter(d => selectedDecisions.has(d.id));

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card bg-green-500/20 border-green-500/50 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Decisions Submitted!</h2>
          <p className="text-slate-300">Waiting for other teams to submit...</p>
          
          {selectedDecisionsList.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="text-sm font-bold text-slate-300 mb-2">Your Selections:</h3>
              <div className="space-y-1">
                {selectedDecisionsList.map(d => (
                  <div key={d.id} className="text-sm text-white">• {d.name}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Cycle Brief - Full Width */}
      {brief && (
        <div className="card bg-gradient-to-br from-primary-900 to-primary-800 border-primary-700 p-4 mb-4">
          <h2 className="text-xl font-bold text-white mb-2">{brief.title}</h2>
          <p className="text-primary-100 text-sm mb-3">{brief.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {brief.signals.map((signal: string, idx: number) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-primary-200 bg-primary-800/50 px-2 py-1 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Available Decisions */}
        <div className="col-span-8">
          <div className="space-y-4">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-md font-bold mb-2 text-white capitalize">
                  {category.replace(/_/g, ' ')}
                </h3>
                <div className="grid gap-2">
                  {decisions
                    .filter(d => d.category === category)
                    .map(decision => {
                      const isSelected = selectedDecisions.has(decision.id);
                      const affordable = isSelected || canAfford(decision);
                      const effects = decision.effects || decision.effectTags || [];

                      return (
                        <div
                          key={decision.id}
                          onClick={() => toggleDecision(decision.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-primary-500/20 border-primary-500'
                              : affordable
                              ? 'bg-slate-800 border-slate-700 hover:border-slate-500'
                              : 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm">{decision.name}</h4>
                                {isSelected && <CheckCircle className="w-4 h-4 text-primary-400" />}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{decision.description}</p>
                            </div>
                            
                            {/* Costs on the right */}
                            <div className="flex gap-2 text-xs ml-4 flex-shrink-0">
                              {decision.costs.capacityPoints > 0 && (
                                <span className="text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                                  C:{decision.costs.capacityPoints}
                                </span>
                              )}
                              {decision.costs.staffEnergy > 0 && (
                                <span className="text-green-400 bg-green-500/20 px-2 py-1 rounded">
                                  E:{decision.costs.staffEnergy}
                                </span>
                              )}
                              {decision.costs.cashBudget > 0 && (
                                <span className="text-amber-400 bg-amber-500/20 px-2 py-1 rounded">
                                  £:{decision.costs.cashBudget}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Effect tags */}
                          {effects.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {effects.map((effect, idx) => (
                                <span
                                  key={idx}
                                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-700/50 ${getEffectColor(effect)}`}
                                >
                                  {getEffectIcon(effect)}
                                  <span className="capitalize">{effect}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Sticky Sidebar */}
        <div className="col-span-4">
          <div className="sticky top-4 space-y-4">
            {/* Budget Display */}
            <div className="card bg-slate-800 border-slate-700 p-4">
              <h3 className="text-sm font-bold text-white mb-3">Remaining Budget</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400">Capacity</span>
                    <span className="text-white font-bold">{remainingBudget.capacityPoints}/{maxBudget.capacityPoints}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${(remainingBudget.capacityPoints / maxBudget.capacityPoints) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-400">Staff Energy</span>
                    <span className="text-white font-bold">{remainingBudget.staffEnergy}/{maxBudget.staffEnergy}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all"
                      style={{ width: `${(remainingBudget.staffEnergy / maxBudget.staffEnergy) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400">Cash Budget</span>
                    <span className="text-white font-bold">{remainingBudget.cashBudget}/{maxBudget.cashBudget}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${(remainingBudget.cashBudget / maxBudget.cashBudget) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Decisions */}
            <div className="card bg-slate-800 border-slate-700 p-4">
              <h3 className="text-sm font-bold text-white mb-3">
                Selected ({selectedDecisions.size})
              </h3>
              
              {selectedDecisionsList.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No decisions selected yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDecisionsList.map(decision => (
                    <div
                      key={decision.id}
                      className="flex items-center justify-between bg-primary-500/10 border border-primary-500/30 rounded p-2"
                    >
                      <span className="text-sm text-white truncate flex-1">{decision.name}</span>
                      <button
                        onClick={() => toggleDecision(decision.id)}
                        className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full btn btn-primary py-3 text-lg font-bold"
            >
              Submit Decisions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
