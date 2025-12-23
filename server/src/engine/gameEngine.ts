import seedrandom from 'seedrandom';
import { Decision, CycleResults, ScoreBreakdown, OperationalMetrics, Incident } from '@safe-by-design/shared';
import decisions from '../data/decisions.json';

interface CalculationContext {
  teamId: string;
  gameId: string;
  cycle: number;
  scenarioSeed: number;
  selectedDecisions: Decision[];
  previousResults?: CycleResults;
}

// Base values that increase with pressure over cycles
const BASE_VALUES = {
  safety: [75, 73, 70, 68, 65, 67],
  equity: [70, 68, 65, 62, 60, 62],
  staff: [80, 75, 70, 65, 60, 63],
  resilience: [75, 72, 68, 64, 60, 62],
  backlog: [15, 25, 35, 45, 55, 50],
  dnaRate: [12, 15, 18, 22, 25, 23],
  staffSickness: [5, 8, 12, 18, 25, 22],
  highRiskShare: [35, 40, 45, 50, 52, 50],
};

export function calculateCycleResults(context: CalculationContext): CycleResults {
  const rng = seedrandom(`${context.scenarioSeed}-${context.teamId}-${context.cycle}`);
  
  // Get base values for this cycle
  const cycleIndex = context.cycle - 1;
  
  // Calculate scores with decision effects
  const scores = calculateScores(context, cycleIndex, rng);
  
  // Calculate operational metrics
  const metrics = calculateMetrics(context, cycleIndex, rng);
  
  // Generate incidents based on conditions
  const incidents = generateIncidents(context, scores, metrics, rng);
  
  return {
    id: `${context.gameId}-${context.teamId}-${context.cycle}`,
    gameId: context.gameId,
    cycle: context.cycle,
    teamId: context.teamId,
    scores,
    metrics,
    incidents,
    calculatedAt: new Date().toISOString(),
  };
}

function calculateScores(
  context: CalculationContext,
  cycleIndex: number,
  rng: () => number
): ScoreBreakdown {
  // Start with base values
  let safety = BASE_VALUES.safety[cycleIndex];
  let equity = BASE_VALUES.equity[cycleIndex];
  let staff = BASE_VALUES.staff[cycleIndex];
  let resilience = BASE_VALUES.resilience[cycleIndex];
  
  // Apply decision effects
  for (const decision of context.selectedDecisions) {
    // Immediate effects
    if (decision.timing === 'immediate' || decision.timing === 'both') {
      safety += applyEffects(decision, 'safety') * (0.8 + rng() * 0.4);
      equity += applyEffects(decision, 'equity') * (0.8 + rng() * 0.4);
      staff += applyEffects(decision, 'staff') * (0.8 + rng() * 0.4);
      resilience += applyEffects(decision, 'resilience') * (0.8 + rng() * 0.4);
    }
  }
  
  // Apply delayed effects from previous cycles
  if (context.previousResults) {
    const prevDecisionIds = getPreviousDecisions(context);
    const prevDecisions = decisions.filter(d => prevDecisionIds.includes(d.id));
    
    for (const decision of prevDecisions) {
      if (decision.timing === 'delayed' || decision.timing === 'both') {
        const delayedCycles = decision.delayedCycles || 1;
        if (delayedCycles === 1 || context.cycle - 1 <= delayedCycles) {
          safety += applyEffects(decision, 'safety') * 1.2;
          equity += applyEffects(decision, 'equity') * 1.2;
          staff += applyEffects(decision, 'staff') * 1.2;
          resilience += applyEffects(decision, 'resilience') * 1.2;
        }
      }
    }
  }
  
  // Apply trade-offs and cross-effects
  safety = applyTradeoffs(safety, context.selectedDecisions, 'safety', rng);
  equity = applyTradeoffs(equity, context.selectedDecisions, 'equity', rng);
  staff = applyTradeoffs(staff, context.selectedDecisions, 'staff', rng);
  resilience = applyTradeoffs(resilience, context.selectedDecisions, 'resilience', rng);
  
  // Clamp values
  safety = Math.max(0, Math.min(100, safety));
  equity = Math.max(0, Math.min(100, equity));
  staff = Math.max(0, Math.min(100, staff));
  resilience = Math.max(0, Math.min(100, resilience));
  
  const total = safety + equity + staff + resilience;
  
  return { safety, equity, staff, resilience, total };
}

function applyEffects(decision: Decision, pillar: string): number {
  const effects = decision.effectTags;
  const relevantEffects = effects.filter(e => e === pillar || 
    (pillar === 'resilience' && e === 'governance'));
  
  let value = 0;
  if (relevantEffects.length > 0) {
    value = relevantEffects.length * 4; // Base increase per effect tag
  }
  
  // Some decisions have negative impacts
  if (decision.id === 'tighten_triage' && pillar === 'equity') {
    value -= 6;
  }
  if (decision.id === 'bank_agency' && pillar === 'resilience') {
    value -= 4;
  }
  if (decision.id === 'bank_agency' && pillar === 'staff') {
    value -= 2;
  }
  
  return value;
}

