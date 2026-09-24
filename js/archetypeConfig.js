/**
 * LifeSim.ai — Archetype Configuration & Data Access Layer
 * Schema aligned with Firestore collection: /config/archetypes/{classId}
 */

export const ARCHETYPES = [
  {
    id: "corp_tank",
    classCode: "CLS_01",
    name: "THE BPO NIGHT OWL",
    archetype: "CORP TANK",
    ageRange: "24-32 YRS OLD",
    location: "EASTWOOD & BGC",
    earning: 45000,
    earningLabel: "₱45,000/mo",
    savings: 120000,
    savingsLabel: "₱120,000",
    commuteHours: 3.5,
    commuteLabel: "3.5 hrs EDSA/MRT",
    remittance: 10000,
    remittanceLabel: "₱10,000 parent meds",
    buffs: ["HMO+DEPENDENTS"],
    debuffs: ["CIRCADIAN RHYTHM"],
    stats: [
      { label: "HP / RESILIENCE", value: 85, max: 100, color: "gold" },
      { label: "FREE TIME", value: 20, max: 100, color: "mana" },
      { label: "BURNOUT STRESS", value: 82, max: 100, isNegative: true, tag: "[HIGH]", color: "rose" }
    ],
    recommended: true,
    badgeText: "[RECOMMENDED TANK]",
    // Compatibility fields with hero calibration
    baseIncome: 45000,
    baseSavings: 120000,
    workSetup: "On-Site",
    guild: "BPO",
    hmoShield: "Comprehensive",
    familySafetyNet: "SandwichGen",
    familyRemittance: 10000,
    aiLeverage: "Traditional",
    socialCapital: "LoneWolf",
    learningVelocity: "Steady",
    desireVector: "DollarClients",
    riskStance: "Paladin"
  },
  {
    id: "agile_mage",
    classCode: "CLS_02",
    name: "THE HUSTLING FREELANCER",
    archetype: "AGILE MAGE",
    ageRange: "22-35 YRS OLD",
    location: "REMOTE / PASIG",
    earning: 65000,
    earningLabel: "₱65,000 ($1.2k)",
    savings: 180000,
    savingsLabel: "₱180,000",
    commuteHours: 0.0,
    commuteLabel: "0.0 hrs (WFH Home)",
    remittance: 5000,
    remittanceLabel: "₱5,000 occasional",
    buffs: ["USD ARBITRAGE"],
    debuffs: ["NO 13TH MO PAY"],
    stats: [
      { label: "AUTONOMY", value: 90, max: 100, color: "mana" },
      { label: "CASH VOLATILITY", value: 78, max: 100, isNegative: true, tag: "[HIGH]", color: "rose" },
      { label: "BENEFITS & HMO", value: 25, max: 100, tag: "[SOLO]", color: "slate" }
    ],
    recommended: false,
    badgeText: null,
    baseIncome: 65000,
    baseSavings: 180000,
    workSetup: "Remote",
    guild: "Freelance",
    hmoShield: "Solo",
    familySafetyNet: "SelfSufficient",
    familyRemittance: 5000,
    aiLeverage: "AiAugmented",
    socialCapital: "CommunityPeer",
    learningVelocity: "HyperAdaptive",
    desireVector: "ProvincialWFH",
    riskStance: "Berserker"
  },
  {
    id: "novice_explorer",
    classCode: "CLS_03",
    name: "THE FRESH GRAD",
    archetype: "NOVICE EXPLORER",
    ageRange: "20-24 YRS OLD",
    location: "MAKATI COMMUTE",
    earning: 24000,
    earningLabel: "₱24,000/mo",
    savings: 30000,
    savingsLabel: "₱30,000",
    commuteHours: 3.0,
    commuteLabel: "3.0 hrs Jeep/Bus",
    remittance: 3000,
    remittanceLabel: "₱3,000 household share",
    buffs: ["FAST ADAPTABILITY"],
    debuffs: ["LOW CAPITAL"],
    stats: [
      { label: "GROWTH POTENTIAL", value: 95, max: 100, tag: "[PEAK]", color: "gold" },
      { label: "TREASURY / BUFFER", value: 15, max: 100, color: "rose" },
      { label: "CAREER AUTONOMY", value: 30, max: 100, color: "mana" }
    ],
    recommended: false,
    badgeText: null,
    baseIncome: 24000,
    baseSavings: 30000,
    workSetup: "On-Site",
    guild: "Tech",
    hmoShield: "Solo",
    familySafetyNet: "SelfSufficient",
    familyRemittance: 3000,
    aiLeverage: "AiAugmented",
    socialCapital: "CommunityPeer",
    learningVelocity: "HyperAdaptive",
    desireVector: "DollarClients",
    riskStance: "Guardian"
  },
  {
    id: "wildcard_rogue",
    classCode: "CLS_04",
    name: "THE ASPIRING FOUNDER",
    archetype: "WILDCARD ROGUE",
    ageRange: "MID-CAREER BUILDER",
    location: "QC & ORTIGAS",
    earning: 50000,
    earningLabel: "VARIABLE (MSME)",
    isSpecialFinancials: true,
    revenueLabel: "VARIABLE (MSME)",
    runwayLabel: "₱350,000 (6.5 mos)",
    regulatoryLabel: "SEC/BIR compliance",
    teamBurnLabel: "₱45,000/mo OPEX",
    savings: 350000,
    savingsLabel: "₱350,000",
    commuteHours: 1.5,
    commuteLabel: "1.5 hrs Hybrid",
    remittance: 8000,
    remittanceLabel: "₱8,000 parent share",
    buffs: ["EQUITY UPSIDE"],
    debuffs: ["CASH CRUNCH"],
    stats: [
      { label: "ENTERPRISE RISK", value: 90, max: 100, isNegative: true, tag: "[CRITICAL]", color: "rose" },
      { label: "SURVIVAL RUNWAY", value: 55, max: 100, tag: "(6.5 MO)", color: "gold" },
      { label: "VISION AUTONOMY", value: 95, max: 100, color: "mana" }
    ],
    recommended: false,
    badgeText: null,
    baseIncome: 50000,
    baseSavings: 350000,
    workSetup: "Hybrid",
    guild: "Corporate",
    hmoShield: "Solo",
    familySafetyNet: "SandwichGen",
    familyRemittance: 8000,
    aiLeverage: "AiAugmented",
    socialCapital: "CommunityPeer",
    learningVelocity: "Steady",
    desireVector: "OwnBusiness",
    riskStance: "Paladin"
  }
];

/**
 * Asynchronous data access function for Archetypes.
 * Designed for 1:1 drop-in replacement with Cloud Firestore:
 *   const snapshot = await getDocs(collection(db, 'archetypes'));
 *   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 * 
 * @returns {Promise<typeof ARCHETYPES>}
 */
export async function getArchetypes() {
  return Promise.resolve([...ARCHETYPES]);
}
