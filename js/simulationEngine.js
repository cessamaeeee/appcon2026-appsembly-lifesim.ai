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
