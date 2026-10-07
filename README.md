# ApparelFlow ERP: Cutting Operations & Gatekeeper Verification Terminal

> A production-grade Next.js ERP system engineered for garment factory cutting operations, real-time bill-of-materials calculation, server-enforced state machines, and gatekeeper verification terminals.

[![CI - Automated Test Suite & Build Verification](https://github.com/keshanrandula/apparelflow-cutting-gate/actions/workflows/ci.yml/badge.svg)](https://github.com/keshanrandula/apparelflow-cutting-gate/actions/workflows/ci.yml)

---

## Key Architecture & Highlights

- **Clean Layered Architecture (Client vs Server Separation):**
  - `src/server/`: Encapsulates business services, database operations (Prisma + PostgreSQL), pure domain calculations, Zod validation, and RBAC guards.
  - `src/client/`: Encapsulates React presentation UI, custom hooks, typed API clients, and view models.
  - `src/app/`: Next.js 14+ App Router for routing, layout hierarchy, and REST API route handlers.
- **Strict Role-Based Access Control (RBAC):**
  - `cutting_supervisor`: Logs fabric cut batches, computes live bill-of-materials, views personal orders, and performs re-cuts.
  - `cutting_verifier`: Inspects physical piece counts, manages gatekeeper compliance, and approves/rejects batches.
  - `sewing_supervisor`: Floor intake manager accepting verified batches onto sewing machine lines.
- **Automated Gatekeeper Rule Engine:**
  - Component piece counts receive real-time traffic flags: **GREEN** (Exact match), **YELLOW** (Surplus), **RED** (Shortage defect).
  - Approvals are strictly rejected with **HTTP 422** if any component is missing or in **RED** status.
- **Deterministic State Machine:**
  - `IN_PROGRESS` $\rightarrow$ `PENDING_VERIFICATION` $\rightarrow$ `VERIFIED` | `REJECTED`
  - `REJECTED` $\rightarrow$ `PENDING_VERIFICATION` (Re-cut resubmission)
  - `VERIFIED` $\rightarrow$ `SEWING_STARTED`
  - Any illegal transition is rejected server-side with **HTTP 409 Conflict**.
- **Automated Fabric Wastage Analytics:**
  - Real-time computation: $\text{Wastage \%} = \frac{\text{Actual Fabric} - \text{Expected Fabric}}{\text{Expected Fabric}} \times 100$.
- **Immutable Audit Trail:** Append-only verification log tracking verifier decisions, timestamps, and defect notes.
- **High-Contrast Accessible UI:** Strictly enforced light scheme (`color-scheme: light`), dark `#111827` text on pure white inputs, visible borders, and focus rings.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 14+ (App Router), TypeScript (Strict), React 19 |
| **Styling** | Tailwind CSS (Explicit High-Contrast Light Theme) |
| **Database & ORM** | PostgreSQL (Supabase Pooler & Direct) + Prisma ORM |
| **Authentication** | Jose JWT (`HS256`, 8h expiry) stored in `httpOnly`, `SameSite=Lax` cookies + Bcrypt |
| **Validation** | Zod (Schemas on every API endpoint) |
| **Testing** | Vitest (Automated unit tests for calculations, RBAC, state machine, and validation) |

---

## Quick Start & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/keshanrandula/apparelflow-cutting-gate.git
cd apparelflow-cutting-gate
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your PostgreSQL database connection strings:
```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://<user>:<password>@<pooler-host>:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<direct-host>:5432/postgres"
JWT_SECRET="super-secret-jwt-signing-key-change-in-production"
```

### 4. Push Database Schema & Seed Data
```bash
npx prisma db push
npm run db:seed
```

### 5. Run Automated Tests
```bash
npm test
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts for Evaluation

The database seed includes 3 pre-configured user accounts covering the factory personas and test workflows:

| Role | Email | Password | Designation |
| :--- | :--- | :--- | :--- |
| **Cutting Supervisor** | `supervisor@apparelflow.com` | `Supervisor@123` | Cutting Supervisor |
| **QC Gatekeeper** | `verifier@apparelflow.com` | `Verifier@123` | QC Gatekeeper |
| **Sewing Supervisor** | `sewing@apparelflow.com` | `Sewing@123` | Sewing Supervisor |

*(Note: The login terminal includes 1-click **Quick Role Switcher** buttons for instant evaluator access).*

---

## ⚡ Evaluator 5-Minute Technical Audit Walkthrough

Evaluators can verify the entire production system on the live deployed URL following these 5 steps (matching Section 16 of the Assessment Specification):

1. **High-Contrast UI & Accessibility Audit:**
   - Click every input, search bar, and select dropdown across dark and light modes.
   - All text renders in high-contrast `#111827` on pure white inputs with clear focus rings and zero white-on-white text issues.

2. **Server-Enforced RBAC Check:**
   - Log in as **Cutting Supervisor**: Create batches, view personal orders.
   - Log in as **QC Gatekeeper**: Notice `+ Create Order` action is strictly hidden on UI and rejected with `403 Forbidden` on the API.
   - Log in as **Sewing Supervisor**: Notice unverified/pending/rejected batches are strictly invisible and inaccessible.

3. **Shortage Hard Stop (Gatekeeper Rule):**
   - Log in as **QC Gatekeeper** and open any pending batch.
   - Enter a shortage count for any component (e.g. 40 pcs when 50 pcs are expected).
   - Notice the traffic-light indicator immediately turns **RED SHORTAGE** and the `Approve Batch` button is strictly disabled on the UI and rejected with **HTTP 422** on the server.

4. **Sewing Queue Handoff & Cloud Persistence:**
   - In Gatekeeper Terminal, click `Fill All Expected` (All GREEN) and approve the batch.
   - Log in as **Sewing Supervisor**: The approved batch appears in the **Sewing Floor Queue**.
   - Click `Start Sewing Intake` to initiate assembly line intake.
   - Refresh the browser; all statuses and audit logs remain 100% persistent in PostgreSQL.

5. **AI Candor & Code Audit:**
   - Inspect `AI_OPTIMIZATION_REPORT.md` for candid documentation of AI prompts, caught hallucinations, and human refactoring.

---

## Directory Structure

```
├── prisma/                          # Prisma ORM schema, migrations, & seed
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/                         # App Router (Pages, Layouts & API Routes)
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── cutting/
│   │   │   ├── verification/
│   │   │   ├── sewing/
│   │   │   └── orders/[id]/
│   │   ├── api/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── client/                      # Frontend Presentation Layer
│   │   ├── api/client.ts            # Typed REST API Client
│   │   ├── components/              # Domain & UI Components
│   │   ├── hooks/                   # Custom React Hooks (useAuth, useOrders)
│   │   └── types/                   # Client View Types
│   ├── server/                      # Backend Service & Security Layer
│   │   ├── auth/                    # Jose JWT & RBAC Guards
│   │   ├── domain/                  # State Machine & Math Calculations
│   │   ├── services/                # Business Logic Services
│   │   ├── validators/              # Zod Validation Schemas
│   │   └── http.ts                  # Central Error & HTTP Mapper
│   └── lib/                         # Singleton Prisma Client
└── tests/                           # Vitest Unit & Integration Suites
    └── unit/
```

---

## License
This project is licensed under the MIT License.
