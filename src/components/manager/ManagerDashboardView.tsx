'use client';
import { TeamReportExplorer } from './TeamReportExplorer';
import type { ActivityType, Representative } from '@/types';
/** Compatibility boundary for existing workspace callers; overview has its own data flow. */
export function ManagerDashboardView({ initialTab }: { reps:Representative[]; onLock:()=>void; onError:(message:string)=>void; onSuccess:(message:string)=>void; initialTab?:ActivityType|'weeklyPlans'|'managerActivities' }) {
 return <TeamReportExplorer initialType={initialTab==='availability'?'availability':''}/>;
}
