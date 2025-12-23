// =============================================================================
// SAFE BY DESIGN - DEBRIEF ENGINE
// Generates facilitator prompts based on team decisions
// =============================================================================

import {
  DebriefQuestion,
  TriggerResult,
  TeamAnalysis,
  FacilitatorPrompts,
  questionBank
} from './debriefQuestions';
import { detectTriggers, TeamContext, GameContext, CycleResult } from './triggerDetection';

const QUESTIONS_PER_TEAM = 3;
const ALL_TEAMS_QUESTIONS = 2;

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

export function generateFacilitatorPrompts(
  teams: TeamContext[],
  gameContext: GameContext,
  currentCycle: number
): FacilitatorPrompts {
  // Analyze each team
  const teamAnalyses: TeamAnalysis[] = teams.map(team => {
    const triggers = detectTriggers(team, gameContext);
    const firedTriggers = triggers.filter(t => t.fired);
    const suggestedQuestions = selectQuestionsForTeam(firedTriggers, currentCycle, currentCycle >= 6);

    return {
      teamId: team.teamId,
      teamName: team.teamName,
      triggers: firedTriggers,
      keyObservations: firedTriggers
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 4)
        .map(t => t.context),
      suggestedQuestions
    };
  });

  // Select all-teams questions
  const allTeamsQuestions = selectAllTeamsQuestions(teamAnalyses, currentCycle, currentCycle >= 6);

  // Generate narrative
  const gameNarrative = generateGameNarrative(teamAnalyses, gameContext);

  return {
    gameNarrative,
    allTeams: allTeamsQuestions,
    perTeam: teamAnalyses
  };
}

// =============================================================================
// CYCLE-SPECIFIC PROMPTS (after each cycle)
// =============================================================================

export interface CyclePrompts {
  cycle: number;
  perTeam: {
    teamId: string;
    teamName: string;
    keyObservations: string[];
    suggestedQuestions: DebriefQuestion[];
  }[];
  allTeams: DebriefQuestion[];
}

export function generateCyclePrompts(
  teams: TeamContext[],
  gameContext: GameContext,
  currentCycle: number
): CyclePrompts {
  const perTeam = teams.map(team => {
    const triggers = detectTriggers(team, gameContext);
    const firedTriggers = triggers.filter(t => t.fired);

    // Focus on triggers relevant to this cycle
    const recentTriggers = firedTriggers.filter(t =>
      t.cycles?.includes(currentCycle) || t.cycles?.length === 0
    );

    const keyObservations = recentTriggers
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3)
      .map(t => t.context);

    const suggestedQuestions = selectQuestionsForTeam(recentTriggers, currentCycle, false).slice(0, 2);

    return {
      teamId: team.teamId,
      teamName: team.teamName,
      keyObservations,
      suggestedQuestions
    };
  });

  // Get all-teams questions appropriate for this cycle
  const allTeams = selectAllTeamsQuestions(
    perTeam.map(t => ({ ...t, triggers: [] })) as TeamAnalysis[],
    currentCycle,
    false
  ).slice(0, 2);

  return {
    cycle: currentCycle,
    perTeam,
    allTeams
  };
}

// =============================================================================
// QUESTION SELECTION
// =============================================================================

function getQuestionsForCycle(currentCycle: number, isEndOfGame: boolean): DebriefQuestion[] {
  return questionBank.filter(q => {
    // Check minCycle constraint
    if (q.minCycle && currentCycle < q.minCycle) {
      return false;
    }

    // Check maxCycle constraint (only for cycle debriefs, not end of game)
    if (!isEndOfGame && q.maxCycle && currentCycle > q.maxCycle) {
      return false;
    }

    return true;
  });
}

function selectQuestionsForTeam(
  triggers: TriggerResult[],
  currentCycle: number,
  isEndOfGame: boolean
): DebriefQuestion[] {
  const availableQuestions = getQuestionsForCycle(currentCycle, isEndOfGame);

  const scoredQuestions = availableQuestions
    .filter(q => q.scope === 'team')
    .map(question => {
      let score = 0;

      // Score based on trigger matches
      for (const trigger of triggers) {
        if (question.triggers.includes(trigger.type as any)) {
          score += question.priority * trigger.intensity;
        }
      }

      // Boost questions that have no specific triggers but are appropriate for this cycle
      if (question.triggers.length === 0 && score === 0) {
        score = question.priority * 0.3;
      }

      // Early game boost for first_cycle trigger
      if (currentCycle <= 2 && question.triggers.includes('first_cycle')) {
        score += 2;
      }

      return { question, score };
    })
    .filter(sq => sq.score > 0)
    .sort((a, b) => b.score - a.score);

  // Select with theme diversity
  const selected: DebriefQuestion[] = [];
  const usedThemes = new Set<string>();

  for (const sq of scoredQuestions) {
    if (selected.length >= QUESTIONS_PER_TEAM) break;

    const themeCount = selected.filter(q => q.theme === sq.question.theme).length;
    if (themeCount < 2) {
      selected.push(sq.question);
      usedThemes.add(sq.question.theme);
    }
  }

  return selected;
}

