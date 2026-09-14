import * as dotenv from 'dotenv';
dotenv.config({path:'.env.local'});
import {client} from '../src/lib/db';
import {PRODUCTS_LIST} from '../src/lib/constants';

async function addColumn(table:string,name:string,definition:string){const info=await client.execute(`PRAGMA table_info(${table})`) as Array<{name:string}>;if(!info.some(column=>column.name===name))await client.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`)}
async function main(){
 await addColumn('pharmacies','distributors',"TEXT NOT NULL DEFAULT '[]'");await addColumn('pharmacies','distributor_other','TEXT');await addColumn('trainings','location','TEXT');
 const statements=[
  'CREATE TABLE IF NOT EXISTS hospital_visit_departments (id TEXT PRIMARY KEY NOT NULL, hospital_visit_id TEXT NOT NULL REFERENCES hospital_visits(id) ON DELETE CASCADE, department TEXT NOT NULL, display_order INTEGER NOT NULL DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS idx_hospital_visit_departments_visit ON hospital_visit_departments(hospital_visit_id)',
  'CREATE TABLE IF NOT EXISTS hospital_visit_department_doctors (id TEXT PRIMARY KEY NOT NULL, department_id TEXT NOT NULL REFERENCES hospital_visit_departments(id) ON DELETE CASCADE, doctor_name TEXT NOT NULL, display_order INTEGER NOT NULL DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS idx_hospital_visit_department_doctors_department ON hospital_visit_department_doctors(department_id)',
  'CREATE TABLE IF NOT EXISTS doctor_visit_products (id TEXT PRIMARY KEY NOT NULL, doctor_visit_id TEXT NOT NULL REFERENCES doctor_visits(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name_snapshot TEXT NOT NULL, prescription_rate TEXT NOT NULL, display_order INTEGER NOT NULL DEFAULT 0, UNIQUE(doctor_visit_id,product_id))',
  'CREATE TABLE IF NOT EXISTS branch_visit_products (id TEXT PRIMARY KEY NOT NULL, branch_visit_id TEXT NOT NULL REFERENCES branch_visits(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name_snapshot TEXT NOT NULL, observation TEXT NOT NULL DEFAULT \'\', display_order INTEGER NOT NULL DEFAULT 0, UNIQUE(branch_visit_id,product_id))'
 ];for(const statement of statements)await client.execute(statement);
 for(const name of PRODUCTS_LIST){const normalized=name.trim().replace(/\s+/g,' ').toLowerCase();const rows=await client.execute('SELECT id,name FROM products') as Array<{id:string;name:string}>;const existing=rows.find(row=>row.name.trim().replace(/\s+/g,' ').toLowerCase()===normalized);if(existing)await client.execute('UPDATE products SET name=?,is_active=1 WHERE id=?',[name,existing.id]);else await client.execute('INSERT INTO products(id,name,is_active,created_at) VALUES(?,?,1,?)',[crypto.randomUUID(),name,Date.now()])}
 await client.execute("UPDATE products SET is_active=0 WHERE lower(trim(name)) IN ('todosunny','todosunny 350 mg')");
 const active=await client.execute('SELECT COUNT(*) AS count FROM products WHERE is_active=1');console.log(JSON.stringify({status:'Task 3 additive migration complete',active},null,2));
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Migration failed');process.exit(1)});
