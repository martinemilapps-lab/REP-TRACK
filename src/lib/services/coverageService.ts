import type { UserSessionPayload } from '@/lib/auth';
import { client } from '@/lib/db';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { hierarchyService } from './hierarchyService';
import { AppError } from '@/lib/errors';

export interface CycleCoverageResult {repId:string;startDate:string;endDate:string;hospital:{required:number;completed:number;percentage:number;averageAchievement:number};doctor:{required:number;completed:number;percentage:number;averageAchievement:number};formula:string}
const days=(a:string,b:string)=>Math.floor((Date.parse(`${b}T12:00:00Z`)-Date.parse(`${a}T12:00:00Z`))/86400000)+1;
const pct=(done:number,required:number)=>required?Math.round(Math.min(100,done/required*1000))/10:0;

export async function getCycleCoverage(session:UserSessionPayload|null,repId:string,startDate:string,endDate:string):Promise<CycleCoverageResult>{
 assertAuthenticatedSession(session);if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||endDate<startDate)throw new AppError('Invalid reporting period',400);
 if(session.role==='REPRESENTATIVE'){if(session.repId!==repId)throw new AppError('Coverage is outside your authorized scope',403);}else await hierarchyService.assertRepVisible(session,repId);
 const periodDays=days(startDate,endDate);
 const [hospitalEntities,doctorEntities,hospitalDone,doctorDone]=await Promise.all([
  client.execute('SELECT id,default_cycle AS cycle,created_at FROM hospitals WHERE rep_id=? AND is_active=1',[repId]) as Promise<Array<{id:string;cycle:number;created_at:number}>>,
  client.execute('SELECT id,default_cycle AS cycle,created_at FROM doctors WHERE rep_id=? AND is_active=1',[repId]) as Promise<Array<{id:string;cycle:number;created_at:number}>>,
  client.execute('SELECT hospital_id AS id,COUNT(DISTINCT last_visit_date) AS completed FROM hospital_visits WHERE rep_id=? AND last_visit_date BETWEEN ? AND ? GROUP BY hospital_id',[repId,startDate,endDate]) as Promise<Array<{id:string;completed:number}>>,
  client.execute('SELECT doctor_id AS id,COUNT(DISTINCT visit_date) AS completed FROM doctor_visits WHERE rep_id=? AND visit_date BETWEEN ? AND ? GROUP BY doctor_id',[repId,startDate,endDate]) as Promise<Array<{id:string;completed:number}>>,
 ]);
 const compute=(entities:Array<{id:string;cycle:number;created_at:number}>,done:Array<{id:string;completed:number}>)=>{const completedMap=new Map(done.map(x=>[x.id,Number(x.completed)]));let required=0,completed=0,achievementSum=0,eligible=0;for(const entity of entities){if(!entity.cycle||entity.cycle<=0)continue;const created=new Date(entity.created_at).toISOString().slice(0,10);const activeStart=created>startDate?created:startDate;if(activeStart>endDate)continue;const obligation=Math.ceil(days(activeStart,endDate)/entity.cycle);const actual=Math.min(obligation,completedMap.get(entity.id)||0);required+=obligation;completed+=actual;achievementSum+=pct(actual,obligation);eligible++;}return{required,completed,percentage:pct(completed,required),averageAchievement:eligible?Math.round(achievementSum/eligible*10)/10:0};};
 return{repId,startDate,endDate,hospital:compute(hospitalEntities,hospitalDone),doctor:compute(doctorEntities,doctorDone),formula:`Eligible unique entity-days completed ÷ cycle-derived required visits × 100. Active days in period: ${periodDays}. Duplicate same-day visits count once; inactive and zero-cycle entities are excluded; newly added entities are prorated from creation date.`};
}
