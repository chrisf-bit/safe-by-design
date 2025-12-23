// =============================================================================
// SAFE BY DESIGN - RANDOM EVENTS SYSTEM
// Generates cycle-specific events that impact gameplay
// =============================================================================

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  effect: string;
  impacts: {
    backlog?: number;
    dnaRate?: number;
    staffSickness?: number;
    staffMorale?: number;
    safetyRisk?: number;
    capacityModifier?: number;
  };
  cycle?: number; // If set, only appears in this cycle
  minCycle?: number; // Earliest cycle this can appear
  maxCycle?: number; // Latest cycle this can appear
}

// =============================================================================
// EVENT LIBRARY
// =============================================================================

const EVENT_LIBRARY: Omit<RandomEvent, 'id'>[] = [
  // STAFFING EVENTS
  {
    title: "Winter Flu Outbreak",
    description: "A flu outbreak is affecting your staff. Several midwives have called in sick.",
    severity: 'warning',
    effect: "Staff sickness +8%, Capacity reduced",
    impacts: { staffSickness: 8, capacityModifier: -0.15 },
    minCycle: 2
  },
  {
    title: "Senior Midwife Resignation",
    description: "An experienced senior midwife has handed in their notice, citing burnout.",
    severity: 'critical',
    effect: "Experience loss, Training effectiveness -10%",
    impacts: { staffMorale: -10, safetyRisk: 5 },
    minCycle: 3
  },
  {
    title: "Agency Staff Shortage",
    description: "Regional shortage of agency midwives. Bank staff availability reduced.",
    severity: 'warning',
    effect: "Harder to cover gaps",
    impacts: { capacityModifier: -0.1, staffSickness: 3 },
    minCycle: 2
  },
  {
    title: "Staff Wellbeing Initiative Success",
    description: "Your investment in staff wellbeing is paying off. Team morale is improving.",
    severity: 'info',
    effect: "Staff morale +5%",
    impacts: { staffMorale: 5, staffSickness: -2 },
    minCycle: 3
  },
  
  // CAPACITY/DEMAND EVENTS
  {
    title: "Neighbouring Trust Diverts Patients",
    description: "A nearby trust has temporarily closed its maternity unit. Expect 20% more referrals.",
    severity: 'critical',
    effect: "Referrals +20%, Backlog pressure",
    impacts: { backlog: 15, capacityModifier: -0.1 },
    minCycle: 2
  },
  {
    title: "New Housing Development",
    description: "A new housing estate is bringing young families to the area. Gradual increase in births expected.",
    severity: 'warning',
    effect: "Long-term demand increase",
    impacts: { backlog: 8 },
    minCycle: 3
  },
  {
    title: "Birth Rate Dip",
    description: "Slightly fewer births expected this quarter due to seasonal variation.",
    severity: 'info',
    effect: "Reduced pressure on capacity",
    impacts: { backlog: -5, capacityModifier: 0.05 },
    minCycle: 2
  },
  {
    title: "Complex Cases Cluster",
    description: "Unusual cluster of high-risk pregnancies requiring additional consultant input.",
    severity: 'warning',
    effect: "More time per patient, Capacity strain",
    impacts: { capacityModifier: -0.12, safetyRisk: 3 },
    minCycle: 2
  },
  
  // PATIENT/COMMUNITY EVENTS
  {
    title: "Local Newspaper Article",
    description: "A positive story about your maternity services has been published locally. Community confidence grows.",
    severity: 'info',
    effect: "DNA rate -2%",
    impacts: { dnaRate: -2 },
    minCycle: 2
  },
  {
    title: "Social Media Concerns",
    description: "Negative posts about waiting times are circulating on local social media groups.",
    severity: 'warning',
    effect: "DNA rate +3%, Reputation pressure",
    impacts: { dnaRate: 3, staffMorale: -3 },
    minCycle: 2
  },
  {
    title: "Interpreter Service Disruption",
    description: "Your usual interpreter service has reduced availability. Language support may be affected.",
    severity: 'warning',
    effect: "Equity risk, DNA rate +2%",
    impacts: { dnaRate: 2 },
    minCycle: 2
  },
  {
    title: "Community Outreach Success",
    description: "Community midwife efforts are improving engagement with hard-to-reach groups.",
    severity: 'info',
    effect: "DNA rate -3%",
    impacts: { dnaRate: -3 },
    minCycle: 3
  },
  
  // CLINICAL/SAFETY EVENTS
  {
    title: "Near-Miss Incident",
    description: "A near-miss has been reported. No harm occurred but it requires investigation and learning.",
    severity: 'warning',
    effect: "Safety focus needed, Staff anxiety",
    impacts: { safetyRisk: 8, staffMorale: -5 },
    minCycle: 2
  },
  {
    title: "Equipment Failure",
    description: "CTG machine breakdown. Backup equipment is older and less reliable.",
    severity: 'warning',
    effect: "Safety risk until resolved",
    impacts: { safetyRisk: 5, capacityModifier: -0.05 },
    minCycle: 2
  },
  {
    title: "Medication Supply Issue",
    description: "National shortage affecting certain medications. Workarounds needed.",
    severity: 'warning',
    effect: "Process disruption",
    impacts: { capacityModifier: -0.08 },
    minCycle: 2
  },
  {
    title: "New Safety Protocol Success",
    description: "Your recent safety improvements are showing results. Incident reports are down.",
    severity: 'info',
    effect: "Safety risk reduced",
    impacts: { safetyRisk: -5 },
    minCycle: 3
  },
  
  // GOVERNANCE/EXTERNAL EVENTS
  {
    title: "CQC Inspection Announced",
    description: "CQC has announced an upcoming inspection. Documentation and processes will be scrutinised.",
    severity: 'critical',
    effect: "Must prioritise compliance",
    impacts: { capacityModifier: -0.1, staffMorale: -5 },
    minCycle: 3,
    maxCycle: 5
  },
  {
    title: "New NICE Guidelines",
    description: "Updated national guidelines require changes to your care pathways.",
    severity: 'warning',
    effect: "Training needed, Process updates",
    impacts: { capacityModifier: -0.05 },
    minCycle: 2
  },
  {
    title: "Trust-Wide Cost Pressures",
    description: "The trust is asking all departments to find efficiency savings.",
    severity: 'warning',
    effect: "Budget pressure",
    impacts: { staffMorale: -3 },
    minCycle: 3
  },
  {
    title: "Successful CNST Submission",
    description: "Your maternity incentive scheme submission has been successful. Additional funding secured.",
    severity: 'info',
    effect: "Resources +10%",
    impacts: { capacityModifier: 0.08 },
    minCycle: 4
  },
  
  // WEATHER/SEASONAL
  {
    title: "Severe Weather Warning",
    description: "Storm conditions expected. Some community appointments may need rescheduling.",
    severity: 'warning',
    effect: "DNA rate +5%, Some delays",
    impacts: { dnaRate: 5, capacityModifier: -0.08 },
    minCycle: 2
  },
  {
    title: "Summer Holiday Period",
    description: "Peak holiday season affecting both staff availability and patient bookings.",
    severity: 'info',
    effect: "Mixed impact on capacity",
    impacts: { staffSickness: 2, backlog: -3 },
    minCycle: 2
  }
];