function applyTradeoffs(
  currentValue: number,
  decisions: Decision[],
  pillar: string,
  rng: () => number
): number {
  // Tighten triage improves safety but reduces equity
  if (decisions.some(d => d.id === 'tighten_triage')) {
    if (pillar === 'safety') currentValue += 3;
    if (pillar === 'equity') currentValue -= 6;
  }
  
  // Bank/agency improves flow but damages resilience and sometimes staff morale
  if (decisions.some(d => d.id === 'bank_agency')) {
    if (pillar === 'resilience') currentValue -= 5;
    if (pillar === 'staff' && rng() > 0.5) currentValue -= 3;
  }
  
  // Protected learning reduces capacity now but improves staff and future quality
  if (decisions.some(d => d.id === 'protected_learning')) {
    if (pillar === 'staff') currentValue += 5;
  }
  
  // Remote monitoring has implementation drag
  if (decisions.some(d => d.id === 'remote_monitoring')) {
    if (pillar === 'staff') currentValue -= 2; // Initial burden
  }
  
  return currentValue;
}

function calculateMetrics(
  context: CalculationContext,
  cycleIndex: number,
  rng: () => number
): OperationalMetrics {
  let backlog = BASE_VALUES.backlog[cycleIndex];
  let dnaRate = BASE_VALUES.dnaRate[cycleIndex];
  let staffSickness = BASE_VALUES.staffSickness[cycleIndex];
  let highRiskShare = BASE_VALUES.highRiskShare[cycleIndex];
  
  // Apply decision effects on metrics
  for (const decision of context.selectedDecisions) {
    if (decision.id === 'expand_diabetes_clinic') {
      backlog -= 8;
    }
    if (decision.id === 'group_education') {
      backlog -= 5;
    }
    if (decision.id === 'sms_reminders') {
      dnaRate -= 4;
    }
    if (decision.id === 'bank_agency') {
      backlog -= 10;
    }
    if (decision.id === 'wellbeing_support') {
      staffSickness -= 5;
    }
    if (decision.id === 'protected_learning') {
      staffSickness -= 3;
      backlog += 3; // Trade-off: less capacity
    }
    if (decision.id === 'tighten_triage') {
      backlog += 5; // Some people wait longer
    }
  }
  
  // Add randomness
  backlog += Math.floor((rng() - 0.5) * 10);
  dnaRate += (rng() - 0.5) * 3;
  staffSickness += (rng() - 0.5) * 4;
  
  // Clamp values
  backlog = Math.max(0, backlog);
  dnaRate = Math.max(0, Math.min(40, dnaRate));
  staffSickness = Math.max(0, Math.min(50, staffSickness));
  
  // Calculate incidents and admissions
  const incidentsCount = calculateIncidentCount(context, rng);
  const neonatalAdmissions = Math.floor(2 + cycleIndex + rng() * 3);
  
  return {
    backlog,
    dnaRate: Math.round(dnaRate * 10) / 10,
    staffSickness: Math.round(staffSickness * 10) / 10,
    highRiskShare: Math.round(highRiskShare * 10) / 10,
    incidents: incidentsCount,
    neonatalAdmissions,
  };
}

function calculateIncidentCount(context: CalculationContext, rng: () => number): number {
  const cycleIndex = context.cycle - 1;
  let baseIncidents = [0, 0, 1, 1, 2, 1][cycleIndex];
  
  // Increase incidents if safety mechanisms not in place
  const hasSafetyMechanisms = context.selectedDecisions.some(d => 
    d.id === 'escalation_audits' || d.id === 'standardise_guidelines' || d.id === 'incident_review'
  );
  
  if (!hasSafetyMechanisms && cycleIndex >= 2) {
    baseIncidents += rng() > 0.5 ? 1 : 0;
  }
  
  return baseIncidents;
}

function generateIncidents(
  context: CalculationContext,
  scores: ScoreBreakdown,
  metrics: OperationalMetrics,
  rng: () => number
): Incident[] {
  const incidents: Incident[] = [];
  
  if (metrics.incidents === 0) return incidents;
  
  // Generate incidents based on conditions
  if (scores.safety < 65 && rng() > 0.5) {
    incidents.push({
      type: 'documentation_gap',
      severity: 'medium',
      description: 'Escalation pathway not followed for woman with deteriorating glucose control',
    });
  }
  
  if (metrics.dnaRate > 20 && rng() > 0.6) {
    incidents.push({
      type: 'missed_appointment',
      severity: 'medium',
      description: 'Woman missed consecutive appointments and presented in DKA at 34 weeks',
    });
  }
  
  if (metrics.staffSickness > 20 && rng() > 0.7) {
    incidents.push({
      type: 'handover_failure',
      severity: 'high',
      description: 'Critical information not handed over due to staff absence and workload pressure',
    });
  }
  
  if (context.cycle >= 4 && scores.equity < 60 && rng() > 0.7) {
    incidents.push({
      type: 'access_barrier',
      severity: 'medium',
      description: 'Language barrier resulted in misunderstanding about insulin administration',
    });
  }
  
  return incidents.slice(0, metrics.incidents);
}

function getPreviousDecisions(context: CalculationContext): string[] {
  // This would be fetched from database in real implementation
  // For now, return empty array - this will be populated by the actual system
  return [];
}

export function getDecisions(): Decision[] {
  return decisions as Decision[];
}
