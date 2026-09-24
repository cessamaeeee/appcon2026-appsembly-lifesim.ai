/**
 * LifeSim.ai — Asynchronous Simulation Pipeline Controller
 * 
 * Orchestrates simulation generation across 2026-2030:
 * - Attempts primary Gemini API call with strict timeout protection (18s)
 * - Transparently falls back to the deterministic Simulation Engine (js/simulationEngine.js)
 * - Guarantees a fully resolved simulation payload without exposing raw errors to the user
 */
import { buildDynamicCalculatedSimulation, sanitizeHeroState } from "./simulationEngine.js";

export const SIMULATION_TIMEOUT_MS = 18000; // 18-second timeout for AI API calls

/**
 * Builds the structured prompt for Gemini Generative AI.
 * 
 * @param {Object} hero - Sanitized hero profile
 * @param {string} chosenPathway - Selected portal title
 * @returns {string} Prompt text
 */
export function buildGeminiSimulationPrompt(hero, chosenPathway) {
  return `You are LifeSim.ai's Multiverse Simulation Engine for the Philippines.
Perform an in-depth, realistic 5-year simulation (2026 to 2030) strictly tailored to this specific Filipino hero:
- Class / Background: ${hero.className || 'Hero'} (Age: ${hero.age || 25}, Zone: ${hero.location || 'Metro Manila'})
- Current Work Setup: ${hero.workSetup} with ${hero.commuteHours} hours daily transit
- Base Salary: ₱${hero.income.toLocaleString()}/month
- Liquid Savings: ₱${hero.savings.toLocaleString()}
- Starting Line / Family Safety Net: ${hero.familySafetyNet}
- Monthly Family Support / Remittance (Sandwich Gen): ₱${hero.familyRemittance.toLocaleString()}/month
- Debt Payment: ₱${hero.debtPayment.toLocaleString()}/month (${hero.debtType || 'None'})
- Health Shield (HMO): ${hero.hmoShield}
- The Equalizers: AI Leverage = ${hero.aiLeverage}, Social Capital = ${hero.socialCapital}, Learning Velocity = ${hero.learningVelocity}
- Core Desire: ${hero.desireVector || 'DollarClients'} (Combat Stance: ${hero.riskStance || 'Paladin'})
- Chosen Portal Pathway: "${chosenPathway}"

Calculate realistic year-by-year numbers in Philippine Pesos (PHP) for 2026, 2027, 2028, 2029, 2030:
- monthlyIncome (PHP per month)
- cumulativeSavings (PHP total accumulated savings)
- monthlyExpenses (PHP living expenses per month, including living costs + family remittance + debt)
- stress (Integer 0 to 100)
- freeHours (Integer weekly discretionary free hours)
- wealthScore (Integer 0 to 100)
- mindScore (Integer 0 to 100)
- freedomScore (Integer 0 to 100)
- healthScore (Integer 0 to 100)
- phase (Short phase title)
- narrative (2-3 sentences explaining exactly what happened in this year for this specific hero)
- curveball (category, title, desc, mitigation)
- quests (treasury, skills, bureaucracy, mana - each with 2 actionable quests)
- overallStrategicThesis (2 paragraphs synthesizing their starting line vs equalizers)

Return ONLY a strictly valid JSON object matching this schema without markdown code blocks:
{
  "scenarioName": "${chosenPathway}",
  "overallStrategicThesis": "Detailed 2-paragraph strategic thesis...",
  "years": {
    "2026": { "phase": "...", "monthlyIncome": 50000, "cumulativeSavings": 150000, "monthlyExpenses": 32000, "stress": 65, "freeHours": 20, "wealthScore": 55, "mindScore": 60, "freedomScore": 50, "healthScore": 70, "narrative": "...", "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." } },
    "2027": { "phase": "...", "monthlyIncome": 75000, "cumulativeSavings": 320000, "monthlyExpenses": 38000, "stress": 55, "freeHours": 24, "wealthScore": 65, "mindScore": 68, "freedomScore": 60, "healthScore": 75, "narrative": "...", "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." } },
    "2028": { "phase": "...", "monthlyIncome": 120000, "cumulativeSavings": 650000, "monthlyExpenses": 45000, "stress": 45, "freeHours": 28, "wealthScore": 78, "mindScore": 75, "freedomScore": 75, "healthScore": 80, "narrative": "...", "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." } },
    "2029": { "phase": "...", "monthlyIncome": 180000, "cumulativeSavings": 1400000, "monthlyExpenses": 55000, "stress": 35, "freeHours": 35, "wealthScore": 88, "mindScore": 85, "freedomScore": 88, "healthScore": 85, "narrative": "...", "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." } },
    "2030": { "phase": "...", "monthlyIncome": 250000, "cumulativeSavings": 2800000, "monthlyExpenses": 65000, "stress": 25, "freeHours": 40, "wealthScore": 96, "mindScore": 92, "freedomScore": 95, "healthScore": 90, "narrative": "...", "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." } }
  },
  "quests": {
    "treasury": [{ "id": "q_t1", "text": "..." }, { "id": "q_t2", "text": "..." }],
    "skills": [{ "id": "q_s1", "text": "..." }, { "id": "q_s2", "text": "..." }],
    "bureaucracy": [{ "id": "q_b1", "text": "..." }, { "id": "q_b2", "text": "..." }],
    "mana": [{ "id": "q_m1", "text": "..." }, { "id": "q_m2", "text": "..." }]
  }
}`;
}

