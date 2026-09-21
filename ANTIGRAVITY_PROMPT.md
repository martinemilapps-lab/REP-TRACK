# Antigravity IDE takeover prompt

Open the existing workspace at `D:\Vibe_Antigravity_Projects\REP TRACK` and take ownership of REP TRACK from this repository state.

Start by reading `AGENTS.md`, `docs/ANTIGRAVITY_HANDOFF.md`, `README.md`, and the relevant guides under `node_modules/next/dist/docs/` before changing Next.js code. Then inspect `git status`, the latest commits, and the current Vercel/Cloudflare links. Treat the checked-in repository as the source of truth and preserve the current bilingual UI/UX, design tokens, responsive behavior, authentication/authorization, server-derived identity, reporting rules, database contents, migrations, and deployment topology.

The handoff baseline was verified with `npm test` (157 passed, 0 failed) and `npm run build` (passed). Repository-wide `npm run lint` currently reports documented legacy debt; do not perform broad unrelated cleanup. Never print or commit `.env.local`, `.dev-credentials*`, `local.db*`, `.wrangler/`, tokens, passwords, or database secrets. Do not run a remote D1 migration, seed, destructive database operation, production deployment, rollback, or domain change without confirming the exact target and receiving explicit human approval.

Continue work in small reviewable changes. Before each delivery, run the tests relevant to the changed behavior, then `npm test` and `npm run build`; report lint truthfully. Keep GitHub `main`, the local checkout, Vercel project `reptracksunny`, and the Cloudflare Worker/D1 gateway aligned. Prefer Git-integrated Vercel deployments from reviewed commits, inspect the deployment before promotion, and verify production after release. Update `docs/ANTIGRAVITY_HANDOFF.md` whenever architecture, operations, migration state, or known risks change.

Your first response should summarize: current branch/commit and cleanliness, architecture, environment variable names (never values), test/build/lint status, Vercel and Cloudflare linkage, pending migrations or risks, and the safest next action. Do not edit code until that audit is complete.
