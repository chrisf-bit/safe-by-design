import { CycleResults, FacilitationPrompts, RolePrompts, PromptTemplate } from '@safe-by-design/shared';
import promptBank from '../data/promptBank.json';
import { getDecisions } from './gameEngine';

interface PromptGenerationContext {
  teamId: string;
  cycle: number;
  currentResults: CycleResults;
  previousResults?: CycleResults;
  decisionIds: string[];
}

export function generateFacilitationPrompts(context: PromptGenerationContext): FacilitationPrompts {
  const decisions = getDecisions().filter(d => context.decisionIds.includes(d.id));
  
  // Generate what happened summary
  const whatHappened = generateWhatHappened(context, decisions);
  
  // Detect and describe trade-offs
  const notableTradeoffs = detectTradeoffs(context, decisions);
  
  // Generate coaching questions
  const coachingQuestions = generateCoachingQuestions(context, decisions);
  
  // Generate role-specific prompts
  const rolePrompts = generateRolePrompts(context, decisions);
  
  return {
    teamId: context.teamId,
    cycle: context.cycle,
    whatHappened,
    notableTradeoffs,
    coachingQuestions,
    rolePrompts,
  };
}

function generateWhatHappened(
  context: PromptGenerationContext,
  decisions: any[]
): string[] {
  const summary: string[] = [];
  const { currentResults, previousResults } = context;
  
  // Describe score changes
  if (previousResults) {
    const safetyDelta = currentResults.scores.safety - previousResults.scores.safety;
    const equityDelta = currentResults.scores.equity - previousResults.scores.equity;
    const staffDelta = currentResults.scores.staff - previousResults.scores.staff;
    const resilienceDelta = currentResults.scores.resilience - previousResults.scores.resilience;
    
    if (Math.abs(safetyDelta) > 5) {
      summary.push(
        `Safety ${safetyDelta > 0 ? 'improved' : 'declined'} by ${Math.abs(Math.round(safetyDelta))} points to ${Math.round(currentResults.scores.safety)}`
      );
    }
    
    if (Math.abs(equityDelta) > 5) {
      summary.push(
        `Equity ${equityDelta > 0 ? 'improved' : 'declined'} by ${Math.abs(Math.round(equityDelta))} points to ${Math.round(currentResults.scores.equity)}`
      );
    }
    
    if (Math.abs(staffDelta) > 5) {
      summary.push(
        `Staff wellbeing ${staffDelta > 0 ? 'improved' : 'declined'} by ${Math.abs(Math.round(staffDelta))} points to ${Math.round(currentResults.scores.staff)}`
      );
    }
    
    if (Math.abs(resilienceDelta) > 5) {
      summary.push(
        `System resilience ${resilienceDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(resilienceDelta))} points to ${Math.round(currentResults.scores.resilience)}`
      );
    }
  }
  
  // Describe operational changes
  if (previousResults) {
    if (currentResults.metrics.backlog > previousResults.metrics.backlog + 10) {
      summary.push(`Backlog increased significantly to ${currentResults.metrics.backlog} women waiting`);
    }
    if (currentResults.metrics.dnaRate > previousResults.metrics.dnaRate + 3) {
      summary.push(`DNA rate rose to ${currentResults.metrics.dnaRate}%`);
    }
    if (currentResults.metrics.staffSickness > previousResults.metrics.staffSickness + 5) {
      summary.push(`Staff sickness increased to ${currentResults.metrics.staffSickness}%`);
    }
  }
  
  // Describe incidents
  if (currentResults.incidents.length > 0) {
    summary.push(`${currentResults.incidents.length} incident(s) occurred this cycle`);
  }
  
  // Describe key decisions
  const keyDecisionCategories = [...new Set(decisions.map(d => d.category))];
  if (keyDecisionCategories.length > 0) {
    summary.push(`Team focused investments in: ${keyDecisionCategories.join(', ').replace(/_/g, ' ')}`);
  }
  
  return summary.slice(0, 3); // Top 3 most important
}

function detectTradeoffs(
  context: PromptGenerationContext,
  decisions: any[]
): string[] {
  const tradeoffs: string[] = [];
  const { currentResults, previousResults } = context;
  
  if (!previousResults) return tradeoffs;
  
  const safetyDelta = currentResults.scores.safety - previousResults.scores.safety;
  const equityDelta = currentResults.scores.equity - previousResults.scores.equity;
  const staffDelta = currentResults.scores.staff - previousResults.scores.staff;
  const resilienceDelta = currentResults.scores.resilience - previousResults.scores.resilience;
  
  // Safety vs Equity divergence
  if (safetyDelta > 5 && equityDelta < -5) {
    tradeoffs.push('Safety improved but at the cost of equitable access - some groups were likely deprioritised');
  } else if (equityDelta > 5 && safetyDelta < -5) {
    tradeoffs.push('Access expanded but safety mechanisms may have been compromised');
  }
  
  // Staff vs Flow/Capacity
  if (staffDelta < -8 && currentResults.metrics.backlog < (previousResults?.metrics.backlog || 0)) {
    tradeoffs.push('Reduced backlog but team wellbeing suffered - sustainable?');
  }
  
  // Resilience vs Short-term gains
  if (resilienceDelta < -8 && decisions.some(d => d.id === 'bank_agency')) {
    tradeoffs.push('Bank/agency provided immediate capacity but reduced financial resilience and continuity');
  }
  
  // Capacity investment vs immediate care
  if (decisions.some(d => d.id === 'protected_learning') && currentResults.metrics.backlog > 30) {
    tradeoffs.push('Protected learning time invested in long-term capability but increased short-term waiting');
  }
  
  // Digital investment vs immediate needs
  if (decisions.some(d => d.id === 'remote_monitoring') && staffDelta < -5) {
    tradeoffs.push('Remote monitoring rollout consumed staff energy during implementation phase');
  }
  
  return tradeoffs;
}

