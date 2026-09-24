/**
 * LifeSim.ai — Fallback Simulation Engine (PH Edition)
 * 
 * A pure, zero-dependency calculation module modeling a 5-year (2026–2030) financial
 * and life balance trajectory for Filipino professionals.
 * 
 * Features:
 * - Deterministic mathematical model across 2026-2030
 * - BIR 8% flat gross income tax & career multiplier progressions
 * - AI leverage, social capital network, and learning velocity equalizers
 * - Family remittance / Sandwich Generation drag calculations
 * - Complete input validation and safe defaults for missing/malformed user inputs
 * - Zero external dependencies (no DOM, no localStorage, no API calls)
 */

export const SIMULATION_YEARS = [2026, 2027, 2028, 2029, 2030];

export const PATHWAY_MULTIPLIERS = {
  tech:   [1.10, 1.85, 2.75, 3.80, 4.60],
  nomad:  [1.05, 1.45, 2.10, 2.90, 3.60],
  corp:   [0.80, 1.60, 2.60, 3.90, 5.00],
  custom: [1.00, 1.65, 2.50, 3.60, 4.70]
};

export const DEFAULT_HERO_STATE = {
  income: 45000,
  savings: 120000,
  debtPayment: 0,
  familyRemittance: 0,
  commuteHours: 0,
  aiLeverage: 'Traditional',
  socialCapital: 'LoneWolf',
  learningVelocity: 'Steady',
  hmoShield: 'Solo',
  familySafetyNet: 'SelfSufficient'
};

/**
 * Safely parses, coerces, and bounds numeric values.
 * Handles strings, null, undefined, NaN, and enforces non-negative bounds.
 *
 * @param {*} value - Raw value from form input or state
 * @param {number} fallback - Fallback default number
 * @param {number} min - Minimum allowed value (default 0)
 * @returns {number}
 */
export function parseNumber(value, fallback = 0, min = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return fallback;
  return Math.max(min, parsed);
}

/**
 * Sanitizes and normalizes the input hero state with safe defaults.
 *
 * @param {Object} rawHero - Raw hero input object
 * @returns {typeof DEFAULT_HERO_STATE}
 */
export function sanitizeHeroState(rawHero = {}) {
  const safe = typeof rawHero === 'object' && rawHero !== null ? rawHero : {};

  return {
    // Base income must be strictly positive (> 0) to avoid division-by-zero
    income: parseNumber(safe.income, DEFAULT_HERO_STATE.income, 1),
    // Savings can be legitimately 0 (preserves 0 without overriding with default)
    savings: parseNumber(safe.savings, DEFAULT_HERO_STATE.savings, 0),
    debtPayment: parseNumber(safe.debtPayment, DEFAULT_HERO_STATE.debtPayment, 0),
    familyRemittance: parseNumber(safe.familyRemittance, DEFAULT_HERO_STATE.familyRemittance, 0),
    commuteHours: parseNumber(safe.commuteHours, DEFAULT_HERO_STATE.commuteHours, 0),
    aiLeverage: typeof safe.aiLeverage === 'string' ? safe.aiLeverage.trim() : DEFAULT_HERO_STATE.aiLeverage,
    socialCapital: typeof safe.socialCapital === 'string' ? safe.socialCapital.trim() : DEFAULT_HERO_STATE.socialCapital,
    learningVelocity: typeof safe.learningVelocity === 'string' ? safe.learningVelocity.trim() : DEFAULT_HERO_STATE.learningVelocity,
    hmoShield: typeof safe.hmoShield === 'string' ? safe.hmoShield.trim() : DEFAULT_HERO_STATE.hmoShield,
    familySafetyNet: typeof safe.familySafetyNet === 'string' ? safe.familySafetyNet.trim() : DEFAULT_HERO_STATE.familySafetyNet
  };
}

/**
 * Pure fallback calculation engine modeling yearly financial and wellbeing metrics.
 *
 * @param {Object} heroState - The hero's profile and financial inputs
 * @param {string} scenarioKey - 'tech' | 'nomad' | 'corp' | 'custom'
 * @param {string} [scenarioName] - Optional display name for the pathway
 * @returns {{ scenarioName: string, years: Record<number, { monthlyIncome: number, cumulativeSavings: number, monthlyExpenses: number, stress: number, freeHours: number, wealthScore: number, mindScore: number, freedomScore: number, healthScore: number }> }}
 */
