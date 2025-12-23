// =============================================================================
// SAFE BY DESIGN - TRIGGER DETECTION
// Analyzes team state to fire relevant debrief triggers
// =============================================================================

import { TriggerType, TriggerResult } from './debriefQuestions';

// =============================================================================
// THRESHOLDS - Tune these based on game balance
// =============================================================================

const THRESHOLDS = {
  // Safety
  LOW_SAFETY_SCORE: 55,
  HIGH_SAFETY_SCORE: 75,
  INCIDENT_COUNT: 1,
  
  // Equity
  LOW_EQUITY_SCORE: 55,
  HIGH_EQUITY_SCORE: 75,
  
  // Staff
  LOW_STAFF_SCORE: 55,
  HIGH_STAFF_SCORE: 75,
  HIGH_SICKNESS: 15,
  CRITICAL_SICKNESS: 25,
  
  // Resilience
  LOW_RESILIENCE_SCORE: 55,
  HIGH_RESILIENCE_SCORE: 75,
  
  // Metrics
  HIGH_BACKLOG: 50,
  LOW_BACKLOG: 20,
  HIGH_DNA_RATE: 15,
  HIGH_RISK_PROPORTION: 35,
  HIGH_NEONATAL: 5,
  
  // Balance
  PILLAR_IMBALANCE: 15, // Difference between highest and lowest pillar
};

// =============================================================================
// TYPES
// =============================================================================

export interface CycleResult {
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
  incidents: Array<{ type: string; severity: string; description: string }>;
}

export interface TeamDecision {
  cycle: number;
  decisions: string[];
}

export interface TeamContext {
  teamId: string;
  teamName: string;
  currentCycle: number;
  cycleResults: CycleResult[];
  decisions: TeamDecision[];
  cumulativeScore: {
    safety: number;
    equity: number;
    staff: number;
    resilience: number;
    total: number;
  };
}

export interface GameContext {
  totalTeams: number;
  currentCycle: number;
  leaderByCycle: string[];
  allTeams: TeamContext[];
}

// =============================================================================
// MAIN DETECTION FUNCTION
// =============================================================================

