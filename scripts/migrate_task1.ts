import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { client } from '../src/lib/db';

const additions: Record<string, Array<[string,string]>> = {
  hospitals: [['hospital_types',"TEXT NOT NULL DEFAULT '[]'"],['address','TEXT'],['key_person_name','TEXT'],['key_person_phone','TEXT'],['purchasing_contact_name','TEXT'],['purchasing_contact_phone','TEXT']],
  doctors: [['clinic_address','TEXT']],
  hospital_visits: [['objective_other_text','TEXT'],['daily_report_id','TEXT REFERENCES daily_reports(id) ON DELETE CASCADE']],
  pharmacy_visits: [['objective_other_text','TEXT']],
  doctor_visits: [['objective_other_text','TEXT']],
  branch_visits: [['objective_other_text','TEXT']],
};
async function main(){
  await client.execute("CREATE TABLE IF NOT EXISTS daily_reports (id TEXT PRIMARY KEY NOT NULL, rep_id TEXT NOT NULL REFERENCES representatives(id) ON DELETE RESTRICT, report_date TEXT NOT NULL, submitted_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000))");
  await client.execute('CREATE INDEX IF NOT EXISTS idx_daily_reports_rep_date ON daily_reports(rep_id, report_date)');
  for(const [table,columns] of Object.entries(additions)){
    const info=await client.execute(`PRAGMA table_info(${table})`) as Array<{name:string}>; const names=new Set(info.map(x=>x.name));
    for(const [name,type] of columns)if(!names.has(name))await client.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
  }
  await client.execute("CREATE TABLE IF NOT EXISTS hospital_visit_doctors (id TEXT PRIMARY KEY NOT NULL, hospital_visit_id TEXT NOT NULL REFERENCES hospital_visits(id) ON DELETE CASCADE, doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT, specialty_snapshot TEXT, comment TEXT)");
  await client.execute('CREATE INDEX IF NOT EXISTS idx_hospital_visit_doctors_visit ON hospital_visit_doctors(hospital_visit_id)');
  await client.execute("CREATE TABLE IF NOT EXISTS doctor_working_hospitals (doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE, hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE, UNIQUE (doctor_id, hospital_id))");
  await client.execute("CREATE TABLE IF NOT EXISTS doctor_nearby_pharmacies (doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE, pharmacy_id TEXT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE, UNIQUE (doctor_id, pharmacy_id))");
  await client.execute("CREATE TABLE IF NOT EXISTS representative_visit_rates (id TEXT PRIMARY KEY NOT NULL, rep_id TEXT NOT NULL REFERENCES representatives(id) ON DELETE CASCADE, customer_category TEXT NOT NULL CHECK(customer_category IN ('HOSPITAL','DOCTOR','PHARMACY','DISTRIBUTION_BRANCH')), daily_rate INTEGER NOT NULL DEFAULT 0 CHECK(daily_rate >= 0), working_days_per_week INTEGER NOT NULL DEFAULT 6 CHECK(working_days_per_week > 0), working_days_per_month INTEGER NOT NULL DEFAULT 26 CHECK(working_days_per_month > 0), effective_from TEXT NOT NULL, effective_to TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), UNIQUE (rep_id, customer_category, effective_from))");
  await client.execute('CREATE INDEX IF NOT EXISTS idx_rep_visit_rate_rep ON representative_visit_rates(rep_id)');
  await client.execute("UPDATE hospitals SET hospital_types = json_array(type) WHERE hospital_types = '[]' AND type IS NOT NULL AND trim(type) <> ''");
  console.log('Task 1 additive migration complete');
}
main().catch((error)=>{console.error(error instanceof Error?error.message:'Migration failed');process.exit(1)});
