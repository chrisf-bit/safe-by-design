// =============================================================================
// SAFE BY DESIGN - DEBRIEF QUESTION SYSTEM
// Adapted from Pitch Perfect for maternity system simulation
// =============================================================================

export type QuestionTheme =
  | 'story'
  | 'decision_quality'
  | 'systems_thinking'
  | 'team_dynamics'
  | 'strategy'
  | 'lessons'
  | 'safety_culture'
  | 'equity_access'
  | 'staff_wellbeing'
  | 'resilience';

export type TriggerType =
  // Safety triggers
  | 'safety_focus'
  | 'safety_neglect'
  | 'incident_occurred'
  | 'near_miss'
  | 'escalation_improved'
  | 'documentation_gap'
  // Equity triggers
  | 'equity_focus'
  | 'equity_neglect'
  | 'access_barrier'
  | 'interpreter_used'
  | 'triage_tightened'
  | 'vulnerable_group_impact'
  // Staff triggers
  | 'staff_wellbeing_focus'
  | 'staff_neglect'
  | 'high_sickness'
  | 'burnout_risk'
  | 'training_invested'
  | 'workload_pressure'
  // Resilience triggers
  | 'resilience_focus'
  | 'resilience_neglect'
  | 'governance_improved'
  | 'capacity_strain'
  | 'bank_staff_used'
  | 'system_fragile'
  // Performance triggers
  | 'backlog_growing'
  | 'backlog_reduced'
  | 'dna_rate_high'
  | 'dna_rate_improved'
  | 'high_risk_proportion'
  | 'neonatal_admissions_high'
  // Game position triggers
  | 'first_cycle'
  | 'leading_team'
  | 'struggling_team'
  | 'comeback'
  | 'early_lead_lost'
  | 'balanced_approach'
  | 'single_focus';

export interface DebriefQuestion {
  id: string;
  text: string;
  theme: QuestionTheme;
  triggers: TriggerType[];
  priority: number; // 1-5
  scope: 'team' | 'all';
  followUp?: string;
  minCycle?: number;
  maxCycle?: number;
}

export interface TriggerResult {
  type: TriggerType;
  fired: boolean;
  intensity: number; // 0-1
  context: string;
  cycles?: number[];
}

export interface TeamAnalysis {
  teamId: string;
  teamName: string;
  triggers: TriggerResult[];
  keyObservations: string[];
  suggestedQuestions: DebriefQuestion[];
}

export interface FacilitatorPrompts {
  gameNarrative: string;
  allTeams: DebriefQuestion[];
  perTeam: TeamAnalysis[];
}

// =============================================================================
// QUESTION BANK
// =============================================================================

