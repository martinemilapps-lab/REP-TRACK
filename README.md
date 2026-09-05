# REP TRACK 🏢

**REP TRACK** is a high-performance, enterprise-grade Medical Representative Activity & Performance Tracking System built with **Next.js 16 (Turbopack)**, **Drizzle ORM**, and **Cloudflare D1**.

---

## 🌟 Key Features

- **Multi-Role Authentication & Security**:
  - Database-backed secure sessions.
  - Granular role isolation between **Managers** and **Representatives**.
  - Persistent IP-based rate limiting (locks after 5 failed attempts for 15 minutes).
  - Strict server-derived identity (`session.repId` cannot be spoofed from client).
- **Core Activity Reporting**:
  - Hospital Visits with doctor counts, products discussed, and competitor tracking.
  - Pharmacy Visits with classifications and scheduling cycles.
  - Doctor Visits with detailed product prioritization (Product 1, 2, 3, Reminder).
  - Distribution Branch Visits and coverage tracking.
  - Monthly Product Availability & Sales Tracking with unique `(rep, hospital, product, month)` constraints.
- **Deterministic Business Engines**:
  - **Coverage Engine**: Computes actual coverage based on **distinct** institution visits against assigned quotas.
  - **Dynamic Status Derivation**: Timezone-safe date arithmetic deriving statuses (`Visited`, `Overdue`, `Not visited yet`) dynamically without mutable database state.
- **Multi-Tab Excel Export**: Protected manager export generating comprehensive operational reports.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16.3.2 (App Router & Turbopack)
- **Database Backend**: Cloudflare D1 (`rep-track-dev`) & Cloudflare Workers
- **ORM & Migrations**: Drizzle ORM & Drizzle Kit
- **Validation**: Zod
- **Styling**: Tailwind CSS & Lucide Icons
- **Language**: TypeScript

---

## 🚀 Getting Started

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/martinemilapps-lab/REP-TRACK.git
cd "REP TRACK"
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
REP_TRACK_DATA_API_URL=https://rep-track-d1-api.your-subdomain.workers.dev
REP_TRACK_DATA_API_SECRET=your-secure-internal-api-secret-min-32-chars
MANAGER_DEFAULT_PASSWORD=...
```

### 3. Database Migrations & Seeding

```bash
# Apply D1 migrations to Cloudflare D1 local database
cd cloudflare/rep-track-d1-api
npm run db:migrate:local
```

### 4. Running the Development Server

```bash
npm run dev
```

### 5. Running Automated Tests

```bash
npm test
```

### 6. Production Build Verification

```bash
npm run build
```
