# LifeSim.ai // Philippine Multiverse Engine v2.4

> **Cyberpunk Retro RPG Multiverse Life Simulator for Filipino Professionals & Students**

---

## 📌 Problem Statement

Every year, millions of Filipino professionals and graduates face critical, high-stakes life decisions—such as transitioning careers, moving to remote work, taking entrepreneurial leaps, or relocating to the provinces—without clear visibility into how these choices will compound over time.

In the Philippines, these decisions are heavily influenced by localized socio-economic variables:
- **Sandwich Generation Obligations:** Supporting elderly parents and siblings while trying to build personal wealth.
- **Urban Transit Drain:** Losing 2 to 4+ hours daily in Metro Manila traffic, eroding discretionary time and health.
- **Fiscal Inefficiencies & Compliance:** Navigating complex BIR tax regimes (e.g., graduated tax brackets vs. the BIR 8% flat gross income tax shield).
- **Economic Shocks & Infrastructure Curveballs:** Managing typhoon power outages, healthcare emergencies, and inflation without adequate emergency buffers.

**LifeSim.ai** bridges this foresight gap by simulating realistic 5-year multiverse trajectories (2026–2030) using a hybrid engine of Google Gemini generative AI and deterministic Philippine macroeconomic models.

---

## 🎮 Core Features (Implemented)

### 1. Title Sanctum & Authentication Gate
- **Firebase Google Authentication:** Secure login using Firebase Auth popup, creating verified hero profiles.
- **1-Click Gmail Hero Test Mode:** Frictionless instant evaluation for hackathon judges and rapid testing.
- **Guest Explorer Mode:** Full simulation capability with local storage caching (limited to 2 vault slots).
- **Firebase In-App Configurator:** Interactive modal allowing custom Firebase credentials to be pasted or edited directly in the UI.

### 2. Class Archetype Selector
- **The BPO Night Owl (Corporate Tank):** Hybrid/Graveyard corporate warrior balancing steady cash flow with high transit burnout.
- **The Hustling Freelancer (Agile Mage):** High-autonomy remote specialist balancing dollar retainers with health shield risks.
- **The Fresh Grad (Novice Explorer):** Early-career entry point focused on aggressive skill compounding and runway building.
- **Custom Bespoke Hero:** Fully custom starting class for tailored personal modeling.
- Keyboard shortcut support (`1`, `2`, `3`, `4`/`C`, `Enter`).

### 3. Hero Character Sheet & 4-Pillar Calibration
- **Pillar 1: Fiscal Armor:** Base monthly income, liquid savings buffer, and debt servicing (Credit Card, Salary Loan, SSS, Auto).
- **Pillar 2: Geographic & Transit Reality:** Location (Metro Manila, Cebu, Provincial hubs), work setup (On-Site, Hybrid, Remote, Graveyard), and daily commute slider calculating monthly lost discretionary hours.
- **Pillar 3: Filipino Kinship Shield:** Family remittance support (Sandwich Gen toggle), dependent count, and HMO health armor tier (Comprehensive, Solo, PhilHealth).
- **Pillar 4: The Equalizers & North Star:** AI leverage tier (`Traditional`, `AiAugmented`, `Architect10x`), social capital network, learning velocity, and custom dream input.
- **Live Telemetry Engine:** Real-time calculation of discretionary monthly cash flow, burnout vulnerability index, class tier, 5-year net worth projection, and runway months.
- **Gemini Character Diagnostic:** Real-time AI analysis modal providing strategic bottleneck diagnosis and tailored desire prompts.
- **Dual View Modes:** Focused Step-by-Step Tabs or 4-Pillar Grid view.