export const questionBank: DebriefQuestion[] = [
  // ==========================================================================
  // EARLY GAME QUESTIONS (Cycle 1-2)
  // ==========================================================================
  {
    id: 'early_initial_strategy',
    text: "What was your initial strategy going into this cycle?",
    theme: 'strategy',
    triggers: ['first_cycle'],
    priority: 5,
    scope: 'team',
    maxCycle: 2
  },
  {
    id: 'early_decision_selection',
    text: "How did you decide which interventions to prioritize?",
    theme: 'decision_quality',
    triggers: ['first_cycle'],
    priority: 5,
    scope: 'all',
    maxCycle: 3
  },
  {
    id: 'early_budget_approach',
    text: "Walk us through how you allocated your budget this cycle.",
    theme: 'decision_quality',
    triggers: ['first_cycle'],
    priority: 4,
    scope: 'team',
    maxCycle: 3
  },
  {
    id: 'early_pillar_focus',
    text: "Which of the four pillars did you prioritize and why?",
    theme: 'strategy',
    triggers: ['first_cycle', 'single_focus', 'balanced_approach'],
    priority: 5,
    scope: 'all',
    maxCycle: 3,
    followUp: "What trade-offs were you considering?"
  },
  {
    id: 'early_safety_thinking',
    text: "How did you approach patient safety in your decisions?",
    theme: 'safety_culture',
    triggers: ['safety_focus', 'safety_neglect', 'first_cycle'],
    priority: 4,
    scope: 'team',
    maxCycle: 3
  },
  {
    id: 'early_what_watching',
    text: "What metrics or signals are you watching most closely?",
    theme: 'systems_thinking',
    triggers: ['first_cycle'],
    priority: 4,
    scope: 'all',
    maxCycle: 3
  },
  {
    id: 'early_surprised',
    text: "Anything surprise you about the results this cycle?",
    theme: 'story',
    triggers: ['first_cycle'],
    priority: 4,
    scope: 'all',
    maxCycle: 4
  },

  // ==========================================================================
  // MID GAME QUESTIONS (Cycle 3-4)
  // ==========================================================================
  {
    id: 'mid_strategy_evolving',
    text: "How has your strategy evolved since the start?",
    theme: 'strategy',
    triggers: [],
    priority: 5,
    scope: 'all',
    minCycle: 3,
    maxCycle: 5
  },
  {
    id: 'mid_pattern_noticed',
    text: "What patterns are you noticing across cycles?",
    theme: 'systems_thinking',
    triggers: [],
    priority: 4,
    scope: 'all',
    minCycle: 3
  },
  {
    id: 'mid_adjustment',
    text: "What adjustments have you made based on earlier results?",
    theme: 'decision_quality',
    triggers: [],
    priority: 4,
    scope: 'team',
    minCycle: 3,
    maxCycle: 5
  },
  {
    id: 'mid_backlog_pressure',
    text: "Your backlog has been growing. What's driving that?",
    theme: 'systems_thinking',
    triggers: ['backlog_growing', 'capacity_strain'],
    priority: 5,
    scope: 'team',
    minCycle: 2,
    followUp: "What options are you considering?"
  },
  {
    id: 'mid_staff_sickness',
    text: "Staff sickness is climbing. How are you thinking about that?",
    theme: 'staff_wellbeing',
    triggers: ['high_sickness', 'burnout_risk', 'staff_neglect'],
    priority: 5,
    scope: 'team',
    minCycle: 2
  },
  {
    id: 'mid_safety_trend',
    text: "Your safety scores have been {trend}. What's contributing to that?",
    theme: 'safety_culture',
    triggers: ['safety_focus', 'safety_neglect', 'incident_occurred'],
    priority: 4,
    scope: 'team',
    minCycle: 2
  },
  {
    id: 'mid_equity_gap',
    text: "There seem to be equity gaps emerging. What's your perspective?",
    theme: 'equity_access',
    triggers: ['equity_neglect', 'access_barrier', 'triage_tightened'],
    priority: 4,
    scope: 'team',
    minCycle: 2
  },

  // ==========================================================================
  // LATE GAME / REFLECTION QUESTIONS (Cycle 4+)
  // ==========================================================================
  {
    id: 'story_turning_point',
    text: "What was your biggest turning point in the game?",
    theme: 'story',
    triggers: ['comeback', 'early_lead_lost', 'incident_occurred'],
    priority: 5,
    scope: 'team',
    minCycle: 4
  },
  {
    id: 'story_pressure',
    text: "When did you feel the most pressure? What caused it?",
    theme: 'story',
    triggers: ['backlog_growing', 'high_sickness', 'incident_occurred', 'capacity_strain'],
    priority: 4,
    scope: 'team',
    minCycle: 3
  },
  {
    id: 'story_confidence',
    text: "When did things start clicking for your team?",
    theme: 'story',
    triggers: ['backlog_reduced', 'safety_focus', 'balanced_approach'],
    priority: 3,
    scope: 'team',
    minCycle: 3
  },

  // --- SAFETY CULTURE (Late game) ---
  {
    id: 'safety_incident_reflection',
    text: "You had an incident this cycle. Walk us through what happened and what you learned.",
    theme: 'safety_culture',
    triggers: ['incident_occurred', 'near_miss'],
    priority: 5,
    scope: 'team',
    minCycle: 2,
    followUp: "What would you do differently?"
  },
  {
    id: 'safety_escalation',
    text: "How did your escalation and audit processes evolve over the game?",
    theme: 'safety_culture',
    triggers: ['escalation_improved', 'documentation_gap'],
    priority: 4,
    scope: 'team',
    minCycle: 3
  },
  {
    id: 'safety_tradeoff',
    text: "Where did you feel you had to compromise on safety for other priorities?",
    theme: 'safety_culture',
    triggers: ['safety_neglect', 'capacity_strain'],
    priority: 5,
    scope: 'all',
    minCycle: 4
  },

  // --- EQUITY & ACCESS (Late game) ---
  {
    id: 'equity_triage_impact',
    text: "You tightened triage criteria. How did that affect different patient groups?",
    theme: 'equity_access',
    triggers: ['triage_tightened', 'vulnerable_group_impact'],
    priority: 5,
    scope: 'team',
    minCycle: 2,
    followUp: "Would you make the same choice again?"
  },
  {
    id: 'equity_access_barriers',
    text: "What access barriers did you notice emerging? How did you respond?",
    theme: 'equity_access',
    triggers: ['access_barrier', 'equity_neglect'],
    priority: 4,
    scope: 'team',
    minCycle: 3
  },
  {
    id: 'equity_vs_efficiency',
    text: "Where did equity and efficiency come into tension?",
    theme: 'equity_access',
    triggers: ['equity_neglect', 'backlog_reduced'],
    priority: 4,
    scope: 'all',
    minCycle: 4
  },

  // --- STAFF WELLBEING (Late game) ---
  {
    id: 'staff_burnout_spiral',
    text: "Staff sickness spiked significantly. Walk us through how that happened.",
    theme: 'staff_wellbeing',
    triggers: ['high_sickness', 'burnout_risk', 'staff_neglect'],
    priority: 5,
    scope: 'team',
    minCycle: 3,
    followUp: "At what point did you realize it was becoming a problem?"
  },
  {
    id: 'staff_wellbeing_investment',
    text: "You invested in staff wellbeing. How did that affect your team's performance?",
    theme: 'staff_wellbeing',
    triggers: ['staff_wellbeing_focus', 'training_invested'],
    priority: 4,
    scope: 'team',
    minCycle: 3
  },
  {
    id: 'staff_workload',
    text: "How did you balance workload across your team?",
    theme: 'staff_wellbeing',
    triggers: ['workload_pressure', 'capacity_strain'],
    priority: 4,
    scope: 'all',
    minCycle: 3
  },
  {
    id: 'staff_bank_agency',
    text: "You used bank/agency staff. How did that work out?",
    theme: 'staff_wellbeing',
    triggers: ['bank_staff_used'],
    priority: 4,
    scope: 'team',
    minCycle: 2
  },

  // --- RESILIENCE (Late game) ---
  {
    id: 'resilience_governance',
    text: "How did you build resilience into your system?",
    theme: 'resilience',
    triggers: ['resilience_focus', 'governance_improved'],
    priority: 4,
    scope: 'team',
    minCycle: 4
  },
  {
    id: 'resilience_fragility',
    text: "Where did your system feel most fragile?",
    theme: 'resilience',
    triggers: ['system_fragile', 'resilience_neglect'],
    priority: 4,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'resilience_sustainability',
    text: "Looking at your final state - is this sustainable for the long term?",
    theme: 'resilience',
    triggers: [],
    priority: 5,
    scope: 'all',
    minCycle: 5
  },

  // --- SYSTEMS THINKING (Late game) ---
  {
    id: 'systems_delayed_consequences',
    text: "What consequences showed up two or three cycles after the decision that caused them?",
    theme: 'systems_thinking',
    triggers: ['incident_occurred', 'high_sickness', 'early_lead_lost'],
    priority: 5,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'systems_interconnections',
    text: "Where did you see the four pillars interconnecting - where improving one affected another?",
    theme: 'systems_thinking',
    triggers: [],
    priority: 5,
    scope: 'all',
    minCycle: 3
  },
  {
    id: 'systems_small_big',
    text: "Where did a small decision create a surprisingly big effect later?",
    theme: 'systems_thinking',
    triggers: ['incident_occurred', 'comeback'],
    priority: 4,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'systems_root_cause',
    text: "Which problems were symptoms rather than root causes?",
    theme: 'systems_thinking',
    triggers: ['backlog_growing', 'high_sickness', 'incident_occurred'],
    priority: 4,
    scope: 'all',
    minCycle: 4
  },

  // --- STRATEGY (Late game) ---
  {
    id: 'strategy_single_focus',
    text: "You focused heavily on one pillar. How did that work out?",
    theme: 'strategy',
    triggers: ['single_focus'],
    priority: 4,
    scope: 'team',
    minCycle: 4
  },
  {
    id: 'strategy_balanced',
    text: "You took a balanced approach. What were the trade-offs?",
    theme: 'strategy',
    triggers: ['balanced_approach'],
    priority: 4,
    scope: 'team',
    minCycle: 4
  },
  {
    id: 'strategy_comeback',
    text: "You recovered from a difficult position. What changed?",
    theme: 'strategy',
    triggers: ['comeback'],
    priority: 5,
    scope: 'team',
    minCycle: 4
  },
  {
    id: 'strategy_lost_lead',
    text: "You had an early lead but it slipped. What happened?",
    theme: 'strategy',
    triggers: ['early_lead_lost'],
    priority: 5,
    scope: 'team',
    minCycle: 4
  },
  {
    id: 'strategy_repeat',
    text: "What would you definitely do again if you played tomorrow?",
    theme: 'strategy',
    triggers: ['leading_team', 'balanced_approach'],
    priority: 4,
    scope: 'all',
    minCycle: 5
  },
  {
    id: 'strategy_never_again',
    text: "What would you never do again?",
    theme: 'strategy',
    triggers: ['incident_occurred', 'high_sickness', 'early_lead_lost'],
    priority: 4,
    scope: 'all',
    minCycle: 5
  },

  // --- CROSS-TEAM (Late game) ---
  {
    id: 'compare_different_approach',
    text: "Looking at other teams, where did you see a fundamentally different approach?",
    theme: 'strategy',
    triggers: ['leading_team'],
    priority: 3,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'compare_risk',
    text: "Which team took the biggest risks? How did that play out?",
    theme: 'strategy',
    triggers: [],
    priority: 3,
    scope: 'all',
    minCycle: 4
  },

  // --- REAL WORLD APPLICATION ---
  {
    id: 'real_early_warning',
    text: "How do you spot early warning signs in real maternity services - before they become crises?",
    theme: 'lessons',
    triggers: ['incident_occurred', 'high_sickness'],
    priority: 3,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'real_safety_vs_flow',
    text: "In your real work, how do you balance patient safety with patient flow?",
    theme: 'lessons',
    triggers: ['safety_focus', 'backlog_growing'],
    priority: 3,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'real_staff_sustainability',
    text: "What does sustainable staffing look like in your actual service?",
    theme: 'lessons',
    triggers: ['staff_wellbeing_focus', 'high_sickness'],
    priority: 3,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'real_equity_practice',
    text: "How do you ensure equitable access in your real service?",
    theme: 'lessons',
    triggers: ['equity_focus', 'equity_neglect'],
    priority: 3,
    scope: 'all',
    minCycle: 4
  },

  // --- LESSONS (always relevant but scaled) ---
  {
    id: 'lesson_mirror',
    text: "Where does this simulation mirror dynamics you see in your real work?",
    theme: 'lessons',
    triggers: [],
    priority: 5,
    scope: 'all',
    minCycle: 3
  },
  {
    id: 'lesson_personal',
    text: "What leadership lesson emerged for you personally?",
    theme: 'lessons',
    triggers: [],
    priority: 5,
    scope: 'all',
    minCycle: 4
  },
  {
    id: 'lesson_monday',
    text: "What will you do differently on Monday?",
    theme: 'lessons',
    triggers: [],
    priority: 4,
    scope: 'all',
    minCycle: 5
  },
  {
    id: 'lesson_early_takeaway',
    text: "What's your biggest takeaway from this cycle?",
    theme: 'lessons',
    triggers: ['first_cycle'],
    priority: 4,
    scope: 'all',
    maxCycle: 3
  }
];
