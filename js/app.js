// =========================================================================
// LIFESIM.AI - PHILIPPINE MULTIVERSE ENGINE (V2.4_PH)
// CORE CONTROLLER: AUTH (GOOGLE VS GUEST), SOUND SYNTHESIS, TELEMETRY & AI
// =========================================================================

// --- 1. ZERO-DEPENDENCY 8-BIT RETRO SOUND SYNTHESIZER (Web Audio API) ---
class RetroSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    const icon = document.getElementById('soundIcon');
    const footerStatus = document.getElementById('footerSfxStatus');
    if (this.enabled) {
      if (icon) icon.className = "fa-solid fa-volume-high text-rpg-emerald";
      if (footerStatus) {
        footerStatus.className = "text-rpg-emerald font-bold";
        footerStatus.innerText = "SFX: ON";
      }
      this.playPowerup();
    } else {
      if (icon) icon.className = "fa-solid fa-volume-xmark text-slate-500";
      if (footerStatus) {
        footerStatus.className = "text-slate-500 font-bold";
        footerStatus.innerText = "SFX: OFF";
      }
    }
  }

  playTone(freq, type = 'square', duration = 0.08, delay = 0) {
    if (!this.enabled) return;
    try {
      this.initContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  playBlip() {
    this.playTone(440, 'square', 0.04);
  }

  playSelect() {
    this.playTone(330, 'square', 0.04);
    this.playTone(550, 'square', 0.06, 0.04);
  }

  playPowerup() {
    this.playTone(261.63, 'square', 0.05, 0.00);
    this.playTone(329.63, 'square', 0.05, 0.05);
    this.playTone(392.00, 'square', 0.05, 0.10);
    this.playTone(523.25, 'square', 0.12, 0.15);
  }

  playLevelUp() {
    this.playTone(330, 'square', 0.05, 0.00);
    this.playTone(392, 'square', 0.05, 0.05);
    this.playTone(659, 'square', 0.07, 0.10);
    this.playTone(523, 'square', 0.07, 0.15);
    this.playTone(587, 'square', 0.07, 0.20);
    this.playTone(784, 'square', 0.20, 0.25);
  }

  playDoorHum() {
    this.playTone(110, 'sawtooth', 0.35);
    this.playTone(220, 'sine', 0.35, 0.05);
  }
}

const soundEngine = new RetroSoundEngine();

// Unlock Web Audio context on user gesture
const unlockAudio = () => {
  soundEngine.initContext();
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
};
document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

// --- 2. USER AUTHENTICATION STATE (GOOGLE VS GUEST) ---
let currentUser = {
  isLoggedIn: false, // true = Google Verified, false = Guest Hero
  authProvider: 'guest', // 'google' | 'guest'
  displayName: 'Guest Hero',
  email: null,
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LifeSimGuest',
  role: 'GUEST_EXPLORER',
  cloudSync: false,
  maxVaultSlots: 2, // Guest limited to 2; Logged-in has Infinity
  verifiedSealNumber: null
};

// --- 3. HERO STATE & CLASS ARCHETYPES ---
const CLASS_ARCHETYPES = {
  bpo: {
    id: 'bpo',
    className: 'The BPO Night Owl',
    archetypeTitle: 'Corporate Tank',
    baseIncome: 45000,
    baseSavings: 120000,
    age: 26,
    location: 'Metro Manila (NCR)',
    workSetup: 'Hybrid',
    commuteHours: 3.5,
    guild: 'Tech',
    debtType: 'CreditCard',
    debtPayment: 4500,
    hmoShield: 'Comprehensive',
    familySafetyNet: 'SandwichGen',
    familyRemittance: 10000,
    dependents: 2,
    aiLeverage: 'AiAugmented',
    socialCapital: 'CommunityPeer',
    learningVelocity: 'HyperAdaptive',
    desireVector: 'DollarClients',
    riskStance: 'Paladin'
  },
  freelancer: {
    id: 'freelancer',
    className: 'The Hustling Freelancer',
    archetypeTitle: 'Agile Mage',
    baseIncome: 65000,
    baseSavings: 180000,
    age: 28,
    location: 'Metro Manila (NCR)',
    workSetup: 'Remote',
    commuteHours: 0,
    guild: 'Freelance',
    debtType: 'None',
    debtPayment: 0,
    hmoShield: 'Solo',
    familySafetyNet: 'SelfSufficient',
    familyRemittance: 5000,
    dependents: 1,
    aiLeverage: 'AiAugmented',
    socialCapital: 'CommunityPeer',
    learningVelocity: 'HyperAdaptive',
    desireVector: 'ProvincialWFH',
    riskStance: 'Berserker'
  },
  freshgrad: {
    id: 'freshgrad',
    className: 'The Fresh Grad',
    archetypeTitle: 'Novice Explorer',
    baseIncome: 24000,
    baseSavings: 30000,
    age: 22,
    location: 'Metro Manila (NCR)',
    workSetup: 'On-Site',
    commuteHours: 3.0,
    guild: 'Tech',
    debtType: 'None',
    debtPayment: 0,
    hmoShield: 'Solo',
    familySafetyNet: 'SelfSufficient',
    familyRemittance: 3000,
    dependents: 0,
    aiLeverage: 'AiAugmented',
    socialCapital: 'CommunityPeer',
    learningVelocity: 'HyperAdaptive',
    desireVector: 'DollarClients',
    riskStance: 'Guardian'
  },
  custom: {
    id: 'custom',
    className: 'Custom Bespoke Hero',
    archetypeTitle: '100% Bespoke Hero',
    baseIncome: 50000,
    baseSavings: 150000,
    age: 26,
    location: 'Metro Manila (NCR)',
    workSetup: 'Remote',
    commuteHours: 0,
    guild: 'Tech',
    debtType: 'None',
    debtPayment: 0,
    hmoShield: 'Solo',
    familySafetyNet: 'SelfSufficient',
    familyRemittance: 0,
    dependents: 0,
    aiLeverage: 'Architect10x',
    socialCapital: 'GlobalNetwork',
    learningVelocity: 'HyperAdaptive',
    desireVector: 'OwnBusiness',
    riskStance: 'Berserker'
  }
};

let hero = { ...CLASS_ARCHETYPES.bpo };

// --- 4. MULTIVERSE SIMULATION STATE ---
let activeScenarioKey = 'tech';
let currentYear = 2028;
let activeForkIndex = 0;
let completedQuests = new Set();
let financialChart = null;
let activeAiSimulationData = null;
let whatIfVault = [];
let activeWhatIfId = null;
let activeDestinyPortals = [];

// Preset Fork Timelines (Alpha, Beta, Gamma)
const FORK_TIMELINES = [
  {
    id: 'fork_alpha',
    title: '⚡ Shift to High-Income IT & Consulting',
    badge: 'RECOMMENDED LEAP',
    desc: 'BIR 8% Flat Tax / Net +₱145k/mo',
    scenarioKey: 'tech',
    years: {
      '2026': { monthlyIncome: 65000, cumulativeSavings: 320000, stress: 55, freeHours: 12, wealthScore: 70, mindScore: 68, freedomScore: 65, sovereigntyScore: 68, healthScore: 80 },
      '2027': { monthlyIncome: 95000, cumulativeSavings: 840000, stress: 45, freeHours: 16, wealthScore: 80, mindScore: 75, freedomScore: 78, sovereigntyScore: 75, healthScore: 80 },
      '2028': { monthlyIncome: 145000, cumulativeSavings: 1840000, stress: 28, freeHours: 21.5, wealthScore: 92, mindScore: 84, freedomScore: 88, sovereigntyScore: 82, healthScore: 80 },
      '2029': { monthlyIncome: 195000, cumulativeSavings: 2750000, stress: 24, freeHours: 24, wealthScore: 96, mindScore: 88, freedomScore: 92, sovereigntyScore: 88, healthScore: 82 },
      '2030': { monthlyIncome: 245000, cumulativeSavings: 3850000, stress: 20, freeHours: 28, wealthScore: 98, mindScore: 92, freedomScore: 95, sovereigntyScore: 94, healthScore: 85 }
    },
    curveball: {
      year: 2027,
      tag: '[2027 CURVEBALL EVENT DETECTED]',
      title: 'Typhoon Power Grid Outage (Meralco 72h Blackout) + BIR Form 1701A Audit Trigger',
      desc: 'Simulation predicts Category 4 Typhoon disruption across Luzon during Q3 2027, followed by an algorithmic Bureau of Internal Revenue (BIR) gross receipts verification for self-employed digital tech workers.',
      mitigation1: '<strong>Hardware Resilience:</strong> Starlink Mini portable dish + 1066Wh LiFePO4 battery station funded from Q1 2026 setup stipend. Zero downtime with US clients.',
      mitigation2: '<strong>Fiscal Immunity:</strong> Automated BIR 8% flat-rate quarterly ledger booked with SSS WISP Plus voluntary contribution shield. Full tax compliance audit log cleared.'
    }
  },
  {
    id: 'fork_beta',
    title: '🌴 Relocate to Province on Remote WFH',
    badge: 'MAX PEACE & CLARITY',
    desc: 'Starlink + US Retainer / -40% Living Cost',
    scenarioKey: 'nomad',
    years: {
      '2026': { monthlyIncome: 55000, cumulativeSavings: 280000, stress: 40, freeHours: 20, wealthScore: 65, mindScore: 85, freedomScore: 82, sovereigntyScore: 70, healthScore: 82 },
      '2027': { monthlyIncome: 80000, cumulativeSavings: 720000, stress: 32, freeHours: 24, wealthScore: 75, mindScore: 90, freedomScore: 88, sovereigntyScore: 78, healthScore: 85 },
      '2028': { monthlyIncome: 120000, cumulativeSavings: 1540000, stress: 22, freeHours: 28, wealthScore: 85, mindScore: 95, freedomScore: 94, sovereigntyScore: 84, healthScore: 88 },
      '2029': { monthlyIncome: 160000, cumulativeSavings: 2450000, stress: 18, freeHours: 32, wealthScore: 90, mindScore: 96, freedomScore: 96, sovereigntyScore: 88, healthScore: 90 },
      '2030': { monthlyIncome: 200000, cumulativeSavings: 3400000, stress: 15, freeHours: 35, wealthScore: 94, mindScore: 98, freedomScore: 98, sovereigntyScore: 90, healthScore: 92 }
    },
    curveball: {
      year: 2027,
      tag: '[2027 SUBSEA CABLE CUT EVENT]',
      title: 'Island Fiber Cut + Localized Rental Price Inflation in General Luna',
      desc: 'Severe weather damages provincial undersea fiber backbone while beach town rent spikes 25%.',
      mitigation1: '<strong>Dual Satellite WAN:</strong> Secondary Starlink residential dish roaming failover active with local mesh backup.',
      mitigation2: '<strong>Long-Term Lease Ward:</strong> 3-year fixed rental deed locked with local landowner avoiding spot inflation.'
    }
  },
  {
    id: 'fork_gamma',
    title: '✨ Custom Desired Pathway',
    badge: 'CUSTOM DESIRE',
    desc: 'Hero Bespoke Desire Pathway',
    scenarioKey: 'corp',
    years: {
      '2026': { monthlyIncome: 45000, cumulativeSavings: 140000, stress: 82, freeHours: 8, wealthScore: 45, mindScore: 35, freedomScore: 25, sovereigntyScore: 30, healthScore: 60 },
      '2027': { monthlyIncome: 48000, cumulativeSavings: 190000, stress: 86, freeHours: 7, wealthScore: 48, mindScore: 30, freedomScore: 22, sovereigntyScore: 32, healthScore: 55 },
      '2028': { monthlyIncome: 52000, cumulativeSavings: 260000, stress: 90, freeHours: 6, wealthScore: 50, mindScore: 25, freedomScore: 20, sovereigntyScore: 35, healthScore: 50 },
      '2029': { monthlyIncome: 56000, cumulativeSavings: 340000, stress: 92, freeHours: 5, wealthScore: 52, mindScore: 20, freedomScore: 18, sovereigntyScore: 38, healthScore: 45 },
      '2030': { monthlyIncome: 62000, cumulativeSavings: 450000, stress: 95, freeHours: 4, wealthScore: 55, mindScore: 18, freedomScore: 15, sovereigntyScore: 40, healthScore: 40 }
    },
    curveball: {
      year: 2028,
      tag: '[2028 CRITICAL BURNOUT EPISODE]',
      title: 'Severe Hypertension Triggered by Daily EDSA Transit + Sandwich Remittance Surge',
      desc: 'Cumulative sleep deficit from night shifts causes hospitalization right as familial medical dependents increase.',
      mitigation1: '<strong>Emergency Loan Draw:</strong> SSS Salary Loan depleted to cover out-of-pocket medical gap.',
      mitigation2: '<strong>Status Quo Warning:</strong> High economic and biometric fragility. Transition recommended immediately.'
    }
  }
];

// --- 5. TIMELINE ENGINE & CHART.JS CONTROLLER ---
const timelineEngine = {
  setYear(year) {
    currentYear = parseInt(year);
    const slider = document.getElementById('timelineSlider');
    if (slider) slider.value = currentYear;
    soundEngine.playBlip();
    this.updateDashboardMetrics();
  },

  onSliderChange(year) {
    currentYear = parseInt(year);
    soundEngine.playBlip();
    this.updateDashboardMetrics();
  },

  runSimulationPulse() {
    soundEngine.playLevelUp();
    this.updateDashboardMetrics();
    this.initCharts();
  },

  updateDashboardMetrics() {
    const fork = FORK_TIMELINES[activeForkIndex] || FORK_TIMELINES[0];
    if (!fork || !fork.years) return;

    // 1. Sync All 3 Fork Tabs in the DOM
    [0, 1, 2].forEach(i => {
      const f = FORK_TIMELINES[i];
      if (!f) return;
      const tEl = document.getElementById(`forkTitle-${i}`);
      const dEl = document.getElementById(`forkDesc-${i}`);
      const bEl = document.getElementById(`forkBadgeStatus-${i}`);
      const sEl = document.getElementById(`forkStability-${i}`);
      const tab = document.getElementById(`forkTab-${i}`);
      if (tEl) {
        tEl.innerText = f.title;
        tEl.title = f.title;
      }
      if (dEl) {
        dEl.innerText = f.desc;
        dEl.title = f.desc;
      }
      if (bEl) bEl.innerText = i === activeForkIndex ? 'ACTIVE REALITY' : (f.badge || (i === 1 ? 'FORK B' : 'CUSTOM'));
      if (sEl) sEl.innerText = i === activeForkIndex ? '98.4% STABILITY' : (i === 1 ? '78.5% STABILITY' : 'CUSTOM');

      if (tab) {
        if (i === activeForkIndex) {
          tab.className = 'bg-dungeon-900 border-2 border-rpg-gold p-3 shadow-brutal-gold cursor-pointer transition-all';
        } else {
          tab.className = 'bg-dungeon-900 border border-slate-800 hover:border-rpg-mana p-3 shadow-brutal cursor-pointer transition-all';
        }
      }
    });

    const data = fork.years[currentYear.toString()] || fork.years[currentYear] || fork.years['2028'] || fork.years[2028];
    if (!data) return;

    const statusQuoBaseline = Math.round((hero.income || 45000) * Math.pow(1.05, currentYear - 2026));
    const isSabbatical = data.monthlyIncome === 0;
    const growthPercent = !isSabbatical ? (((data.monthlyIncome - statusQuoBaseline) / statusQuoBaseline) * 100).toFixed(0) : 0;
    const monthlyBurn = data.monthlyExpenses || Math.max(25000, (hero.income || 45000) * 0.65);
    const runwayMonths = data.cumulativeSavings > 0 ? (data.cumulativeSavings / monthlyBurn).toFixed(1) : '0.0';

    // Epoch Header
    const epochEl = document.getElementById('currentEpochDisplay');
    if (epochEl) epochEl.innerText = `YEAR ${currentYear}`;

    // Metric 1: Cashflow
    const incEl = document.getElementById('statMonthlyIncome');
    const grwEl = document.getElementById('dashGrowthPct');
    const sqBaseEl = document.getElementById('dashStatusQuoBaseline');
    const incSub = document.getElementById('statMonthlyIncomeSub');

    if (incEl) {
      if (isSabbatical) {
        incEl.innerHTML = `₱0 <span class="text-xs text-amber-400 font-normal">/ mo (REST & SABBATICAL)</span>`;
      } else {
        incEl.innerHTML = `₱${data.monthlyIncome.toLocaleString()} <span class="text-xs text-slate-400 font-normal">/ mo</span>`;
      }
    }

    if (grwEl) {
      if (isSabbatical) {
        grwEl.innerText = `CAREER BREAK (0 SALARY)`;
        grwEl.className = "text-amber-400 font-bold";
      } else {
        grwEl.innerText = growthPercent >= 0 ? `+${growthPercent}% VS STATUS QUO` : `${growthPercent}% VS STATUS QUO`;
        grwEl.className = growthPercent >= 0 ? "text-rpg-emerald font-bold" : "text-rose-400 font-bold";
      }
    }

    if (sqBaseEl) sqBaseEl.innerText = `Status Quo: ₱${statusQuoBaseline.toLocaleString()} / mo`;
    if (incSub) {
      if (isSabbatical) {
        incSub.innerHTML = `<i class="fa-solid fa-bed text-amber-400"></i> <span>Burnout Recovery / 0 EDSA Drag</span>`;
      } else {
        incSub.innerHTML = `<i class="fa-solid fa-shield-halved text-rpg-gold"></i> <span>BIR 8% Flat Tax Shield Active</span>`;
      }
    }

    // Metric 2: Treasury
    const savEl = document.getElementById('statTotalSavings');
    if (savEl) {
      if (data.cumulativeSavings < 0) {
        savEl.innerHTML = `<span class="text-rose-400">-₱${Math.abs(data.cumulativeSavings).toLocaleString()}</span> <span class="text-xs text-rose-400 font-normal">DEFICIT</span>`;
      } else {
        savEl.innerHTML = `₱${data.cumulativeSavings.toLocaleString()} <span class="text-xs text-slate-400 font-normal">PHP</span>`;
      }
    }
    const rnwEl = document.getElementById('dashRunwayBadge');
    if (rnwEl) {
      rnwEl.innerText = `${runwayMonths} MO RUNWAY`;
      rnwEl.className = data.cumulativeSavings < 0 ? 'text-rose-400 font-bold' : (parseFloat(runwayMonths) < 6 ? 'text-amber-400 font-bold' : 'text-rpg-gold font-bold');
    }

    // Metric 3: Strain
    const strEl = document.getElementById('statStressIndex');
    if (strEl) {
      const zoneText = data.stress < 35 ? '[SAFE]' : (data.stress < 70 ? '[MODERATE]' : '[CRITICAL]');
      const zoneColor = data.stress < 35 ? 'text-emerald-400' : (data.stress < 70 ? 'text-amber-400' : 'text-rose-400');
      strEl.innerHTML = `<span class="${zoneColor}">${data.stress} / 100</span> <span class="text-xs font-normal">${zoneText}</span>`;
    }

    // Metric 4: Free Time
    const freeEl = document.getElementById('statFreeHours');
    if (freeEl) freeEl.innerHTML = `+${data.freeHours} <span class="text-xs text-slate-400 font-normal">hrs / wk</span>`;

    // 5-Axis Score Bars
    const scores = [
      { id: '1', val: data.wealthScore || 80 },
      { id: '2', val: data.mindScore || 80 },
      { id: '3', val: data.freedomScore || 80 },
      { id: '4', val: data.sovereigntyScore || 80 },
      { id: '5', val: data.healthScore || 80 }
    ];

    let totalScore = 0;
    scores.forEach(s => {
      totalScore += s.val;
      const vEl = document.getElementById(`scoreVal-${s.id}`);
      const bEl = document.getElementById(`scoreBar-${s.id}`);
      if (vEl) vEl.innerText = `${s.val} / 100`;
      if (bEl) bEl.style.width = `${s.val}%`;
    });

    const avgScore = Math.round(totalScore / scores.length);
    const scoreBadge = document.getElementById('dashScoreBadge');
    if (scoreBadge) scoreBadge.innerText = `SCORE: ${avgScore}/100`;

    // Diagnostic Assessment Text
    const diagText = document.getElementById('dashDiagnosticText');
    const diagTier = document.getElementById('dashAssessmentTier');
    if (diagText) {
      diagText.innerText = data.narrative || fork.overallStrategicThesis || "Strategic pathway calculated to optimize your income velocity, lifestyle autonomy, and financial safety net in the Philippines.";
    }
    if (diagTier) {
      diagTier.innerText = avgScore >= 88 ? 'TIER: S+' : (avgScore >= 76 ? 'TIER: A+' : 'TIER: B+');
    }

    // Chart Active Legend
    const legendEl = document.getElementById('dashChartLegendActive');
    if (legendEl) legendEl.innerText = fork.title.replace(/^[⚡🌴🏢✨]\s*(Portal \d+:\s*|Timeline [Alpha|Beta|Gamma]+:\s*)?/i, '');

    // Crossover Callout
    const crossText = document.getElementById('dashCrossoverText');
    const crossDiff = document.getElementById('dashCrossoverDiff');
    const target2030 = fork.years['2030']?.cumulativeSavings || data.cumulativeSavings;
    const sq2030 = Math.round((hero.income || 45000) * 12 * Math.pow(1.05, 4) * 0.15 + (hero.savings || 120000));
    const diff2030 = target2030 - sq2030;

    if (crossDiff && crossText) {
      if (diff2030 >= 0) {
        crossDiff.innerText = `[+₱${(diff2030 / 1000000).toFixed(2)}M ADVANTAGE]`;
        crossDiff.className = 'text-rpg-gold font-bold';
        crossText.innerText = `Trajectory: ${fork.title.replace(/^[⚡🌴🏢✨]\s*/, '')} outpaces Status Quo by Year 2028.`;
      } else {
        crossDiff.innerText = `[₱${(Math.abs(diff2030) / 1000000).toFixed(2)}M REST BUFFER]`;
        crossDiff.className = 'text-amber-400 font-bold';
        crossText.innerText = `Runway: Frugal living draws upon cash reserves with zero daily EDSA transit drag.`;
      }
    }

    // Execution Summary
    const execSummary = document.getElementById('dashExecutionSummary');
    if (execSummary) {
      execSummary.innerText = `${fork.title.replace(/^[⚡🌴🏢✨]\s*/, '')} is mathematically synchronized for your profile.`;
    }

    // Philippine Hazard Engine Curveball update
    const currentCurveball = (data.curveball) ? data.curveball : (fork.curveball || null);
    if (currentCurveball) {
      const cbTag = document.getElementById('curveballTag');
      const cbTitle = document.getElementById('curveballTitle');
      const cbDesc = document.getElementById('curveballDesc');
      const mit1 = document.getElementById('mitigationPoint1');
      const mit2 = document.getElementById('mitigationPoint2');

      if (cbTag) cbTag.innerText = currentCurveball.tag || `[${currentYear} CURVEBALL EVENT]`;
      if (cbTitle) cbTitle.innerText = currentCurveball.title;
      if (cbDesc) cbDesc.innerText = currentCurveball.desc;
      if (mit1) mit1.innerHTML = currentCurveball.mitigation1 ? (currentCurveball.mitigation1.startsWith('<strong>') ? currentCurveball.mitigation1 : `<strong>Hardware/Action:</strong> ${currentCurveball.mitigation1}`) : '<strong>Mitigation:</strong> Proactive buffer allocated.';
      if (mit2) mit2.innerHTML = currentCurveball.mitigation2 ? (currentCurveball.mitigation2.startsWith('<strong>') ? currentCurveball.mitigation2 : `<strong>Fiscal Ward:</strong> ${currentCurveball.mitigation2}`) : '<strong>Compliance:</strong> Tax & emergency ledger locked.';
    }
  },

  initCharts() {
    const isDark = document.documentElement.classList.contains('dark');
    const fork = FORK_TIMELINES[activeForkIndex] || FORK_TIMELINES[0];
    const years = ['2026', '2027', '2028', '2029', '2030'];
    const statusQuoData = years.map((y, idx) => Math.round((hero.income || 45000) * 12 * Math.pow(1.05, idx) * 0.15 + (hero.savings || 120000)));
    const projectedData = years.map(y => fork.years[y].cumulativeSavings);

    const lineCanvas = document.getElementById('financialChart');
    if (lineCanvas) {
      const ctx = lineCanvas.getContext('2d');
      if (financialChart) financialChart.destroy();

      const goldColor = isDark ? '#fbbf24' : '#d97706';
      const goldBg = isDark ? 'rgba(251, 191, 36, 0.12)' : 'rgba(217, 119, 6, 0.10)';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.06)';
      const tickColor = isDark ? '#94a3b8' : '#475569';
      const tooltipBg = isDark ? '#0a0f1d' : '#ffffff';
      const tooltipTextColor = isDark ? '#f8fafc' : '#0f172a';

      financialChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['2026', '2027', '2028', '2029', '2030'],
          datasets: [
            {
              label: 'Status Quo',
              data: statusQuoData,
              borderColor: isDark ? '#64748b' : '#94a3b8',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              pointBackgroundColor: isDark ? '#64748b' : '#94a3b8',
              pointRadius: 3,
              tension: 0.2
            },
            {
              label: fork.title.replace('⚡ ', '').replace('🌴 ', '').replace('🏢 ', ''),
              data: projectedData,
              borderColor: goldColor,
              backgroundColor: goldBg,
              borderWidth: 2.5,
              fill: true,
              pointBackgroundColor: goldColor,
              pointBorderColor: isDark ? '#020617' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: tooltipBg,
              titleColor: tooltipTextColor,
              bodyColor: tooltipTextColor,
              titleFont: { family: '"JetBrains Mono"', size: 11, weight: 'bold' },
              bodyFont: { family: '"JetBrains Mono"', size: 12 },
              borderColor: goldColor,
              borderWidth: 1,
              padding: 8,
              callbacks: {
                label: (ctx) => ` ₱${ctx.raw.toLocaleString()} PHP Net Wealth`
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: tickColor, font: { family: '"JetBrains Mono"', size: 10 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: tickColor,
                font: { family: '"JetBrains Mono"', size: 10 },
                callback: (val) => val >= 1000000 ? `₱${(val / 1000000).toFixed(1)}M` : `₱${(val / 1000)}k`
              }
            }
          }
        }
      });
    }
  }
};