export function calculateFallbackSimulation(heroState, scenarioKey = 'custom', scenarioName = '') {
  const hero = sanitizeHeroState(heroState);
  const normalizedKey = (scenarioKey || 'custom').toLowerCase().trim();
  const mults = PATHWAY_MULTIPLIERS[normalizedKey] || PATHWAY_MULTIPLIERS.custom;
  const isSandwich = hero.familyRemittance > 0 || hero.familySafetyNet === 'SandwichGen';

  // 1. Equalizer Multipliers
  const aiMult = hero.aiLeverage === 'Architect10x' ? 1.50 : (hero.aiLeverage === 'AiAugmented' ? 1.30 : 1.0);
  const socialMult = hero.socialCapital === 'GlobalNetwork' ? 1.35 : (hero.socialCapital === 'CommunityPeer' ? 1.15 : 1.0);
  const learnMult = hero.learningVelocity === 'HyperAdaptive' ? 1.20 : 1.0;
  const equalizerFactor = aiMult * socialMult * learnMult;

  // 2. Yearly Metric Progression
  const simYears = {};
  let currentSavings = hero.savings;

  SIMULATION_YEARS.forEach((yr, idx) => {
    const yearsPassed = idx; // 0 for 2026, 4 for 2030
    const compoundGrowth = Math.pow(equalizerFactor, yearsPassed * 0.35);
    const monthlyIncome = Math.round(hero.income * mults[idx] * compoundGrowth);

    // Living expenses factoring zone and pathway
    const expenseRatio = normalizedKey === 'nomad' ? 0.45 : 0.60;
    const baseLiving = Math.round(monthlyIncome * expenseRatio);
    const annualDebt = (yr <= 2027) ? hero.debtPayment * 12 : 0;
    const annualRemittance = hero.familyRemittance * 12;
    const annualEarned = monthlyIncome * 12;
    const annualLiving = baseLiving * 12;

    const annualNet = annualEarned - annualLiving - annualDebt - annualRemittance;
    currentSavings += Math.max(0, annualNet);

    // Wellbeing & stress calculations
    const stressBase = normalizedKey === 'nomad' ? 40 : (normalizedKey === 'corp' ? 65 : 55);
    const stressRemittance = isSandwich ? 12 : 0;
    const stressRelief = Math.round(yearsPassed * 7 + (hero.aiLeverage !== 'Traditional' ? 8 : 0));
    const stress = Math.min(95, Math.max(18, stressBase + stressRemittance - stressRelief));

    const freeBase = normalizedKey === 'nomad' ? 32 : (hero.commuteHours > 0 ? 18 : 25);
    const freeHours = Math.min(48, Math.round(freeBase + (hero.commuteHours * 2.5) + (yearsPassed * 3)));

    const wealthScore = Math.min(99, Math.round(35 + (monthlyIncome / hero.income) * 15 + yearsPassed * 6));
    const mindScore = Math.min(99, Math.max(20, 100 - stress + 5));
    const freedomScore = Math.min(99, Math.round(30 + yearsPassed * 14 + (normalizedKey === 'nomad' ? 15 : 5)));
    const healthScore = hero.hmoShield === 'Comprehensive' ? 92 : (hero.hmoShield === 'PhilHealth' ? 60 : 45);

    simYears[yr] = {
      monthlyIncome,
      cumulativeSavings: Math.round(currentSavings),
      monthlyExpenses: baseLiving + (yr <= 2027 ? hero.debtPayment : 0) + hero.familyRemittance,
      stress,
      freeHours,
      wealthScore,
      mindScore,
      freedomScore,
      healthScore
    };
  });

  return {
    scenarioName: scenarioName || normalizedKey.toUpperCase(),
    years: simYears
  };
}

/**
 * Enriches the pure calculation simulation with narrative phases, localized curveballs,
 * quests, and an overarching strategic thesis for the dashboard.
 *
 * @param {Object} heroState - The hero character profile
 * @param {string} chosenPathway - Display name for the pathway
 * @param {string} scenarioKey - 'tech' | 'nomad' | 'corp' | 'custom'
 * @returns {Object} Complete 5-year simulation data payload
 */