function generateCoachingQuestions(
  context: PromptGenerationContext,
  decisions: any[]
): string[] {
  const questions: string[] = [];
  const templates = promptBank as PromptTemplate[];
  
  // Select relevant prompts based on conditions
  const selectedPrompts = selectPrompts(context, decisions, templates);
  
  // Extract questions from templates
  for (const prompt of selectedPrompts) {
    if (prompt.templates && prompt.templates.length > 0) {
      // Pick a random template from each prompt
      const randomIndex = Math.floor(Math.random() * prompt.templates.length);
      questions.push(prompt.templates[randomIndex]);
    }
  }
  
  return questions.slice(0, 8); // Top 8 questions
}

function generateRolePrompts(
  context: PromptGenerationContext,
  decisions: any[]
): RolePrompts {
  const templates = promptBank as PromptTemplate[];
  const roleTemplates = templates.filter(t => t.roleSpecific);
  
  const diabetesSpecialist: string[] = [];
  const clinicalLead: string[] = [];
  const workforceCapacity: string[] = [];
  const servicePathway: string[] = [];
  
  // Select role-specific prompts
  const selectedRolePrompts = selectPrompts(context, decisions, roleTemplates);
  
  for (const prompt of selectedRolePrompts) {
    if (prompt.roles && prompt.templates.length > 0) {
      const randomIndex = Math.floor(Math.random() * prompt.templates.length);
      const question = prompt.templates[randomIndex];
      
      if (prompt.roles.includes('diabetesSpecialist')) {
        diabetesSpecialist.push(question);
      }
      if (prompt.roles.includes('clinicalLead')) {
        clinicalLead.push(question);
      }
      if (prompt.roles.includes('workforceCapacity')) {
        workforceCapacity.push(question);
      }
      if (prompt.roles.includes('servicePathway')) {
        servicePathway.push(question);
      }
    }
  }
  
  return {
    diabetesSpecialist: diabetesSpecialist.slice(0, 4),
    clinicalLead: clinicalLead.slice(0, 4),
    workforceCapacity: workforceCapacity.slice(0, 4),
    servicePathway: servicePathway.slice(0, 4),
  };
}

function selectPrompts(
  context: PromptGenerationContext,
  decisions: any[],
  templates: PromptTemplate[]
): PromptTemplate[] {
  const selected: PromptTemplate[] = [];
  const { currentResults, previousResults } = context;
  
  for (const template of templates) {
    if (shouldTriggerPrompt(template, context, decisions, currentResults, previousResults)) {
      selected.push(template);
    }
  }
  
  return selected;
}

function shouldTriggerPrompt(
  template: PromptTemplate,
  context: PromptGenerationContext,
  decisions: any[],
  currentResults: CycleResults,
  previousResults?: CycleResults
): boolean {
  const { trigger } = template;
  
  switch (trigger.condition) {
    case 'safety_drop':
      if (previousResults) {
        const delta = currentResults.scores.safety - previousResults.scores.safety;
        const threshold = trigger.parameters?.threshold || 10;
        return delta < -threshold;
      }
      return currentResults.scores.safety < 65;
      
    case 'equity_drop':
      if (previousResults) {
        const delta = currentResults.scores.equity - previousResults.scores.equity;
        const threshold = trigger.parameters?.threshold || 10;
        return delta < -threshold;
      }
      return currentResults.scores.equity < 60;
      
    case 'staff_burnout':
      if (previousResults) {
        const delta = currentResults.scores.staff - previousResults.scores.staff;
        const threshold = trigger.parameters?.threshold || 15;
        return delta < -threshold || currentResults.scores.staff < 60;
      }
      return currentResults.scores.staff < 60;
      
    case 'resilience_drop':
      if (previousResults) {
        const delta = currentResults.scores.resilience - previousResults.scores.resilience;
        const threshold = trigger.parameters?.threshold || 10;
        return delta < -threshold;
      }
      return currentResults.scores.resilience < 60;
      
    case 'backlog_rise':
      if (previousResults) {
        const delta = currentResults.metrics.backlog - previousResults.metrics.backlog;
        const threshold = trigger.parameters?.threshold || 20;
        return delta > threshold;
      }
      return currentResults.metrics.backlog > 40;
      
    case 'dna_rise':
      if (previousResults) {
        const delta = currentResults.metrics.dnaRate - previousResults.metrics.dnaRate;
        const threshold = trigger.parameters?.threshold || 5;
        return delta > threshold;
      }
      return currentResults.metrics.dnaRate > 20;
      
    case 'incident_occurred':
      return currentResults.incidents.length > 0;
      
    case 'budget_imbalance':
      // Would check team's budget allocation if available
      return false; // Placeholder
      
    case 'trade_off_detected':
      // Always applicable for general reflection
      return true;
      
    case 'remote_monitoring_chosen':
      return decisions.some(d => d.id === 'remote_monitoring');
      
    case 'bank_agency_used':
      return decisions.some(d => d.id === 'bank_agency');
      
    case 'equity_safety_diverge':
      if (previousResults) {
        const safetyDelta = currentResults.scores.safety - previousResults.scores.safety;
        const equityDelta = currentResults.scores.equity - previousResults.scores.equity;
        const threshold = trigger.parameters?.threshold || 15;
        return Math.abs(safetyDelta - equityDelta) > threshold;
      }
      return false;
      
    case 'protected_time_chosen':
      return decisions.some(d => d.id === 'protected_learning');
      
    case 'triage_tightened':
      return decisions.some(d => d.id === 'tighten_triage');
      
    default:
      return false;
  }
}
