// =========================================================================
// LIFESIM.AI - THE MULTIVERSE ENGINE (PH EDITION)
// CORE APPLICATION LOGIC: SOUND ENGINE, MODELS, SIMULATION & GEMINI AI
// =========================================================================
import { auth, db } from "../lib/firebase.ts";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { calculateFallbackSimulation, sanitizeHeroState, SIMULATION_YEARS } from "./simulationEngine.js";

// --- 1. ZERO-DEPENDENCY 8-BIT SOUND SYNTHESIZER (Web Audio API) ---
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
    const text = document.getElementById('soundText');
    if (this.enabled) {
      icon.className = "fa-solid fa-volume-high text-rpg-emerald";
      text.innerText = "SFX: ON";
      this.playPowerup();
    } else {
      icon.className = "fa-solid fa-volume-xmark text-slate-500";
      text.innerText = "SFX: OFF";
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
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  playBlip() {
    this.playTone(440, 'square', 0.05);
  }

  playSelect() {
    this.playTone(330, 'square', 0.04);
    this.playTone(550, 'square', 0.06, 0.05);
  }

  playPowerup() {
    this.playTone(261.63, 'square', 0.06, 0.00);
    this.playTone(329.63, 'square', 0.06, 0.06);
    this.playTone(392.00, 'square', 0.06, 0.12);
    this.playTone(523.25, 'square', 0.14, 0.18);
  }

  playLevelUp() {
    this.playTone(330, 'square', 0.06, 0.00);
    this.playTone(392, 'square', 0.06, 0.06);
    this.playTone(659, 'square', 0.08, 0.12);
    this.playTone(523, 'square', 0.08, 0.18);
    this.playTone(587, 'square', 0.08, 0.24);
    this.playTone(784, 'square', 0.25, 0.30);
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

// --- 2. HERO STATE & CLASS ARCHETYPES ---
const CLASS_ARCHETYPES = {
  bpo: {
    id: 'bpo',
    className: 'The BPO Night Owl',
    archetypeTitle: 'Corporate Tank',
    baseIncome: 45000,
    baseSavings: 120000,
    wealth: 75,
    stress: 85,
    freedom: 35,
    workSetup: 'On-Site',
    commuteHours: 3.5,
    guild: 'BPO',
    hmoShield: 'Comprehensive',
    familySafetyNet: 'SandwichGen',
    familyRemittance: 10000,
    aiLeverage: 'Traditional',
    socialCapital: 'LoneWolf',
    learningVelocity: 'Steady',
    desireVector: 'DollarClients',
    riskStance: 'Paladin'
  },
  freelancer: {
    id: 'freelancer',
    className: 'Hustling Freelancer',
    archetypeTitle: 'Agile Mage',
    baseIncome: 65000,
    baseSavings: 180000,
    wealth: 80,
    stress: 55,
    freedom: 85,
    workSetup: 'Remote',
    commuteHours: 0,
    guild: 'Freelance',
    hmoShield: 'Solo',
    familySafetyNet: 'SelfSufficient',
    familyRemittance: 5000,
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
    wealth: 30,
    stress: 40,
    freedom: 70,
    workSetup: 'On-Site',
    commuteHours: 3,
    guild: 'Tech',
    hmoShield: 'Solo',
    familySafetyNet: 'SelfSufficient',
    familyRemittance: 3000,
    aiLeverage: 'AiAugmented',
    socialCapital: 'CommunityPeer',
    learningVelocity: 'HyperAdaptive',
    desireVector: 'DollarClients',
    riskStance: 'Guardian'
  },
  custom: {
    id: 'custom',
    className: 'Custom Hero Rogue',
    archetypeTitle: 'Wildcard Rogue',
    baseIncome: 50000,
    baseSavings: 100000,
    wealth: 60,
    stress: 60,
    freedom: 60,
    workSetup: 'Hybrid',
    commuteHours: 1.5,
    guild: 'Corporate',
    hmoShield: 'Solo',
    familySafetyNet: 'SandwichGen',
    familyRemittance: 8000,
    aiLeverage: 'AiAugmented',
    socialCapital: 'CommunityPeer',
    learningVelocity: 'Steady',
    desireVector: 'OwnBusiness',
    riskStance: 'Paladin'
  }
};

let hero = {
  id: 'bpo',
  className: 'The BPO Night Owl',
  archetypeTitle: 'Corporate Tank',
  age: 25,
  location: 'Metro Manila',
  income: 45000,
  savings: 120000,
  partySize: 1,
  workSetup: 'On-Site',
  commuteHours: 3.5,
  guild: 'BPO',
  debtType: 'None',
  debtPayment: 0,
  hmoShield: 'Comprehensive',
  familySafetyNet: 'SandwichGen',
  familyRemittance: 10000,
  aiLeverage: 'AiAugmented',
  socialCapital: 'CommunityPeer',
  learningVelocity: 'HyperAdaptive',
  desireVector: 'DollarClients',
  riskStance: 'Paladin'
};

// --- 3. MULTIVERSE SCENARIO BLUEPRINTS & FORMULAS (2026-2030) ---
const SCENARIOS = {
  tech: {
    id: 'tech',
    name: 'Shift to IT & Cybersecurity',
    shortName: 'IT & Cyber Portal',
    desc: 'Invest in certs, transition to foreign contract retainers, leverage BIR 8% flat tax.',
    color: '#06b6d4',
    years: {
      2026: {
        phase: 'Phase 1: The Transition Dip & Night Lab Grind',
        narrative: 'You study CompTIA/AWS labs after work hours. Income stays stable at baseline while emergency fund cushions certification fees.',
        baseMultiplier: 1.05,
        savingsRate: 0.20,
        stress: 72,
        freeHours: 14,
        wealthScore: 50,
        mindScore: 55,
        freedom: 40,
        curveball: {
          category: '🚨 Hardware & Infrastructure Hazard',
          title: 'MacBook GPU Glitch + Metro Monsoon Warning',
          desc: 'Workstation graphics chip fries during exam prep. ₱45,000 replacement absorbed by savings.',
          mitigation: 'Keep at least 3 months living expenses in Maya / Seabank (4.5% p.a.).'
        }
      },
      2027: {
        phase: 'Phase 2: First Foreign USD Retainer ($1.5k/mo)',
        narrative: 'You land an overseas security analyst contract. Register BIR 8% flat tax rate to optimize take-home pay.',
        baseMultiplier: 1.85,
        savingsRate: 0.35,
        stress: 60,
        freeHours: 24,
        wealthScore: 68,
        mindScore: 68,
        freedom: 65,
        curveball: {
          category: '🏛️ Philippine Bureaucracy & BIR Code',
          title: 'BIR 2303 & DTI Registration Audit',
          desc: 'Bookkeeper advises moving to Form 1701A (8% Gross Income Tax) saving ₱60k/yr.',
          mitigation: 'Maintain official receipts and pay quarterly taxes on time via eFPS.'
        }
      },
      2028: {
        phase: 'Phase 3: Senior Cloud Consultant ($2.8k/mo)',
        narrative: 'Contract renews at $2,800/mo. Pag-IBIG MP2 account compounding rapidly.',
        baseMultiplier: 2.85,
        savingsRate: 0.45,
        stress: 45,
        freeHours: 30,
        wealthScore: 82,
        mindScore: 78,
        freedom: 80,
        curveball: {
          category: '🏥 Sandwich Generation Family Hazard',
          title: 'Elderly Parent Hospital Shield Test',
          desc: 'Parent requires minor surgery. Standalone HMO and emergency fund cover the ₱180k medical bill.',
          mitigation: 'Secure private HMO (Maxicare/Pacific Cross ₱500k MBL) for senior dependents.'
        }
      },
      2029: {
        phase: 'Phase 4: Sovereign Fractional SecOps Lead ($4k/mo)',
        narrative: 'Managing multiple async clients. Zero commute fatigue; full autonomy.',
        baseMultiplier: 4.10,
        savingsRate: 0.50,
        stress: 35,
        freeHours: 35,
        wealthScore: 92,
        mindScore: 86,
        freedom: 90,
        curveball: {
          category: '📈 Macro Forex & USD Surge',
          title: 'USD/PHP Exchange Rate Hits ₱58.50',
          desc: 'Dollar retainers gain instant 8% purchasing power surge in local currency.',
          mitigation: 'Auto-allocate dollar windfall into high-dividend Pag-IBIG MP2.'
        }
      },
      2030: {
        phase: 'Phase 5: Sovereign Financial Independence in PH',
        narrative: 'MP2 dividends yield ₱250k+/year tax-free. Portfolio and career freedom achieved.',
        baseMultiplier: 4.80,
        savingsRate: 0.55,
        stress: 25,
        freeHours: 40,
        wealthScore: 98,
        mindScore: 95,
        freedom: 98,
        curveball: {
          category: '🏆 Realm Transcendence',
          title: 'The Sovereign Master Milestone',
          desc: 'Net worth crosses ₱6.5M. Passive cashflow covers 100% of living expenses and family support.',
          mitigation: 'Mentor junior Filipino tech creators and preserve capital.'
        }
      }
    },
    quests: {
      treasury: [
        { id: 'q_t1', text: 'Build 3-Month Emergency Fund in Maya/Seabank (₱120,000+)' },
        { id: 'q_t2', text: 'Open Pag-IBIG MP2 Account with automated ₱10,000/mo deposit' }
      ],
      skills: [
        { id: 'q_s1', text: 'Pass CompTIA Security+ or AWS Solutions Architect' },
        { id: 'q_s2', text: 'Deploy AI-accelerated code audit workflow (Cut project delivery time by 50%)' }
      ],
      bureaucracy: [
        { id: 'q_b1', text: 'Register BIR Form 1701A (8% Flat Gross Income Tax)' },
        { id: 'q_b2', text: 'Maintain SSS voluntary contributions at Maximum WISP Plus cap' }
      ],
      mana: [
        { id: 'q_m1', text: 'Procure standalone HMO for senior parents to shield family treasury' },
        { id: 'q_m2', text: 'Build ergonomic work sanctuary (Mesh chair & dual monitor arms)' }
      ]
    }
  },
  nomad: {
    id: 'nomad',
    name: 'Move to Province on Full Remote WFH',
    shortName: 'Nomad Portal',
    desc: 'Relocate to La Union / Siargao / Tagaytay, cut rent by 45%, eliminate EDSA commute.',
    color: '#10b981',
    years: {
      2026: {
        phase: 'Phase 1: The Coastal Sanctuary Relocation',
        narrative: 'Securing Starlink + Solar power generator in La Union. Manila commute drops to 0 hours.',
        baseMultiplier: 1.10,
        savingsRate: 0.35,
        stress: 45,
        freeHours: 28,
        wealthScore: 55,
        mindScore: 80,
        freedom: 75,
        curveball: {
          category: '⚡ Island Infrastructure & Grid Outage',
          title: 'Typhoon Power Grid Interruption',
          desc: 'Local brownout hits for 3 days. 1000Wh Solar station + Starlink keeps client meetings online.',
          mitigation: 'Equip LiFePO4 battery station and backup 5G SIM router.'
        }
      },
      2027: {
        phase: 'Phase 2: Local Cost Arbitrage & Health Compounding',
        narrative: 'Monthly food and rent slashed to ₱22,000. Daily beach run/surfing restores mental peace.',
        baseMultiplier: 1.40,
        savingsRate: 0.45,
        stress: 35,
        freeHours: 32,
        wealthScore: 68,
        mindScore: 90,
        freedom: 85,
        curveball: {
          category: '🏠 Coastal Lease Renewal',
          title: 'Beach Rental Price Increase (Tourism Surge)',
          desc: 'Landlord requests 15% lease hike. You negotiate a 3-year fixed contract.',
          mitigation: 'Lock in multi-year long-term provincial lease agreements.'
        }
      },
      2028: {
        phase: 'Phase 3: Async Remote Agency Retainers',
        narrative: 'Managing 2 international clients asynchronously with zero time zone friction.',
        baseMultiplier: 1.95,
        savingsRate: 0.50,
        stress: 30,
        freeHours: 35,
        wealthScore: 80,
        mindScore: 94,
        freedom: 90,
        curveball: {
          category: '🛵 Provincial Mobility Hazard',
          title: 'Motorcycle Breakdown on Mountain Pass',
          desc: 'Emergency repair costs ₱6,000. Resolved same afternoon.',
          mitigation: 'Maintain local transport maintenance fund.'
        }
      },
      2029: {
        phase: 'Phase 4: Co-Living / Micro-Sanctuary Land Acquisition',
        narrative: 'You purchase a titled provincial lot for future solar homestay retreat.',
        baseMultiplier: 2.45,
        savingsRate: 0.50,
        stress: 25,
        freeHours: 38,
        wealthScore: 88,
        mindScore: 96,
        freedom: 95,
        curveball: {
          category: '📜 Provincial Land Title Verification',
          title: 'Registry of Deeds & LGU Clearance',
          desc: 'Clean title verified through local geodetic engineer.',
          mitigation: 'Always hire licensed geodetic surveyors before rural land deposits.'
        }
      },
      2030: {
        phase: 'Phase 5: Sovereign Coastal Flow State',
        narrative: 'Ultimate harmony: high remote earnings, zero commute, pristine health and peace.',
        baseMultiplier: 2.90,
        savingsRate: 0.55,
        stress: 20,
        freeHours: 42,
        wealthScore: 94,
        mindScore: 99,
        freedom: 99,
        curveball: {
          category: '🌴 Paradise Mastery',
          title: 'Zenith of Health & Autonomy',
          desc: 'Physical health markers at peak levels. Freedom score maxed.',
          mitigation: 'Host remote mastermind retreats for Filipino creators.'
        }
      }
    },
    quests: {
      treasury: [
        { id: 'q_n1', text: 'Secure ₱75,000 relocation & Starlink CapEx fund' },
        { id: 'q_n2', text: 'Automate 50% savings rate directly into Pag-IBIG MP2' }
      ],
      skills: [
        { id: 'q_ns1', text: 'Master asynchronous AI communication tools (Loom, Notion, GPT Agents)' },
        { id: 'q_ns2', text: 'Acquire dual international remote client retainers via high-trust network' }
      ],
      bureaucracy: [
        { id: 'q_nb1', text: 'Transfer Barangay Residency & voter registration to province' },
        { id: 'q_nb2', text: 'Register regional DTI business trade name for local permits' }
      ],
      mana: [
        { id: 'q_nm1', text: 'Acquire 1000Wh Solar Generator backup for brownout resistance' },
        { id: 'q_nm2', text: 'Establish daily 60-min outdoor surf / cycling routine' }
      ]
    }
  },
  custom: {
    id: 'custom',
    name: 'Custom Life Move / Venture',
    shortName: 'Custom Portal',
    desc: 'Bespoke trajectory synthesized by the AI Multiverse Engine.',
    color: '#a855f7',
    years: {
      2026: {
        phase: 'Phase 1: Blueprint Formulation & Validation',
        narrative: 'Testing prototype with initial runway capital. Iterating offer based on local Philippine market demand.',
        baseMultiplier: 0.95,
        savingsRate: 0.15,
        stress: 75,
        freeHours: 15,
        wealthScore: 48,
        mindScore: 60,
        freedom: 50,
        curveball: {
          category: '💼 Initial Product-Market Fit Test',
          title: 'First Customer Churn Alert',
          desc: 'Iterating product pricing to align with local Filipino willingness-to-pay.',
          mitigation: 'Keep personal burn rate below ₱30k/mo during incubation.'
        }
      },
      2027: {
        phase: 'Phase 2: Break-Even & Operational Momentum',
        narrative: 'Revenue surpasses operational overhead. Word-of-mouth creates repeat referrals.',
        baseMultiplier: 1.60,
        savingsRate: 0.30,
        stress: 60,
        freeHours: 20,
        wealthScore: 65,
        mindScore: 72,
        freedom: 65,
        curveball: {
          category: '🏛️ SEC & Mayor’s Business Permit Renewal',
          title: 'LGU Clearance Compliance',
          desc: 'Annual business renewal fees paid with zero penalties.',
          mitigation: 'File quarterly tax returns through certified CPA.'
        }
      },
      2028: {
        phase: 'Phase 3: Scaling & Team Delegation',
        narrative: 'Hiring key operators. Founder transitions from working in the business to on the business.',
        baseMultiplier: 2.50,
        savingsRate: 0.40,
        stress: 50,
        freeHours: 28,
        wealthScore: 78,
        mindScore: 80,
        freedom: 78,
        curveball: {
          category: '👥 Key Employee Retention',
          title: 'Key Staff Incentive Program',
          desc: 'Implemented performance profit-sharing bonus for core team.',
          mitigation: 'Build transparent incentive roadmaps for team members.'
        }
      },
      2029: {
        phase: 'Phase 4: Market Expansion & Brand Dominance',
        narrative: 'Venture expands to multiple branches or B2B enterprise tier clients.',
        baseMultiplier: 3.50,
        savingsRate: 0.45,
        stress: 40,
        freeHours: 32,
        wealthScore: 89,
        mindScore: 88,
        freedom: 85,
        curveball: {
          category: '🏪 Supply Chain Friction',
          title: 'Supplier Logistics Delays',
          desc: 'Diversified supply chain with backup regional suppliers.',
          mitigation: 'Never rely on a single supplier or sole traffic channel.'
        }
      },
      2030: {
        phase: 'Phase 5: Sustainable Sovereign Enterprise',
        narrative: 'Self-sustaining operation generating predictable dividends.',
        baseMultiplier: 4.40,
        savingsRate: 0.50,
        stress: 30,
        freeHours: 38,
        wealthScore: 96,
        mindScore: 92,
        freedom: 94,
        curveball: {
          category: '🏆 Founder Sovereignty',
          title: 'The Sovereign Venture Milestone',
          desc: 'Equity value crosses ₱10M with strong cash dividends.',
          mitigation: 'Reinvest profits into diversified liquid assets & MP2.'
        }
      }
    },
    quests: {
      treasury: [
        { id: 'q_c1', text: 'Secure 6-Month business runway capital buffer' },
        { id: 'q_c2', text: 'Open dedicated business bank account (Separate personal funds)' }
      ],
      skills: [
        { id: 'q_cs1', text: 'Master AI-driven social marketing funnels & direct sales automation' },
        { id: 'q_cs2', text: 'Document end-to-end Standard Operating Procedures (SOPs) in Notion' }
      ],
      bureaucracy: [
        { id: 'q_cb1', text: 'Secure DTI/SEC registration & Mayor’s Business Permit' },
        { id: 'q_cb2', text: 'Register BIR Books of Accounts & Authority to Print (ATP) receipts' }
      ],
      mana: [
        { id: 'q_cm1', text: 'Enforce mandatory 1 full phone-free rest day per week' },
        { id: 'q_cm2', text: 'Join local founder mastermind group for tactical peer accountability' }
      ]
    }
  }
};

let activeScenarioKey = 'tech';
let currentYear = 2026;
let completedQuests = new Set();
let financialChart = null;
let radarChart = null;

// =========================================================================
// 4. 100% DYNAMIC AI-DRIVEN MULTIVERSE SIMULATION ENGINE (GEMINI FLASH)
// =========================================================================
let activeAiSimulationData = null;
let whatIfVault = [];
let activeWhatIfId = null;

// Dynamic Algorithmic Synthesizer combining pure calculation engine with UI narrative enrichment
function buildDynamicCalculatedSimulation(heroState, chosenPathway = 'Multiverse Pathway', scenarioKey = 'custom') {
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

// Master Live Gemini 1.5/2.0/3.6 Flash Multiverse Simulation Function
async function generateFullAiSimulation(heroState, scenarioKey, customPrompt = '') {
  const apiKey = localStorage.getItem('lifesim_gemini_api_key');
  const activeModel = localStorage.getItem('lifesim_gemini_model') || 'gemini-3.6-flash';

  const pathwayNames = {
    tech: 'Shift to High-Income IT, Cloud & Cybersecurity Consulting',
    nomad: 'Relocate to Coastal Province on 100% Asynchronous WFH',
    corp: 'Launch an Independent High-Leverage Philippine Business Venture',
    custom: customPrompt || 'Custom Strategic Multiverse Pathway'
  };

  const chosenPathway = pathwayNames[scenarioKey] || customPrompt || 'Bespoke Multiverse Pathway';

  if (apiKey) {
    const prompt = `You are LifeSim.ai's Multiverse Simulation Engine for the Philippines.
Perform an in-depth, realistic 5-year simulation (2026 to 2030) strictly tailored to this specific Filipino hero:
- Class / Background: ${heroState.className} (Age: ${heroState.age}, Zone: ${heroState.location})
- Current Work Setup: ${heroState.workSetup} with ${heroState.commuteHours} hours daily transit
- Base Salary: ₱${heroState.income.toLocaleString()}/month
- Liquid Savings: ₱${heroState.savings.toLocaleString()}
- Starting Line / Family Safety Net: ${heroState.familySafetyNet}
- Monthly Family Support / Remittance (Sandwich Gen): ₱${heroState.familyRemittance.toLocaleString()}/month
- Debt Payment: ₱${heroState.debtPayment.toLocaleString()}/month (${heroState.debtType})
- Health Shield (HMO): ${heroState.hmoShield}
- The Equalizers: AI Leverage = ${heroState.aiLeverage}, Social Capital = ${heroState.socialCapital}, Learning Velocity = ${heroState.learningVelocity}
- Core Desire: ${heroState.desireVector} (Combat Stance: ${heroState.riskStance})
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

Return ONLY a strictly valid JSON object matching this exact schema without any markdown formatting or code fences:
{
  "scenarioName": "${chosenPathway}",
  "overallStrategicThesis": "Detailed 2-paragraph strategic thesis tailored to this hero...",
  "years": {
    "2026": {
      "phase": "Phase 1 Title",
      "monthlyIncome": 50000,
      "cumulativeSavings": 150000,
      "monthlyExpenses": 32000,
      "stress": 65,
      "freeHours": 20,
      "wealthScore": 55,
      "mindScore": 60,
      "freedomScore": 50,
      "healthScore": 70,
      "narrative": "Detailed narrative for 2026...",
      "curveball": {
        "category": "🚨 Category",
        "title": "Specific Event",
        "desc": "Description...",
        "mitigation": "Tactical mitigation..."
      }
    },
    "2027": {
      "phase": "Phase 2 Title",
      "monthlyIncome": 75000,
      "cumulativeSavings": 320000,
      "monthlyExpenses": 38000,
      "stress": 55,
      "freeHours": 24,
      "wealthScore": 65,
      "mindScore": 68,
      "freedomScore": 60,
      "healthScore": 75,
      "narrative": "Detailed narrative for 2027...",
      "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." }
    },
    "2028": {
      "phase": "Phase 3 Title",
      "monthlyIncome": 120000,
      "cumulativeSavings": 650000,
      "monthlyExpenses": 45000,
      "stress": 45,
      "freeHours": 28,
      "wealthScore": 78,
      "mindScore": 75,
      "freedomScore": 75,
      "healthScore": 80,
      "narrative": "Detailed narrative for 2028...",
      "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." }
    },
    "2029": {
      "phase": "Phase 4 Title",
      "monthlyIncome": 180000,
      "cumulativeSavings": 1400000,
      "monthlyExpenses": 55000,
      "stress": 35,
      "freeHours": 35,
      "wealthScore": 88,
      "mindScore": 85,
      "freedomScore": 88,
      "healthScore": 85,
      "narrative": "Detailed narrative for 2029...",
      "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." }
    },
    "2030": {
      "phase": "Phase 5 Title",
      "monthlyIncome": 250000,
      "cumulativeSavings": 2800000,
      "monthlyExpenses": 650000,
      "stress": 25,
      "freeHours": 40,
      "wealthScore": 96,
      "mindScore": 92,
      "freedomScore": 95,
      "healthScore": 90,
      "narrative": "Detailed narrative for 2030...",
      "curveball": { "category": "...", "title": "...", "desc": "...", "mitigation": "..." }
    }
  },
  "quests": {
    "treasury": [
      { "id": "q_t1", "text": "Actionable financial task 1" },
      { "id": "q_t2", "text": "Actionable financial task 2" }
    ],
    "skills": [
      { "id": "q_s1", "text": "Skill task 1" },
      { "id": "q_s2", "text": "Skill task 2" }
    ],
    "bureaucracy": [
      { "id": "q_b1", "text": "Legal/tax task 1" },
      { "id": "q_b2", "text": "Legal/tax task 2" }
    ],
    "mana": [
      { "id": "q_m1", "text": "Health/rest task 1" },
      { "id": "q_m2", "text": "Health/rest task 2" }
    ]
  }
}`;

    const queryAi = async (modelName) => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (!res.ok) throw new Error(`Model ${modelName} returned HTTP ${res.status}`);
      const data = await res.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      return JSON.parse(rawText);
    };

    try {
      const aiData = await queryAi(activeModel);
      if (aiData && aiData.years && aiData.years['2026']) {
        return aiData;
      }
    } catch (err) {
      console.warn(`Gemini AI simulation failed with ${activeModel}, trying fallback model:`, err);
      try {
        const fbData = await queryAi('gemini-2.0-flash');
        if (fbData && fbData.years && fbData.years['2026']) return fbData;
      } catch (fbErr) {
        console.warn('Fallback model failed, generating dynamic calculated simulation.');
      }
    }
  }

  // Pure dynamic algorithmic calculation (Zero static mock answers)
  return buildDynamicCalculatedSimulation(heroState, chosenPathway, scenarioKey);
}

// --- 5. TIMELINE SCRUBBER & SIMULATOR ENGINE ---
const timelineEngine = {
  setYear(year) {
    currentYear = parseInt(year);
    document.getElementById('timelineSlider').value = currentYear;
    soundEngine.playBlip();
    this.updateDashboardMetrics();
  },

  onSliderChange(year) {
    currentYear = parseInt(year);
    soundEngine.playBlip();
    this.updateDashboardMetrics();
  },

  updateDashboardMetrics() {
    if (!activeAiSimulationData || !activeAiSimulationData.years) {
      activeAiSimulationData = buildDynamicCalculatedSimulation(hero, 'Multiverse Pathway', activeScenarioKey);
    }

    const data = activeAiSimulationData.years[currentYear] || activeAiSimulationData.years['2026'];
    const statusQuoMonthly = Math.round((hero.income || 45000) * Math.pow(1.05, currentYear - 2026));
    const growthPercent = (((data.monthlyIncome - statusQuoMonthly) / statusQuoMonthly) * 100).toFixed(1);
    const monthlyExp = data.monthlyExpenses || Math.max(25000, data.monthlyIncome * 0.55);
    const runwayMonths = (data.cumulativeSavings / monthlyExp).toFixed(1);

    document.getElementById('dashScenarioBadge').innerText = `Scenario: ${activeAiSimulationData.scenarioName}`;
    document.getElementById('currentYearDisplay').innerText = currentYear;
    document.getElementById('yearPhaseBadge').innerText = data.phase;
    document.getElementById('yearNarrativeTitle').innerText = `YEAR ${currentYear - 2025}: ${data.phase.toUpperCase()}`;
    document.getElementById('yearNarrativeText').innerText = data.narrative;
    document.getElementById('radarYearLabel').innerText = currentYear;

    document.getElementById('statMonthlyIncome').innerText = `₱${data.monthlyIncome.toLocaleString()}`;
    document.getElementById('statIncomeGrowth').innerHTML = growthPercent >= 0 
      ? `<i class="fa-solid fa-arrow-trend-up"></i> +${growthPercent}% vs Status Quo`
      : `<i class="fa-solid fa-arrow-trend-down text-rose-400"></i> ${growthPercent}% vs Status Quo`;
    document.getElementById('statTotalSavings').innerText = `₱${data.cumulativeSavings.toLocaleString()}`;
    document.getElementById('statSavingsRunway').innerText = `~${runwayMonths} Mos Living Runway in PH`;
    document.getElementById('statStressIndex').innerText = `${data.stress} / 100`;
    document.getElementById('statStressNarrative').innerText = data.stress > 65 
      ? 'High (Sandwich Generation & Grind Phase)' 
      : (data.stress > 40 ? 'Moderate (Balanced Flow)' : 'Zenith (Sovereign Autonomy)');

    document.getElementById('statFreeHours').innerText = `${data.freeHours} hrs/wk`;
    document.getElementById('statFreeTimeDelta').innerText = hero.commuteHours > 0 
      ? `Reclaimed: +${Math.round(hero.commuteHours * 5)}h Commute`
      : `Weekly Discretionary Freedom`;

    // Curveball update
    if (data.curveball) {
      document.getElementById('curveballYearDisplay').innerText = currentYear;
      document.getElementById('curveballCategory').innerText = data.curveball.category;
      document.getElementById('curveballTitle').innerText = data.curveball.title;
      document.getElementById('curveballDescription').innerText = data.curveball.desc;
      document.getElementById('curveballMitigation').innerText = data.curveball.mitigation;
    }

    // Radar chart update
    if (radarChart) {
      radarChart.data.datasets[0].data = [
        data.wealthScore || 60,
        data.mindScore || 65,
        data.freedomScore || 60,
        data.healthScore || 75,
        100 - (data.stress || 50)
      ];
      radarChart.update();
    }
  },

  initCharts() {
    if (!activeAiSimulationData || !activeAiSimulationData.years) {
      activeAiSimulationData = buildDynamicCalculatedSimulation(hero, 'Multiverse Pathway', activeScenarioKey);
    }

    const years = [2026, 2027, 2028, 2029, 2030];
    const statusQuoData = years.map(y => Math.round((hero.income || 45000) * Math.pow(1.05, y - 2026)));
    const projectedData = years.map(y => activeAiSimulationData.years[y].monthlyIncome);

    // 1. Line Chart
    const lineCanvas = document.getElementById('financialChart');
    if (lineCanvas) {
      const ctxLine = lineCanvas.getContext('2d');
      if (financialChart) financialChart.destroy();

      financialChart = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels: ['2026', '2027', '2028', '2029', '2030'],
          datasets: [
            {
              label: 'Status Quo (No Change)',
              data: statusQuoData,
              borderColor: '#64748b',
              backgroundColor: 'rgba(100, 116, 139, 0.1)',
              borderWidth: 3,
              borderDash: [5, 5],
              pointBackgroundColor: '#64748b',
              pointRadius: 4,
              tension: 0.3
            },
            {
              label: 'AI Multiverse Projected (PHP)',
              data: projectedData,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              borderWidth: 4,
              fill: true,
              pointBackgroundColor: '#fbbf24',
              pointBorderColor: '#020617',
              pointBorderWidth: 2,
              pointRadius: 6,
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
              backgroundColor: '#0a0f1d',
              titleFont: { family: '"Press Start 2P"', size: 10 },
              bodyFont: { family: '"JetBrains Mono"', size: 12 },
              borderColor: '#1e293b',
              borderWidth: 2,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ₱${context.raw.toLocaleString()}/mo`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { family: '"JetBrains Mono"', size: 11 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { family: '"JetBrains Mono"', size: 11 },
                callback: (val) => '₱' + (val / 1000) + 'k'
              }
            }
          }
        }
      });
    }

    // 2. Radar Chart
    const radarCanvas = document.getElementById('lifeBalanceRadarChart');
    if (radarCanvas) {
      const ctxRadar = radarCanvas.getContext('2d');
      if (radarChart) radarChart.destroy();

      const curData = activeAiSimulationData.years[currentYear] || activeAiSimulationData.years['2026'];

      radarChart = new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: ['Wealth & Gold', 'Mental Wellbeing', 'Free Time & Stamina', 'Career Sovereignty', 'Health Shield'],
          datasets: [
            {
              label: 'Life Balance Index',
              data: [
                curData.wealthScore || 60,
                curData.mindScore || 65,
                curData.freedomScore || 60,
                curData.healthScore || 75,
                100 - (curData.stress || 50)
              ],
              backgroundColor: 'rgba(139, 92, 246, 0.25)',
              borderColor: '#a855f7',
              borderWidth: 3,
              pointBackgroundColor: '#fbbf24',
              pointBorderColor: '#020617',
              pointRadius: 5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0a0f1d',
              titleFont: { family: '"Press Start 2P"', size: 9 },
              bodyFont: { family: '"JetBrains Mono"', size: 11 },
              borderColor: '#1e293b',
              borderWidth: 2
            }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: {
                color: '#cbd5e1',
                font: { family: '"JetBrains Mono"', size: 10, weight: 'bold' }
              },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: { display: false, stepSize: 20 }
            }
          }
        }
      });
    }
  }
};

// --- 7. MAIN APPLICATION CONTROLLER & NAVIGATION ---
const app = {
  navTo(screenId) {
    soundEngine.playSelect();
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  toggleCRT() {
    const crt = document.getElementById('crtOverlay');
    if (crt) crt.classList.toggle('hidden');
  },

  openFirebaseModal() {
    soundEngine.playBlip();
    document.getElementById('firebaseConfigModal').classList.remove('hidden');
  },

  closeFirebaseModal() {
    soundEngine.playBlip();
    document.getElementById('firebaseConfigModal').classList.add('hidden');
  },

  onModelSelectChange() {
    const sel = document.getElementById('selectGeminiModel');
    const customWrapper = document.getElementById('customModelWrapper');
    if (sel && customWrapper) {
      if (sel.value === 'custom') {
        customWrapper.classList.remove('hidden');
      } else {
        customWrapper.classList.add('hidden');
      }
    }
  },

  openAdminModal() {
    soundEngine.playPowerup();
    const modal = document.getElementById('adminGeminiModal');
    if (modal) {
      const savedKey = localStorage.getItem('lifesim_gemini_api_key') || '';
      const savedModel = localStorage.getItem('lifesim_gemini_model') || 'gemini-3.6-flash';
      
      document.getElementById('inputGeminiApiKey').value = savedKey;
      
      const sel = document.getElementById('selectGeminiModel');
      const customInput = document.getElementById('inputCustomGeminiModel');
      const customWrapper = document.getElementById('customModelWrapper');

      if (['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash'].includes(savedModel)) {
        sel.value = savedModel;
        customWrapper.classList.add('hidden');
      } else {
        sel.value = 'custom';
        customInput.value = savedModel;
        customWrapper.classList.remove('hidden');
      }

      modal.classList.remove('hidden');
    }
  },

  closeAdminModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('adminGeminiModal');
    if (modal) modal.classList.add('hidden');
  },

  saveAdminApiKey() {
    soundEngine.playLevelUp();
    const key = document.getElementById('inputGeminiApiKey').value.trim();
    const sel = document.getElementById('selectGeminiModel');
    const customInput = document.getElementById('inputCustomGeminiModel');

    let chosenModel = sel.value === 'custom' 
      ? (customInput.value.trim() || 'gemini-3.6-flash') 
      : sel.value;

    if (key) {
      localStorage.setItem('lifesim_gemini_api_key', key);
      localStorage.setItem('lifesim_gemini_model', chosenModel);
      alert(`✨ Gemini AI Activated!\nModel: ${chosenModel}\nLive multiverse synthesis is now enabled.`);
    } else {
      localStorage.removeItem('lifesim_gemini_api_key');
      localStorage.removeItem('lifesim_gemini_model');
      alert('ℹ️ Gemini API Key cleared. Using built-in localized simulation engine.');
    }
    this.closeAdminModal();
  },

  async signInWithGoogle() {
    soundEngine.playPowerup();

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      }

      console.log("Google sign-in successful!");
      console.log("UID:", user.uid);
      console.log("Email:", user.email);
      console.log("Name:", user.displayName);

      this.setUserSession({
        uid: user.uid,
        email: user.email,
        name: user.displayName
      });

      this.navTo('screen-class-select');

    } catch (error) {
      console.error("Google sign-in failed:", error);
    }
  },

  async signUpWithEmail(email, password) {
    soundEngine.playPowerup();

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      console.log("Email sign-up successful!");
      console.log("UID:", user.uid);
      console.log("Email:", user.email);

      this.setUserSession({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email
      });

      this.navTo('screen-class-select');

    } catch (error) {
      console.error("Email sign-up failed:", error);
    }
  },

  async signInWithEmail(email, password) {
    soundEngine.playPowerup();

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      console.log("Email sign-in successful!");
      console.log("UID:", user.uid);
      console.log("Email:", user.email);

      this.setUserSession({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email
      });

      this.navTo('screen-class-select');

    } catch (error) {
      console.error("Email sign-in failed:", error);
    }
  },

  setUserSession(user) {
    const badge = document.getElementById('userBadgeContainer');
    const img = document.getElementById('userAvatarImg');
    const topHud = document.getElementById('topHeroHud');
    if (badge && img) {
      badge.classList.remove('hidden');
      badge.classList.add('flex');
      img.src = user.photo;
    }
    if (topHud) {
      topHud.classList.remove('hidden');
      topHud.classList.add('flex');
    }
    document.getElementById('modalFbAuth').innerText = user.name;
  },

  async signOutUser() {
    try {
      await signOut(auth);
      console.log("Sign-out successful!");
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  },

  async signInAsGuest() {
    soundEngine.playPowerup();
    try {
      // Reuse an existing guest session so refreshes/clicks don't create new uids
      const user = auth.currentUser?.isAnonymous
        ? auth.currentUser
        : (await signInAnonymously(auth)).user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: null,
          displayName: "Guest",
          isAnonymous: true,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }

      this.setUserSession({ uid: user.uid, name: "Guest", photo: null });
      this.navTo('screen-class-select');
    } catch (error) {
      console.error("Guest sign-in failed:", error);
    }
  },

  selectClass(classKey) {
    soundEngine.playSelect();
    document.querySelectorAll('.class-card').forEach(c => {
      c.classList.remove('border-rpg-gold', 'bg-dungeon-800', 'shadow-brutal-gold');
      c.classList.add('border-slate-950', 'bg-dungeon-900');
    });

    const selectedCard = document.getElementById(`card-class-${classKey}`);
    if (selectedCard) {
      selectedCard.classList.remove('border-slate-950', 'bg-dungeon-900');
      selectedCard.classList.add('border-rpg-gold', 'bg-dungeon-800', 'shadow-brutal-gold');
    }

    const template = CLASS_ARCHETYPES[classKey] || CLASS_ARCHETYPES.bpo;
    hero.id = template.id;
    hero.className = template.className;
    hero.archetypeTitle = template.archetypeTitle;
    hero.income = template.baseIncome;
    hero.savings = template.baseSavings;
    hero.workSetup = template.workSetup;
    hero.commuteHours = template.commuteHours;
    hero.guild = template.guild;
    hero.hmoShield = template.hmoShield;
    hero.familySafetyNet = template.familySafetyNet;
    hero.familyRemittance = template.familyRemittance;
    hero.aiLeverage = template.aiLeverage;
    hero.socialCapital = template.socialCapital;
    hero.learningVelocity = template.learningVelocity;
    hero.desireVector = template.desireVector;
    hero.riskStance = template.riskStance;

    // Populate Character Sheet inputs
    document.getElementById('inputIncome').value = hero.income;
    document.getElementById('inputSavings').value = hero.savings;
    document.getElementById('inputWorkSetup').value = hero.workSetup;
    document.getElementById('inputCommute').value = hero.commuteHours;
    document.getElementById('inputGuild').value = hero.guild;
    document.getElementById('inputHmoShield').value = hero.hmoShield;
    document.getElementById('inputFamilySafetyNet').value = hero.familySafetyNet;
    document.getElementById('inputFamilyRemittance').value = hero.familyRemittance;
    document.getElementById('inputAiLeverage').value = hero.aiLeverage;
    document.getElementById('inputSocialCapital').value = hero.socialCapital;
    document.getElementById('inputLearningVelocity').value = hero.learningVelocity;
    document.getElementById('inputDesireVector').value = hero.desireVector;
    document.getElementById('inputRiskStance').value = hero.riskStance;
    document.getElementById('selectedClassBadge').innerText = hero.className.toUpperCase();

    document.getElementById('btnProceedToSheet').disabled = false;
  },

  saveCharacterSheet(e) {
    e.preventDefault();
    soundEngine.playPowerup();

    hero.age = parseInt(document.getElementById('inputAge').value) || 25;
    hero.location = document.getElementById('inputLocation').value;
    hero.income = parseInt(document.getElementById('inputIncome').value) || 45000;
    hero.savings = parseInt(document.getElementById('inputSavings').value) || 120000;
    hero.workSetup = document.getElementById('inputWorkSetup').value;
    hero.commuteHours = parseFloat(document.getElementById('inputCommute').value) || 0;
    hero.guild = document.getElementById('inputGuild').value;
    hero.debtType = document.getElementById('inputDebtType').value;
    hero.debtPayment = parseInt(document.getElementById('inputDebtPayment').value) || 0;
    hero.hmoShield = document.getElementById('inputHmoShield').value;
    hero.familySafetyNet = document.getElementById('inputFamilySafetyNet').value;
    hero.familyRemittance = parseInt(document.getElementById('inputFamilyRemittance').value) || 0;
    hero.aiLeverage = document.getElementById('inputAiLeverage').value;
    hero.socialCapital = document.getElementById('inputSocialCapital').value;
    hero.learningVelocity = document.getElementById('inputLearningVelocity').value;
    hero.desireVector = document.getElementById('inputDesireVector').value;
    hero.riskStance = document.getElementById('inputRiskStance').value;

    const partyRadios = document.getElementsByName('partySize');
    for (let r of partyRadios) {
      if (r.checked) {
        hero.partySize = parseInt(r.value);
        break;
      }
    }

    // Update Top HUD
    document.getElementById('hudHeroName').innerText = hero.className;
    document.getElementById('hudHeroLvl').innerText = hero.age;
    document.getElementById('hudHeroGold').innerText = `₱${hero.income.toLocaleString()}/mo`;

    // Update Hall of Doors HUD
    document.getElementById('doorsHudClass').innerText = hero.className;
    document.getElementById('doorsHudIncome').innerText = `₱${(hero.income / 1000)}k/mo`;
    document.getElementById('doorsHudLocation').innerText = hero.location;
    document.getElementById('doorsHudWork').innerText = `${hero.workSetup} (${hero.commuteHours}h)`;
    document.getElementById('doorsHudDebt').innerText = hero.debtPayment > 0 ? `₱${hero.debtPayment.toLocaleString()}/mo` : '✨ Clean';

    const desireMap = {
      DollarClients: 'Double Income ($)',
      ProvincialWFH: 'Provincial Peace 🌴',
      OwnBusiness: 'Own PH Venture 💼',
      OFWMigration: 'OFW Relocation ✈️',
      FamilyHome: 'Family Home 🏠',
      PeaceAutonomy: 'Autonomy & Sleep 🧘'
    };
    document.getElementById('doorsHudDesire').innerText = desireMap[hero.desireVector] || hero.desireVector;

    // Pre-fill Custom Door prompt
    const customPrompt = document.getElementById('customPromptInput');
    if (customPrompt) {
      const prompts = {
        DollarClients: `Scale to $3,000/mo remote foreign clients using AI leverage while living in ${hero.location} with ₱${hero.savings.toLocaleString()} initial safety runway`,
        ProvincialWFH: `Move from ${hero.location} to a solar coastal sanctuary in La Union with ₱${hero.savings.toLocaleString()} relocation buffer`,
        OwnBusiness: `Launch a specialty coffee cafe or B2B digital agency in ${hero.location} with ₱${hero.savings.toLocaleString()} capital`,
        OFWMigration: `Relocate abroad as a skilled professional with family sponsorship`,
        FamilyHome: `Build a ₱1.5M Pag-IBIG MP2 fund to buy a family house and retire parents`,
        PeaceAutonomy: `Achieve a 4-day work week sovereign remote setup eliminating transit fatigue`
      };
      customPrompt.value = prompts[hero.desireVector] || '';
    }

    // Update Hall of Doors AI Diagnostic Banner
    const isSandwich = hero.familyRemittance > 0 || hero.familySafetyNet === 'SandwichGen';
    const diagShort = isSandwich
      ? `Hero carries ₱${hero.familyRemittance.toLocaleString()}/mo remittance drag. Equalizer: ${hero.aiLeverage} output leverage + ${hero.socialCapital} network multiplier.`
      : `Zero remittance burden. High-bandwidth runway with ${hero.aiLeverage} equalizer velocity.`;
    const bannerDiag = document.getElementById('doorsAiAnalysisText');
    if (bannerDiag) bannerDiag.innerText = diagShort;

    this.navTo('screen-hall-of-doors');
  },

  saveSheetAndOpenAiDesire() {
    soundEngine.playPowerup();
    // Save current sheet inputs
    hero.age = parseInt(document.getElementById('inputAge').value) || 25;
    hero.location = document.getElementById('inputLocation').value;
    hero.income = parseInt(document.getElementById('inputIncome').value) || 45000;
    hero.savings = parseInt(document.getElementById('inputSavings').value) || 120000;
    hero.workSetup = document.getElementById('inputWorkSetup').value;
    hero.commuteHours = parseFloat(document.getElementById('inputCommute').value) || 0;
    hero.guild = document.getElementById('inputGuild').value;
    hero.debtType = document.getElementById('inputDebtType').value;
    hero.debtPayment = parseInt(document.getElementById('inputDebtPayment').value) || 0;
    hero.hmoShield = document.getElementById('inputHmoShield').value;
    hero.familySafetyNet = document.getElementById('inputFamilySafetyNet').value;
    hero.familyRemittance = parseInt(document.getElementById('inputFamilyRemittance').value) || 0;
    hero.aiLeverage = document.getElementById('inputAiLeverage').value;
    hero.socialCapital = document.getElementById('inputSocialCapital').value;
    hero.learningVelocity = document.getElementById('inputLearningVelocity').value;
    hero.desireVector = document.getElementById('inputDesireVector').value;
    hero.riskStance = document.getElementById('inputRiskStance').value;

    this.openCustomModal();
    this.analyzeHeroSheetForDesires();
  },

  async analyzeHeroSheetForDesires() {
    soundEngine.playPowerup();
    const btn = document.getElementById('btnAiAnalyzeHeroSheet');
    const btnText = document.getElementById('btnAiAnalyzeText');
    const diagBox = document.getElementById('aiHeroDiagnosticBox');
    const diagText = document.getElementById('aiHeroDiagnosticText');
    const optionsWrapper = document.getElementById('aiGeneratedOptionsWrapper');
    const optionsList = document.getElementById('aiGeneratedOptionsList');
    const customPrompt = document.getElementById('customPromptInput');
    const modelBadge = document.getElementById('aiModelBadgeDiagnostic');

    const apiKey = localStorage.getItem('lifesim_gemini_api_key');
    const activeModel = localStorage.getItem('lifesim_gemini_model') || 'gemini-3.6-flash';

    if (modelBadge) modelBadge.innerText = activeModel;
    if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Gemini AI Analyzing Character Sheet...';
    if (btn) btn.disabled = true;

    const isSandwich = hero.familyRemittance > 0 || hero.familySafetyNet === 'SandwichGen';
    const annualCommuteSaved = Math.round(hero.commuteHours * 5 * 48);

    // Fallback heuristic data tailored to the hero's exact inputs
    let diagnostic = `Diagnosis for ${hero.className} in ${hero.location}: ${
      isSandwich 
        ? `You face a ₱${hero.familyRemittance.toLocaleString()}/mo family remittance obligation, but your ${hero.aiLeverage} skill leverage provides the asymmetric output needed to break the sandwich generation ceiling.`
        : `With a solid safety runway of ₱${hero.savings.toLocaleString()}, you have the financial bandwidth to take calculated career leaps without endangering daily survival.`
    } ${hero.commuteHours > 1.5 ? `Eliminating your ${hero.commuteHours}h daily commute will unlock ~${annualCommuteSaved} hours/year for high-income skill compounding.` : ''}`;

    let primaryDesire = `Transition from ${hero.workSetup} in ${hero.location} to a high-leverage remote consultancy utilizing ${hero.aiLeverage} Generative AI workflows, scaling income from ₱${hero.income.toLocaleString()}/mo to ₱${Math.round(hero.income * 2.8).toLocaleString()}/mo while sustaining ₱${hero.familyRemittance.toLocaleString()}/mo family remittance.`;

    let pathways = [
      {
        title: "🚀 Asymmetric AI Agency",
        desire: `Launch a high-ticket AI automation & web development agency targeting foreign USD retainers ($2,500-$4,000/mo) using ₱${Math.round(hero.savings * 0.5).toLocaleString()} safety capital buffer.`
      },
      {
        title: "🌴 Sovereign Provincial WFH",
        desire: `Relocate from ${hero.location} to a coastal hub (Siargao/La Union) with 100% remote asynchronous clients, slashing living expenses by 35% and saving ${hero.commuteHours > 0 ? hero.commuteHours : 2}h daily transit.`
      },
      {
        title: "🛡️ Sandwich Breaker & MP2",
        desire: `Maintain steady employment while channeling 40% surplus into Pag-IBIG MP2 and high-yield digital banks to fully pay off ₱${hero.debtPayment.toLocaleString()}/mo debt and fund parents' HMO shield.`
      }
    ];

    if (apiKey) {
      const prompt = `Act as an expert Philippine Career & Financial Multiverse AI Engine.
Analyze this Hero Character Sheet:
- Class Archetype: ${hero.className} (Age: ${hero.age})
- Location: ${hero.location} | Work Setup: ${hero.workSetup} (Commute: ${hero.commuteHours} hrs/day)
- Income: ₱${hero.income.toLocaleString()}/mo | Liquid Savings: ₱${hero.savings.toLocaleString()}
- Starting Line / Family Safety Net: ${hero.familySafetyNet} (Family Remittance: ₱${hero.familyRemittance.toLocaleString()}/mo)
- Debt Burden: ₱${hero.debtPayment.toLocaleString()}/mo (${hero.debtType}) | Health Shield: ${hero.hmoShield}
- The Equalizers: AI Leverage = ${hero.aiLeverage}, Social Capital = ${hero.socialCapital}, Learning Velocity = ${hero.learningVelocity}
- Target Dream: ${hero.desireVector} | Combat Stance: ${hero.riskStance}

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
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
          const parsed = JSON.parse(rawText);
          if (parsed.diagnostic) diagnostic = parsed.diagnostic;
          if (parsed.primaryDesire) primaryDesire = parsed.primaryDesire;
          if (Array.isArray(parsed.pathways) && parsed.pathways.length > 0) pathways = parsed.pathways;
        }
      } catch (err) {
        console.warn("Gemini Character Sheet analysis failed, using specialized heuristic synthesizer:", err);
      }
    }

    // Render Diagnostic & Options
    if (diagText) diagText.innerText = diagnostic;
    if (diagBox) diagBox.classList.remove('hidden');

    const bannerDiag = document.getElementById('doorsAiAnalysisText');
    if (bannerDiag) bannerDiag.innerText = diagnostic;

    if (customPrompt) customPrompt.value = primaryDesire;

    if (optionsList) {
      optionsList.innerHTML = '';
      pathways.forEach(p => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'p-2.5 bg-dungeon-950 border border-slate-700 hover:border-purple-400 hover:bg-purple-950/40 text-left transition-all rounded group';
        card.onclick = () => {
          soundEngine.playSelect();
          if (customPrompt) customPrompt.value = p.desire;
        };
        card.innerHTML = `
          <div class="font-pixel text-[9px] text-purple-300 group-hover:text-rpg-gold mb-1">${p.title}</div>
          <div class="text-[10px] text-slate-300 font-mono line-clamp-2 leading-tight">${p.desire}</div>
        `;
        optionsList.appendChild(card);
      });
      if (optionsWrapper) optionsWrapper.classList.remove('hidden');
    }

    soundEngine.playLevelUp();
    if (btnText) btnText.innerHTML = '<i class="fa-solid fa-check text-rpg-emerald mr-1"></i> Character Sheet Analyzed & Desire Formulated!';
    if (btn) btn.disabled = false;
  },

  async enterPortal(scenarioKey, customPrompt = '') {
    activeScenarioKey = scenarioKey;
    const scenarioNames = {
      tech: 'IT & Cybersecurity Cloud Consulting',
      nomad: 'Coastal Provincial Remote WFH',
      corp: 'Independent High-Leverage PH Business',
      custom: customPrompt || 'Bespoke Multiverse Pathway'
    };
    const pathwayTitle = scenarioNames[scenarioKey] || customPrompt || 'Custom Multiverse Timeline';
    soundEngine.playDoorHum();

    this.navTo('screen-portal-loading');
    document.getElementById('portalLoadingScenarioTitle').innerText = `GEMINI AI SIMULATING TIMELINE: ${pathwayTitle.toUpperCase()}`;

    const isSandwich = hero.familySafetyNet === 'SandwichGen' || hero.familyRemittance > 0;
    const sandwichLog = isSandwich ? `Factoring ₱${hero.familyRemittance.toLocaleString()}/mo family remittance drag...` : 'Zero family remittance burden...';
    const activeModel = localStorage.getItem('lifesim_gemini_model') || 'gemini-3.6-flash';

    const logs = [
      { t: 0, l1: `> Opening timeline rift with ${activeModel}...`, l2: `> Sending Hero baseline (Income: ₱${hero.income.toLocaleString()}/mo | Savings: ₱${hero.savings.toLocaleString()})...`, l3: `> ${sandwichLog}`, p: '30%' },
      { t: 1000, l1: `> Computing Equalizer velocity: AI Leverage (${hero.aiLeverage}) + Social Capital (${hero.socialCapital})...`, l2: `> Health Shield: ${hero.hmoShield} | Commute: ${hero.commuteHours}h/day...`, l3: `> Synthesizing 2026-2030 yearly cashflows & localized curveballs...`, p: '65%' },
      { t: 2200, l1: `> Converging 5-Year Philippine probability distribution nodes...`, l2: `> Compounding Pag-IBIG MP2 and sovereign cashflow matrix...`, l3: `> Complete AI Multiverse Generated! Launching Dashboard...`, p: '100%' }
    ];

    logs.forEach(step => {
      setTimeout(() => {
        soundEngine.playBlip();
        document.getElementById('terminalLog1').innerText = step.l1;
        document.getElementById('terminalLog2').innerText = step.l2;
        document.getElementById('terminalLog3').innerText = step.l3;
        document.getElementById('portalProgressBar').style.width = step.p;
      }, step.t);
    });

    // Launch Full Live AI Simulation
    const aiSimPromise = generateFullAiSimulation(hero, scenarioKey, customPrompt);

    try {
      activeAiSimulationData = await aiSimPromise;
    } catch (err) {
      console.warn("AI Simulation encountered error, using dynamic calculated engine:", err);
      activeAiSimulationData = buildDynamicCalculatedSimulation(hero, pathwayTitle, scenarioKey);
    }

    // Save into What-If Vault
    activeAiSimulationData.id = 'whatif_' + Date.now();
    activeAiSimulationData.createdAt = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    activeAiSimulationData.heroName = hero.className;
    activeAiSimulationData.heroAge = hero.age;
    activeAiSimulationData.scenarioKey = scenarioKey;
    activeWhatIfId = activeAiSimulationData.id;

    // Check if timeline with same title exists, update it or prepend
    const existingIndex = whatIfVault.findIndex(v => v.scenarioName === activeAiSimulationData.scenarioName);
    if (existingIndex >= 0) {
      whatIfVault[existingIndex] = activeAiSimulationData;
    } else {
      whatIfVault.unshift(activeAiSimulationData);
    }
    localStorage.setItem('lifesim_whatif_vault', JSON.stringify(whatIfVault));

    setTimeout(() => {
      soundEngine.playLevelUp();
      this.renderWhatIfSwitcher();
      this.renderForesightMatrix();
      timelineEngine.setYear(2026);
      timelineEngine.initCharts();
      this.navTo('screen-dashboard');
    }, 2800);
  },

  renderWhatIfSwitcher() {
    const count = whatIfVault.length;
    const hCount = document.getElementById('headerVaultCount');
    const dCount = document.getElementById('dashVaultCount');
    const drsCount = document.getElementById('doorsVaultCount');
    if (hCount) hCount.innerText = count;
    if (dCount) dCount.innerText = count;
    if (drsCount) drsCount.innerText = count;

    // 1. Render Dashboard Switcher Tabs
    const tabContainer = document.getElementById('whatIfTimelineTabs');
    if (tabContainer) {
      tabContainer.innerHTML = '';
      if (whatIfVault.length === 0) {
        tabContainer.innerHTML = '<span class="text-xs text-slate-500 font-mono italic">No other timelines yet. Enter a portal or submit a desire to create one!</span>';
      } else {
        whatIfVault.forEach(sim => {
          const isActive = sim.id === activeWhatIfId;
          const peakIncome = sim.years && sim.years['2030'] ? `₱${(sim.years['2030'].monthlyIncome/1000).toFixed(0)}k/mo` : '';
          const tab = document.createElement('div');
          tab.className = `group flex items-center gap-1.5 px-3 py-1.5 border-2 text-xs font-mono transition-all cursor-pointer rounded ${
            isActive 
              ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-brutal-sm' 
              : 'bg-dungeon-950 text-slate-300 border-slate-800 hover:border-indigo-400 hover:text-white'
          }`;
          tab.onclick = () => app.switchWhatIfTimeline(sim.id);
          tab.innerHTML = `
            <i class="fa-solid ${isActive ? 'fa-circle-dot text-rpg-gold' : 'fa-code-branch text-slate-500'} text-[10px]"></i>
            <span class="truncate max-w-[200px]">${sim.scenarioName}</span>
            ${peakIncome ? `<span class="px-1 py-0.2 bg-slate-900/80 text-amber-300 font-pixel text-[8px] rounded border border-slate-700">${peakIncome}</span>` : ''}
            <button onclick="app.deleteWhatIfTimeline('${sim.id}', event)" class="ml-1 text-slate-400 hover:text-rose-400 font-pixel text-[9px]" title="Delete What-If">×</button>
          `;
          tabContainer.appendChild(tab);
        });
      }
    }

    // 2. Render Hall of Doors Tray
    const doorsTray = document.getElementById('doorsWhatIfTray');
    const doorsList = document.getElementById('doorsWhatIfList');
    if (doorsTray && doorsList) {
      if (whatIfVault.length > 0) {
        doorsTray.classList.remove('hidden');
        doorsList.innerHTML = '';
        whatIfVault.forEach(sim => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'px-2.5 py-1 bg-dungeon-900 border border-slate-700 hover:border-indigo-400 text-slate-200 text-xs font-mono rounded flex items-center gap-1.5 shadow-brutal-sm';
          pill.onclick = () => app.switchWhatIfTimeline(sim.id);
          pill.innerHTML = `
            <i class="fa-solid fa-code-branch text-indigo-400 text-[10px]"></i>
            <span class="truncate max-w-[220px]">${sim.scenarioName}</span>
          `;
          doorsList.appendChild(pill);
        });
      } else {
        doorsTray.classList.add('hidden');
      }
    }

    // 3. Render Vault Modal Grid
    const vaultGrid = document.getElementById('whatIfVaultGrid');
    const vaultEmpty = document.getElementById('whatIfVaultEmpty');
    if (vaultGrid && vaultEmpty) {
      if (whatIfVault.length === 0) {
        vaultGrid.innerHTML = '';
        vaultEmpty.classList.remove('hidden');
      } else {
        vaultEmpty.classList.add('hidden');
        vaultGrid.innerHTML = '';
        whatIfVault.forEach(sim => {
          const isActive = sim.id === activeWhatIfId;
          const yr2026 = sim.years ? sim.years['2026'] : null;
          const yr2030 = sim.years ? sim.years['2030'] : null;
          const card = document.createElement('div');
          card.className = `bg-slate-950 border-3 ${isActive ? 'border-indigo-500 shadow-brutal-purple' : 'border-slate-800'} p-4 rounded flex flex-col justify-between`;
          card.innerHTML = `
            <div>
              <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5">
                <div>
                  <span class="font-pixel text-[8px] text-indigo-400 uppercase">${sim.createdAt ? `Simulated at ${sim.createdAt}` : 'Multiverse Timeline'}</span>
                  <h4 class="font-pixel text-xs text-white leading-snug mt-0.5">${sim.scenarioName}</h4>
                </div>
                <button onclick="app.deleteWhatIfTimeline('${sim.id}', event)" class="text-slate-500 hover:text-rose-400 font-pixel text-[10px] p-1" title="Delete Timeline">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                <div class="bg-dungeon-900 p-2 border border-slate-800 rounded">
                  <span class="text-slate-400 text-[10px] block">2026 Starting:</span>
                  <span class="text-slate-200 font-bold">₱${yr2026 ? yr2026.monthlyIncome.toLocaleString() : '---'}/mo</span>
                </div>
                <div class="bg-dungeon-900 p-2 border border-slate-800 rounded">
                  <span class="text-rpg-gold text-[10px] block">2030 Peak:</span>
                  <span class="text-rpg-emerald font-bold text-sm">₱${yr2030 ? yr2030.monthlyIncome.toLocaleString() : '---'}/mo</span>
                </div>
                <div class="bg-dungeon-900 p-2 border border-slate-800 rounded">
                  <span class="text-slate-400 text-[10px] block">Peak Wealth:</span>
                  <span class="text-amber-400 font-bold">₱${yr2030 ? yr2030.cumulativeSavings.toLocaleString() : '---'}</span>
                </div>
                <div class="bg-dungeon-900 p-2 border border-slate-800 rounded">
                  <span class="text-slate-400 text-[10px] block">Stress & Free:</span>
                  <span class="text-cyan-300 font-bold">${yr2030 ? `${yr2030.stress}/100 | ${yr2030.freeHours}h free` : '---'}</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-800 flex justify-between items-center">
              ${isActive ? `
                <span class="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500 font-pixel text-[9px] flex items-center gap-1">
                  <i class="fa-solid fa-check"></i> CURRENTLY ACTIVE
                </span>
              ` : `
                <button onclick="app.switchWhatIfTimeline('${sim.id}')" class="btn-brutal px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-pixel text-[9px] border-2 border-slate-950 shadow-brutal-sm flex items-center gap-1">
                  <i class="fa-solid fa-code-branch"></i> SWITCH TO THIS TIMELINE
                </button>
              `}
            </div>
          `;
          vaultGrid.appendChild(card);
        });
      }
    }
  },

  switchWhatIfTimeline(simId) {
    const found = whatIfVault.find(v => v.id === simId);
    if (!found) return;
    soundEngine.playPowerup();
    activeWhatIfId = simId;
    activeAiSimulationData = found;
    activeScenarioKey = found.scenarioKey || 'custom';
    this.closeWhatIfVaultModal();
    this.renderWhatIfSwitcher();
    this.renderForesightMatrix();
    timelineEngine.setYear(2026);
    timelineEngine.initCharts();
    this.navTo('screen-dashboard');
  },

  deleteWhatIfTimeline(simId, e) {
    if (e) e.stopPropagation();
    soundEngine.playBlip();
    whatIfVault = whatIfVault.filter(v => v.id !== simId);
    localStorage.setItem('lifesim_whatif_vault', JSON.stringify(whatIfVault));
    if (activeWhatIfId === simId) {
      if (whatIfVault.length > 0) {
        this.switchWhatIfTimeline(whatIfVault[0].id);
      } else {
        activeWhatIfId = null;
        activeAiSimulationData = null;
      }
    }
    this.renderWhatIfSwitcher();
  },

  openWhatIfVaultModal() {
    soundEngine.playPowerup();
    this.renderWhatIfSwitcher();
    const modal = document.getElementById('whatIfVaultModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeWhatIfVaultModal() {
    soundEngine.playBlip();
    const modal = document.getElementById('whatIfVaultModal');
    if (modal) modal.classList.add('hidden');
  },

  renderForesightMatrix() {
    if (!activeAiSimulationData) return;
    const annualCommuteHoursSaved = Math.round((hero.commuteHours || 0) * 5 * 48);

    document.getElementById('foresightWorkSummary').innerText = `${hero.workSetup} (${hero.commuteHours}h Commute)`;
    document.getElementById('foresightCommuteImpact').innerText = hero.commuteHours > 0 
      ? `Reclaims ~${annualCommuteHoursSaved} hrs/yr in remote pathways` 
      : 'Zero commute drain; high energy focus';

    const netText = hero.familyRemittance > 0 
      ? `₱${hero.familyRemittance.toLocaleString()}/mo Family Remittance (${hero.familySafetyNet})`
      : `🛡️ Strong Safety Net (${hero.familySafetyNet})`;

    document.getElementById('foresightDebtSummary').innerText = `${netText} | ${hero.debtPayment > 0 ? `₱${hero.debtPayment.toLocaleString()}/mo Debt` : 'Zero Debt'}`;
    document.getElementById('foresightRunwayImpact').innerText = hero.debtPayment > 0 
      ? `Debt cleared by early 2027 via strategic cashflow compounding` 
      : 'Clean cashflow fuels rapid Pag-IBIG MP2 compounding';

    const desireMap = {
      DollarClients: 'Double Income ($) Retainer',
      ProvincialWFH: 'Provincial Sanctuary',
      OwnBusiness: 'Independent PH Venture',
      OFWMigration: 'Global Migration',
      FamilyHome: 'Family Home & Retire Parents',
      PeaceAutonomy: 'Mental Peace & Autonomy'
    };

    document.getElementById('foresightDesireSummary').innerText = `${desireMap[hero.desireVector] || hero.desireVector} | ${hero.riskStance}`;
    document.getElementById('foresightDesireImpact').innerText = `Equalizers: AI Leverage (${hero.aiLeverage}) + Network (${hero.socialCapital})`;

    const activeModelName = localStorage.getItem('lifesim_gemini_model') || 'gemini-3.6-flash';
    document.getElementById('foresightNarrativeDynamic').innerHTML = `
      <div class="inline-block px-2 py-0.5 bg-purple-900/60 text-purple-300 font-pixel text-[8px] uppercase border border-purple-500 mb-2">
        ✨ 100% AI-Generated Multiverse Simulation (${activeModelName})
      </div>
      <div class="whitespace-pre-line text-slate-200 leading-relaxed">${activeAiSimulationData.overallStrategicThesis}</div>
    `;
  },

  openCustomModal() {
    soundEngine.playBlip();
    document.getElementById('customScenarioModal').classList.remove('hidden');
  },

  closeCustomModal() {
    soundEngine.playBlip();
    document.getElementById('customScenarioModal').classList.add('hidden');
  },

  fillCustomPreset(text) {
    soundEngine.playSelect();
    document.getElementById('customPromptInput').value = text;
  },

  submitCustomScenario() {
    const prompt = document.getElementById('customPromptInput').value.trim();
    if (!prompt) {
      alert('Please enter a desire prompt!');
      return;
    }
    this.closeCustomModal();
    this.enterPortal('custom', prompt);
  },

  generateAndGoToQuestLog() {
    soundEngine.playLevelUp();
    const title = activeAiSimulationData ? activeAiSimulationData.scenarioName : 'AI MULTIVERSE QUEST';
    document.getElementById('questScenarioTitle').innerText = title.toUpperCase();
    this.renderQuestItems();
    this.updateQuestProgress();
    this.navTo('screen-quest-tracker');
  },

  renderQuestItems() {
    if (!activeAiSimulationData || !activeAiSimulationData.quests) return;
    const pillars = ['treasury', 'skills', 'bureaucracy', 'mana'];

    pillars.forEach(p => {
      const container = document.getElementById(`category-${p}`);
      if (!container) return;
      container.innerHTML = '';

      const quests = activeAiSimulationData.quests[p] || [];
      quests.forEach(q => {
        const isDone = completedQuests.has(q.id);
        const item = document.createElement('div');
        item.className = `p-3 border-2 border-slate-800 rounded flex items-start gap-3 cursor-pointer select-none transition-all ${
          isDone ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300' : 'bg-dungeon-950 hover:border-slate-600 text-slate-200'
        }`;
        item.onclick = () => app.toggleQuest(q.id);
        item.innerHTML = `
          <div class="mt-0.5 w-5 h-5 border-2 ${isDone ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-slate-600 bg-dungeon-900'} flex items-center justify-center font-bold text-xs">
            ${isDone ? '✓' : ''}
          </div>
          <div class="flex-1 text-xs font-mono leading-snug ${isDone ? 'line-through opacity-80' : ''}">
            ${q.text}
          </div>
        `;
        container.appendChild(item);
      });
    });
  },

  toggleQuest(questId) {
    if (completedQuests.has(questId)) {
      completedQuests.delete(questId);
      soundEngine.playBlip();
    } else {
      completedQuests.add(questId);
      soundEngine.playPowerup();
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#38bdf8', '#10b981', '#f43f5e']
        });
      }
    }
    this.renderQuestItems();
    this.updateQuestProgress();
  },

  updateQuestProgress() {
    if (!activeAiSimulationData || !activeAiSimulationData.quests) return;
    let total = 0;
    let done = 0;

    Object.values(activeAiSimulationData.quests).forEach(list => {
      list.forEach(q => {
        total++;
        if (completedQuests.has(q.id)) done++;
      });
    });

    document.getElementById('questCompletedCount').innerText = done;
    document.getElementById('questTotalCount').innerText = total;
    const pct = total > 0 ? (done / total) * 100 : 0;
    document.getElementById('questProgressBar').style.width = `${pct}%`;
  },

  exportQuestScroll() {
    soundEngine.playLevelUp();
    const title = activeAiSimulationData ? activeAiSimulationData.scenarioName : 'AI ACTION DECREE';
    document.getElementById('scrollHeroTitle').innerText = `HERO ACTION DECREE: ${title.toUpperCase()}`;
    document.getElementById('scrollDate').innerText = new Date().toLocaleDateString('en-PH', { dateStyle: 'long' });

    const body = document.getElementById('scrollContentBody');
    let questListHtml = '';

    if (activeAiSimulationData && activeAiSimulationData.quests) {
      Object.entries(activeAiSimulationData.quests).forEach(([cat, list]) => {
        questListHtml += `<div class="mt-3"><span class="font-bold text-rpg-gold uppercase text-[11px] font-pixel">[ ${cat.toUpperCase()} PILLAR ]</span><ul class="list-none pl-2 mt-1 space-y-1">`;
        list.forEach(q => {
          const checked = completedQuests.has(q.id) ? '✓' : ' ';
          questListHtml += `<li class="${completedQuests.has(q.id) ? 'text-emerald-400' : 'text-slate-300'}">[${checked}] ${q.text}</li>`;
        });
        questListHtml += `</ul></div>`;
      });
    }

    body.innerHTML = `
      <div class="bg-dungeon-950 p-4 border-2 border-slate-800 rounded">
        <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
          <p><strong>HERO:</strong> ${hero.className} (LVL ${hero.age})</p>
          <p><strong>ZONE:</strong> ${hero.location}</p>
          <p><strong>INCOME:</strong> ₱${hero.income.toLocaleString()}/mo</p>
          <p><strong>EQUALIZERS:</strong> AI (${hero.aiLeverage}) + Network (${hero.socialCapital})</p>
        </div>
        <div class="border-t border-slate-800 pt-3">
          ${questListHtml}
        </div>
      </div>
    `;

    document.getElementById('questScrollModal').classList.remove('hidden');
  },

  closeQuestScrollModal() {
    soundEngine.playBlip();
    document.getElementById('questScrollModal').classList.add('hidden');
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
  }
};
window.app = app;

// Global Shortcut: Ctrl + Shift + 1 for Admin Gemini API Key Modal
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === '1' || e.key === '!' || e.code === 'Digit1')) {
    e.preventDefault();
    app.openAdminModal();
  }
});

// Initial Console Announcement & What-If Vault Hydration
document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = localStorage.getItem('lifesim_whatif_vault');
    if (saved) {
      whatIfVault = JSON.parse(saved);
      if (whatIfVault.length > 0) {
        activeWhatIfId = whatIfVault[0].id;
        activeAiSimulationData = whatIfVault[0];
      }
    }
  } catch (e) {
    whatIfVault = [];
  }
  app.renderWhatIfSwitcher();
  console.log('🚀 LifeSim.ai Multiverse Engine Loaded with Persistent What-If Vault & Gemini AI Synthesis!');
});