### 4. Hall of Destiny Portals
- **Dynamic Portal Synthesis:** Generates 3 distinct future pathways:
  1. *Portal 01 // Asymmetric Leap:* High-income global tech consulting and USD client retainers.
  2. *Portal 02 // Provincial Sanctuary:* Relocation to coastal lifestyle hubs (Siargao, La Union) with 100% remote asynchronous clients.
  3. *Portal 03 // Custom Dream / Void of Fates:* Dynamic pathway generated strictly around user-provided custom dreams (e.g., sabbatical, launching a physical café, studying abroad).
- Powered by live **Gemini 2.5 Flash** reasoning when authenticated, with automatic fallback to calibrated heuristic models.

### 5. Multiverse Loading Rift
- Real-time terminal sequence providing visual feedback during timeline calculation and AI synthesis.

### 6. Analytical Dashboard (2026–2030)
- **Interactive 5-Year Scrubber:** Scrub year-by-year from 2026 to 2030 to inspect projected milestones.
- **3 Fork Timelines:** Switch between Alpha, Beta, and Gamma timelines on the fly.
- **Core Financial & Life Telemetry:**
  - Monthly cash flow compared against the Status Quo baseline.
  - Liquid savings growth with runway month indicators (handles debt payoff and sabbatical drawdown curves).
  - Stress & Burnout Index (`[SAFE]`, `[MODERATE]`, `[CRITICAL]`).
  - Discretionary free hours reclaimed from commute elimination.
- **5-Axis Score Matrix:** Progress bars tracking Wealth Velocity, Mind Clarity, Career Freedom, Sovereignty, and Health Armor.
- **Chart.js Visualizer:** Interactive comparative chart plotting 5-year net wealth trajectory against status quo savings.
- **Localized Philippine Curveballs:** Annual events (e.g., Category 4 typhoons, BIR Form 1701A tax audits, island fiber cuts) paired with hardware and fiscal mitigation strategies.

### 7. What-If Vault
- Timeline management system allowing users to save, compare, and delete simulation forks.
- Automatically syncs to **Cloud Firestore** for logged-in users; stored in `localStorage` for guests.

### 8. Quest Log & Official Action Decree
- **8-Point Parallel Quest Tracker:** Actionable steps categorized across *Treasury*, *Skills*, *Bureaucracy*, and *Mana*.
- **Interactive Checklists & Progress Bar:** Real-time completion tracking with confetti feedback.
- **Cloud Quest Persistence:** Completed quest states sync to Firestore for authenticated users.
- **Official Hero Decree Export:** Generates an official summary scroll with a verification seal, copyable directly to the clipboard.

