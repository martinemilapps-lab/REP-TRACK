import type { ReactNode } from 'react';
export function FilterBar({ children }: { children: ReactNode }) { return <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3 md:flex-row md:items-end" role="search">{children}</div>; }