export function detectTriggers(
  team: TeamContext,
  gameContext: GameContext
): TriggerResult[] {
  const triggers: TriggerResult[] = [];
  const results = team.cycleResults;
  const numCycles = results.length;
  const currentCycle = team.currentCycle;

  // --- FIRST CYCLE TRIGGER ---
  triggers.push({
    type: 'first_cycle',
    fired: currentCycle <= 2,
    intensity: currentCycle === 1 ? 1 : 0.5,
    context: currentCycle === 1 ? 'First cycle of the game' : 'Early game phase',
    cycles: [currentCycle]
  });

  if (numCycles === 0) {
    return triggers;
  }

  const latestResult = results[results.length - 1];
  const latestScores = latestResult.scores;
  const latestMetrics = latestResult.metrics;

  // ==========================================================================
  // SAFETY TRIGGERS
  // ==========================================================================
  
  triggers.push({
    type: 'safety_focus',
    fired: latestScores.safety >= THRESHOLDS.HIGH_SAFETY_SCORE,
    intensity: Math.min(1, (latestScores.safety - 60) / 40),
    context: `Safety score at ${Math.round(latestScores.safety)}`,
    cycles: [currentCycle]
  });

  triggers.push({
    type: 'safety_neglect',
    fired: latestScores.safety < THRESHOLDS.LOW_SAFETY_SCORE,
    intensity: Math.min(1, (THRESHOLDS.LOW_SAFETY_SCORE - latestScores.safety) / 30),
    context: `Safety score dropped to ${Math.round(latestScores.safety)}`,
    cycles: [currentCycle]
  });

  const totalIncidents = results.reduce((sum, r) => sum + r.metrics.incidents, 0);
  triggers.push({
    type: 'incident_occurred',
    fired: totalIncidents >= THRESHOLDS.INCIDENT_COUNT,
    intensity: Math.min(1, totalIncidents / 3),
    context: totalIncidents > 0 ? `${totalIncidents} incident(s) occurred` : 'No incidents',
    cycles: results.filter(r => r.metrics.incidents > 0).map(r => r.cycle)
  });

  // Check for escalation/audit decisions
  const escalationDecisions = team.decisions.filter(d => 
    d.decisions.some(dec => dec.includes('escalation') || dec.includes('audit') || dec.includes('review'))
  );
  triggers.push({
    type: 'escalation_improved',
    fired: escalationDecisions.length > 0,
    intensity: Math.min(1, escalationDecisions.length / 3),
    context: escalationDecisions.length > 0 
      ? `Invested in escalation/audit processes`
      : 'No escalation improvements',
    cycles: escalationDecisions.map(d => d.cycle)
  });

  // ==========================================================================
  // EQUITY TRIGGERS
  // ==========================================================================

  triggers.push({
    type: 'equity_focus',
    fired: latestScores.equity >= THRESHOLDS.HIGH_EQUITY_SCORE,
    intensity: Math.min(1, (latestScores.equity - 60) / 40),
    context: `Equity score at ${Math.round(latestScores.equity)}`,
    cycles: [currentCycle]
  });

  triggers.push({
    type: 'equity_neglect',
    fired: latestScores.equity < THRESHOLDS.LOW_EQUITY_SCORE,
    intensity: Math.min(1, (THRESHOLDS.LOW_EQUITY_SCORE - latestScores.equity) / 30),
    context: `Equity score dropped to ${Math.round(latestScores.equity)}`,
    cycles: [currentCycle]
  });

  // Check for triage tightening decisions
  const triageDecisions = team.decisions.filter(d =>
    d.decisions.some(dec => dec.includes('triage') || dec.includes('tighten'))
  );
  triggers.push({
    type: 'triage_tightened',
    fired: triageDecisions.length > 0,
    intensity: Math.min(1, triageDecisions.length / 2),
    context: triageDecisions.length > 0 ? 'Tightened triage criteria' : 'Standard triage',
    cycles: triageDecisions.map(d => d.cycle)
  });

  // Check for interpreter/language support decisions
  const interpreterDecisions = team.decisions.filter(d =>
    d.decisions.some(dec => dec.includes('interpreter') || dec.includes('language') || dec.includes('translation'))
  );
  triggers.push({
    type: 'interpreter_used',
    fired: interpreterDecisions.length > 0,
    intensity: Math.min(1, interpreterDecisions.length / 2),
    context: interpreterDecisions.length > 0 ? 'Invested in language support' : 'No language support',
    cycles: interpreterDecisions.map(d => d.cycle)
  });

  // ==========================================================================
  // STAFF WELLBEING TRIGGERS
  // ==========================================================================

  triggers.push({
    type: 'staff_wellbeing_focus',
    fired: latestScores.staff >= THRESHOLDS.HIGH_STAFF_SCORE,
    intensity: Math.min(1, (latestScores.staff - 60) / 40),
    context: `Staff score at ${Math.round(latestScores.staff)}`,
    cycles: [currentCycle]
  });

  triggers.push({
    type: 'staff_neglect',
    fired: latestScores.staff < THRESHOLDS.LOW_STAFF_SCORE,
    intensity: Math.min(1, (THRESHOLDS.LOW_STAFF_SCORE - latestScores.staff) / 30),
    context: `Staff score dropped to ${Math.round(latestScores.staff)}`,
    cycles: [currentCycle]
  });

  const highSicknessCycles = results.filter(r => r.metrics.staffSickness > THRESHOLDS.HIGH_SICKNESS);
  triggers.push({
    type: 'high_sickness',
    fired: highSicknessCycles.length > 0,
    intensity: Math.max(...results.map(r => r.metrics.staffSickness)) / 40,
    context: highSicknessCycles.length > 0
      ? `Staff sickness hit ${Math.max(...highSicknessCycles.map(r => r.metrics.staffSickness))}%`
      : 'Staff sickness manageable',
    cycles: highSicknessCycles.map(r => r.cycle)
  });

  triggers.push({
    type: 'burnout_risk',
    fired: latestMetrics.staffSickness > THRESHOLDS.CRITICAL_SICKNESS,
    intensity: latestMetrics.staffSickness / 40,
    context: latestMetrics.staffSickness > THRESHOLDS.CRITICAL_SICKNESS
      ? `Critical staff sickness at ${latestMetrics.staffSickness}%`
      : 'Staff sickness under control',
    cycles: [currentCycle]
  });

  // Check for wellbeing/training investments
  const wellbeingDecisions = team.decisions.filter(d =>
    d.decisions.some(dec => 
      dec.includes('wellbeing') || dec.includes('training') || 
      dec.includes('learning') || dec.includes('support')
    )
  );
  triggers.push({
    type: 'training_invested',
    fired: wellbeingDecisions.length > 0,
    intensity: Math.min(1, wellbeingDecisions.length / 3),
    context: wellbeingDecisions.length > 0 
      ? `Invested in staff development ${wellbeingDecisions.length} time(s)`
      : 'No staff development investment',
    cycles: wellbeingDecisions.map(d => d.cycle)
  });

  // Check for bank/agency staff usage
  const bankStaffDecisions = team.decisions.filter(d =>
    d.decisions.some(dec => dec.includes('bank') || dec.includes('agency'))
  );
  triggers.push({
    type: 'bank_staff_used',
    fired: bankStaffDecisions.length > 0,
    intensity: Math.min(1, bankStaffDecisions.length / 2),
    context: bankStaffDecisions.length > 0 ? 'Used bank/agency staff' : 'Core staff only',
    cycles: bankStaffDecisions.map(d => d.cycle)
  });

  // ==========================================================================
  // RESILIENCE TRIGGERS
  // ==========================================================================

  triggers.push({
    type: 'resilience_focus',
    fired: latestScores.resilience >= THRESHOLDS.HIGH_RESILIENCE_SCORE,
    intensity: Math.min(1, (latestScores.resilience - 60) / 40),
    context: `Resilience score at ${Math.round(latestScores.resilience)}`,
    cycles: [currentCycle]
  });

  triggers.push({
    type: 'resilience_neglect',
    fired: latestScores.resilience < THRESHOLDS.LOW_RESILIENCE_SCORE,
    intensity: Math.min(1, (THRESHOLDS.LOW_RESILIENCE_SCORE - latestScores.resilience) / 30),
    context: `Resilience score dropped to ${Math.round(latestScores.resilience)}`,
    cycles: [currentCycle]
  });

  // Check for governance decisions
  const governanceDecisions = team.decisions.filter(d =>
    d.decisions.some(dec => 
      dec.includes('governance') || dec.includes('standardise') || 
      dec.includes('guideline') || dec.includes('protocol')
    )
  );
  triggers.push({
    type: 'governance_improved',
    fired: governanceDecisions.length > 0,
    intensity: Math.min(1, governanceDecisions.length / 3),
    context: governanceDecisions.length > 0 
      ? 'Invested in governance/standards'
      : 'No governance investment',
    cycles: governanceDecisions.map(d => d.cycle)
  });

  // System fragility
  const lowScoreCount = [
    latestScores.safety < THRESHOLDS.LOW_SAFETY_SCORE,
    latestScores.equity < THRESHOLDS.LOW_EQUITY_SCORE,
    latestScores.staff < THRESHOLDS.LOW_STAFF_SCORE,
    latestScores.resilience < THRESHOLDS.LOW_RESILIENCE_SCORE
  ].filter(Boolean).length;

  triggers.push({
    type: 'system_fragile',
    fired: lowScoreCount >= 2,
    intensity: lowScoreCount / 4,
    context: lowScoreCount >= 2
      ? `${lowScoreCount} pillars below threshold`
      : 'System stable',
    cycles: [currentCycle]
  });

  // ==========================================================================
  // PERFORMANCE TRIGGERS
  // ==========================================================================

  // Backlog
  triggers.push({
    type: 'backlog_growing',
    fired: latestMetrics.backlog > THRESHOLDS.HIGH_BACKLOG,
    intensity: Math.min(1, latestMetrics.backlog / 100),
    context: `Backlog at ${latestMetrics.backlog} patients`,
    cycles: results.filter(r => r.metrics.backlog > THRESHOLDS.HIGH_BACKLOG).map(r => r.cycle)
  });

  triggers.push({
    type: 'backlog_reduced',
    fired: latestMetrics.backlog < THRESHOLDS.LOW_BACKLOG,
    intensity: 1 - (latestMetrics.backlog / THRESHOLDS.HIGH_BACKLOG),
    context: `Backlog reduced to ${latestMetrics.backlog} patients`,
    cycles: [currentCycle]
  });

  // DNA Rate
  triggers.push({
    type: 'dna_rate_high',
    fired: latestMetrics.dnaRate > THRESHOLDS.HIGH_DNA_RATE,
    intensity: Math.min(1, latestMetrics.dnaRate / 30),
    context: `DNA rate at ${latestMetrics.dnaRate}%`,
    cycles: results.filter(r => r.metrics.dnaRate > THRESHOLDS.HIGH_DNA_RATE).map(r => r.cycle)
  });

  // High risk proportion
  triggers.push({
    type: 'high_risk_proportion',
    fired: latestMetrics.highRiskShare > THRESHOLDS.HIGH_RISK_PROPORTION,
    intensity: latestMetrics.highRiskShare / 50,
    context: `High-risk proportion at ${latestMetrics.highRiskShare}%`,
    cycles: [currentCycle]
  });

  // Neonatal admissions
  triggers.push({
    type: 'neonatal_admissions_high',
    fired: latestMetrics.neonatalAdmissions >= THRESHOLDS.HIGH_NEONATAL,
    intensity: Math.min(1, latestMetrics.neonatalAdmissions / 8),
    context: `${latestMetrics.neonatalAdmissions} neonatal admissions`,
    cycles: [currentCycle]
  });

  // ==========================================================================
  // GAME POSITION TRIGGERS
  // ==========================================================================

  // Check for balanced vs single-focus approach
  const scores = [latestScores.safety, latestScores.equity, latestScores.staff, latestScores.resilience];
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const scoreDiff = maxScore - minScore;

  triggers.push({
    type: 'balanced_approach',
    fired: scoreDiff < THRESHOLDS.PILLAR_IMBALANCE,
    intensity: 1 - (scoreDiff / 30),
    context: scoreDiff < THRESHOLDS.PILLAR_IMBALANCE
      ? 'Balanced approach across pillars'
      : 'Focused approach',
    cycles: []
  });

  triggers.push({
    type: 'single_focus',
    fired: scoreDiff >= THRESHOLDS.PILLAR_IMBALANCE * 1.5,
    intensity: Math.min(1, scoreDiff / 30),
    context: scoreDiff >= THRESHOLDS.PILLAR_IMBALANCE * 1.5
      ? `Strong focus on one pillar (${scoreDiff} point spread)`
      : 'Relatively balanced',
    cycles: []
  });

  // Leader detection
  const isLeader = gameContext.leaderByCycle.length > 0 &&
    gameContext.leaderByCycle[gameContext.leaderByCycle.length - 1] === team.teamId;
  triggers.push({
    type: 'leading_team',
    fired: isLeader,
    intensity: isLeader ? 1 : 0,
    context: isLeader ? 'Currently leading' : `Total score: ${team.cumulativeScore.total}`,
    cycles: []
  });

  // Comeback / Early lead lost (only after cycle 3)
  if (numCycles >= 3 && gameContext.leaderByCycle.length >= 2) {
    const earlyLeader = gameContext.leaderByCycle.slice(0, 2).includes(team.teamId);
    const finalLeader = isLeader;
    const wasBottom = detectWasBottom(team, gameContext);

    triggers.push({
      type: 'comeback',
      fired: wasBottom && finalLeader,
      intensity: wasBottom && finalLeader ? 0.9 : 0,
      context: wasBottom && finalLeader ? 'Staged a comeback to lead' : 'No major comeback',
      cycles: []
    });

    triggers.push({
      type: 'early_lead_lost',
      fired: earlyLeader && !finalLeader,
      intensity: earlyLeader && !finalLeader ? 0.9 : 0,
      context: earlyLeader && !finalLeader ? 'Led early but fell behind' : 'Maintained position',
      cycles: []
    });
  }

  return triggers;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function detectWasBottom(team: TeamContext, gameContext: GameContext): boolean {
  // Check if team had the lowest score at any point
  if (team.cycleResults.length < 2) return false;
  
  const teamTotals = team.cycleResults.map(r => r.scores.total);
  const minTotal = Math.min(...teamTotals);
  
  // If team's minimum score was significantly below average, they were struggling
  const avgTotal = teamTotals.reduce((a, b) => a + b, 0) / teamTotals.length;
  return minTotal < avgTotal * 0.8;
}