function selectAllTeamsQuestions(
  analyses: TeamAnalysis[],
  currentCycle: number,
  isEndOfGame: boolean
): DebriefQuestion[] {
  const availableQuestions = getQuestionsForCycle(currentCycle, isEndOfGame);

  // Count trigger occurrences across teams
  const triggerCounts = new Map<string, number>();

  for (const analysis of analyses) {
    for (const trigger of analysis.triggers) {
      const current = triggerCounts.get(trigger.type) || 0;
      triggerCounts.set(trigger.type, current + trigger.intensity);
    }
  }

  const scoredQuestions = availableQuestions
    .filter(q => q.scope === 'all')
    .map(question => {
      let score = question.priority;

      // Boost if multiple teams triggered
      for (const triggerType of question.triggers) {
        const count = triggerCounts.get(triggerType) || 0;
        if (count >= 2) {
          score += count * 2;
        }
      }

      // Always-relevant questions get a boost
      if (question.triggers.length === 0) {
        score += 2;
      }

      // Early game boost for first_cycle trigger
      if (currentCycle <= 2 && question.triggers.includes('first_cycle')) {
        score += 3;
      }

      return { question, score };
    })
    .sort((a, b) => b.score - a.score);

  // Select with theme diversity
  const selected: DebriefQuestion[] = [];
  const usedThemes = new Set<string>();

  for (const sq of scoredQuestions) {
    if (selected.length >= ALL_TEAMS_QUESTIONS) break;

    if (!usedThemes.has(sq.question.theme)) {
      selected.push(sq.question);
      usedThemes.add(sq.question.theme);
    }
  }

  return selected;
}

// =============================================================================
// GAME NARRATIVE
// =============================================================================

function generateGameNarrative(
  analyses: TeamAnalysis[],
  gameContext: GameContext
): string {
  const parts: string[] = [];

  // Leadership changes
  const uniqueLeaders = new Set(gameContext.leaderByCycle).size;
  if (uniqueLeaders > 2) {
    parts.push("Lead changed hands multiple times throughout the game.");
  } else if (uniqueLeaders === 1 && gameContext.leaderByCycle.length > 0) {
    const leader = analyses.find(a => a.teamId === gameContext.leaderByCycle[0]);
    if (leader) {
      parts.push(`${leader.teamName} maintained the lead throughout.`);
    }
  }

  // Incident events
  const incidentTeams = analyses.filter(a =>
    a.triggers.some(t => t.type === 'incident_occurred' && t.intensity > 0.3)
  );
  if (incidentTeams.length > 0) {
    parts.push(`${incidentTeams.map(a => a.teamName).join(' and ')} experienced significant safety incidents.`);
  }

  // Staff pressure
  const staffPressureTeams = analyses.filter(a =>
    a.triggers.some(t => t.type === 'high_sickness' || t.type === 'burnout_risk')
  );
  if (staffPressureTeams.length > 0) {
    parts.push(`${staffPressureTeams.map(a => a.teamName).join(' and ')} faced significant staffing challenges.`);
  }

  // Comebacks
  const comebackTeams = analyses.filter(a =>
    a.triggers.some(t => t.type === 'comeback')
  );
  if (comebackTeams.length > 0) {
    parts.push(`${comebackTeams.map(a => a.teamName).join(' and ')} staged impressive comebacks.`);
  }

  // Strategic contrast
  const balanced = analyses.filter(a =>
    a.triggers.some(t => t.type === 'balanced_approach')
  );
  const focused = analyses.filter(a =>
    a.triggers.some(t => t.type === 'single_focus')
  );
  if (balanced.length > 0 && focused.length > 0) {
    parts.push("Teams took contrasting approaches - some balanced, others focused on specific pillars.");
  }

  return parts.join(' ') || 'A competitive game with varied strategies across teams.';
}

// =============================================================================
// EXPORTS
// =============================================================================

export { questionBank } from './debriefQuestions';
export type { TeamContext, GameContext, CycleResult } from './triggerDetection';