// --- 6. MAIN APPLICATION CONTROLLER ---
const app = {
  // Navigation Router
  navTo(screenId, tabName = null) {
    soundEngine.playSelect();
    
    // Switch Screen View
    document.querySelectorAll('.screen-view').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update Top Navigation Tab Active Indicators
    document.querySelectorAll('.nav-tab-link').forEach(t => t.classList.remove('active'));
    if (tabName) {
      const activeNavTab = document.getElementById(`navTab${tabName.replace(/\s+/g, '')}`);
      if (activeNavTab) activeNavTab.classList.add('active');
    }

    if (screenId === 'screen-dashboard') {
      setTimeout(() => {
        timelineEngine.updateDashboardMetrics();
        timelineEngine.initCharts();
      }, 50);
    }
  },

  // --- THEME SYSTEM (LIGHT MODE BY DEFAULT & DARK MODE) ---
  initTheme() {
    const savedTheme = localStorage.getItem('lifesim_theme') || 'light';
    this.setTheme(savedTheme);
  },

  toggleTheme() {
    soundEngine.playSelect();
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  setTheme(theme) {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');

    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('lifesim_theme', 'dark');
      if (icon) icon.className = "fa-solid fa-sun text-amber-400";
      if (label) label.innerText = "LIGHT";
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      localStorage.setItem('lifesim_theme', 'light');
      if (icon) icon.className = "fa-solid fa-moon text-indigo-600";
      if (label) label.innerText = "DARK";
    }

    if (financialChart) {
      setTimeout(() => timelineEngine.initCharts(), 50);
    }
  },

  // --- AUTHENTICATION & USER EXPERIENCE DIFFERENTIATION ---
  async initAuth() {
    try {
      const savedAuth = localStorage.getItem('lifesim_auth_user');
      if (savedAuth) {
        currentUser = JSON.parse(savedAuth);
      }
    } catch (e) {
      console.warn('Could not read auth state from localStorage:', e);
    }
    this.updateAuthUI();

    if (currentUser.isLoggedIn) {
      await this.loadUserVault();
      await this.loadQuestLogs();
    }

    // The first thing the user sees is the Login screen (Sanctum)
    if (!currentUser.isLoggedIn) {
      this.navTo('screen-title', 'Sanctum');
    }
  },

  async loadUserVault() {
    if (!currentUser.isLoggedIn || !currentUser.uid) return;

    const cloudVault = await firebaseService.loadUserVault(currentUser.uid);
    whatIfVault = Array.isArray(cloudVault) ? cloudVault : [];
    localStorage.setItem('lifesim_whatif_vault', JSON.stringify(whatIfVault));
    this.renderVaultModal();
  },

  async loadQuestLogs() {
    if (!currentUser.isLoggedIn || !currentUser.uid) return;

    const savedQuestIds = await firebaseService.loadQuestLogs(currentUser.uid);
    completedQuests = new Set(Array.isArray(savedQuestIds) ? savedQuestIds : []);
    this.renderQuestItems();
  },

  openGoogleAuthModal() {
    soundEngine.playPowerup();
    const modal = document.getElementById('googleAuthModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeGoogleAuthModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('googleAuthModal');
    if (modal) modal.classList.add('hidden');
  },

  // --- FIREBASE CONFIGURATION MODAL HANDLERS ---
  openFirebaseConfigModal() {
    soundEngine.playPowerup();
    const modal = document.getElementById('firebaseConfigModal');
    if (!modal) return;

    const config = firebaseService.getConfig();
    const keyEl = document.getElementById('fbInputApiKey');
    const domainEl = document.getElementById('fbInputAuthDomain');
    const projEl = document.getElementById('fbInputProjectId');
    const appEl = document.getElementById('fbInputAppId');

    if (keyEl) keyEl.value = config.apiKey || '';
    if (domainEl) domainEl.value = config.authDomain || '';
    if (projEl) projEl.value = config.projectId || '';
    if (appEl) appEl.value = config.appId || '';

    modal.classList.remove('hidden');
  },

  closeFirebaseConfigModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('firebaseConfigModal');
    if (modal) modal.classList.add('hidden');
  },

  onFirebaseSnippetPaste(snippet) {
    if (!snippet || typeof snippet !== 'string') return;
    try {
      // Regex extraction for common Firebase config format
      const apiKeyMatch = snippet.match(/apiKey\s*:\s*["']([^"']+)["']/);
      const authDomainMatch = snippet.match(/authDomain\s*:\s*["']([^"']+)["']/);
      const projectIdMatch = snippet.match(/projectId\s*:\s*["']([^"']+)["']/);
      const appIdMatch = snippet.match(/appId\s*:\s*["']([^"']+)["']/);

      if (apiKeyMatch && document.getElementById('fbInputApiKey')) {
        document.getElementById('fbInputApiKey').value = apiKeyMatch[1];
      }
      if (authDomainMatch && document.getElementById('fbInputAuthDomain')) {
        document.getElementById('fbInputAuthDomain').value = authDomainMatch[1];
      }
      if (projectIdMatch && document.getElementById('fbInputProjectId')) {
        document.getElementById('fbInputProjectId').value = projectIdMatch[1];
      }
      if (appIdMatch && document.getElementById('fbInputAppId')) {
        document.getElementById('fbInputAppId').value = appIdMatch[1];
      }
    } catch (e) {
      console.warn('Could not auto-parse snippet:', e);
    }
  },

  saveFirebaseConfig() {
    soundEngine.playLevelUp();
    const apiKey = document.getElementById('fbInputApiKey')?.value.trim() || '';
    const authDomain = document.getElementById('fbInputAuthDomain')?.value.trim() || '';
    const projectId = document.getElementById('fbInputProjectId')?.value.trim() || '';
    const appId = document.getElementById('fbInputAppId')?.value.trim() || '';

    if (!apiKey || !authDomain || !projectId) {
      alert('Please fill in at least API Key, Auth Domain, and Project ID.');
      return;
    }

    const configObj = {
      apiKey,
      authDomain,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId: "",
      appId
    };

    const success = firebaseService.saveConfig(configObj);
    this.closeFirebaseConfigModal();
    this.updateAuthUI();

    if (success) {
      alert(`Firebase initialized successfully for project "${projectId}"! You can now sign in with Google.`);
    } else {
      alert(`Firebase config saved. Ready to sign in.`);
    }
  },

  // Firebase Google Popup Authentication
  async signInWithFirebaseGoogle() {
    soundEngine.playLevelUp();
    try {
      if (firebaseService.isInitialized || firebaseService.init()) {
        const heroUser = await firebaseService.signInWithGoogle();
        currentUser = heroUser;
        await this.loadUserVault();
        await this.loadQuestLogs();
        localStorage.setItem('lifesim_auth_user', JSON.stringify(currentUser));
        this.closeGoogleAuthModal();
        this.updateAuthUI();

        if (typeof confetti === 'function') {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
        }

        this.navTo('screen-class-select', 'Archetype');
        return;
      } else {
        // Firebase config not yet provided: prompt user to configure or use 1-click test
        this.openFirebaseConfigModal();
        return;
      }
    } catch (err) {
      console.warn('Firebase Google Auth error:', err);
      if (err.message === 'CONFIG_MISSING' || err.code === 'auth/invalid-api-key') {
        this.openFirebaseConfigModal();
        return;
      }
      alert(`Google Sign-In notice: ${err.message || 'Popup closed or failed'}. You can also use 1-Click Instant Test Login.`);
    }
  },

  async signInWithGoogle(customName = null, customEmail = null) {
    soundEngine.playLevelUp();
    const name = customName || document.getElementById('googleInputName')?.value.trim() || 'Juan Dela Cruz';
    let email = customEmail || document.getElementById('googleInputEmail')?.value.trim() || 'juan.delacruz@gmail.com';
    
    // Ensure email is valid
    if (!email.includes('@')) {
      email = `${email.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
    }

    currentUser = {
      isLoggedIn: true,
      authProvider: 'google',
      displayName: name,
      email: email,
      uid: `demo_${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: 'VERIFIED_HERO',
      cloudSync: true,
      maxVaultSlots: Infinity, // Unlimited Cloud Storage
      verifiedSealNumber: `PH-2026-HERO-${Math.floor(1000 + Math.random() * 9000)}`
    };

    await firebaseService.saveUser(currentUser);
    await this.loadUserVault();
    await this.loadQuestLogs();
    
    localStorage.setItem('lifesim_auth_user', JSON.stringify(currentUser));
    this.closeGoogleAuthModal();
    this.updateAuthUI();

    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
    }

    this.navTo('screen-class-select', 'Archetype');
  },

  async signInAsGuest() {
    soundEngine.playSelect();
    const guestUid = localStorage.getItem('lifesim_guest_uid') || `guest_${crypto.randomUUID()}`;
    localStorage.setItem('lifesim_guest_uid', guestUid);
    currentUser = {
      isLoggedIn: false,
      authProvider: 'guest',
      displayName: 'Guest Hero',
      email: `${guestUid}@lifesim.ai`,
      uid: guestUid,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LifeSimGuest',
      role: 'GUEST_EXPLORER',
      cloudSync: false,
      maxVaultSlots: 2, // Maximum 2 local slots for guests
      verifiedSealNumber: null
    };

    completedQuests.clear();
    await firebaseService.saveUser(currentUser);
    await this.loadUserVault();

    localStorage.setItem('lifesim_auth_user', JSON.stringify(currentUser));
    this.updateAuthUI();
    this.navTo('screen-class-select', 'Archetype');
  },

  async signOut() {
    soundEngine.playBlip();
    if (typeof firebaseService !== 'undefined') {
      await firebaseService.signOut();
    }
    currentUser = {
      isLoggedIn: false,
      authProvider: 'guest',
      displayName: 'Guest Hero',
      email: null,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LifeSimGuest',
      role: 'GUEST_EXPLORER',
      cloudSync: false,
      maxVaultSlots: 2,
      verifiedSealNumber: null
    };
    localStorage.removeItem('lifesim_auth_user');
    localStorage.removeItem('lifesim_whatif_vault');
    whatIfVault = [];
    completedQuests.clear();
    this.updateAuthUI();
    this.navTo('screen-title', 'Sanctum');
  },

  updateAuthUI() {
    // 1. Header Auth Section
    const headerAuth = document.getElementById('headerAuthContainer');
    if (headerAuth) {
      if (currentUser.isLoggedIn) {
        headerAuth.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 px-2 py-1 bg-dungeon-950 border border-emerald-500/80 text-[11px] font-mono text-emerald-300">
              <img src="${currentUser.avatar}" alt="Avatar" class="w-4 h-4 rounded-full border border-emerald-400">
              <span class="font-bold truncate max-w-[110px]">${currentUser.displayName}</span>
              <span class="text-[9px] bg-emerald-950 text-emerald-400 px-1 border border-emerald-500">VERIFIED</span>
            </div>
            <button onclick="app.signOut()" class="text-slate-400 hover:text-rose-400 text-xs" title="Sign Out to Guest">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        `;
      } else {
        headerAuth.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="hidden lg:inline-block px-1.5 py-0.5 bg-amber-950/40 border border-amber-500/50 text-[10px] text-amber-400 font-mono">
              GUEST (2 SLOTS)
            </span>
            <button onclick="app.openGoogleAuthModal()" class="btn-brutal px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 border border-slate-950">
              <i class="fa-brands fa-google text-slate-900 text-xs"></i>
              <span>LOG IN</span>
            </button>
          </div>
        `;
      }
    }

    // 2. Sanctum Hero Status Box
    const sanctumStatus = document.getElementById('sanctumUserStatusBox');
    if (sanctumStatus) {
      if (currentUser.isLoggedIn) {
        sanctumStatus.innerHTML = `
          <div class="bg-white dark:bg-dungeon-950 border-2 border-emerald-500 p-4 shadow-brutal-emerald flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div class="flex items-center gap-3">
              <img src="${currentUser.avatar}" alt="Avatar" class="w-11 h-11 rounded-full border-2 border-emerald-400 bg-slate-900">
              <div>
                <div class="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                  <span>${currentUser.displayName}</span>
                  <span class="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 border border-emerald-400 font-mono">CLOUD SYNCED</span>
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">${currentUser.email} // Official Hero ID: ${currentUser.verifiedSealNumber}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="app.navTo('screen-class-select', 'Archetype')" class="btn-brutal px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs border border-slate-950 shadow-brutal-gold">
                CONTINUE SIMULATION →
              </button>
              <button onclick="app.signOut()" class="px-3 py-2 bg-slate-100 dark:bg-dungeon-900 hover:bg-slate-200 dark:hover:bg-dungeon-800 text-slate-600 dark:text-slate-400 font-mono text-xs border border-slate-300 dark:border-slate-800">
                LOGOUT
              </button>
            </div>
          </div>
        `;
      } else {
        sanctumStatus.innerHTML = `
          <div class="bg-white dark:bg-dungeon-950 border-2 border-slate-300 dark:border-slate-800 p-5 shadow-brutal space-y-4 text-center max-w-xl mx-auto">
            <div class="space-y-1">
              <div class="text-[10px] text-amber-600 dark:text-rpg-gold font-bold uppercase tracking-wider">HERO REALM AUTHENTICATION GATE</div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">CHOOSE YOUR SIMULATION ACCESS LEVEL</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 font-mono">Sign in with Google / Gmail to activate Live Gemini 2.5 AI Analysis, or enter as Guest for standard calculations.</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
              <!-- Primary: Firebase Google Auth Popup -->
              <button type="button" onclick="app.signInWithFirebaseGoogle()" class="btn-brutal px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 border border-slate-950 shadow-brutal-gold">
                <i class="fa-brands fa-google text-sm"></i>
                <span>SIGN IN WITH GOOGLE (LIVE AI)</span>
              </button>

              <!-- Quick 1-Click Instant Test -->
              <button type="button" onclick="app.signInWithGoogle('Juan Dela Cruz', 'juan.delacruz@gmail.com')" class="btn-brutal px-3.5 py-2.5 bg-slate-100 dark:bg-dungeon-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold font-mono text-xs border border-slate-950 flex items-center justify-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-bolt text-amber-500"></i>
                <span>1-CLICK GMAIL HERO</span>
              </button>
            </div>

            <!-- Firebase Setup Hint -->
            <div class="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <i class="fa-solid fa-fire text-amber-500"></i>
              <span>Using your own Firebase project?</span>
              <button type="button" onclick="app.openFirebaseConfigModal()" class="text-sky-600 dark:text-rpg-mana hover:underline font-bold">Configure Firebase Keys →</button>
            </div>

            <!-- Guest Option -->
            <div class="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-left">
              <span class="text-slate-500 text-[11px]">Exploring without AI reasoning?</span>
              <button type="button" onclick="app.signInAsGuest()" class="px-3 py-1 bg-slate-100 dark:bg-dungeon-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 font-bold text-xs">
                ENTER AS GUEST (STANDARD ENGINE) →
              </button>
            </div>
          </div>
        `;
      }
    }

    // 3. Vault Modal Status Strip
    this.renderVaultModal();
  },

  // Class Archetype Selection
  selectClass(classKey) {
    soundEngine.playSelect();
    const template = CLASS_ARCHETYPES[classKey] || CLASS_ARCHETYPES.bpo;
    hero = { ...template };

    // Reset card borders
    const classKeys = ['bpo', 'freelancer', 'freshgrad', 'custom'];
    classKeys.forEach(k => {
      const card = document.getElementById(`card-class-${k}`);
      const statusTag = document.getElementById(`statusTag-${k}`);
      const btn = document.getElementById(`btnClass-${k}`);

      if (card) {
        card.classList.remove('border-rpg-gold', 'shadow-brutal-gold');
        card.classList.add('border-slate-800', 'shadow-brutal');
      }
      if (statusTag) {
        statusTag.innerText = '[STANDBY]';
        statusTag.className = 'text-slate-400 font-bold';
      }
      if (btn) {
        btn.className = 'w-full py-1.5 bg-transparent hover:bg-sky-950/40 text-rpg-mana font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 border border-rpg-mana';
        btn.innerHTML = '<i class="fa-solid fa-bolt text-xs"></i> <span>SELECT ARCHETYPE</span>';
      }
    });

    // Highlight selected card
    const selectedCard = document.getElementById(`card-class-${classKey}`);
    const selectedStatus = document.getElementById(`statusTag-${classKey}`);
    const selectedBtn = document.getElementById(`btnClass-${classKey}`);

    if (selectedCard) {
      selectedCard.classList.remove('border-slate-800', 'shadow-brutal');
      selectedCard.classList.add('border-rpg-gold', 'shadow-brutal-gold');
    }
    if (selectedStatus) {
      selectedStatus.innerText = '[ACTIVE]';
      selectedStatus.className = 'text-rpg-gold font-bold';
    }
    if (selectedBtn) {
      selectedBtn.className = 'w-full py-1.5 bg-rpg-gold text-slate-950 font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 border border-slate-950 shadow-sm';
      selectedBtn.innerHTML = '<i class="fa-solid fa-check text-xs"></i> <span>SELECTED CLASS</span>';
    }

    // Update Proceed Button Label
    const proceedLabel = document.getElementById('btnProceedLabel');
    if (proceedLabel) {
      const shortTitles = {
        bpo: 'BPO NIGHT OWL',
        freelancer: 'HUSTLING FREELANCER',
        freshgrad: 'FRESH GRAD',
        custom: 'CUSTOM HERO'
      };
      proceedLabel.innerText = `CALIBRATE [${shortTitles[classKey] || 'HERO'}]`;
    }

    this.populateCalibrationForm();
  },

  populateCalibrationForm() {
    const ageEl = document.getElementById('inputAge');
    const locEl = document.getElementById('inputLocation');
    const incEl = document.getElementById('inputIncome');
    const savEl = document.getElementById('inputSavings');
    const remEl = document.getElementById('inputFamilyRemittance');
    const chkSand = document.getElementById('chkSandwichGen');
    const debtEl = document.getElementById('inputDebtPayment');
    const depEl = document.getElementById('dependentsVal');

    if (ageEl) ageEl.value = hero.age || 26;
    if (locEl) locEl.value = hero.location || 'Metro Manila (NCR)';
    if (incEl) incEl.value = hero.baseIncome || 45000;
    if (savEl) savEl.value = hero.baseSavings || 120000;
    if (remEl) remEl.value = hero.familyRemittance || 10000;
    if (chkSand) chkSand.checked = (hero.familyRemittance > 0 || hero.familySafetyNet === 'SandwichGen');
    if (debtEl) debtEl.value = hero.debtPayment || 0;
    if (depEl) depEl.innerText = hero.dependents || 2;

    this.setWorkSetup(hero.workSetup || 'Hybrid');
    this.onCommuteSlider(hero.commuteHours || 3.5);
    this.setGuild(hero.guild || 'Tech');
    this.setDebtType(hero.debtType || 'CreditCard');
    this.setHmoShield(hero.hmoShield || 'Comprehensive');
    this.setAiLeverage(hero.aiLeverage || 'AiAugmented');
    this.setSocialCapital(hero.socialCapital || 'CommunityPeer');
    this.setLearningVelocity(hero.learningVelocity || 'HyperAdaptive');
    const customDesireEl = document.getElementById('inputCustomDesire');
    if (customDesireEl) customDesireEl.value = hero.customDesire || '';

    this.setDesireVector(hero.desireVector || (hero.customDesire ? 'Custom' : 'DollarClients'));

    this.recalcCalibrationTelemetry();
    this.switchPillarTab(1);
  },

  // Segmented State Toggles for Calibration Screen
  setWorkSetup(setup) {
    hero.workSetup = setup;
    const setups = ['On-Site', 'Hybrid', 'Remote', 'Graveyard'];
    setups.forEach(s => {
      const btn = document.getElementById(`btnSetup-${s}`);
      if (btn) {
        btn.className = (s === setup) ? 'matrix-btn active-yellow py-1.5 px-1 text-center text-[11px]' : 'matrix-btn py-1.5 px-1 text-center text-[11px]';
      }
    });
    this.recalcCalibrationTelemetry();
  },

  onCommuteSlider(val) {
    const num = parseFloat(val);
    hero.commuteHours = num;
    const range = document.getElementById('inputCommuteRange');
    const display = document.getElementById('commuteDisplayVal');
    const warn = document.getElementById('commuteWarningText');

    if (range) range.value = num;
    if (display) display.innerText = `${num.toFixed(1)} HRS / DAY`;

    const monthlyLostHours = Math.round(num * 22);
    if (warn) {
      if (num === 0) {
        warn.className = 'text-[10px] font-mono text-rpg-emerald flex items-center gap-1.5 pt-1 border-t border-slate-850';
        warn.innerHTML = '<i class="fa-solid fa-check"></i> <span>0h commute! Reclaimed ~45 hours/month for sleep & AI building.</span>';
      } else {
        warn.className = 'text-[10px] font-mono text-rose-400 flex items-center gap-1.5 pt-1 border-t border-slate-850';
        warn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Commute tax equates to ${monthlyLostHours} hours/month of lost discretionary XP generation.</span>`;
      }
    }
    this.recalcCalibrationTelemetry();
  },

  setGuild(guild) {
    hero.guild = guild;
    const guilds = ['BPO', 'Tech', 'Freelance', 'Corporate'];
    guilds.forEach(g => {
      const btn = document.getElementById(`btnGuild-${g}`);
      if (btn) {
        btn.className = (g === guild) ? 'matrix-btn active-cyan p-1.5 text-center text-[10px] leading-tight' : 'matrix-btn p-1.5 text-center text-[10px] leading-tight';
      }
    });
  },

  setDebtType(debt) {
    hero.debtType = debt;
    const debts = ['CreditCard', 'SalaryLoan', 'SSS', 'Auto', 'None'];
    debts.forEach(d => {
      const btn = document.getElementById(`btnDebt-${d}`);
      if (btn) {
        btn.className = (d === debt) ? 'matrix-btn active-yellow px-2 py-1 text-[10px]' : 'matrix-btn px-2 py-1 text-[10px]';
      }
    });

    const debtInput = document.getElementById('inputDebtPayment');
    if (debtInput) {
      if (debt === 'None') {
        debtInput.value = 0;
      } else if (parseInt(debtInput.value) === 0) {
        debtInput.value = 4500;
      }
    }
    this.recalcCalibrationTelemetry();
  },

  setHmoShield(hmo) {
    hero.hmoShield = hmo;
    const hmos = ['Comprehensive', 'Solo', 'PhilHealth'];
    hmos.forEach(h => {
      const card = document.getElementById(`hmoOption-${h}`);
      if (card) {
        if (h === hmo) {
          card.className = 'selectable-card selected-gold p-2 flex items-start gap-2';
          const r = card.querySelector('input[type=radio]');
          if (r) r.checked = true;
        } else {
          card.className = 'selectable-card p-2 flex items-start gap-2';
          const r = card.querySelector('input[type=radio]');
          if (r) r.checked = false;
        }
      }
    });
    this.recalcCalibrationTelemetry();
  },

  setAiLeverage(val) {
    hero.aiLeverage = val;
    const tiers = ['Traditional', 'AiAugmented', 'Architect10x'];
    tiers.forEach(t => {
      const btn = document.getElementById(`btnAi-${t}`);
      if (btn) {
        btn.className = (t === val) ? 'matrix-btn active-yellow w-full py-1 text-[9px] text-center font-bold' : 'matrix-btn w-full py-1 text-[9px] text-center';
      }
    });
    this.recalcCalibrationTelemetry();
  },

  setSocialCapital(val) {
    hero.socialCapital = val;
    const tiers = ['LoneWolf', 'CommunityPeer', 'GlobalNetwork'];
    tiers.forEach(t => {
      const btn = document.getElementById(`btnSocial-${t}`);
      if (btn) {
        btn.className = (t === val) ? 'matrix-btn active-cyan w-full py-1 text-[9px] text-center font-bold' : 'matrix-btn w-full py-1 text-[9px] text-center';
      }
    });
  },

  setLearningVelocity(val) {
    hero.learningVelocity = val;
    const tiers = ['Steady', 'HyperAdaptive', 'Stagnant'];
    tiers.forEach(t => {
      const btn = document.getElementById(`btnLearning-${t}`);
      if (btn) {
        btn.className = (t === val) ? 'matrix-btn active-gold w-full py-1 text-[9px] text-center font-bold' : 'matrix-btn w-full py-1 text-[9px] text-center';
      }
    });
  },

  setDesireVector(val) {
    hero.desireVector = val;
    const desires = ['DollarClients', 'ProvincialWFH', 'FamilyHome', 'OwnBusiness', 'Custom'];
    desires.forEach(d => {
      const card = document.getElementById(`desireCard-${d}`);
      if (card) {
        if (d === val) {
          card.className = (d === 'Custom') ? 'selectable-card selected-gold p-3 sm:col-span-2 border-2 border-purple-500 bg-purple-950/40 shadow-brutal-purple' : 'selectable-card selected-gold p-3';
          const dot = card.querySelector('span:first-child');
          if (dot) dot.innerText = (d === 'Custom') ? '★' : '●';
        } else {
          card.className = (d === 'Custom') ? 'selectable-card p-3 sm:col-span-2 border border-purple-500/60 bg-purple-950/20 hover:border-purple-400 transition-all' : 'selectable-card p-3';
          const dot = card.querySelector('span:first-child');
          if (dot) dot.innerText = (d === 'Custom') ? '✧' : '○';
        }
      }
    });

    if (val === 'Custom') {
      const customInput = document.getElementById('inputCustomDesire');
      if (customInput && !customInput.value.trim()) {
        customInput.focus();
      }
    }
  },

  onCustomDesireInput(val) {
    hero.customDesire = val;
    if (val.trim()) {
      hero.desireVector = 'Custom';
      const desires = ['DollarClients', 'ProvincialWFH', 'FamilyHome', 'OwnBusiness'];
      desires.forEach(d => {
        const card = document.getElementById(`desireCard-${d}`);
        if (card) {
          card.className = 'selectable-card p-3';
          const dot = card.querySelector('span:first-child');
          if (dot) dot.innerText = '○';
        }
      });
      const customCard = document.getElementById('desireCard-Custom');
      if (customCard) {
        customCard.className = 'selectable-card selected-gold p-3 sm:col-span-2 border-2 border-purple-500 bg-purple-950/40 shadow-brutal-purple';
        const dot = customCard.querySelector('span:first-child');
        if (dot) dot.innerText = '★';
      }
    }

    const doorsInput = document.getElementById('doorsCustomDesireInput');
    if (doorsInput) doorsInput.value = val;
  },

  setQuickCustomDesire(text) {
    soundEngine.playSelect();
    const input = document.getElementById('inputCustomDesire');
    if (input) {
      input.value = text;
      input.classList.add('ring-2', 'ring-purple-400');
      setTimeout(() => input.classList.remove('ring-2', 'ring-purple-400'), 300);
    }
    this.onCustomDesireInput(text);
  },

  async submitDoorsCustomDesire() {
    soundEngine.playLevelUp();
    const input = document.getElementById('doorsCustomDesireInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      if (input) input.focus();
      return;
    }
    hero.customDesire = val;
    hero.desireVector = 'Custom';

    // Update Step 02 input as well
    const step2Input = document.getElementById('inputCustomDesire');
    if (step2Input) step2Input.value = val;

    // Update Portal 3 in activeDestinyPortals
    if (activeDestinyPortals && activeDestinyPortals[2]) {
      activeDestinyPortals[2].title = val.length > 34 ? val.slice(0, 31).trim() + '...' : val.toUpperCase();
      activeDestinyPortals[2].badge = 'CUSTOM DESIRE';
      activeDestinyPortals[2].targetProfile = 'CUSTOM BESPOKE DREAM';
    }

    await this.enterPortal('custom', val, activeDestinyPortals?.[2] || null, 2);
  },

  adjustDependents(delta) {
    soundEngine.playBlip();
    const depEl = document.getElementById('dependentsVal');
    let current = parseInt(depEl ? depEl.innerText : '2') || 0;
    current = Math.max(0, Math.min(8, current + delta));
    hero.dependents = current;
    if (depEl) depEl.innerText = current;
    this.recalcCalibrationTelemetry();
  },

  toggleSandwichGenCheck(isChecked) {
    soundEngine.playBlip();
    const remInput = document.getElementById('inputFamilyRemittance');
    if (remInput) {
      if (!isChecked) {
        remInput.value = 0;
      } else if (parseInt(remInput.value) === 0) {
        remInput.value = 10000;
      }
    }
    this.recalcCalibrationTelemetry();
  },

  applyQuickPreset(presetKey) {
    soundEngine.playPowerup();
    if (presetKey === 'bpo_graveyard') {
      this.selectClass('bpo');
      this.setWorkSetup('Graveyard');
      this.onCommuteSlider(3.5);
    } else if (presetKey === 'ortigas_sandwich') {
      this.selectClass('bpo');
      document.getElementById('inputIncome').value = 75000;
      document.getElementById('inputSavings').value = 250000;
      document.getElementById('inputFamilyRemittance').value = 20000;
      this.setWorkSetup('Hybrid');
      this.onCommuteSlider(3.0);
    } else if (presetKey === 'cebu_va') {
      this.selectClass('freelancer');
      document.getElementById('inputLocation').value = 'Cebu IT Park';
      document.getElementById('inputIncome').value = 55000;
      this.setHmoShield('PhilHealth');
      this.setWorkSetup('Remote');
      this.onCommuteSlider(0);
    } else if (presetKey === 'siargao_nomad') {
      this.selectClass('freelancer');
      document.getElementById('inputLocation').value = 'Siargao / La Union';
      document.getElementById('inputIncome').value = 90000;
      document.getElementById('inputSavings').value = 300000;
      this.setWorkSetup('Remote');
      this.onCommuteSlider(0);
      this.setDesireVector('ProvincialWFH');
    }
    this.recalcCalibrationTelemetry();
  },

  // --- Calibration 4-Pillar Tab & View Management ---
  activePillarTab: 1,
  isPillarsGridMode: false,

  switchPillarTab(tabNum) {
    soundEngine.playSelect();
    this.activePillarTab = tabNum;

    // If currently in Grid Mode, revert back to Focused Tabs Mode
    if (this.isPillarsGridMode) {
      this.togglePillarsViewMode(false);
    }

    // Update Tab Buttons UI
    for (let i = 1; i <= 4; i++) {
      const tabBtn = document.getElementById(`tabPillar-${i}`);
      const section = document.getElementById(`pillarSection-${i}`);

      if (tabBtn) {
        if (i === tabNum) {
          tabBtn.className = 'pillar-tab-btn active-pillar px-3 py-1.5 font-bold flex items-center gap-1.5 border border-rpg-gold bg-dungeon-900 text-rpg-gold';
          const numSpan = tabBtn.querySelector('span:first-child');
          if (numSpan) numSpan.className = 'text-rpg-gold font-bold';
        } else {
          tabBtn.className = 'pillar-tab-btn px-3 py-1.5 font-bold flex items-center gap-1.5 border border-slate-800 bg-dungeon-950 text-slate-400 hover:text-white';
          const numSpan = tabBtn.querySelector('span:first-child');
          if (numSpan) numSpan.className = 'text-slate-500';
        }
      }

      if (section) {
        if (i === tabNum) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      }
    }

    // Scroll calibration view to top smoothly if on mobile
    const charScreen = document.getElementById('screen-character-sheet');
    if (charScreen && window.innerWidth < 768) {
      charScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  togglePillarsViewMode(forcedState = null) {
    soundEngine.playSelect();
    if (forcedState !== null) {
      this.isPillarsGridMode = forcedState;
    } else {
      this.isPillarsGridMode = !this.isPillarsGridMode;
    }

    const container = document.getElementById('pillarsContainer');
    const label = document.getElementById('labelTogglePillarsView');
    const icon = document.getElementById('iconTogglePillarsView');
    const stepperBars = document.querySelectorAll('.pillar-stepper-bar');

    if (this.isPillarsGridMode) {
      // Switch container to 2-column grid
      if (container) {
        container.className = 'grid grid-cols-1 lg:grid-cols-2 gap-4';
      }
      // Show all 4 sections
      for (let i = 1; i <= 4; i++) {
        const sec = document.getElementById(`pillarSection-${i}`);
        if (sec) sec.classList.remove('hidden');
        const tabBtn = document.getElementById(`tabPillar-${i}`);
        if (tabBtn) {
          tabBtn.className = 'pillar-tab-btn px-3 py-1.5 font-bold flex items-center gap-1.5 border border-slate-800 bg-dungeon-950 text-slate-300';
        }
      }
      // Hide individual sub-stepper bars in grid mode
      stepperBars.forEach(el => el.classList.add('hidden'));

      if (label) label.innerText = 'FOCUSED TABS';
      if (icon) icon.className = 'fa-solid fa-rectangle-list text-rpg-gold';
    } else {
      // Revert container to single column stack
      if (container) {
        container.className = 'space-y-4';
      }
      // Show only active tab
      for (let i = 1; i <= 4; i++) {
        const sec = document.getElementById(`pillarSection-${i}`);
        if (sec) {
          if (i === this.activePillarTab) sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        }
      }
      // Restore sub-stepper bars
      stepperBars.forEach(el => el.classList.remove('hidden'));

      // Re-highlight active tab button
      this.switchPillarTab(this.activePillarTab);

      if (label) label.innerText = 'VIEW ALL 4 (GRID)';
      if (icon) icon.className = 'fa-solid fa-table-cells-large text-rpg-mana';
    }
  },

  recalcCalibrationTelemetry() {
    const inc = parseInt(document.getElementById('inputIncome')?.value) || 45000;
    const sav = parseInt(document.getElementById('inputSavings')?.value) || 120000;
    const rem = parseInt(document.getElementById('inputFamilyRemittance')?.value) || 0;
    const debt = parseInt(document.getElementById('inputDebtPayment')?.value) || 0;
    const commute = hero.commuteHours || 3.5;

    // Estimated living cost based on location
    const baseLiving = inc > 60000 ? inc * 0.45 : 22000;
    const discCashflow = inc - (baseLiving + rem + debt);

    // Burnout index calculation
    let burnout = 40;
    if (commute >= 3.5) burnout += 25;
    else if (commute >= 1.5) burnout += 12;
    if (rem > 0) burnout += 15;
    if (hero.workSetup === 'Graveyard') burnout += 18;
    if (hero.hmoShield === 'PhilHealth') burnout += 10;
    if (hero.aiLeverage === 'AiAugmented') burnout -= 10;
    if (hero.aiLeverage === 'Architect10x') burnout -= 15;
    burnout = Math.max(15, Math.min(95, Math.round(burnout)));

    // Class Tier
    let classTier = 'Class C-Upper (NCR)';
    if (inc >= 150000) classTier = 'Class A/B (High Net Worth)';
    else if (inc >= 85000) classTier = 'Class B (Upper Middle)';
    else if (inc >= 40000) classTier = 'Class C-Upper (NCR)';
    else if (inc >= 22000) classTier = 'Class C-Middle';
    else classTier = 'Class D (Striving)';

    // Projected 5-yr net worth
    const annualSavingsRate = Math.max(5000, discCashflow);
    const projNetWorth = Math.round(sav + (annualSavingsRate * 60 * 1.35));

    // Update Telemetry Elements
    const cashEl = document.getElementById('telemetryCashflow');
    if (cashEl) cashEl.innerText = `${discCashflow >= 0 ? '+' : ''}₱${discCashflow.toLocaleString()}/mo`;

    const burnEl = document.getElementById('telemetryBurnout');
    if (burnEl) {
      const bLabel = burnout > 70 ? '[HIGH]' : (burnout > 45 ? '[MODERATE]' : '[LOW]');
      burnEl.innerText = `${burnout}% ${bLabel}`;
    }

    const tierEl = document.getElementById('telemetryClassTier');
    if (tierEl) tierEl.innerText = classTier;

    const nwEl = document.getElementById('telemetryNetWorth');
    if (nwEl) nwEl.innerText = `₱${projNetWorth.toLocaleString()}`;

    // Runway HP Label
    const runwayMonths = (sav / Math.max(15000, inc * 0.65)).toFixed(1);
    const hpLabel = document.getElementById('runwayHpLabel');
    if (hpLabel) hpLabel.innerText = `${runwayMonths} MO RUNWAY`;

    // Debt Drain Label
    const debtPct = Math.round((debt / inc) * 100);
    const dDrain = document.getElementById('debtDrainLabel');
    if (dDrain) dDrain.innerText = `DRAINS ${debtPct}% INCOME`;
  },

  async saveCharacterSheet(e) {
    if (e && e.preventDefault) e.preventDefault();
    soundEngine.playPowerup();

    try {
      hero.age = parseInt(document.getElementById('inputAge')?.value) || hero.age || 26;
      hero.location = document.getElementById('inputLocation')?.value || hero.location || 'Metro Manila (NCR)';
      hero.income = parseInt(document.getElementById('inputIncome')?.value) || hero.income || 45000;
      hero.savings = parseInt(document.getElementById('inputSavings')?.value) || hero.savings || 120000;
      hero.familyRemittance = parseInt(document.getElementById('inputFamilyRemittance')?.value) || 0;
      hero.debtPayment = parseInt(document.getElementById('inputDebtPayment')?.value) || 0;

      const customDesireEl = document.getElementById('inputCustomDesire');
      if (customDesireEl && customDesireEl.value.trim()) {
        hero.customDesire = customDesireEl.value.trim();
        hero.desireVector = 'Custom';
      }

      const doorsInput = document.getElementById('doorsCustomDesireInput');
      if (doorsInput) {
        doorsInput.value = hero.customDesire || '';
      }

      // Update Top Header Hero Level
      const hudText = document.getElementById('topHeroHudText');
      if (hudText) hudText.innerText = `LV.${hero.age} ${(hero.className || 'HERO').toUpperCase()}`;

      // Update Hall of Doors HUD
      const dClass = document.getElementById('doorsHudClass');
      const dInc = document.getElementById('doorsHudIncome');
      if (dClass) dClass.innerText = hero.className || 'The BPO Night Owl';
      if (dInc) dInc.innerText = `₱${Math.round((hero.income || 45000) / 1000)}k/mo`;
    } catch (err) {
      console.warn('[app] Could not read form values:', err);
    }

    // Immediate Screen Transition
    this.navTo('screen-hall-of-doors', 'Multiverse');

    // Asynchronously synthesize and render portals
    try {
      await this.synthesizeAndRenderPortals();
    } catch (err) {
      console.error('[app] synthesizeAndRenderPortals failed:', err);
    }
  },

  async openAiHeroAnalysisModal() {
    soundEngine.playPowerup();

    // Read current form values into hero
    hero.age = parseInt(document.getElementById('inputAge')?.value) || hero.age || 26;
    hero.location = document.getElementById('inputLocation')?.value || hero.location || 'Metro Manila (NCR)';
    hero.income = parseInt(document.getElementById('inputIncome')?.value) || hero.income || 45000;
    hero.savings = parseInt(document.getElementById('inputSavings')?.value) || hero.savings || 120000;
    hero.familyRemittance = parseInt(document.getElementById('inputFamilyRemittance')?.value) || 0;
    hero.debtPayment = parseInt(document.getElementById('inputDebtPayment')?.value) || 0;

    const modal = document.getElementById('aiHeroAnalysisModal');
    const loading = document.getElementById('aiHeroAnalysisLoading');
    const body = document.getElementById('aiHeroAnalysisBody');
    const authBanner = document.getElementById('aiHeroAuthStatusBanner');
    const diagTag = document.getElementById('aiHeroDiagTag');

    if (modal) modal.classList.remove('hidden');
    if (loading) loading.classList.remove('hidden');
    if (body) body.classList.add('hidden');

    // Update Auth Banner Gating UI
    const isAuth = geminiService.isAiAuthorized();
    if (authBanner) {
      if (isAuth) {
        authBanner.innerHTML = `
          <div class="bg-emerald-950/40 border border-emerald-500/80 p-2.5 font-mono text-xs flex items-center justify-between gap-2 text-emerald-300">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-sparkles text-rpg-gold text-sm"></i>
              <span><strong>GEMINI 2.5 AI LIVE:</strong> Real-time LLM Diagnostic & Custom Desire synthesis active for <strong>${currentUser.displayName}</strong> (${currentUser.email}).</span>
            </div>
            <span class="text-[9px] bg-emerald-900 text-emerald-300 px-1.5 py-0.5 border border-emerald-400 font-bold shrink-0">AUTH GRANTED</span>
          </div>
        `;
        if (diagTag) {
          diagTag.innerText = '[GEMINI 2.5 AI LIVE]';
          diagTag.className = 'text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-900 text-[9px] font-bold';
        }
      } else {
        authBanner.innerHTML = `
          <div class="bg-amber-950/40 border border-amber-500/60 p-3 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div class="flex items-center gap-2 text-amber-300 text-[11px]">
              <i class="fa-solid fa-lock text-base text-amber-400"></i>
              <span><strong>GUEST MODE:</strong> Standard algorithmic diagnostic active. Sign in with Google / Gmail to unlock <strong>Live Gemini 2.5 AI Analysis & Custom Reasoning</strong>.</span>
            </div>
            <button type="button" onclick="app.closeAiHeroAnalysisModal(); app.openGoogleAuthModal();" class="btn-brutal px-3 py-1 bg-white hover:bg-slate-100 text-slate-950 font-bold text-[11px] shrink-0 flex items-center gap-1.5 border border-slate-950 shadow-sm">
              <i class="fa-brands fa-google text-slate-900"></i>
              <span>SIGN IN WITH GOOGLE</span>
            </button>
          </div>
        `;
        if (diagTag) {
          diagTag.innerText = '[STANDARD DIAGNOSTIC]';
          diagTag.className = 'text-amber-400 bg-amber-950/60 px-1.5 py-0.5 border border-amber-900 text-[9px] font-bold';
        }
      }
    }

    try {
      const diagData = await geminiService.analyzeHeroSheet(hero);
      
      const diagText = document.getElementById('aiHeroDiagnosisText');
      if (diagText) diagText.innerText = diagData.diagnostic;

      const pathList = document.getElementById('aiPathwaysList');
      if (pathList && Array.isArray(diagData.pathways)) {
        pathList.innerHTML = '';
        diagData.pathways.forEach((p, idx) => {
          const card = document.createElement('div');
          card.className = 'selectable-card p-2.5 transition-all cursor-pointer hover:border-sky-400';
          card.onclick = () => app.selectAiPathway(p.desire);
          card.innerHTML = `
            <div class="flex justify-between items-center text-xs font-bold text-rpg-gold mb-1 font-mono">
              <span>${p.title}</span>
              <span class="text-[9px] text-rpg-mana border border-rpg-mana/60 px-1 py-0.5 bg-sky-950/40">SELECT</span>
            </div>
            <p class="text-[11px] text-slate-300 font-mono leading-relaxed">${p.desire}</p>
          `;
          pathList.appendChild(card);
        });
      }

      const activeDesireInput = document.getElementById('aiActiveDesireInput');
      if (activeDesireInput) {
        activeDesireInput.value = diagData.primaryDesire || (diagData.pathways?.[0]?.desire) || '';
      }

      if (loading) loading.classList.add('hidden');
      if (body) body.classList.remove('hidden');
    } catch (err) {
      console.error('[app] AI Hero Analysis failed:', err);
      if (loading) loading.classList.add('hidden');
      if (body) body.classList.remove('hidden');
    }
  },

  closeAiHeroAnalysisModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('aiHeroAnalysisModal');
    if (modal) modal.classList.add('hidden');
  },

  selectAiPathway(desireText) {
    soundEngine.playSelect();
    const input = document.getElementById('aiActiveDesireInput');
    if (input) {
      input.value = desireText;
      input.classList.add('ring-1', 'ring-amber-400');
      setTimeout(() => input.classList.remove('ring-1', 'ring-amber-400'), 400);
    }
  },

  applyAiDesireAndProceed() {
    soundEngine.playLevelUp();
    const input = document.getElementById('aiActiveDesireInput');
    const desireVal = input ? input.value.trim() : '';

    if (desireVal) {
      hero.customDesire = desireVal;
      hero.desireVector = 'Custom';
    }

    this.closeAiHeroAnalysisModal();
    this.saveCharacterSheet();
  },

  syncPortalsToForkTimelines(portals) {
    if (!Array.isArray(portals) || portals.length === 0) return;
    const p1 = portals[0];
    const p2 = portals[1];
    const p3 = portals[2];

    if (p1) {
      const p1Sim = geminiService.buildCalculatedSimulation(hero, p1.title, p1.id || 'tech');
      FORK_TIMELINES[0] = {
        id: 'fork_alpha',
        title: p1.title.startsWith('⚡') ? p1.title : `⚡ ${p1.title}`,
        desc: `${p1.taxCode || 'BIR 8% Flat Tax'} / ${p1.wealthGrowth || 'Net +₱145k/mo'}`,
        badge: p1.badge || 'ACTIVE REALITY',
        scenarioKey: p1.id || 'tech',
        portalData: p1,
        years: p1Sim.years,
        curveball: p1Sim.curveball,
        quests: p1Sim.quests,
        overallStrategicThesis: p1Sim.overallStrategicThesis
      };
    }

    if (p2) {
      const p2Sim = geminiService.buildCalculatedSimulation(hero, p2.title, p2.id || 'nomad');
      FORK_TIMELINES[1] = {
        id: 'fork_beta',
        title: p2.title.startsWith('🌴') ? p2.title : `🌴 ${p2.title}`,
        desc: `${p2.taxCode || '-40% Living Cost'} / ${p2.wealthGrowth || 'Low Cost, High Sun'}`,
        badge: p2.badge || 'FORK B',
        scenarioKey: p2.id || 'nomad',
        portalData: p2,
        years: p2Sim.years,
        curveball: p2Sim.curveball,
        quests: p2Sim.quests,
        overallStrategicThesis: p2Sim.overallStrategicThesis
      };
    }

    if (p3) {
      const p3Title = hero.customDesire || p3.title;
      const p3Sim = geminiService.buildCalculatedSimulation(hero, p3Title, p3.id || 'custom');
      FORK_TIMELINES[2] = {
        id: 'fork_gamma',
        title: p3Title.startsWith('✨') ? p3Title : `✨ ${p3Title}`,
        desc: `${p3.taxCode || 'Custom Pathway'} / ${p3.wealthGrowth || 'Calculated Matrix'}`,
        badge: p3.badge || (hero.customDesire ? 'CUSTOM DESIRE' : 'FORK C'),
        scenarioKey: p3.id || 'custom',
        portalData: p3,
        years: p3Sim.years,
        curveball: p3Sim.curveball,
        quests: p3Sim.quests,
        overallStrategicThesis: p3Sim.overallStrategicThesis
      };
    }
  },

  async synthesizeAndRenderPortals(forceRefresh = false) {
    const container = document.getElementById('destinyPortalsContainer');
    const bannerText = document.getElementById('aiSynthesisBannerText');
    const dClass = document.getElementById('doorsHudClass');
    const dInc = document.getElementById('doorsHudIncome');
    const isAuth = geminiService.isAiAuthorized();

    if (dClass) dClass.innerText = hero.className;
    if (dInc) dInc.innerText = `₱${Math.round(hero.income / 1000)}k/mo`;

    if (bannerText) {
      if (isAuth) {
        bannerText.innerHTML = `✨ GEMINI 2.5 AI: Synthesizing 3 Bespoke Portals for <strong>${hero.className}</strong> (₱${Math.round(hero.income/1000)}k/mo, ${hero.location})...`;
      } else {
        bannerText.innerHTML = `📊 STANDARD ENGINE: Calibrating 3 Destinies for <strong>${hero.className}</strong> (Guest Mode)...`;
      }
    }

    if (container) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center space-y-3 font-mono">
          <div class="w-10 h-10 mx-auto border-2 border-rpg-gold border-t-transparent rounded-full animate-spin"></div>
          <div class="text-xs text-rpg-gold font-bold uppercase tracking-wider animate-pulse">GENERATING MULTIVERSE REALITY NODES...</div>
          <div class="text-[10px] text-slate-400">Balancing Philippine living indices, AI leverage multiplier, and family remittance vectors</div>
        </div>
      `;
    }

    try {
      const portals = await geminiService.generateDynamicPortals(hero);
      activeDestinyPortals = portals;
      this.syncPortalsToForkTimelines(portals);

      if (bannerText) {
        if (isAuth) {
          bannerText.innerHTML = `✨ GEMINI 2.5 AI LIVE: 3 Bespoke Portals Synthesized for <strong>${hero.className}</strong> (₱${Math.round(hero.income/1000)}k/mo, ${hero.location})`;
        } else {
          bannerText.innerHTML = `
            <div class="flex flex-wrap items-center justify-between w-full gap-2 font-mono text-xs">
              <span class="text-slate-300">📊 STANDARD ALGORITHMIC ENGINE (GUEST MODE) // Calibrated to PH Economic Indices & BIR 8% Tax</span>
              <button type="button" onclick="app.openGoogleAuthModal()" class="btn-brutal px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 border border-slate-950 shadow-sm">
                <i class="fa-brands fa-google text-slate-900"></i>
                <span>UNLOCK GEMINI LIVE AI</span>
              </button>
            </div>
          `;
        }
      }

      if (container && Array.isArray(portals)) {
        container.innerHTML = '';
        portals.forEach((p, idx) => {
          const borderClass = p.theme === 'emerald' ? 'border-emerald-500 shadow-brutal-emerald' : (p.theme === 'purple' ? 'border-purple-500 shadow-brutal-purple' : 'border-sky-500 shadow-brutal-cyan');
          const badgeBg = p.theme === 'emerald' ? 'bg-emerald-400 text-slate-950' : (p.theme === 'purple' ? 'bg-purple-500 text-white' : 'bg-rpg-gold text-slate-950');
          const titleColor = p.theme === 'emerald' ? 'text-rpg-emerald' : (p.theme === 'purple' ? 'text-rpg-void' : 'text-rpg-mana');
          const btnBg = p.theme === 'emerald' ? 'bg-rpg-emerald hover:bg-emerald-400 text-slate-950' : (p.theme === 'purple' ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-rpg-mana hover:bg-sky-400 text-slate-950');

          const cardWrapper = document.createElement('div');
          cardWrapper.className = 'relative pt-2.5 flex flex-col';
          cardWrapper.innerHTML = `
            <div class="absolute top-0 right-3 z-10 px-2 py-0.5 ${badgeBg} font-bold font-mono text-[9px] border border-slate-950 shadow-sm">
              ${p.badge || 'RECOMMENDED'}
            </div>

            <div onclick="app.enterPortalByIndex(${idx})" class="class-card group bg-dungeon-900 border-2 ${borderClass} hover:border-rpg-gold p-4 flex-1 flex flex-col justify-between cursor-pointer transition-all">
              <div>
                <div class="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span class="${titleColor} font-bold">${p.portalTag || `PORTAL 0${idx+1}`}</span>
                  <span class="text-rpg-gold font-bold">[ACTIVE]</span>
                </div>

                <div class="text-[10px] text-slate-400 font-mono uppercase mb-1">
                  ${p.targetProfile || 'CALIBRATED PATHWAY'}
                </div>

                <h3 class="text-sm font-bold text-white font-mono uppercase tracking-tight mb-2.5">
                  ${p.title}
                </h3>

                <div class="space-y-1 text-xs font-mono py-2 border-y border-slate-800 mb-2.5 bg-dungeon-950/70 px-2.5">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400 text-[11px]">5-YR WEALTH:</span>
                    <span class="font-bold text-rpg-gold">${p.wealthGrowth}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400 text-[11px]">TAX CODE:</span>
                    <span class="font-bold ${titleColor}">${p.taxCode}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400 text-[11px]">COMMUTE:</span>
                    <span class="text-slate-200">${p.commute}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400 text-[11px]">AI MULTIPLIER:</span>
                    <span class="text-slate-300">${p.multiplier}</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1 mb-3 text-[9px] font-mono">
                  ${(p.buffs || []).map(b => `<span class="px-1.5 py-0.5 border border-slate-800 text-slate-300 bg-dungeon-950">${b}</span>`).join('')}
                </div>

                <div class="space-y-1.5 text-[10px] font-mono mb-3">
                  <div>
                    <div class="flex justify-between text-slate-400 mb-0.5">
                      <span>WEALTH VELOCITY</span>
                      <span class="text-rpg-gold font-bold">${p.wealthScore || 90} / 100</span>
                    </div>
                    <div class="stat-bar-track"><div class="stat-bar-fill-yellow" style="width: ${p.wealthScore || 90}%;"></div></div>
                  </div>

                  <div>
                    <div class="flex justify-between text-slate-400 mb-0.5">
                      <span>CAREER AUTONOMY</span>
                      <span class="text-rpg-mana font-bold">${p.autonomyScore || 88} / 100</span>
                    </div>
                    <div class="stat-bar-track"><div class="stat-bar-fill-cyan" style="width: ${p.autonomyScore || 88}%;"></div></div>
                  </div>

                  <div>
                    <div class="flex justify-between text-slate-400 mb-0.5">
                      <span>STRESS REDUCTION</span>
                      <span class="text-emerald-400 font-bold">${p.stressReduction || 75} / 100 [SAFE]</span>
                    </div>
                    <div class="stat-bar-track"><div class="stat-bar-fill-cyan" style="width: ${p.stressReduction || 75}%;"></div></div>
                  </div>
                </div>
              </div>

              <button class="w-full py-1.5 ${btnBg} font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 border border-slate-950 shadow-sm">
                <i class="fa-solid fa-bolt text-xs"></i>
                <span>${p.btnLabel || 'STEP INTO PORTAL →'}</span>
              </button>
            </div>
          `;
          container.appendChild(cardWrapper);
        });
      }
    } catch (err) {
      console.error('[app] Portal synthesis failed:', err);
    }
  },

  enterPortalByIndex(idx) {
    if (activeDestinyPortals && activeDestinyPortals[idx]) {
      const p = activeDestinyPortals[idx];
      this.enterPortal(p.id || (idx === 0 ? 'tech' : (idx === 1 ? 'nomad' : 'custom')), p.title, p, idx);
    } else {
      const fallbackKeys = ['tech', 'nomad', 'custom'];
      this.enterPortal(fallbackKeys[idx] || 'tech', '', null, idx);
    }
  },

  async enterPortal(scenarioKey, customPrompt = '', portalData = null, targetForkIndex = null) {
    activeScenarioKey = scenarioKey;
    soundEngine.playDoorHum();

    // Determine target fork index (0, 1, or 2)
    const forkIdx = (targetForkIndex !== null && targetForkIndex !== undefined)
      ? targetForkIndex 
      : (scenarioKey === 'nomad' ? 1 : (scenarioKey === 'custom' ? 2 : 0));
    activeForkIndex = forkIdx;

    // Check Vault Quota for Guest Users
    if (!currentUser.isLoggedIn && whatIfVault.length >= currentUser.maxVaultSlots) {
      whatIfVault.pop();
    }

    const title = portalData?.title || customPrompt || (scenarioKey === 'nomad' ? 'Coastal Provincial Remote WFH' : (scenarioKey === 'custom' ? (hero.customDesire || 'Custom Multiverse Pathway') : 'IT & Cybersecurity Cloud Consulting'));

    this.navTo('screen-portal-loading');
    const titleEl = document.getElementById('portalLoadingScenarioTitle');
    if (titleEl) titleEl.innerText = `SIMULATING TIMELINE: ${title.toUpperCase()}`;

    const logs = [
      { t: 0, l1: `> Opening timeline rift with Gemini Multiverse Engine...`, l2: `> Injecting Hero Baseline: ₱${(hero.income||45000).toLocaleString()}/mo | Savings: ₱${(hero.savings||120000).toLocaleString()}...`, l3: `> Factoring ₱${(hero.familyRemittance||0).toLocaleString()}/mo remittance drag...`, p: '30%' },
      { t: 700, l1: `> Computing Equalizer velocity: AI Leverage (${hero.aiLeverage}) + Social Capital...`, l2: `> Health Shield: ${hero.hmoShield} | Commute: ${hero.commuteHours}h/day...`, l3: `> Synthesizing 2026-2030 yearly cashflows & localized curveballs...`, p: '70%' },
      { t: 1400, l1: `> Converging 5-Year Philippine probability distribution nodes...`, l2: `> Compounding Pag-IBIG MP2 & BIR 8% flat-rate ledger...`, l3: `> Multiverse Timeline generated! Launching Analytical Dashboard...`, p: '100%' }
    ];

    logs.forEach(step => {
      setTimeout(() => {
        soundEngine.playBlip();
        const l1 = document.getElementById('terminalLog1');
        const l2 = document.getElementById('terminalLog2');
        const l3 = document.getElementById('terminalLog3');
        const bar = document.getElementById('portalProgressBar');
        if (l1) l1.innerText = step.l1;
        if (l2) l2.innerText = step.l2;
        if (l3) l3.innerText = step.l3;
        if (bar) bar.style.width = step.p;
      }, step.t);
    });

    // Run AI Timeline Simulation in Parallel
    try {
      const simResult = await geminiService.generateTimelineSimulation(hero, scenarioKey, title);
      if (simResult && simResult.years) {
        const emoji = forkIdx === 0 ? '⚡ ' : (forkIdx === 1 ? '🌴 ' : '✨ ');
        const cleanTitle = title.startsWith('⚡') || title.startsWith('🌴') || title.startsWith('✨')
          ? title 
          : `${emoji}${title}`;

        FORK_TIMELINES[forkIdx] = {
          id: `fork_${forkIdx === 0 ? 'alpha' : (forkIdx === 1 ? 'beta' : 'gamma')}`,
          title: cleanTitle,
          desc: simResult.overallStrategicThesis ? (simResult.overallStrategicThesis.slice(0, 80) + '...') : (portalData?.taxCode || 'Calibrated 5-Year Pathway'),
          badge: portalData?.badge || (forkIdx === 0 ? 'ACTIVE REALITY' : (forkIdx === 1 ? 'FORK B' : 'CUSTOM DESIRE')),
          scenarioKey: scenarioKey,
          portalData: portalData,
          years: simResult.years,
          curveball: simResult.curveball,
          quests: simResult.quests,
          overallStrategicThesis: simResult.overallStrategicThesis
        };
      }
    } catch (e) {
      console.warn('[app] Live simulation synthesis error, using calculated engine:', e);
    }

    // Save into What-If Vault
    const newSim = {
      id: 'whatif_' + Date.now(),
      title: title,
      createdAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      scenarioKey: scenarioKey,
      syncedToCloud: currentUser.isLoggedIn
    };
    whatIfVault.unshift(newSim);
    localStorage.setItem('lifesim_whatif_vault', JSON.stringify(whatIfVault));
    if (currentUser.isLoggedIn) {
      await firebaseService.saveVaultItem(currentUser.uid, newSim);
    }
    this.renderVaultModal();

    setTimeout(() => {
      soundEngine.playLevelUp();
      this.switchForkTimeline(forkIdx);
      this.navTo('screen-dashboard', 'Multiverse');
    }, 1800);
  },

  switchForkTimeline(index) {
    soundEngine.playSelect();
    activeForkIndex = index;

    // Ensure target fork has simulation data
    const fork = FORK_TIMELINES[index];
    if (!fork || !fork.years) {
      const fallbackSim = geminiService.buildCalculatedSimulation(hero, fork?.title || 'Alternative Pathway', fork?.scenarioKey || 'tech');
      if (fork) {
        fork.years = fallbackSim.years;
        fork.curveball = fallbackSim.curveball;
        fork.quests = fallbackSim.quests;
        fork.overallStrategicThesis = fallbackSim.overallStrategicThesis;
      }
    }

    timelineEngine.updateDashboardMetrics();
    timelineEngine.initCharts();
  },

  renderVaultModal() {
    const vGrid = document.getElementById('whatIfVaultGrid');
    const vEmpty = document.getElementById('whatIfVaultEmpty');
    const hCount = document.getElementById('headerVaultCount');
    const vQuota = document.getElementById('vaultStorageQuotaLabel');
    const vUpgradeBanner = document.getElementById('vaultGuestUpgradeBanner');

    if (hCount) hCount.innerText = whatIfVault.length;

    if (vQuota) {
      if (currentUser.isLoggedIn) {
        vQuota.innerHTML = `<span class="text-rpg-emerald font-bold"><i class="fa-solid fa-cloud mr-1"></i> CLOUD SYNCED (UNLIMITED)</span>`;
      } else {
        vQuota.innerHTML = `<span class="text-rpg-gold font-bold">GUEST STORAGE: ${whatIfVault.length}/${currentUser.maxVaultSlots} SLOTS USED</span>`;
      }
    }

    if (vUpgradeBanner) {
      if (!currentUser.isLoggedIn && whatIfVault.length >= currentUser.maxVaultSlots) {
        vUpgradeBanner.classList.remove('hidden');
      } else {
        vUpgradeBanner.classList.add('hidden');
      }
    }

    if (vGrid && vEmpty) {
      if (whatIfVault.length === 0) {
        vGrid.innerHTML = '';
        vEmpty.classList.remove('hidden');
      } else {
        vEmpty.classList.add('hidden');
        vGrid.innerHTML = '';

        whatIfVault.forEach(sim => {
          const card = document.createElement('div');
          card.className = 'bg-dungeon-950 border border-slate-800 p-3 flex flex-col justify-between font-mono text-xs';
          card.innerHTML = `
            <div>
              <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                <span class="text-rpg-gold font-bold">TIMELINE FORK</span>
                <span>${sim.createdAt}</span>
              </div>
              <h4 class="font-bold text-white text-xs mb-2">${sim.title}</h4>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-850">
              <button onclick="app.switchForkTimeline(${sim.scenarioKey === 'nomad' ? 1 : 0}); app.closeWhatIfVaultModal(); app.navTo('screen-dashboard', 'Multiverse');" class="btn-brutal px-3 py-1 bg-sky-950 text-rpg-mana border border-rpg-mana text-[10px] font-bold">
                VIEW DASHBOARD
              </button>
              <button onclick="app.deleteVaultItem('${sim.id}')" class="text-slate-500 hover:text-rose-400 text-xs" title="Delete Timeline">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `;
          vGrid.appendChild(card);
        });
      }
    }
  },

  async deleteVaultItem(id) {
    soundEngine.playBlip();
    whatIfVault = whatIfVault.filter(v => v.id !== id);
    localStorage.setItem('lifesim_whatif_vault', JSON.stringify(whatIfVault));
    if (currentUser.isLoggedIn) {
      await firebaseService.deleteVaultItem(currentUser.uid, id);
    }
    this.renderVaultModal();
  },

  openWhatIfVaultModal() {
    soundEngine.playPowerup();
    this.renderVaultModal();
    const modal = document.getElementById('whatIfVaultModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeWhatIfVaultModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('whatIfVaultModal');
    if (modal) modal.classList.add('hidden');
  },

  openCustomModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('customScenarioModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeCustomModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('customScenarioModal');
    if (modal) modal.classList.add('hidden');
  },

  fillCustomPreset(txt) {
    soundEngine.playSelect();
    const input = document.getElementById('customPromptInput');
    if (input) input.value = txt;
  },

  submitCustomScenario() {
    const input = document.getElementById('customPromptInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      alert('Please enter your custom desire statement!');
      return;
    }
    this.closeCustomModal();
    this.enterPortal('custom', val);
  },

  openAdminModal() {
    soundEngine.playPowerup();
    const modal = document.getElementById('adminGeminiModal');
    if (modal) {
      const input = document.getElementById('inputGeminiApiKey');
      const sel = document.getElementById('selectGeminiModel');
      const customInput = document.getElementById('inputCustomGeminiModel');
      const customWrap = document.getElementById('customModelWrapper');
      
      const savedKey = geminiService.getApiKey();
      const savedModel = geminiService.getModel();
      
      if (input) input.value = savedKey;
      if (sel) {
        if (['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'].includes(savedModel)) {
          sel.value = savedModel;
          if (customWrap) customWrap.classList.add('hidden');
        } else {
          sel.value = 'custom';
          if (customInput) customInput.value = savedModel;
          if (customWrap) customWrap.classList.remove('hidden');
        }
      }
      modal.classList.remove('hidden');
    }
  },

  closeAdminModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('adminGeminiModal');
    if (modal) modal.classList.add('hidden');
  },

  onModelSelectChange() {
    const sel = document.getElementById('selectGeminiModel');
    const wrap = document.getElementById('customModelWrapper');
    if (sel && wrap) {
      wrap.classList.toggle('hidden', sel.value !== 'custom');
    }
  },

  saveAdminApiKey() {
    soundEngine.playLevelUp();
    const key = document.getElementById('inputGeminiApiKey')?.value.trim();
    const sel = document.getElementById('selectGeminiModel')?.value;
    const customTag = document.getElementById('inputCustomGeminiModel')?.value.trim();
    const model = sel === 'custom' ? (customTag || 'gemini-2.5-flash') : (sel || 'gemini-2.5-flash');

    geminiService.setApiKey(key);
    geminiService.setModel(model);

    alert(key ? `✨ Gemini AI Activated!\nModel: ${model}\nLive Multiverse Synthesis ready.` : 'ℹ️ Gemini API Key cleared. Using standard simulation engine.');
    this.closeAdminModal();

    // Refresh portal view or banner if active
    const doorsScreen = document.getElementById('screen-hall-of-doors');
    if (doorsScreen && !doorsScreen.classList.contains('hidden')) {
      this.synthesizeAndRenderPortals();
    }
  },

  generateAndGoToQuestLog() {
    soundEngine.playLevelUp();
    this.renderQuestItems();
    this.navTo('screen-quest-tracker', 'Quest Log');
  },

  renderQuestItems() {
    const defaultQuests = {
      treasury: [
        { id: 'q1', text: 'Seed ₱120k Emergency Buffer into Digital High-Yield Bank (6.5% p.a.)' },
        { id: 'q2', text: 'Initiate Pag-IBIG MP2 Government Dividend Compounding (Target ₱500k by 2028)' }
      ],
      skills: [
        { id: 'q3', text: 'Integrate Generative AI LLM Agents into proposal & sprint automation workflows' },
        { id: 'q4', text: 'Acquire Arcane Cloud & Cybersecurity Practitioner Certification' }
      ],
      bureaucracy: [
        { id: 'q5', text: 'Register with BIR Form 1901 under 8% Gross Flat Rate Income Tax Regime' },
        { id: 'q6', text: 'Automate Quarterly 1701Q Tax Declarations to prevent audit curveballs' }
      ],
      mana: [
        { id: 'q7', text: 'Eliminate daily 3.5h EDSA commute by enforcing asynchronous WFH contract terms' },
        { id: 'q8', text: 'Lock Comprehensive Family HMO Shield with ₱200,000 MBL Coverage' }
      ]
    };

    const currentFork = FORK_TIMELINES[activeForkIndex] || FORK_TIMELINES[0];
    const quests = (currentFork && currentFork.quests) ? currentFork.quests : defaultQuests;

    ['treasury', 'skills', 'bureaucracy', 'mana'].forEach(cat => {
      const container = document.getElementById(`category-${cat}`);
      if (!container) return;
      container.innerHTML = '';

      quests[cat].forEach(q => {
        const isDone = completedQuests.has(q.id);
        const item = document.createElement('div');
        item.className = `p-2.5 border text-xs font-mono flex items-start gap-2.5 cursor-pointer select-none transition-all ${
          isDone ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300' : 'bg-dungeon-950 border-slate-800 hover:border-slate-600 text-slate-200'
        }`;
        item.onclick = () => app.toggleQuest(q.id);
        item.innerHTML = `
          <div class="w-4 h-4 mt-0.5 border ${isDone ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-bold' : 'border-slate-600 bg-dungeon-900'} flex items-center justify-center text-[10px]">
            ${isDone ? '✓' : ''}
          </div>
          <span class="${isDone ? 'line-through opacity-75' : ''}">${q.text}</span>
        `;
        container.appendChild(item);
      });
    });

    this.updateQuestProgress();
  },

  async toggleQuest(id) {
    const completed = !completedQuests.has(id);
    if (completedQuests.has(id)) {
      completedQuests.delete(id);
      soundEngine.playBlip();
    } else {
      completedQuests.add(id);
      soundEngine.playPowerup();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      }
    }
    if (currentUser.isLoggedIn) {
      await firebaseService.saveQuestLog(currentUser.uid, id, completed);
    }
    this.renderQuestItems();
  },

  updateQuestProgress() {
    const done = completedQuests.size;
    const total = 8;
    const cEl = document.getElementById('questCompletedCount');
    const bar = document.getElementById('questProgressBar');
    if (cEl) cEl.innerText = done;
    if (bar) bar.style.width = `${(done / total) * 100}%`;
  },

  exportQuestScroll() {
    soundEngine.playLevelUp();
    const modal = document.getElementById('questScrollModal');
    const body = document.getElementById('scrollContentBody');
    const headerTitle = document.getElementById('scrollHeroTitle');

    if (headerTitle) {
      headerTitle.innerText = currentUser.isLoggedIn
        ? `OFFICIAL HERO DECREE: ${currentUser.displayName.toUpperCase()}`
        : `HERO ACTION DECREE: GUEST SIMULATION`;
    }

    if (body) {
      const sealBadge = currentUser.isLoggedIn ? `
        <div class="bg-amber-950/40 border border-rpg-gold p-2 text-center text-rpg-gold font-bold text-xs mb-2">
          ★ OFFICIAL SEAL: ${currentUser.verifiedSealNumber} // GOOGLE VERIFIED HERO ★
        </div>
      ` : `
        <div class="bg-rose-950/40 border border-rose-500 p-2 text-center text-rose-400 font-bold text-xs mb-2">
          ⚠ UNVERIFIED GUEST SIMULATION // LOCAL CACHE ONLY (Sign in to issue official seal)
        </div>
      `;

      const currentFork = FORK_TIMELINES[activeForkIndex] || FORK_TIMELINES[0];
      const target2030 = currentFork.years['2030'] ? `₱${(currentFork.years['2030'].cumulativeSavings / 1000000).toFixed(2)}M` : '₱3.85M';
      const questList = currentFork.quests ? [
        ...(currentFork.quests.treasury || []).map(q => q.text),
        ...(currentFork.quests.skills || []).map(q => q.text),
        ...(currentFork.quests.bureaucracy || []).map(q => q.text),
        ...(currentFork.quests.mana || []).map(q => q.text)
      ] : [
        'Seed ₱120k Emergency Buffer into Digital High-Yield Bank (6.5% p.a.)',
        'Initiate Pag-IBIG MP2 Government Dividend Compounding (Target ₱500k by 2028)',
        'Integrate Generative AI LLM Agents into proposal & sprint automation workflows',
        'Register under BIR 8% Gross Flat Rate Income Tax Regime',
        'Lock Comprehensive Family HMO Shield with ₱200,000 MBL Coverage',
        'Eliminate daily commute with asynchronous remote contract terms'
      ];

      body.innerHTML = `
        ${sealBadge}
        <div class="bg-dungeon-950 p-4 border border-slate-800 space-y-3 font-mono text-xs">
          <div class="grid grid-cols-2 gap-2 text-slate-400 border-b border-slate-800 pb-2">
            <div>HERO: <strong class="text-white">${currentUser.isLoggedIn ? currentUser.displayName : hero.className}</strong></div>
            <div>STATUS: <strong class="text-rpg-gold">BIR 8% FLAT TAX ACTIVE</strong></div>
            <div>ZONE: <strong class="text-white">${hero.location}</strong></div>
            <div>TARGET 2030: <strong class="text-rpg-mana">${target2030} WEALTH</strong></div>
          </div>
          <div>
            <div class="text-rpg-gold font-bold uppercase text-[10px] mb-1">■ 8-POINT PARALLEL ACTION DECREE:</div>
            <ul class="space-y-1 text-slate-300 text-[11px] list-disc pl-4">
              ${questList.map(q => `<li>${q}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
    if (modal) modal.classList.remove('hidden');
  },

  closeQuestScrollModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('questScrollModal');
    if (modal) modal.classList.add('hidden');
  },

  copyScrollText() {
    const body = document.getElementById('scrollContentBody');
    const btn = document.getElementById('btnCopyScrollText');
    if (!body) return;
    navigator.clipboard.writeText(body.innerText).then(() => {
      soundEngine.playPowerup();
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> COPIED!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
      }
    });
  },

  clearAppData() {
    soundEngine.playBlip();
    if (confirm('Clear local cache and reset simulation states?')) {
      localStorage.removeItem('lifesim_whatif_vault');
      localStorage.removeItem('lifesim_auth_user');
      whatIfVault = [];
      location.reload();
    }
  }
};

