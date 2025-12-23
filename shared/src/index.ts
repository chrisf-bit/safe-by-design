// Game Status
export type GameStatus = 'lobby' | 'in_cycle' | 'results' | 'ended';

// Game Model
export interface Game {
  id: string;
  gameCode: string;
  createdAt: string;
  status: GameStatus;
  numberOfTeams: number;
  currentCycle: number;
  scenarioSeed: number;
  facilitatorName?: string;
}

// Team Model
export interface Team {
  id: string;
  gameId: string;
  name: string;
  joinedAt: string;
  roleAssignments?: RoleAssignments;
  cumulativeScore: ScoreBreakdown;
}

export interface RoleAssignments {
  diabetesSpecialist?: string;
  clinicalLead?: string;
  workforceCapacity?: string;
  servicePathway?: string;
}

// Budget Types
export interface Budgets {
  capacityPoints: number;
  staffEnergy: number;
  cashBudget: number;
}

// Decision Model
export interface Decision {
  id: string;
  name: string;
  description: string;
  category: DecisionCategory;
  costs: Budgets;
  effectTags: EffectTag[];
  timing: 'immediate' | 'delayed' | 'both';
  delayedCycles?: number;
}

export type DecisionCategory = 
  | 'pathway_access'
  | 'clinical_safety'
  | 'digital_monitoring'
  | 'workforce_wellbeing';

export type EffectTag = 
  | 'safety' 
  | 'equity' 
  | 'staff' 
  | 'flow' 
  | 'resilience'
  | 'governance'
  | 'digital';

// Team Decision Submission
export interface TeamDecisions {
  id: string;
  teamId: string;
  gameId: string;
  cycle: number;
  decisions: string[]; // Decision IDs
  submittedAt: string;
  budgetsUsed: Budgets;
}

// Cycle Results
export interface CycleResults {
  id: string;
  gameId: string;
  cycle: number;
  teamId: string;
  scores: ScoreBreakdown;
  metrics: OperationalMetrics;
  incidents: Incident[];
  calculatedAt: string;
}

export interface ScoreBreakdown {
  safety: number;
  equity: number;
  staff: number;
  resilience: number;
  total: number;
}

export interface OperationalMetrics {
  backlog: number;
  dnaRate: number;
  staffSickness: number;
  highRiskShare: number;
  incidents: number;
  neonatalAdmissions: number;
}

export interface Incident {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// Cycle Brief
export interface CycleBrief {
  cycle: number;
  title: string;
  description: string;
  signals: string[];
  pressureLevel: number;
}

// Facilitation Prompts
export interface FacilitationPrompts {
  teamId: string;
  cycle: number;
  whatHappened: string[];
  notableTradeoffs: string[];
  coachingQuestions: string[];
  rolePrompts: RolePrompts;
}

export interface RolePrompts {
  diabetesSpecialist: string[];
  clinicalLead: string[];
  workforceCapacity: string[];
  servicePathway: string[];
}

// Prompt Template
export interface PromptTemplate {
  id: string;
  category: PromptCategory;
  trigger: PromptTrigger;
  templates: string[];
  roleSpecific?: boolean;
  roles?: string[];
}

export type PromptCategory = 
  | 'plenary'
  | 'team_specific'
  | 'role_lens';

export interface PromptTrigger {
  condition: TriggerCondition;
  parameters?: Record<string, any>;
}

export type TriggerCondition =
  | 'safety_drop'
  | 'equity_drop'
  | 'staff_burnout'
  | 'resilience_drop'
  | 'backlog_rise'
  | 'dna_rise'
  | 'incident_occurred'
  | 'budget_imbalance'
  | 'trade_off_detected'
  | 'remote_monitoring_chosen'
  | 'bank_agency_used'
  | 'equity_safety_diverge'
  | 'protected_time_chosen'
  | 'triage_tightened';

// Pinned Prompt for Facilitator
export interface PinnedPrompt {
  id: string;
  cycle: number;
  teamId?: string;
  promptText: string;
  category: string;
  pinnedAt: string;
}

// Session Summary
export interface SessionSummary {
  gameId: string;
  teams: TeamSummary[];
  overallStats: GameStats;
  cycleProgression: CycleProgression[];
  pinnedPrompts: PinnedPrompt[];
}

export interface TeamSummary {
  teamId: string;
  teamName: string;
  finalScores: ScoreBreakdown;
  rankings: {
    safety: number;
    equity: number;
    staff: number;
    resilience: number;
    overall: number;
  };
  incidents: Incident[];
  keyDecisions: string[];
}

export interface GameStats {
  totalCycles: number;
  averageScores: ScoreBreakdown;
  totalIncidents: number;
}

export interface CycleProgression {
  cycle: number;
  teams: {
    teamId: string;
    scores: ScoreBreakdown;
  }[];
}

// WebSocket Events
export interface SocketEvents {
  // Client -> Server
  'join_game': { gameCode: string; teamName: string; roles?: RoleAssignments };
  'join_facilitator': { gameCode: string };
  'submit_decisions': { teamId: string; decisions: string[] };
  'start_cycle': { gameId: string; cycle: number };
  'close_submissions': { gameId: string; cycle: number };
  'reveal_results': { gameId: string; cycle: number };
  'advance_cycle': { gameId: string };
  'end_game': { gameId: string };
  'pin_prompt': PinnedPrompt;
  'unpin_prompt': { id: string };

  // Server -> Client
  'game_updated': Game;
  'team_joined': Team;
  'cycle_started': { cycle: number; brief: CycleBrief };
  'submissions_closed': { cycle: number };
  'results_ready': { cycle: number; results: CycleResults[] };
  'cycle_advanced': { cycle: number };
  'game_ended': { summary: SessionSummary };
  'error': { message: string };
  'team_submitted': { teamId: string; teamName: string };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateGameRequest {
  numberOfTeams: number;
  facilitatorName?: string;
}

export interface CreateGameResponse {
  game: Game;
  gameCode: string;
}

// Constants
export const INITIAL_BUDGETS: Budgets = {
  capacityPoints: 10,
  staffEnergy: 10,
  cashBudget: 10,
};

export const TOTAL_CYCLES = 6;