/**
 * Executes a raw Google Gemini API request.
 * 
 * @param {string} prompt - Prompt string
 * @param {string} apiKey - Gemini API Key
 * @param {string} modelName - e.g. 'gemini-2.0-flash' or 'gemini-3.6-flash'
 * @returns {Promise<Object>} Parsed JSON
 */
async function callGeminiApi(prompt, apiKey, modelName = 'gemini-2.0-flash') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const parsed = JSON.parse(rawText);

  if (!parsed || !parsed.years || !parsed.years['2026']) {
    throw new Error('Malformed Gemini response: missing required 2026-2030 structure.');
  }

  return parsed;
}

/**
 * Controller pipeline for running a 5-year simulation trajectory.
 * 
 * 1. Tries primary Gemini GenAI call first (with timeout protection).
 * 2. On any failure (network error, missing key, invalid format, timeout, or missing module),
 *    gracefully falls back to calculateFallbackSimulation / buildDynamicCalculatedSimulation.
 * 3. Never throws an unhandled error, guaranteeing a valid simulation result is always returned.
 * 
 * @param {Object} heroState - The hero character profile
 * @param {string} scenarioKey - 'tech' | 'nomad' | 'corp' | 'custom'
 * @param {string} [customPrompt] - User's custom pathway or desire statement
 * @param {Function} [primaryAiFn] - Optional external AI simulation function (e.g. teammate's in-progress service)
 * @returns {Promise<Object>} Resolves to complete 5-year simulation data payload
 */
export async function runSimulationPipeline(heroState, scenarioKey = 'custom', customPrompt = '', primaryAiFn = null) {
  const hero = sanitizeHeroState(heroState);
  
  const pathwayNames = {
    tech: 'Shift to High-Income IT, Cloud & Cybersecurity Consulting',
    nomad: 'Relocate to Coastal Province on 100% Asynchronous WFH',
    corp: 'Launch an Independent High-Leverage Philippine Business Venture',
    custom: customPrompt || 'Custom Strategic Multiverse Pathway'
  };

  const chosenPathway = pathwayNames[scenarioKey] || customPrompt || 'Bespoke Multiverse Pathway';

  // Read Gemini API Key and active model if present
  let apiKey = '';
  let activeModel = 'gemini-2.0-flash';
  try {
    if (typeof localStorage !== 'undefined') {
      apiKey = localStorage.getItem('lifesim_gemini_api_key') || '';
      activeModel = localStorage.getItem('lifesim_gemini_model') || 'gemini-2.0-flash';
    }
  } catch (e) {
    apiKey = '';
  }

  // If primaryAiFn is provided OR API key is set, attempt AI generation with timeout protection
  if (primaryAiFn || apiKey) {
    try {
      const executeAiCall = async () => {
        if (typeof primaryAiFn === 'function') {
          return await primaryAiFn(hero, scenarioKey, customPrompt);
        }
        const prompt = buildGeminiSimulationPrompt(hero, chosenPathway);
        return await callGeminiApi(prompt, apiKey, activeModel);
      };

      // Strict timeout promise (18s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Simulation API timed out after ${SIMULATION_TIMEOUT_MS / 1000}s`));
        }, SIMULATION_TIMEOUT_MS);
      });

      const aiResult = await Promise.race([executeAiCall(), timeoutPromise]);

      if (aiResult && aiResult.years && aiResult.years['2026']) {
        return {
          ...aiResult,
          scenarioName: aiResult.scenarioName || chosenPathway,
          isAiGenerated: true,
          source: 'gemini_api'
        };
      }
    } catch (aiError) {
      console.warn("⚠️ Primary AI simulation failed/timed out. Seamlessly engaging deterministic fallback engine:", aiError.message);
    }
  }

  // Seamless fallback to pure calculation simulation engine
  const fallbackResult = buildDynamicCalculatedSimulation(heroState, chosenPathway, scenarioKey);
  return {
    ...fallbackResult,
    isAiGenerated: false,
    source: 'fallback_engine'
  };
}