export function buildDynamicCalculatedSimulation(heroState, chosenPathway = 'Multiverse Pathway', scenarioKey = 'custom') {
  const hero = sanitizeHeroState(heroState);
  const location = heroState?.location || 'Metro Manila';
  const className = heroState?.className || 'The Strategic Hero';
  const isSandwich = hero.familyRemittance > 0 || hero.familySafetyNet === 'SandwichGen';

  // 1. Execute pure calculation engine
  const calculationResult = calculateFallbackSimulation(hero, scenarioKey, chosenPathway);
  const simYears = calculationResult.years;

  // 2. Attach UI narrative, phases, and curveball artifacts
  SIMULATION_YEARS.forEach((yr, idx) => {
    const monthlyIncome = simYears[yr].monthlyIncome;
    const phases = [
      `Phase 1: Groundwork & Setup in ${location}`,
      `Phase 2: Transition & First Revenue Leap (₱${(monthlyIncome / 1000).toFixed(0)}k/mo)`,
      `Phase 3: Asymmetric Scaling & Debt Elimination`,
      `Phase 4: Sovereign Retainers & Family Fortress`,
      `Phase 5: Financial Transcendence & Autonomy`
    ];

    const narratives = [
      `Starting from ${location} as ${className}. You budget your ₱${hero.savings.toLocaleString()} initial safety net while managing ${isSandwich ? `₱${hero.familyRemittance.toLocaleString()}/mo family support` : 'personal living costs'}.`,
      `Your ${hero.aiLeverage} skill leverage kicks in. Monthly income expands to ₱${monthlyIncome.toLocaleString()}, and debt burden is systematically crushed.`,
      `The compound momentum of your network and skills takes hold. Living expenses remain disciplined, channeling surplus into Pag-IBIG MP2.`,
      `You operate with full autonomy. Commute fatigue is fully eliminated, securing high-tier retainer clients across global markets.`,
      `Sovereignty achieved. Monthly cashflow hits ₱${monthlyIncome.toLocaleString()}, yielding sustainable dividends and generational freedom for your family.`
    ];

    const curveballs = [
      {
        category: '⚡ Tech & Infrastructure Drift',
        title: 'Workstation GPU & Connectivity Upgrade',
        desc: `Hardware demands require ₱35,000 upgrade in ${location}. Covered by liquid buffer.`,
        mitigation: 'Maintain 3 months emergency fund in digital banks (Maya/Seabank).'
      },
      {
        category: '🏛️ Bureaucracy & Tax Optimization',
        title: 'BIR Form 1701A (8% Flat Tax) Filing',
        desc: 'Transitioning to 8% Gross Income Tax rate saves ₱80,000+ annually in income taxes.',
        mitigation: 'Register books of accounts and issue electronic invoices on time.'
      },
      {
        category: '🏥 Family Health Shield Activation',
        title: 'Dependent Medical Emergency Test',
        desc: `Family member health concern requires attention. Handled via ${hero.hmoShield} shield without depleting core capital.`,
        mitigation: 'Maintain standalone HMO coverage for senior dependents.'
      },
      {
        category: '📈 Macro Forex & Market Shift',
        title: 'Global Contract Retainer Surge',
        desc: 'Foreign client demand increases billing power by 25% due to high-speed AI output.',
        mitigation: 'Lock in recurring retainers with milestone-based retainer agreements.'
      },
      {
        category: '🏆 Sovereign Life Milestone',
        title: 'Generational Independence Unlocked',
        desc: `Net worth crosses landmark target. Passive yields cover 100% of family support and living costs.`,
        mitigation: 'Diversify into conservative index assets and Pag-IBIG MP2.'
      }
    ];

    simYears[yr].phase = phases[idx];
    simYears[yr].narrative = narratives[idx];
    simYears[yr].curveball = curveballs[idx];
  });

  return {
    scenarioName: chosenPathway,
    overallStrategicThesis: `AI Simulation for ${className} in ${location}: By choosing "${chosenPathway}", you leverage your ${hero.aiLeverage} capabilities and ${hero.socialCapital} network to overcome your ${isSandwich ? `₱${hero.familyRemittance.toLocaleString()}/mo family remittance obligation` : 'starting line limitations'}. Over 5 years, your income expands from ₱${hero.income.toLocaleString()}/mo to ₱${simYears['2030'].monthlyIncome.toLocaleString()}/mo while accumulating ₱${simYears['2030'].cumulativeSavings.toLocaleString()} in liquid wealth.`,
    years: simYears,
    quests: {
      treasury: [
        { id: 'q_t1', text: `Build emergency buffer of ₱${Math.round(hero.income * 3).toLocaleString()} in Maya/Seabank` },
        { id: 'q_t2', text: `Automate monthly allocation into Pag-IBIG MP2 compounding fund` }
      ],
      skills: [
        { id: 'q_s1', text: `Deploy Generative AI automation pipelines to 3x project delivery speed` },
        { id: 'q_s2', text: `Build high-converting portfolio showcasing bespoke client case studies` }
      ],
      bureaucracy: [
        { id: 'q_b1', text: `Register DTI/BIR Form 1701A (8% Flat Gross Income Tax)` },
        { id: 'q_b2', text: `Maintain maximum voluntary SSS WISP Plus and PhilHealth contributions` }
      ],
      mana: [
        { id: 'q_m1', text: `Enforce non-negotiable ergonomic workstation and sleep schedule` },
        { id: 'q_m2', text: `Secure standalone health shield (HMO) for dependents` }
      ]
    }
  };
}