// =============================================================================
// EVENT GENERATION
// =============================================================================

export function generateEventsForCycle(
  cycle: number, 
  scenarioSeed: number,
  previousEvents: string[] = []
): RandomEvent[] {
  // Use seed for reproducibility
  const random = seededRandom(scenarioSeed + cycle * 1000);
  
  // Filter eligible events
  const eligibleEvents = EVENT_LIBRARY.filter(e => {
    if (e.cycle && e.cycle !== cycle) return false;
    if (e.minCycle && cycle < e.minCycle) return false;
    if (e.maxCycle && cycle > e.maxCycle) return false;
    return true;
  });
  
  // Determine number of events (1-2 typically, sometimes 0 or 3)
  let numEvents: number;
  const roll = random();
  if (cycle === 1) {
    numEvents = roll < 0.7 ? 1 : 0; // First cycle: usually 1, sometimes 0
  } else if (roll < 0.2) {
    numEvents = 0;
  } else if (roll < 0.75) {
    numEvents = 1;
  } else if (roll < 0.95) {
    numEvents = 2;
  } else {
    numEvents = 3;
  }
  
  // Select events
  const selectedEvents: RandomEvent[] = [];
  const shuffled = shuffleWithSeed(eligibleEvents, random);
  
  for (let i = 0; i < Math.min(numEvents, shuffled.length); i++) {
    const event = shuffled[i];
    // Avoid repeating recent events
    const eventId = `${cycle}-${i}`;
    if (!previousEvents.includes(event.title)) {
      selectedEvents.push({
        ...event,
        id: eventId
      });
    }
  }
  
  return selectedEvents;
}

// =============================================================================
// APPLY EVENT IMPACTS
// =============================================================================

export interface SystemMetrics {
  backlog: number;
  dnaRate: number;
  staffSickness: number;
  staffMorale: number;
  safetyRisk: number;
  capacityModifier: number;
}

export function applyEventImpacts(
  metrics: SystemMetrics,
  events: RandomEvent[]
): SystemMetrics {
  const result = { ...metrics };
  
  for (const event of events) {
    if (event.impacts.backlog) {
      result.backlog = Math.max(0, result.backlog + event.impacts.backlog);
    }
    if (event.impacts.dnaRate) {
      result.dnaRate = Math.max(0, Math.min(50, result.dnaRate + event.impacts.dnaRate));
    }
    if (event.impacts.staffSickness) {
      result.staffSickness = Math.max(0, Math.min(40, result.staffSickness + event.impacts.staffSickness));
    }
    if (event.impacts.staffMorale) {
      result.staffMorale = Math.max(0, Math.min(100, result.staffMorale + event.impacts.staffMorale));
    }
    if (event.impacts.safetyRisk) {
      result.safetyRisk = Math.max(0, result.safetyRisk + event.impacts.safetyRisk);
    }
    if (event.impacts.capacityModifier) {
      result.capacityModifier = result.capacityModifier + event.impacts.capacityModifier;
    }
  }
  
  return result;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function seededRandom(seed: number) {
  let state = seed;
  return function() {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function shuffleWithSeed<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
