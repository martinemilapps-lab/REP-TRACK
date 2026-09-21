# REP TRACK — Antigravity takeover handoff

Last verified: 2026-09-21 (Africa/Cairo)

## Takeover baseline

- Repository: `https://github.com/martinemilapps-lab/REP-TRACK.git`
- Primary branch: `main`
- Local workspace: `D:\Vibe_Antigravity_Projects\REP TRACK`
- Vercel link: project `reptracksunny`, project ID `prj_iaMBsKxGMno329XYYBGNQsZHrXOw`, team ID `team_REUWMTVaMWZWwNR2EKy9SGSM`
- Cloudflare Worker: `rep-track-d1-api-dev`
- Cloudflare D1 binding: `DB` → database `rep-track-dev` (`0e35f1e7-70be-494b-ab20-eb8f649010fb`)
- Framework: Next.js 16.3.2 App Router/Turbopack, React 19.2.8, TypeScript, Tailwind CSS 4
- Data layer: Drizzle ORM over a protected Cloudflare Worker data gateway to D1

The application is bilingual (English/Arabic), role- and hierarchy-aware, and supports representative and manager workflows, customer lists, visits/reports, coverage/compliance, weekly plans, administration, and Excel exports. Authentication uses database-backed sessions, password rotation, server-derived identity, role/capability checks, and rate limiting.

## Non-negotiable preservation rules

1. Read `AGENTS.md` and the relevant installed Next.js guide under `node_modules/next/dist/docs/` before editing framework code. This project uses a version with breaking changes.
2. Preserve the existing UI/UX system, CSS variables/design tokens, bilingual text direction, mobile behavior, API contracts, authorization boundaries, and database data.
3. Never trust a client-supplied representative identity. Continue resolving writable/readable scope from the authenticated server session and hierarchy policies.
4. Never expose or commit secrets. The ignored files `.env.local`, `.dev-credentials*`, `local.db*`, `.wrangler/`, and generated credentials remain local only.
5. Do not run remote D1 migrations, seeds, destructive SQL, production deploys, rollbacks, or domain changes without explicit approval for the exact target. Create/confirm a recoverable D1 backup or Time Travel bookmark first.
6. Avoid broad formatting or lint rewrites during feature work. The codebase contains dense legacy files; keep changes focused and reviewable.

## Runtime and deployment flow

```text
Browser
  → Next.js application on Vercel
    → server-only dataGatewayClient
      → authenticated Cloudflare Worker
        → Cloudflare D1
```

Vercel is linked locally through the ignored `.vercel/project.json`. The intended release flow is reviewed Git commits on `main` with Vercel Git integration. For a manual release, inspect/link the exact project and team first, create a preview, verify it, then promote the same artifact. Do not disable deployment protection; use `vercel curl` for protected previews.

Cloudflare Worker source is in `cloudflare/rep-track-d1-api/`. Its deployment is separate from the Vercel frontend. Worker configuration is in `cloudflare/rep-track-d1-api/wrangler.jsonc`.

## Environment contract

Required runtime names are documented in `.env.example`:

- `REP_TRACK_DATA_API_URL`
- `REP_TRACK_DATA_API_SECRET`
- `SESSION_SECRET`
- `MANAGER_PASSWORD_HASH`
- `NODE_ENV`

Additional code paths reference `BUSINESS_TIME_ZONE` (defaults to the authoritative `Africa/Cairo`) and `MANAGER_DEFAULT_PASSWORD` for controlled seed operations. Values must stay in the approved secret stores; never copy them into documentation, prompts, commits, logs, or chat.

## Verification baseline

Run from the repository root:

```text
npm install
npm test
npm run build
npm run lint
```

Verified on 2026-09-21:

- `npm test`: PASS — 157 passed, 0 failed; remote database integration suites intentionally skipped unless an explicitly designated non-production target is supplied.
- `npm run build`: PASS — optimized Next.js production build and TypeScript checks completed successfully; 49 routes/pages were generated or registered.
- `npm run lint`: FAIL — 52 errors and 33 warnings in pre-existing scripts, tests, and app files. Major categories are CommonJS `require`, explicit `any`, React state updates inside effects, plain anchors for internal navigation, and unused symbols. This is known debt, not a production-build blocker. Re-baseline after each change and do not conceal regressions.

## Current delivered feature set at handoff

The final synchronized change set adds and verifies:

- pre-registered customer details shown inside hospital, doctor, pharmacy, and distribution-branch visit forms;
- Single/Double visit status and required companion capture for Double visits;
- persisted visit cycle, visit type, and companion data in visit services;
- customer visit cycles constrained to 7, 10, 14, or 30 days;
- the business-provided canonical catalog reconciled to 86 unique products;
- dynamic product-count display and updated regression expectations.

The complete test suite and production build pass with this feature set.

## Database and migration safety

- Local Drizzle migrations are in `drizzle/`.
- Remote D1 scripts and SQL are in `scripts/migrate_*.ts` and `scripts/migrations/`.
- `npm run db:migrate` targets `file:local.db`; it is not the D1 production migration path.
- Read `docs/step19-migration.md`, `docs/admin-phase1-migration.md`, `docs/task4-production.md`, and `scripts/migrations/ROLLBACK_NOTES.md` before any remote operation.
- STEP 19 is explicitly documented as prepared/not applied. Confirm actual remote state with read-only checks; do not infer it from local files.
- Migration scripts are designed to fail closed and require explicit flags. Preserve those gates.

## Git and release checklist

1. `git status --short --branch` and `git fetch`/`git pull --ff-only` after confirming no local work would be overwritten.
2. Review the diff and confirm ignored secret/local data files remain untracked.
3. Run targeted tests, `npm test`, and `npm run build`; run lint and compare against the documented baseline.
4. Commit a focused change on the intended branch and push to GitHub.
5. Confirm the Vercel deployment belongs to the expected commit and reaches `READY`.
6. Smoke-test authentication, role routing, representative list ownership, one read path per report type, and exports. Use non-production data for write tests unless production writes are explicitly approved.
7. Check deployment/runtime errors and document any operational change here.

## First actions for Antigravity

1. Paste/use `ANTIGRAVITY_PROMPT.md` as the takeover instruction.
2. Audit current Git/GitHub/Vercel state and compare the deployed commit with local `HEAD`.
3. Confirm environment-variable names and presence without revealing values.
4. Confirm D1 migration state with read-only queries before proposing any schema action.
5. Continue only from a clean, verified baseline and keep this document current.
