// Game Types
export type GameStatus = 'lobby' | 'in_cycle' | 'results' | 'ended';

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

export interface RoleAssignments {
  [key: string]: string; // role name to player name
}

export interface Team {
  id: string;
  gameId: string;
  name: string;
  roleAssignments?: RoleAssignments;
  cumulativeScore: ScoreBreakdown;
  joinedAt: string;
}

export interface ScoreBreakdown {
  safety: number;
  equity: number;
  staff: number;
  resilience: number;
  total: number;
}

// Decision Types
export type BudgetType = 'capacity' | 'staffEnergy' | 'cash';

export interface DecisionCosts {
  capacityPoints?: number;
  staffEnergy?: number;
  cashBudget?: number;
}

export interface DecisionEffects {
  safety?: number;
  equity?: number;
  staff?: number;
  flow?: number;
  resilience?: number;
}

export interface Decision {
  id: string;
  name: string;
  description: string;
  category: 'pathway' | 'clinical' | 'digital' | 'workforce';
  costs: {
    capacityPoints: number;
    staffEnergy: number;
    cashBudget: number;
  };
  effects: string[]; // Tags like 'safety', 'equity', 'staff', 'resilience'
  immediateEffects: DecisionEffects;
  delayedEffects: DecisionEffects;
  timing: 'immediate' | 'delayed' | 'both';
}

export interface TeamBudgets {
  capacityPoints: number;
  staffEnergy: number;
  cashBudget: number;
}

export interface TeamDecisionSubmission {
  teamId: string;
  gameId: string;
  cycle: number;
  decisions: string[]; // Array of decision IDs
  budgetsUsed: TeamBudgets;
  submittedAt: string;
}

export interface TeamDecisions {
  id: string;
  teamId: string;
  gameId: string;
  cycle: number;
  decisions: string[];
  submittedAt: string;
}

export interface Incident {
  severity: 'low' | 'medium' | 'high';
  description: string;
}

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

// Cycle Types
export interface CycleBrief {
  cycle: number;
  title: string;
  description: string;
  pressureLevel: number;
  signals: string[];
}

export interface CycleBaseline {
  safety: number;
  equity: number;
  staff: number;
  resilience: number;
  backlog: number;
  dnaRate: number;
  staffSickness: number;
  highRiskShare: number;
}

export interface OperationalMetrics {
  backlog: number;
  dnaRate: number;
  staffSickness: number;
  highRiskShare: number;
  incidents: number;
  neonatalAdmissions: number;
}

export interface CycleOutcome {
  teamId: string;
  gameId: string;
  cycle: number;
  safetyIndex: number;
  equityIndex: number;
  staffIndex: number;
  resilienceIndex: number;
  metrics: OperationalMetrics;
  pillarScores: ScoreBreakdown;
  decisionsChosen: string[];
  calculatedAt: string;
}

// Prompt Types
export type PromptContext = 
  | 'plenary'
  | 'team_specific'
  | 'role_diabetes'
  | 'role_clinical_lead'
  | 'role_workforce'
  | 'role_service';

export type PromptSituation =
  | 'safety_drop'
  | 'equity_drop'
  | 'burnout'
  | 'flow_issues'
  | 'governance_gaps'
  | 'digital_adoption'
  | 'equity_safety_divergence'
  | 'backlog_rise'
  | 'dna_rise'
  | 'remote_monitoring'
  | 'bank_agency_dependency'
  | 'general';

export interface PromptTemplate {
  id: string;
  context: PromptContext;
  situation: PromptSituation;
  text: string;
  placeholders?: string[];
}

export interface GeneratedPrompt {
  id: string;
  teamId?: string;
  context: PromptContext;
  situation: PromptSituation;
  text: string;
  priority: number;
}

export interface FacilitatorPin {
  id: string;
  gameId: string;
  cycle: number;
  promptId: string;
  promptText: string;
  context: PromptContext;
  pinnedAt: string;
  order: number;
}

// WebSocket Events
export interface SocketEvents {
  // Client -> Server
  'game:join': (data: { gameCode: string; teamName: string; roles?: string[] }) => void;
  'game:create': (data: { numberOfTeams: number }) => void;
  'cycle:start': (data: { gameId: string }) => void;
  'cycle:close_submissions': (data: { gameId: string }) => void;
  'cycle:reveal_results': (data: { gameId: string }) => void;
  'cycle:advance': (data: { gameId: string }) => void;
  'decision:submit': (data: TeamDecisionSubmission) => void;
  'prompt:pin': (data: { gameId: string; cycle: number; promptText: string; context: PromptContext }) => void;
  'prompt:unpin': (data: { gameId: string; pinId: string }) => void;
  
  // Server -> Client
  'game:created': (data: { gameId: string; gameCode: string }) => void;
  'game:joined': (data: { teamId: string; team: Team; game: Game }) => void;
  'game:error': (data: { message: string }) => void;
  'game:update': (data: { game: Game; teams: Team[] }) => void;
  'cycle:started': (data: { game: Game; brief: CycleBrief }) => void;
  'cycle:submissions_closed': (data: { gameId: string }) => void;
  'cycle:results_ready': (data: { outcomes: CycleOutcome[]; prompts: GeneratedPrompt[] }) => void;
  'decision:submitted': (data: { teamId: string }) => void;
  'teams:updated': (data: { teams: Team[] }) => void;
}

// UI State Types
export interface TeamViewState {
  game: Game | null;
  team: Team | null;
  currentBrief: CycleBrief | null;
  availableDecisions: Decision[];
  selectedDecisions: string[];
  remainingBudgets: TeamBudgets;
  lastOutcome: CycleOutcome | null;
  allOutcomes: CycleOutcome[];
}

export interface FacilitatorViewState {
  game: Game | null;
  teams: Team[];
  currentBrief: CycleBrief | null;
  cycleOutcomes: CycleOutcome[];
  generatedPrompts: GeneratedPrompt[];
  pinnedPrompts: FacilitatorPin[];
  submissionStatus: Record<string, boolean>; // teamId -> hasSubmitted
}

// Report Types
export interface GameSummaryReport {
  game: Game;
  teams: Team[];
  cycleResults: CycleOutcome[][];
  rankings: {
    overall: { teamId: string; teamName: string; score: number }[];
    safety: { teamId: string; teamName: string; score: number }[];
    equity: { teamId: string; teamName: string; score: number }[];
    staff: { teamId: string; teamName: string; score: number }[];
    resilience: { teamId: string; teamName: number; score: number }[];
  };
  incidents: {
    cycle: number;
    teamId: string;
    teamName: string;
    count: number;
    likelyContributors: string[];
  }[];
  pinnedPrompts: FacilitatorPin[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JoinGameRequest {
  gameCode: string;
  teamName: string;
  roles?: string[];
}

export interface CreateGameRequest {
  numberOfTeams: number;
}

// Constants
export const INITIAL_BUDGETS: TeamBudgets = {
  capacityPoints: 10,
  staffEnergy: 10,
  cashBudget: 10,
};

export const MAX_CYCLES = 6;
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;
