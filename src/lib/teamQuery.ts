export type TeamScopeMode = 'DIRECT_REPORTS' | 'ALL_DESCENDANTS';
export function buildTeamReportsUrl(scope: TeamScopeMode): string { return `/api/reports?scopeMode=${scope}`; }
export function buildTeamPlansUrl(scope: TeamScopeMode): string { return `/api/weekly-plans?team=true&scopeMode=${scope}`; }
export function hasExplicitTeamListSelection(rep: string): boolean { return rep.trim().length > 0; }
