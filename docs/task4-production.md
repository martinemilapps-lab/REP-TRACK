# Task 4 production notes

## Report cutoff

The authoritative business timezone is `Africa/Cairo` (override only with `BUSINESS_TIME_ZONE`). A report dated D is accepted through D+1 before `09:00:00`; at or after 09:00 it is rejected by server services with a localized error. Weekly plans, My Lists, Product Availability, exports, configuration, and historical reads are not subject to this daily cutoff.

## Coverage formula

Hospital and Doctor coverage is calculated server-side from active MR My Lists and canonical entity IDs. For every active entity with a positive `default_cycle`, required visits are `ceil(active days overlapping the selected period / default_cycle)`. New entities are prorated from `created_at`; inactive and zero-cycle entities are excluded. Completed visits are unique entity/date combinations within the period, capped by the entity obligation so duplicate same-day and excess visits do not inflate coverage. Coverage is `eligible completed / required * 100`; a zero denominator produces 0%. Average achievement is the arithmetic mean of each eligible entity's capped achievement.

The current schema does not retain a history table for edits to `default_cycle`; therefore historical calculations use the currently persisted cycle. A future frequency-history migration can replace that input without changing the result contract.

## Safe migration

Run `npm run db:migrate:d1:task4` only against the verified production Data Gateway after creating a Cloudflare D1 Time Travel bookmark. The script records pre/post row counts, adds columns and a new extended-entry table idempotently, corrects only Rafik Maged's direct relationship using resolved stable user IDs, and rebuilds transitive paths from active canonical relationships. It does not delete reports, plans, lists, users, products, availability, or historical relationship rows; the incorrect direct edge is deactivated.