// --- 7. KEYBOARD SHORTCUTS CONTROLLER ---
document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    if (e.ctrlKey && e.shiftKey && (e.key === '1' || e.key === '!' || e.code === 'Digit1')) {
      e.preventDefault();
      app.openAdminModal();
    }
    return;
  }

  // Hotkey: Ctrl + Shift + 1 for Admin Modal
  if (e.ctrlKey && e.shiftKey && (e.key === '1' || e.key === '!' || e.code === 'Digit1')) {
    e.preventDefault();
    app.openAdminModal();
    return;
  }

  const classScreen = document.getElementById('screen-class-select');
  const doorsScreen = document.getElementById('screen-hall-of-doors');

  // Hotkeys on Hall of Doors
  if (doorsScreen && !doorsScreen.classList.contains('hidden')) {
    if (e.key === '1') {
      e.preventDefault();
      app.enterPortal('tech');
      return;
    } else if (e.key === '2') {
      e.preventDefault();
      app.enterPortal('nomad');
      return;
    } else if (e.key === '3') {
      e.preventDefault();
      app.openCustomModal();
      return;
    }
  }

  // Hotkey: 1, 2, 3, 4 Direct Archetype Select
  if (classScreen && !classScreen.classList.contains('hidden')) {
    if (e.key === '1') {
      e.preventDefault();
      app.selectClass('bpo');
    } else if (e.key === '2') {
      e.preventDefault();
      app.selectClass('freelancer');
    } else if (e.key === '3') {
      e.preventDefault();
      app.selectClass('freshgrad');
    } else if (e.key === '4' || e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      app.selectClass('custom');
      app.navTo('screen-character-sheet', 'Calibration');
    }
  }

  // Hotkey: Enter to calibrate / proceed
  if (e.key === 'Enter') {
    const classScreen = document.getElementById('screen-class-select');
    const sheetScreen = document.getElementById('screen-character-sheet');
    if (classScreen && !classScreen.classList.contains('hidden')) {
      e.preventDefault();
      app.navTo('screen-character-sheet', 'Calibration');
    } else if (sheetScreen && !sheetScreen.classList.contains('hidden')) {
      e.preventDefault();
      app.saveCharacterSheet();
    }
  }

  // Hotkey: Escape for Vault Modal
  if (e.key === 'Escape') {
    e.preventDefault();
    const vaultModal = document.getElementById('whatIfVaultModal');
    if (vaultModal && !vaultModal.classList.contains('hidden')) {
      app.closeWhatIfVaultModal();
    } else {
      app.openWhatIfVaultModal();
    }
  }

  // Hotkey: B for Theme Toggle
  if (e.key === 'b' || e.key === 'B') {
    e.preventDefault();
    app.toggleTheme();
  }

  // Hotkey: Space for advancing to Quest Log
  if (e.key === ' ') {
    const curActive = document.querySelector('.screen-view.active');
    if (curActive && curActive.id === 'screen-dashboard') {
      e.preventDefault();
      app.navTo('screen-quest-tracker', 'Quest Log');
    }
  }
});

// --- 8. INITIAL HYDRATION & BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = localStorage.getItem('lifesim_whatif_vault');
    if (saved) whatIfVault = JSON.parse(saved);
  } catch (e) {
    whatIfVault = [];
  }
  if (typeof firebaseService !== 'undefined') {
    firebaseService.init();
  }
  app.initTheme();
  app.initAuth();
  app.selectClass('bpo');
  app.renderVaultModal();
  console.log('🚀 LifeSim.ai Multiverse Engine V2.4_PH Active with Firebase Auth!');
});
