// =========================================================================
// LIFESIM.AI - GEMINI AI MULTIVERSE SERVICE
// Handles live AI portal generation, simulation synthesis & character diagnostics
// =========================================================================

const geminiService = {
  // --- Storage & Config Helpers ---
  lastApiError: null,

  getApiKey() {
    const customKey = localStorage.getItem('lifesim_gemini_api_key');
    if (customKey && customKey.trim()) return customKey.trim();
    if (typeof firebaseService !== 'undefined' && firebaseService.config && firebaseService.config.apiKey) {
      return firebaseService.config.apiKey.trim();
    }
    return '';
  },

  setApiKey(key) {
    if (key) {
      localStorage.setItem('lifesim_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('lifesim_gemini_api_key');
    }
    this.lastApiError = null;
  },

  getModel() {
    return localStorage.getItem('lifesim_gemini_model') || 'gemini-3.8-flash';
  },

  setModel(model) {
    if (model) {
      localStorage.setItem('lifesim_gemini_model', model.trim());
    } else {
      localStorage.removeItem('lifesim_gemini_model');
    }
  },

  cleanJsonResponse(rawText) {
    if (!rawText) return '{}';
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    // In case there is surrounding text before the first '{' or after the last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned.trim();
  },

  isAiAuthorized() {
    const hasCustomKey = !!(localStorage.getItem('lifesim_gemini_api_key') && localStorage.getItem('lifesim_gemini_api_key').trim());
    const isGoogleAuth = typeof currentUser !== 'undefined' && currentUser && currentUser.isLoggedIn && currentUser.authProvider === 'google';
    const hasFirebaseKey = typeof firebaseService !== 'undefined' && firebaseService.config && firebaseService.config.apiKey && firebaseService.config.apiKey.trim();
    return hasCustomKey || isGoogleAuth || !!hasFirebaseKey;
  },

  // --- Core API Query Runner ---
  async queryModel(prompt, modelName = null) {
    const apiKey = this.getApiKey();
    if (modelName == null) {
      console.warn("[geminiService] No model name provided, using default 'gemini-3.8-flash'.");
    }
    if (!apiKey) {
      if (!this.isAiAuthorized()) {
        throw new Error('AUTH_REQUIRED: Please enter your Gemini API Key in Settings (Ctrl+Shift+1) or sign in with Google.');
      }
      throw new Error('NO_API_KEY: Please configure your Gemini API Key in the AI Settings (Ctrl+Shift+1).');
    }

    const primaryModel = modelName || this.getModel() || 'gemini-3.8-flash';
    const fallbackList = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite'
    ];
    const candidateModels = [primaryModel, ...fallbackList].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError = null;

    for (const targetModel of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95
            }
          })
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          let parsedErr = null;
          try { parsedErr = JSON.parse(errorText); } catch(e) {}
          
          const errReason = parsedErr?.error?.status || `HTTP_${res.status}`;
          const errMsg = parsedErr?.error?.message || errorText || res.statusText;
          lastError = new Error(`Gemini API (${targetModel}) returned ${errReason} (${res.status}): ${errMsg}`);
          console.warn(`[geminiService] Model ${targetModel} failed:`, errMsg);
          continue;
        }

        this.lastApiError = null;
        const data = await res.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          throw new Error('Empty response payload from Gemini API.');
        }

        const sanitized = this.cleanJsonResponse(rawContent);
        return JSON.parse(sanitized);
      } catch (err) {
        lastError = err;
        console.warn(`[geminiService] Model ${targetModel} attempt error:`, err.message);
      }
    }

    this.lastApiError = { status: 500, reason: 'QUERY_FAILED', message: lastError?.message || 'All models failed' };
    throw lastError || new Error('All Gemini candidate models failed to generate a response.');
  },

  // --- 1. DYNAMIC DESTINY PORTALS GENERATOR BASED ON HERO CALIBRATION ---
  async generateDynamicPortals(heroState) {
    const isSandwich = (heroState.familyRemittance || 0) > 0 || heroState.familySafetyNet === 'SandwichGen';
    const baseInc = heroState.income || 45000;
    const baseSav = heroState.savings || 120000;
    const desire = heroState.desireVector || 'DollarClients';
    const aiTier = heroState.aiLeverage || 'AiAugmented';
    const isAuth = this.isAiAuthorized();
    const locShort = (heroState.location || 'Metro Manila').split(' ')[0];

    // Tailored heuristic defaults based on calibrated hero
    let portals = [
      {
        id: 'tech',
        portalTag: 'PORTAL 01 // ASYMMETRIC LEAP',
        badge: isAuth ? 'RECOMMENDED LEAP' : 'STANDARD LEAP',
        targetProfile: `${heroState.age || 26}-${(heroState.age || 26) + 8} YRS // ${locShort} TO US/EU CLIENTS`,
        title: desire === 'OwnBusiness' ? 'BOOTSTRAP AI TECH STUDIO' : (desire === 'DollarClients' ? 'HIGH-TICKET US RETAINER PIPELINE' : 'SHIFT TO IT & CYBER CONSULTING'),
        wealthGrowth: `+${Math.round(160 + (aiTier === 'Architect10x' ? 80 : 20))}% (₱${((baseInc * 5.2 * 12 * 0.05 + baseSav * 2.5) / 1000000).toFixed(2)}M)`,
        taxCode: 'BIR 8% Flat Gross Shield',
        commute: 'Zero EDSA (Async Remote)',
        multiplier: `${aiTier === 'Architect10x' ? '10x' : '3x'} LLM Prompt Moat`,
        buffs: ['BUFF: USD ARBITRAGE', 'BUFF: 8% TAX SHIELD'],
        wealthScore: Math.min(98, 85 + (aiTier === 'Architect10x' ? 10 : 5)),
        autonomyScore: 92,
        stressReduction: 74,
        btnLabel: 'STEP INTO TECH PORTAL →',
        theme: 'cyan'
      },
      {
        id: 'nomad',
        portalTag: 'PORTAL 02 // SANCTUARY & HEALTH',
        badge: 'MAX PEACE & CLARITY',
        targetProfile: `PROVINCIAL SANCTUARY // SIARGAO & LU`,
        title: 'RELOCATE TO PROVINCE ON WFH',
        wealthGrowth: `+${Math.round(110 + (baseSav > 200000 ? 30 : 10))}% (₱${((baseInc * 3.8 * 12 * 0.05 + baseSav * 2.1) / 1000000).toFixed(2)}M)`,
        taxCode: '-40% Living Cost vs Manila',
        commute: '0.0 hrs (Zero Transit Drain)',
        multiplier: 'Starlink + LiFePO4 Station',
        buffs: ['BUFF: 0 HRS EDSA TRAFFIC', 'BUFF: +65% CLARITY'],
        wealthScore: 84,
        autonomyScore: 96,
        stressReduction: 98,
        btnLabel: 'STEP INTO NOMAD PORTAL →',
        theme: 'emerald'
      },
      {
        id: 'custom',
        portalTag: 'PORTAL 03 // VOID OF FATES',
        badge: isAuth ? (heroState.customDesire ? 'CUSTOM AI' : 'GEMINI AI LIVE') : (heroState.customDesire ? 'CUSTOM DESIRE' : 'GUEST ENGINE'),
        targetProfile: heroState.customDesire ? `CUSTOM BESPOKE DREAM` : `WHAT-IF BESPOKE ENGINE // ${locShort}`,
        title: heroState.customDesire ? (heroState.customDesire.length > 34 ? heroState.customDesire.slice(0, 31).trim() + '...' : heroState.customDesire).toUpperCase() : (desire === 'FamilyHome' ? 'PAG-IBIG MP2 FIRE RETIREMENT' : (desire === 'OwnBusiness' ? 'FOUNDER MICRO-AGENCY LAB' : 'SPEAK CUSTOM DESIRE')),
        wealthGrowth: isAuth ? `+220% (DYNAMIC AI)` : `+190% (CALCULATED)`,
        taxCode: isAuth ? 'Live Gemini Simulation' : 'Standard Fiscal Matrix',
        commute: 'Tailored to Pathway',
        multiplier: 'Hero Character Baseline',
        buffs: ['INFINITE TIMELINES', 'DYNAMIC PH CURVEBALLS'],
        wealthScore: 94,
        autonomyScore: 95,
        stressReduction: 85,
        btnLabel: isAuth ? (heroState.customDesire ? 'STEP INTO CUSTOM PORTAL →' : 'WHISPER DESIRE TO AI →') : 'SIMULATE PATHWAY →',
        theme: 'purple'
      }
    ];

    // ONLY execute Gemini LLM Generation if User is Logged In with Google
    if (isAuth) {
      const apiKey = this.getApiKey();
      const activeModel = this.getModel();

    if (apiKey) {
      const prompt = `Act as LifeSim.ai Multiverse Portal Generator for the Philippines.
Analyze this Hero Character Calibration Sheet:
- Class: ${heroState.className} (Age: ${heroState.age}, Zone: ${heroState.location})
- Income: ₱${(heroState.income || 45000).toLocaleString()}/mo | Cash Savings: ₱${(heroState.savings || 120000).toLocaleString()}
- Remittance: ₱${(heroState.familyRemittance || 0).toLocaleString()}/mo (${isSandwich ? 'Sandwich Gen' : 'None'})
- Commute: ${heroState.commuteHours} hrs/day (${heroState.workSetup})
- Debt: ₱${(heroState.debtPayment || 0).toLocaleString()}/mo (${heroState.debtType}) | HMO: ${heroState.hmoShield}
- AI Leverage: ${heroState.aiLeverage} | Social Net: ${heroState.socialCapital} | Learning: ${heroState.learningVelocity}
- North Star Desire: ${heroState.customDesire ? `[USER CUSTOM DESIRE]: "${heroState.customDesire}"` : heroState.desireVector}

Generate 3 deeply personalized, realistic Philippine Destiny Portals for this specific hero:
1. Portal 1 (High-Income Leap tailored to their AI leverage & desire)
2. Portal 2 (Lifestyle & Cost Optimization tailored to their family situation)
3. Portal 3 (Strategic Wildcard or Venture tailored strictly to their custom dream: "${heroState.customDesire || heroState.desireVector}")

Return ONLY a strictly valid JSON object matching this schema without markdown fences:
{
  "portals": [
    {
      "id": "tech",
      "portalTag": "PORTAL 01 // ASYMMETRIC LEAP",
      "badge": "RECOMMENDED LEAP",
      "targetProfile": "Age // Target Market",
      "title": "Short Punchy Title (max 4 words)",
      "wealthGrowth": "+180% (₱3.85M)",
      "taxCode": "BIR 8% Flat Gross Shield",
      "commute": "Zero EDSA (Async Remote)",
      "multiplier": "LLM Multiplier note",
      "buffs": ["BUFF: ...", "BUFF: ..."],
      "wealthScore": 95,
      "autonomyScore": 90,
      "stressReduction": 75,
      "btnLabel": "STEP INTO PORTAL →",
      "theme": "cyan"
    },
    {
      "id": "nomad",
      "portalTag": "PORTAL 02 // SANCTUARY",
      "badge": "MAX PEACE & CLARITY",
      "targetProfile": "Location // Setup",
      "title": "Short Punchy Title",
      "wealthGrowth": "+120% (₱3.40M)",
      "taxCode": "-40% Living Cost",
      "commute": "0.0 hrs Transit",
      "multiplier": "Infra note",
      "buffs": ["BUFF: ...", "BUFF: ..."],
      "wealthScore": 84,
      "autonomyScore": 96,
      "stressReduction": 98,
      "btnLabel": "STEP INTO PORTAL →",
      "theme": "emerald"
    },
    {
      "id": "custom",
      "portalTag": "PORTAL 03 // VOID OF FATES",
      "badge": "GEMINI AI LIVE",
      "targetProfile": "Focus Area",
      "title": "Short Punchy Title",
      "wealthGrowth": "+220% (AI DYNAMIC)",
      "taxCode": "Live Gemini Synthesis",
      "commute": "Async WFH",
      "multiplier": "Hero Baseline",
      "buffs": ["INFINITE TIMELINES", "DYNAMIC CURVEBALLS"],
      "wealthScore": 92,
      "autonomyScore": 94,
      "stressReduction": 86,
      "btnLabel": "WHISPER DESIRE TO AI →",
      "theme": "purple"
    }
  ]
}`;

      try {
        const parsed = await this.queryModel(prompt, activeModel);
        if (parsed && Array.isArray(parsed.portals) && parsed.portals.length === 3) {
          portals = parsed.portals;
        }
      } catch (err) {
        console.warn("[geminiService] Dynamic Portal generation query failed, using calibrated heuristics:", err);
      }
    }
  }

    return portals;
  },

  // --- 2. Generate Full 5-Year Live Timeline Simulation (2026-2030) ---
  async generateTimelineSimulation(heroState, scenarioKey, customPrompt = '') {
    const pathwayNames = {
      tech: 'Shift to High-Income IT, Cloud & Cybersecurity Consulting',
      nomad: 'Relocate to Coastal Province on 100% Asynchronous WFH',
      corp: 'Launch an Independent High-Leverage Philippine Business Venture',
      custom: customPrompt || heroState.customDesire || 'Custom Strategic Multiverse Pathway'
    };

    const chosenPathway = customPrompt || (scenarioKey === 'custom' ? heroState.customDesire : null) || pathwayNames[scenarioKey] || heroState.customDesire || 'Bespoke Multiverse Pathway';
    const isAuth = this.isAiAuthorized();

    // ONLY query Live Gemini AI if user is authenticated with Google/Gmail!
    if (isAuth) {
      const apiKey = this.getApiKey();
      const primaryModel = this.getModel();

      if (apiKey) {
        const prompt = `You are LifeSim.ai's Multiverse Simulation Engine for the Philippines.
Perform an in-depth, realistic 5-year simulation (2026 to 2030) strictly tailored to this specific Filipino hero:
- Class / Background: ${heroState.className} (Age: ${heroState.age}, Zone: ${heroState.location})
- Current Work Setup: ${heroState.workSetup} with ${heroState.commuteHours} hours daily transit
- Base Salary: ₱${(heroState.income || 45000).toLocaleString()}/month
- Liquid Savings: ₱${(heroState.savings || 120000).toLocaleString()}
- Starting Line / Family Safety Net: ${heroState.familySafetyNet}
- Monthly Family Support / Remittance (Sandwich Gen): ₱${(heroState.familyRemittance || 0).toLocaleString()}/month
- Debt Payment: ₱${(heroState.debtPayment || 0).toLocaleString()}/month (${heroState.debtType})
- Health Shield (HMO): ${heroState.hmoShield}
- The Equalizers: AI Leverage = ${heroState.aiLeverage}, Social Capital = ${heroState.socialCapital}, Learning Velocity = ${heroState.learningVelocity}
- Core Desire: ${heroState.customDesire ? `"${heroState.customDesire}"` : heroState.desireVector} (Combat Stance: ${heroState.riskStance})
- Chosen Portal Pathway: "${chosenPathway}"

CRITICAL INSTRUCTIONS:
1. STRICT ADHERENCE TO INTENT: If the hero wants to stop working, take a break, take a 5-year sabbatical, retire, study full-time, or pause work (e.g. "${chosenPathway}"), monthlyIncome MUST BE 0 (or strictly as indicated). Do NOT project active salary growth if they explicitly chose not to work!
2. REALISTIC DRAWDOWN: If monthlyIncome is 0, cumulativeSavings MUST deplete each year by (monthlyExpenses * 12). If funds hit 0 or negative, reflect realistic financial strain in the later years while keeping stress low in the early rest years.
3. CUSTOM DESIRE ADAPTIVITY: Tailor phases, narratives, curveballs, and quests strictly to their specific pathway: "${chosenPathway}".

Return ONLY a strictly valid JSON object matching this schema without markdown formatting or code fences:
{
  "scenarioName": "${chosenPathway}",
  "overallStrategicThesis": "Detailed 2-paragraph strategic thesis analyzing their choice...",
  "years": {
    "2026": {
      "phase": "Phase 1 Title",
      "monthlyIncome": 0,
      "cumulativeSavings": 100000,
      "monthlyExpenses": 25000,
      "stress": 20,
      "freeHours": 55,
      "wealthScore": 60,
      "mindScore": 65,
      "freedomScore": 55,
      "sovereigntyScore": 60,
      "healthScore": 75,
      "narrative": "Detailed narrative for 2026...",
      "curveball": {
        "tag": "[2026 ADAPTATION EVENT]",
        "title": "Specific Event Title",
        "desc": "Event description...",
        "mitigation1": "Hardware or fiscal mitigation...",
        "mitigation2": "Compliance or tactical ward..."
      }
    },
    "2027": {
      "phase": "Phase 2 Title",
      "monthlyIncome": 85000,
      "cumulativeSavings": 520000,
      "monthlyExpenses": 38000,
      "stress": 50,
      "freeHours": 22,
      "wealthScore": 75,
      "mindScore": 72,
      "freedomScore": 70,
      "sovereigntyScore": 72,
      "healthScore": 78,
      "narrative": "Detailed narrative for 2027...",
      "curveball": {
        "tag": "[2027 CURVEBALL EVENT DETECTED]",
        "title": "Typhoon Power Grid Outage + BIR Form 1701A Audit Trigger",
        "desc": "Simulation predicts storm disruption and gross receipts verification for self-employed digital tech workers.",
        "mitigation1": "Starlink + LiFePO4 battery station funded from setup stipend.",
        "mitigation2": "Automated BIR 8% flat-rate quarterly ledger booked with SSS WISP Plus."
      }
    },
    "2028": {
      "phase": "Phase 3 Title",
      "monthlyIncome": 145000,
      "cumulativeSavings": 1450000,
      "monthlyExpenses": 45000,
      "stress": 35,
      "freeHours": 26,
      "wealthScore": 88,
      "mindScore": 82,
      "freedomScore": 84,
      "sovereigntyScore": 82,
      "healthScore": 80,
      "narrative": "Detailed narrative for 2028...",
      "curveball": {
        "tag": "[2028 CROSSOVER EVENT]",
        "title": "US Client Pipeline Expansion",
        "desc": "High retention rate unlocks permanent monthly retainers.",
        "mitigation1": "Automated client invoicing with escrow protection.",
        "mitigation2": "Pag-IBIG MP2 dividend compounding locked."
      }
    },
    "2029": {
      "phase": "Phase 4 Title",
      "monthlyIncome": 195000,
      "cumulativeSavings": 2550000,
      "monthlyExpenses": 52000,
      "stress": 26,
      "freeHours": 30,
      "wealthScore": 94,
      "mindScore": 88,
      "freedomScore": 90,
      "sovereigntyScore": 88,
      "healthScore": 82,
      "narrative": "Detailed narrative for 2029...",
      "curveball": { "tag": "...", "title": "...", "desc": "...", "mitigation1": "...", "mitigation2": "..." }
    },
    "2030": {
      "phase": "Phase 5 Title",
      "monthlyIncome": 255000,
      "cumulativeSavings": 3950000,
      "monthlyExpenses": 60000,
      "stress": 20,
      "freeHours": 35,
      "wealthScore": 98,
      "mindScore": 94,
      "freedomScore": 96,
      "sovereigntyScore": 94,
      "healthScore": 85,
      "narrative": "Detailed narrative for 2030...",
      "curveball": { "tag": "...", "title": "...", "desc": "...", "mitigation1": "...", "mitigation2": "..." }
    }
  },
  "quests": {
    "treasury": [
      { "id": "q1", "text": "Seed ₱120k Emergency Buffer into Digital High-Yield Bank (6.5% p.a.)" },
      { "id": "q2", "text": "Initiate Pag-IBIG MP2 Government Dividend Compounding (Target ₱500k by 2028)" }
    ],
    "skills": [
      { "id": "q3", "text": "Integrate Generative AI LLM Agents into proposal & sprint automation workflows" },
      { "id": "q4", "text": "Acquire Arcane Cloud & Cybersecurity Practitioner Certification" }
    ],
    "bureaucracy": [
      { "id": "q5", "text": "Register with BIR Form 1901 under 8% Gross Flat Rate Income Tax Regime" },
      { "id": "q6", "text": "Automate Quarterly 1701Q Tax Declarations to prevent audit curveballs" }
    ],
    "mana": [
      { "id": "q7", "text": "Eliminate daily commute by enforcing asynchronous WFH contract terms" },
      { "id": "q8", "text": "Lock Comprehensive Family HMO Shield with ₱200,000 MBL Coverage" }
    ]
  }
}`;

      try {
        const aiData = await this.queryModel(prompt, primaryModel);
        if (aiData && aiData.years && aiData.years['2026']) {
          return aiData;
        }
      } catch (err) {
        console.warn(`[geminiService] Primary model (${primaryModel}) failed:`, err);
        const fallbacks = [
          'gemini-3.8-flash',
          'gemini-3.7-flash',
          'gemini-3.6-flash',
          'gemini-3.5-flash',
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite'
        ].filter(m => m !== primaryModel);
        for (const fbModel of fallbacks) {
          try {
            const fbData = await this.queryModel(prompt, fbModel);
            if (fbData && fbData.years && fbData.years['2026']) {
              return fbData;
            }
          } catch (fbErr) {
            console.warn(`[geminiService] Fallback model (${fbModel}) failed:`, fbErr);
          }
        }
      }
    }
  }

  // Algorithmic offline calculation fallback
  console.info('[geminiService] Generating algorithmic calculated simulation.');
  return this.buildCalculatedSimulation(heroState, chosenPathway, scenarioKey);
},

  // --- 3. Character Sheet Deep AI Diagnostic & Desire Synthesizer ---
  async analyzeHeroSheet(heroState) {
    const isSandwich = (heroState.familyRemittance || 0) > 0 || heroState.familySafetyNet === 'SandwichGen';
    const annualCommuteSaved = Math.round((heroState.commuteHours || 0) * 5 * 48);

    let diagnostic = `Diagnosis for ${heroState.className} in ${heroState.location}: ${
      isSandwich 
        ? `You face a ₱${(heroState.familyRemittance || 0).toLocaleString()}/mo family remittance obligation, but your ${heroState.aiLeverage} skill leverage provides the asymmetric output needed to break the sandwich generation ceiling.`
        : `With a solid safety runway of ₱${(heroState.savings || 120000).toLocaleString()}, you have the financial bandwidth to take calculated career leaps without endangering daily survival.`
    } ${heroState.commuteHours > 1.5 ? `Eliminating your ${heroState.commuteHours}h daily commute will unlock ~${annualCommuteSaved} hours/year for high-income skill compounding.` : ''}`;

    let primaryDesire = `Transition from ${heroState.workSetup} in ${heroState.location} to a high-leverage remote consultancy utilizing ${heroState.aiLeverage} Generative AI workflows, scaling income from ₱${(heroState.income || 45000).toLocaleString()}/mo to ₱${Math.round((heroState.income || 45000) * 2.8).toLocaleString()}/mo while sustaining ₱${(heroState.familyRemittance || 0).toLocaleString()}/mo family remittance.`;

    let pathways = [
      {
        title: "🚀 Asymmetric AI Agency",
        desire: `Launch a high-ticket AI automation & web development agency targeting foreign USD retainers ($2,500-$4,000/mo) using ₱${Math.round((heroState.savings || 120000) * 0.5).toLocaleString()} safety capital buffer.`
      },
      {
        title: "🌴 Sovereign Provincial WFH",
        desire: `Relocate from ${heroState.location} to a coastal hub (Siargao/La Union) with 100% remote asynchronous clients, slashing living expenses by 35% and saving ${heroState.commuteHours > 0 ? heroState.commuteHours : 2}h daily transit.`
      },
      {
        title: "🛡️ Sandwich Breaker & MP2",
        desire: `Maintain steady employment while channeling 40% surplus into Pag-IBIG MP2 and high-yield digital banks to fully pay off ₱${(heroState.debtPayment || 0).toLocaleString()}/mo debt and fund parents' HMO shield.`
      }
    ];

    const isAuth = this.isAiAuthorized();
    const apiKey = this.getApiKey();
    const activeModel = this.getModel();

    if (isAuth && apiKey) {
      const prompt = `Act as an expert Philippine Career & Financial Multiverse AI Engine.
Analyze this Hero Character Sheet:
- Class Archetype: ${heroState.className} (Age: ${heroState.age})
- Location: ${heroState.location} | Work Setup: ${heroState.workSetup} (Commute: ${heroState.commuteHours} hrs/day)
- Income: ₱${(heroState.income || 45000).toLocaleString()}/mo | Liquid Savings: ₱${(heroState.savings || 120000).toLocaleString()}
- Starting Line / Family Safety Net: ${heroState.familySafetyNet} (Family Remittance: ₱${(heroState.familyRemittance || 0).toLocaleString()}/mo)
- Debt Burden: ₱${(heroState.debtPayment || 0).toLocaleString()}/mo (${heroState.debtType}) | Health Shield: ${heroState.hmoShield}
- The Equalizers: AI Leverage = ${heroState.aiLeverage}, Social Capital = ${heroState.socialCapital}, Learning Velocity = ${heroState.learningVelocity}
- Target Dream: ${heroState.desireVector} | Combat Stance: ${heroState.riskStance}

Based on this Hero's starting line gap, sandwich generation drag, and AI speed equalizers, return a strictly valid JSON object with this exact schema:
{
  "diagnostic": "2-sentence strategic diagnosis of their biggest bottleneck and equalizing superpower.",
  "primaryDesire": "1-2 sentence compelling desire statement ready to be simulated for 2026-2030 in the Philippines.",
  "pathways": [
    { "title": "Option 1 Title with emoji", "desire": "Full 1-sentence prompt for option 1" },
    { "title": "Option 2 Title with emoji", "desire": "Full 1-sentence prompt for option 2" },
    { "title": "Option 3 Title with emoji", "desire": "Full 1-sentence prompt for option 3" }
  ]
}
Return ONLY the raw JSON object, without markdown formatting.`;

      try {
        const parsed = await this.queryModel(prompt, activeModel);
        if (parsed.diagnostic) diagnostic = parsed.diagnostic;
        if (parsed.primaryDesire) primaryDesire = parsed.primaryDesire;
        if (Array.isArray(parsed.pathways) && parsed.pathways.length > 0) pathways = parsed.pathways;
      } catch (err) {
        console.warn("[geminiService] Character Sheet analysis query failed, using heuristic synthesizer:", err);
      }
    }

    return {
      diagnostic,
      primaryDesire,
      pathways
    };
  },

  // --- 4. Semantic Algorithmic Simulation Engine (Offline & Intelligent Fallback) ---
  buildCalculatedSimulation(heroState, chosenPathway, scenarioKey) {
    const baseIncome = heroState.income || 45000;
    const startingSavings = heroState.savings || 120000;
    const debtPayment = heroState.debtPayment || 0;
    const familyRemittance = heroState.familyRemittance || 0;
    const isSandwich = familyRemittance > 0 || heroState.familySafetyNet === 'SandwichGen';
    const pathwayLower = (chosenPathway || '').toLowerCase();

    // 1. Semantic Intent Detection
    const isSabbatical = /stop\s*work|take\s*a\s*break|break\s*for|sabbatical|quit\s*job|retire|no\s*work|unemployed|pause|vacation|tambay|gap\s*year|chill|sleep|rest\s*for|hiatus|stop\s*earning/i.test(pathwayLower);
    const isPhysicalBusiness = /cafe|coffee|matcha|restaurant|food|bar|shop|store|poblacion|bakery|laundry|franchise/i.test(pathwayLower);
    const isNomad = /siargao|elyu|la\s*union|province|palawan|beach|bukidnon|cebu|davao|coastal|nomad/i.test(pathwayLower) || scenarioKey === 'nomad';

    const years = [2026, 2027, 2028, 2029, 2030];
    const simYears = {};
    let currentSavings = startingSavings;

    // === CASE A: SABBATICAL / 5-YEAR CAREER BREAK / STOP WORKING ===
    if (isSabbatical) {
      const loc = heroState.location || 'Metro Manila (NCR)';
      const livingCostPerMonth = loc.includes('Metro Manila') ? 22000 : 16000;
      const totalMonthlyBurn = livingCostPerMonth + familyRemittance + debtPayment;

      years.forEach((yr, idx) => {
        const yearsPassed = idx;
        const monthlyIncome = 0; // Strictly 0 active salary
        const annualBurn = totalMonthlyBurn * 12;
        currentSavings -= annualBurn;

        // Stress is very low during initial break, rises if funds run out
        let stress = Math.min(90, Math.max(12, Math.round(16 + (currentSavings < 30000 ? (30000 - currentSavings) / 4000 : 0))));
        let freeHours = 58; // Discretionary free time is maximized

        const wealthScore = Math.max(5, Math.min(95, Math.round((Math.max(0, currentSavings) / Math.max(1, startingSavings)) * 40)));
        const mindScore = Math.max(25, Math.min(98, Math.round(95 - (currentSavings < 0 ? 35 : 0))));
        const freedomScore = Math.max(30, Math.min(99, Math.round(98 - (currentSavings < 0 ? 45 : yearsPassed * 4))));
        const sovereigntyScore = Math.max(20, Math.min(90, Math.round(75 - yearsPassed * 6)));
        const healthScore = Math.min(98, 86 + (yearsPassed * 2));

        const phases = [
          `Phase 1: Resignation & Deep Decompression`,
          `Phase 2: Full Sabbatical & Restorative Healing`,
          `Phase 3: Mid-Break Equilibrium & Runway Audit`,
          `Phase 4: Cash Buffer Depletion & Survival Management`,
          `Phase 5: 5-Year Break Horizon & Restored Perspective`
        ];

        const narratives = [
          `You officially step down from work to begin your 5-year break. Daily transit drops to 0 hours. You live off your ₱${startingSavings.toLocaleString()} buffer, spending ₱${totalMonthlyBurn.toLocaleString()}/mo on living costs and ₱${familyRemittance.toLocaleString()}/mo family remittance.`,
          `Deep restorative rest achieved. Sleep quality rebounds to 100% and mental exhaustion disappears. Annual outflow of ₱${annualBurn.toLocaleString()} reduces cash reserves to ₱${Math.max(0, currentSavings).toLocaleString()}.`,
          `Year 3 of work hiatus. You explore creative arts, reading, and personal recovery. Remittance payments of ₱${familyRemittance.toLocaleString()}/mo remain your continuous family obligation.`,
          currentSavings < 0 
            ? `Runway alert: Liquid reserves have depleted into a ₱${Math.abs(currentSavings).toLocaleString()} deficit. You navigate essential expenses through extreme frugality or drawing upon family safety nets.` 
            : `Frugal living sustained. Remaining cash reserves stand at ₱${currentSavings.toLocaleString()}. You enjoy calm days with zero corporate stress while keeping expenses audited.`,
          `5-year sabbatical successfully completed! You have completely cured corporate burnout and re-enter 2031 with full autonomy, restored vitality, and deep self-knowledge.`
        ];

        const curveballs = [
          {
            tag: '[2026 ADAPTATION EVENT]',
            title: 'Decompression Withdrawal & Peer Pressure',
            desc: 'Colleagues question your decision to step down. Recruiters reach out, testing your determination to rest.',
            mitigation1: 'Strict digital detox: mute work platforms and establish peaceful offline daily habits.',
            mitigation2: 'Maintain fixed monthly cash withdrawal caps on digital bank accounts.'
          },
          {
            tag: '[2027 FISCAL DRAIN WARNING]',
            title: 'Inflation on Basic Living & Utilities',
            desc: `Food and utility rates rise +5.5% in ${heroState.location}, increasing your non-earning burn rate.`,
            mitigation1: 'Bulk local palengke purchasing to keep monthly grocery expenses disciplined.',
            mitigation2: 'Park remaining savings in digital high-yield accounts (Maya/Seabank 6% p.a.) for passive cash yield.'
          },
          {
            tag: '[2028 BUFFER AUDIT]',
            title: 'Unexpected Home / Family Expense',
            desc: 'A family appliance repair or dental need demands ₱18,000 outflow with zero incoming salary.',
            mitigation1: 'Pre-allocated emergency sub-wallet absorbs the outflow without panic.',
            mitigation2: 'Maintain active voluntary PhilHealth contributions to prevent hospitalization drain.'
          },
          {
            tag: '[2029 RUNWAY INFLECTION]',
            title: 'Liquid Buffer Depletion Threshold',
            desc: 'Cash reserves reach the critical threshold after 48 months of zero active salary.',
            mitigation1: 'Monetize zero-effort micro-advising (5 hours/month) or hobby crafts to bridge remittance gap.',
            mitigation2: 'Restructure household budget with family members to share utility loads.'
          },
          {
            tag: '[2030 RE-ENTRY MILESTONE]',
            title: 'Mind Clarity & Next Era Synthesis',
            desc: '5 years of burnout-free living yields profound mental peace. You prepare your next chapter on your own terms.',
            mitigation1: 'Use modern AI workflows to quickly bridge skill gaps in 30 days without starting from scratch.',
            mitigation2: 'Launch a high-ticket async niche consultancy preserving your 4-day rest week and zero EDSA commutes.'
          }
        ];

        simYears[yr.toString()] = {
          phase: phases[idx],
          monthlyIncome: monthlyIncome,
          cumulativeSavings: currentSavings,
          monthlyExpenses: totalMonthlyBurn,
          stress: stress,
          freeHours: freeHours,
          wealthScore: wealthScore,
          mindScore: mindScore,
          freedomScore: freedomScore,
          sovereigntyScore: sovereigntyScore,
          healthScore: healthScore,
          narrative: narratives[idx],
          curveball: curveballs[idx]
        };
      });

      return {
        scenarioName: chosenPathway,
        overallStrategicThesis: `Taking a deliberate 5-year break from work allows your Mind Score (peaking at 95/100) and Health Score (96/100) to flourish with 0 hours of daily transit. Starting with ₱${startingSavings.toLocaleString()} in liquid cash, your primary challenge is managing the ₱${totalMonthlyBurn.toLocaleString()}/mo total cash burn (including ₱${familyRemittance.toLocaleString()}/mo family remittance) across 60 months of zero active salary.`,
        years: simYears,
        quests: {
          treasury: [
            { id: 'q1', text: `Enforce strict ₱${totalMonthlyBurn.toLocaleString()}/mo total cash burn cap across 5-year sabbatical` },
            { id: 'q2', text: 'Park remaining cash in 6% p.a. digital high-yield accounts to generate passive yield' }
          ],
          mana: [
            { id: 'q3', text: 'Reclaim 8+ hours of uninterrupted sleep nightly and eliminate alarm clock dependency' },
            { id: 'q4', text: 'Establish daily mindfulness, walking, and stress-free creative routines' }
          ],
          bureaucracy: [
            { id: 'q5', text: 'File voluntary non-earning status / minimum tier SSS & PhilHealth to maintain healthcare active' },
            { id: 'q6', text: 'Close dormant business TIN books or pause active BIR 1701Q filings properly' }
          ],
          skills: [
            { id: 'q7', text: 'Pursue low-pressure curiosity learning (philosophy, health, cooking, writing)' },
            { id: 'q8', text: 'Preserve personal professional network via casual coffee catchups without job-hunting stress' }
          ]
        }
      };
    }

    // === CASE B: STANDARD / BUSINESS / HIGH-GROWTH PATHWAYS ===
    let aiMult = heroState.aiLeverage === 'Architect10x' ? 1.50 : (heroState.aiLeverage === 'AiAugmented' ? 1.30 : 1.0);
    let socialMult = heroState.socialCapital === 'GlobalNetwork' ? 1.35 : (heroState.socialCapital === 'CommunityPeer' ? 1.15 : 1.0);
    let learnMult = heroState.learningVelocity === 'HyperAdaptive' ? 1.20 : 1.0;
    const equalizerFactor = aiMult * socialMult * learnMult;

    const pathMultipliers = {
      tech: [1.10, 1.85, 2.75, 3.80, 4.60],
      nomad: [1.05, 1.45, 2.10, 2.90, 3.60],
      corp: [0.80, 1.60, 2.60, 3.90, 5.00],
      custom: isPhysicalBusiness ? [0.60, 1.20, 2.20, 3.40, 4.80] : [1.00, 1.65, 2.50, 3.60, 4.70]
    };

    const mults = pathMultipliers[scenarioKey] || pathMultipliers.custom;

    years.forEach((yr, idx) => {
      const yearsPassed = idx;
      const compoundGrowth = Math.pow(equalizerFactor, yearsPassed * 0.35);
      const monthlyIncome = Math.round(baseIncome * mults[idx] * compoundGrowth);
      
      const expenseRatio = isNomad ? 0.42 : 0.58;
      const baseLiving = Math.round(monthlyIncome * expenseRatio);
      const annualDebt = (yr <= 2027) ? debtPayment * 12 : 0;
      const annualRemittance = familyRemittance * 12;
      const annualEarned = monthlyIncome * 12;
      const annualLiving = baseLiving * 12;
      
      const annualNet = annualEarned - annualLiving - annualDebt - annualRemittance;
      currentSavings += Math.max(0, annualNet);

      const stressBase = isNomad ? 35 : (isPhysicalBusiness ? 70 : 50);
      const stressRemittance = isSandwich ? 12 : 0;
      const stressRelief = Math.round(yearsPassed * 7 + (heroState.aiLeverage !== 'Traditional' ? 8 : 0));
      const stress = Math.min(95, Math.max(18, stressBase + stressRemittance - stressRelief));

      const freeBase = isNomad ? 34 : (heroState.commuteHours > 0 ? 18 : 25);
      const freeHours = Math.min(48, Math.round(freeBase + ((heroState.commuteHours || 0) * 2.5) + (yearsPassed * 3)));

      const wealthScore = Math.min(99, Math.round(35 + (monthlyIncome / baseIncome) * 15 + yearsPassed * 6));
      const mindScore = Math.min(99, Math.max(20, 100 - stress + 5));
      const freedomScore = Math.min(99, Math.round(30 + yearsPassed * 14 + (isNomad ? 15 : 5)));
      const sovereigntyScore = Math.min(98, Math.round(40 + yearsPassed * 12 + (heroState.aiLeverage === 'Architect10x' ? 12 : 6)));
      const healthScore = heroState.hmoShield === 'Comprehensive' ? 92 : (heroState.hmoShield === 'PhilHealth' ? 60 : 45);

      const phases = [
        `Phase 1: Groundwork & Setup in ${heroState.location}`,
        `Phase 2: Transition & First Revenue Leap (₱${(monthlyIncome/1000).toFixed(0)}k/mo)`,
        `Phase 3: Asymmetric Scaling & Debt Elimination`,
        `Phase 4: Sovereign Retainers & Family Fortress`,
        `Phase 5: Financial Transcendence & Autonomy`
      ];

      const narratives = [
        `Starting from ${heroState.location} as ${heroState.className}. You budget your ₱${(heroState.savings || 120000).toLocaleString()} initial safety net while managing ${isSandwich ? `₱${familyRemittance.toLocaleString()}/mo family support` : 'personal living costs'}.`,
        `Your ${heroState.aiLeverage} skill leverage kicks in. Monthly income expands to ₱${monthlyIncome.toLocaleString()}, and debt burden is systematically crushed.`,
        `The compound momentum of your network and skills takes hold. Living expenses remain disciplined, channeling surplus into Pag-IBIG MP2.`,
        `You operate with full autonomy. Commute fatigue is fully eliminated, securing high-tier retainer clients across global markets.`,
        `Sovereignty achieved. Monthly cashflow hits ₱${monthlyIncome.toLocaleString()}, yielding sustainable dividends and generational freedom for your family.`
      ];

      const curveballs = [
        {
          tag: '[2026 INFRASTRUCTURE EVENT]',
          title: 'Workstation & Hardware Upgrade Required',
          desc: `High-throughput AI and client workloads demand ₱35,000 equipment upgrade in ${heroState.location}. Covered by liquid buffer.`,
          mitigation1: 'Maintain 3 months emergency fund in digital banks (Maya/Seabank).',
          mitigation2: 'Claim IT hardware depreciation under BIR business expense itemization.'
        },
        {
          tag: '[2027 CURVEBALL EVENT DETECTED]',
          title: 'Typhoon Power Grid Outage + BIR Form 1701A Audit Trigger',
          desc: 'Simulation predicts Category 4 storm disruption across Luzon followed by gross receipts verification for self-employed workers.',
          mitigation1: 'Starlink Mini portable dish + 1066Wh LiFePO4 battery station funded from setup stipend.',
          mitigation2: 'Automated BIR 8% flat-rate quarterly ledger booked with SSS WISP Plus voluntary contribution shield.'
        },
        {
          tag: '[2028 CROSSOVER MILESTONE]',
          title: 'Asymmetric Foreign Client Expansion & Rate Leap',
          desc: 'Global client retention solidifies, allowing renegotiation to $3,500/mo retainer without increasing hours worked.',
          mitigation1: 'Dual foreign currency accounts (Wise/Payoneer) hedging against Peso spot volatility.',
          mitigation2: 'Pag-IBIG MP2 maximum compounding tier locked for early dividend harvest.'
        },
        {
          tag: '[2029 SOVEREIGN EXPANSION]',
          title: 'Micro-Agency Subcontracting & Team Delegation',
          desc: 'Workload scales beyond individual hours, hiring 2 junior Philippine devs to handle execution while you manage architecture.',
          mitigation1: 'Standardized SOPs and LLM prompt templates maintaining 99% QA output.',
          mitigation2: 'Private HMO health armor expanded to cover junior subcontractors.'
        },
        {
          tag: '[2030 FREEDOM SYNCHRONIZATION]',
          title: 'Generational Wealth & Debt Immunity Achieved',
          desc: 'Net worth surpasses ₱3.8M, generating ₱25,000/month in passive government dividends covering all family baseline needs.',
          mitigation1: 'Perpetual estate planning and multi-asset diversification active.',
          mitigation2: 'Zero debt encumbrance with 100% career sovereignty.'
        }
      ];

      simYears[yr.toString()] = {
        phase: phases[idx],
        monthlyIncome: monthlyIncome,
        cumulativeSavings: currentSavings,
        monthlyExpenses: baseLiving,
        stress: stress,
        freeHours: freeHours,
        wealthScore: wealthScore,
        mindScore: mindScore,
        freedomScore: freedomScore,
        sovereigntyScore: sovereigntyScore,
        healthScore: healthScore,
        narrative: narratives[idx],
        curveball: curveballs[idx]
      };
    });

    const quests = {
      treasury: [
        { id: 'q1', text: `Seed ₱${Math.round((heroState.savings || 120000) * 0.4).toLocaleString()} Emergency Buffer into High-Yield Digital Bank (6.5% p.a.)` },
        { id: 'q2', text: 'Initiate Pag-IBIG MP2 Government Dividend Compounding (Target ₱500k by 2028)' }
      ],
      skills: [
        { id: 'q3', text: `Integrate ${heroState.aiLeverage} Generative AI LLM Agents into client proposal & execution workflows` },
        { id: 'q4', text: 'Acquire Arcane Cloud & Cybersecurity Practitioner Certification for foreign client trust' }
      ],
      bureaucracy: [
        { id: 'q5', text: 'Register with BIR Form 1901 under 8% Gross Flat Rate Income Tax Regime' },
        { id: 'q6', text: 'Automate Quarterly 1701Q Tax Declarations to eliminate audit curveballs' }
      ],
      mana: [
        { id: 'q7', text: `Eliminate daily ${heroState.commuteHours}h commute by enforcing asynchronous remote contract terms` },
        { id: 'q8', text: `Lock ${heroState.hmoShield} Family HMO Shield with ₱200,000 MBL Coverage for elders` }
      ]
    };

    return {
      scenarioName: chosenPathway,
      overallStrategicThesis: `Starting from ${heroState.location} with ₱${(heroState.savings || 120000).toLocaleString()} in liquid cash, your greatest lever is leveraging ${heroState.aiLeverage} AI speed while insulating your family with disciplined 8% BIR tax shields.`,
      years: simYears,
      quests: quests
    };
  }
};