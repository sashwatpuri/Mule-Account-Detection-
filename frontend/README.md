# AML Mule Account Detection - Investigation Frontend

A modern, high-precision financial crime intelligence and AML (Anti-Money Laundering) investigation dashboard built with React, Vite, TypeScript, and Tailwind CSS.

Designed specifically to interface with the Decision Tree machine learning baseline models and feature extraction pipelines from the RBIH Mule Account Detection project.

---

## Visual Design & Theme

- **Background:** Deep dark navy (`#0B111E`)
- **Surfaces & Cards:** Elevated navy surfaces (`#111C33` / `#0F172A`) with subtle border styling (`rgba(255, 255, 255, 0.08)`)
- **Primary Accent:** Blue (`#3B82F6`)
- **AML Risk Color Hierarchy:**
  - 🔴 **High Risk / Mule:** `#EF4444` (`bg-red-500/15 text-red-300`)
  - 🟡 **Medium Risk / Review:** `#F59E0B` (`bg-amber-500/15 text-amber-300`)
  - 🟢 **Low Risk / Legitimate:** `#10B981` (`bg-emerald-500/15 text-emerald-300`)
- **Typography:** Inter (Primary UI) and JetBrains Mono (Financial IDs, Metrics, Rule Logic)

---

## Modules (Phase 1 Application Shell)

1. **Overview (`/overview`):**
   - System health, model evaluation metrics (ROC-AUC, PR-AUC, F1 score), and alert volume distributions.
2. **Suspicious Accounts (`/suspicious-accounts`):**
   - High-throughput triage queue for accounts flagged by decision split rules (e.g. Counterparties > 30.5, Rapid Pass-Through Symmetry $\le 0.33$, recent KYC modifications).
3. **Network Analysis (`/network-analysis`):**
   - Graph visualization canvas for tracing fan-in funnels, fan-out disbursement hubs, and counterparty rings.
4. **Account Investigation (`/account-investigation`):**
   - Entity-level audit view showing the exact Decision Tree rule traversal path, leaf node confidence, transaction velocity spikes, and freeze status.

---

## Technology Stack

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **Component Patterns:** shadcn/ui design methodology (CVA, `clsx`, `tailwind-merge`, Radix UI slot primitives)
- **Icons:** Lucide React
- **Charting Engine:** Recharts (installed & ready for dashboard data integration)
- **Routing:** React Router v6

---

## Local Development & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
From the repository root:
```bash
cd frontend
npm install
```

### Running the Development Server
```bash
npm run dev
```
The application will launch at: `http://localhost:3000`

### Building for Production
```bash
npm run build
```

### Previewing the Production Build
```bash
npm run preview
```