### 9. System Utilities & Retro Aesthetics
- **Dual Design System:** Default clean Neo-Brutalist Light Mode with toggleable Cyber RPG Void Dark Mode.
- **8-Bit Web Audio Sound Engine:** Zero-dependency sound synthesizer generated via the browser's Web Audio API (`AudioContext`).
- **Admin AI Settings Modal (`Ctrl + Shift + 1`):** Configure custom Gemini API keys and switch models (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`).

---

## 🛠️ Tech Stack

### Frontend & Architecture
- **HTML5 & Vanilla JavaScript (ES6+):** Component-style UI controllers and state management without heavy framework overhead.
- **Tailwind CSS (CDN) & Vanilla CSS (`css/styles.css`):** Neo-brutalist styling, retro borders, custom typography tokens, and CSS variables for light/dark modes.
- **Typography:** Google Fonts (*Press Start 2P*, *JetBrains Mono*, *Cinzel*).
- **Icons:** Font Awesome 6.5.1.

### Cloud & Backend
- **Firebase Authentication (v9 compat):** Google OAuth provider integration and user session observer.
- **Cloud Firestore:** Real-time NoSQL database storing user metadata, saved timeline snapshots in the `whatIfVault` subcollection, and quest states in `questLogs`.

### Artificial Intelligence & Reasoning
- **Google Gemini API (REST `v1beta`):**
  - Primary Model: `gemini-2.5-flash`
  - Fallback Cascades: `gemini-2.0-flash` and `gemini-1.5-flash`
  - Dynamic JSON schema extraction for character diagnostics, portal synthesis, and multi-year simulation narratives.
- **Deterministic Offline Simulation Engine:** High-precision fallback mathematical engine calculating progressive income taxes, Pag-IBIG MP2 compound growth, inflation, and sabbatical burn rates when offline or unauthenticated.

### Data Visualization & Audio
- **Chart.js:** Line charts displaying 5-year wealth growth comparison with custom retro canvas tooltips.
- **Canvas Confetti:** Micro-interaction celebration effects for quest completions and logins.
- **Web Audio API:** Pure programmatic sound synthesis (square/sawtooth oscillators) for retro sound effects.
- **DiceBear Avatars API:** Dynamic procedural avatars based on user profiles.

---

## 🔄 How It Works

```
[ Title Sanctum ] ──▶ [ Select Archetype ] ──▶ [ Calibrate 4 Pillars ]
      │                                                │
      ├─ Google Sign-In (Firebase)                     ├─ Fiscal / Location / Kinship / Equalizers
      ├─ 1-Click Gmail Hero                            └─ Live AI Diagnostic (Gemini)
      └─ Guest Explorer Mode                                   │
                                                               ▼
[ Quest Log & Action Decree ] ◀── [ 5-Year Dashboard ] ◀── [ Hall of Destiny Portals ]
      │                                    │                       │
      ├─ 8-Point Parallel Quests           ├─ 2026-2030 Scrubber   ├─ 3 AI-Generated Portals
      ├─ Firestore Quest Sync              ├─ Chart.js Projections └─ Bespoke Custom Desires
      └─ Export Official Scroll            └─ PH Curveball Events
```

1. **Authentication:** The user logs in via Google/Firebase or enters in Guest Mode.
2. **Class Selection:** Pick from established archetypes (BPO, Freelancer, Fresh Grad) or create a Custom Hero.
3. **Hero Calibration:** Adjust finances, commute times, family remittance, and AI leverage across 4 pillars. Optionally run an AI diagnostic to synthesize a north star desire.
4. **Portal Synthesis:** LifeSim.ai queries Gemini 2.5 Flash to generate 3 personalized multiverse gateways tailored to the hero's exact baseline.
5. **Timeline Exploration:** Step through the 5-year timeline from 2026 to 2030, examining cash flow curves, stress levels, savings runway, and localized Philippine curveballs.
6. **Action Execution:** Review the 8-point quest decree, track progress with real-time cloud persistence, and export the official action decree.

---

## 🚀 Setup & Local Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Modern web browser with Web Audio and ES6 support

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/cessamaeeee/appcon2026-appsembly-lifesim.ai.git
   cd appcon2026-team09-lifesim.ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Local Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Firebase & Gemini API Configuration (Optional):**
   - **Firebase:** The project includes a pre-configured Firebase project (`appcon2026-appsembly-lifesimai`). You can also supply custom Firebase credentials directly via the in-app Firebase setup modal on the login screen.
   - **Google Gemini API:** You can configure a Gemini API key inside the app by pressing `Ctrl + Shift + 1` (or logging in with Google).

---

## 👥 Team

| Name | Role / Focus Area |
| :--- | :--- |
| **Team Member 1** | *Full-Stack Development & AI Integration* |
| **Team Member 2** | *UI/UX Design & Frontend Architecture* |
| **Team Member 3** | *Macroeconomic Modeling & Prompt Engineering* |
| **Team Member 4** | *Cloud Infrastructure & Data Persistence* |

---

## ⚠️ Disclaimer

LifeSim.ai is a strategic simulation and decision-support tool. Trajectories, financial growth estimates, and curveball scenarios are potential outcomes synthesized from predictive models, macroeconomic assumptions, and generative AI reasoning. They do not constitute certified financial, legal, medical, or career advisory services. Users should conduct independent due diligence before making significant career or financial commitments.