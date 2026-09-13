import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// ----------------------------------------------------
// 0. ORGANIZATION STRUCTURE & LOOKUPS
// ----------------------------------------------------
export const positions = sqliteTable('positions', {
  code: text('code').primaryKey(), // 'MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD'
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  hierarchyLevel: integer('hierarchy_level').notNull(),
});

export const areas = sqliteTable('areas', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  region: text('region'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_areas_name').on(table.name),
  index('idx_areas_active').on(table.isActive),
]);

export const visitObjectives = sqliteTable('visit_objectives', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  positionCode: text('position_code').notNull(),
  objectiveCode: text('objective_code').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_visit_obj_unique').on(table.positionCode, table.objectiveCode),
  index('idx_visit_obj_position').on(table.positionCode),
  index('idx_visit_obj_active').on(table.isActive),
]);

// ----------------------------------------------------
// 1. IDENTITY, AUTHENTICATION & SECURITY
// ----------------------------------------------------
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['MANAGER', 'REPRESENTATIVE'] }).notNull().default('REPRESENTATIVE'),
  repId: text('rep_id').references(() => representatives.id, { onDelete: 'set null' }),
  positionCode: text('position_code').references(() => positions.code),
  systemRole: text('system_role'),
  legacyTitleRaw: text('legacy_title_raw'),
  businessLine: integer('business_line'),
  usernameNumber: integer('username_number').default(1),
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_users_position').on(table.positionCode),
  index('idx_users_is_active').on(table.isActive),
]);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_sessions_user').on(table.userId),
  index('idx_sessions_expires').on(table.expiresAt),
]);


export const loginAttempts = sqliteTable('login_attempts', {
  ipAddress: text('ip_address').primaryKey(),
  attemptCount: integer('attempt_count').notNull().default(1),
  lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  lockedUntil: integer('locked_until', { mode: 'timestamp_ms' }),
});

export const adminAuditEvents = sqliteTable('admin_audit_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminUserId: text('admin_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  actionType: text('action_type').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: text('metadata').notNull().default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_admin_audit_created').on(table.createdAt),
  index('idx_admin_audit_admin').on(table.adminUserId),
  index('idx_admin_audit_target').on(table.targetType, table.targetId),
  index('idx_admin_audit_action').on(table.actionType),
]);

export const representatives = sqliteTable('representatives', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  area: text('area').notNull(),
  assignedHospitals: integer('assigned_hospitals').notNull().default(0),
  assignedPharmacies: integer('assigned_pharmacies').notNull().default(0),
  assignedDrs: integer('assigned_drs').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ----------------------------------------------------
// 1.1 SALES ASSIGNMENTS & DUAL ROLES
// ----------------------------------------------------
export const salesAssignments = sqliteTable('sales_assignments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignmentType: text('assignment_type', { enum: ['PRIMARY_REP', 'PERSONAL_MR', 'TERRITORY_COVERAGE'] }).notNull().default('PRIMARY_REP'),
  titleRaw: text('title_raw').notNull(),
  businessLine: integer('business_line'),
  areaId: text('area_id').references(() => areas.id, { onDelete: 'set null' }),
  territoryName: text('territory_name').notNull(),
  repId: text('rep_id').references(() => representatives.id, { onDelete: 'set null' }),
  sourceRow: integer('source_row'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_sales_assign_user').on(table.userId),
  index('idx_sales_assign_area').on(table.areaId),
  index('idx_sales_assign_line').on(table.businessLine),
]);

// ----------------------------------------------------
// 1.2 GENERAL ORGANIZATION MODEL & RELATIONSHIPS
// ----------------------------------------------------
export const organizationRelationships = sqliteTable('organization_relationships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  subordinateUserId: text('subordinate_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  managerUserId: text('manager_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull().default('DIRECT'),
  sourcePosition: text('source_position').notNull(),
  managerPosition: text('manager_position').notNull(),
  subordinateAssignmentId: text('subordinate_assignment_id').references(() => salesAssignments.id, { onDelete: 'set null' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sourceMetadata: text('source_metadata'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_org_rel_unique').on(table.subordinateUserId, table.managerUserId, table.relationshipType),
  index('idx_org_rel_mgr_sub').on(table.managerUserId, table.subordinateUserId),
  index('idx_org_rel_sub').on(table.subordinateUserId),
]);

export const hierarchyPaths = sqliteTable('hierarchy_paths', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceAssignmentId: text('source_assignment_id').references(() => salesAssignments.id, { onDelete: 'cascade' }),
  sourceUserId: text('source_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ancestorUserId: text('ancestor_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ancestorPosition: text('ancestor_position').notNull(),
  depth: integer('depth').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_hier_unique_path').on(table.ancestorUserId, table.sourceAssignmentId, table.sourceUserId),
  index('idx_hier_ancestor').on(table.ancestorUserId),
  index('idx_hier_source_assign').on(table.sourceAssignmentId),
]);

// ----------------------------------------------------
// 1.3 BACKWARD COMPATIBILITY: MANAGER SCOPES
// ----------------------------------------------------
export const managerRepScopes = sqliteTable('manager_rep_scopes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  managerUserId: text('manager_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_mgr_rep_scopes_unique').on(table.managerUserId, table.repId),
  index('idx_mgr_rep_scopes_mgr').on(table.managerUserId),
  index('idx_mgr_rep_scopes_rep').on(table.repId),
]);

export const managerAreaScopes = sqliteTable('manager_area_scopes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  managerUserId: text('manager_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  areaId: text('area_id').notNull().references(() => areas.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_mgr_area_scopes_unique').on(table.managerUserId, table.areaId),
  index('idx_mgr_area_scopes_mgr').on(table.managerUserId),
  index('idx_mgr_area_scopes_area').on(table.areaId),
]);

// ----------------------------------------------------
// 2. MASTER ENTITIES (DIMENSIONS)
// ----------------------------------------------------
export const hospitals = sqliteTable('hospitals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').references(() => representatives.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  area: text('area').notNull(),
  type: text('type').notNull().default('Private'), // Private, Government, University, Insurance, Other
  hospitalTypes: text('hospital_types').notNull().default('[]'),
  address: text('address'),
  keyPersonName: text('key_person_name'),
  keyPersonPhone: text('key_person_phone'),
  purchasingContactName: text('purchasing_contact_name'),
  purchasingContactPhone: text('purchasing_contact_phone'),
  dept: text('dept'),
  contact: text('contact'),
  phone: text('phone'),
  doctorNames: text('doctor_names'),
  defaultCycle: integer('default_cycle').default(7),
  targetProducts: text('target_products'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_hospitals_rep').on(table.repId),
  index('idx_hospitals_name_area').on(table.name, table.area),
]);

export const pharmacies = sqliteTable('pharmacies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').references(() => representatives.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  area: text('area').notNull(),
  address: text('address'),
  pharmacist: text('pharmacist'),
  mobile: text('mobile'),
  classification: text('classification').notNull().default('A'), // A, B, C
  defaultCycle: integer('default_cycle').default(7),
  targetProducts: text('target_products'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_pharmacies_rep').on(table.repId),
  index('idx_pharmacies_name_area').on(table.name, table.area),
]);

export const doctors = sqliteTable('doctors', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').references(() => representatives.id, { onDelete: 'set null' }),
  code: text('code'),
  name: text('name').notNull(),
  specialty: text('specialty'),
  workplace: text('workplace'),
  clinicAddress: text('clinic_address'),
  area: text('area').notNull(),
  address: text('address'),
  mobile: text('mobile'),
  classification: text('classification').notNull().default('A'), // A, B
  bestTime: text('best_time'),
  defaultCycle: integer('default_cycle').default(7),
  targetProducts: text('target_products'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_doctors_rep').on(table.repId),
  index('idx_doctors_name_area').on(table.name, table.area),
]);

export const distributionBranches = sqliteTable('distribution_branches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').references(() => representatives.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  coverageArea: text('coverage_area').notNull(),
  address: text('address'),
  contact: text('contact'),
  phone: text('phone'),
  distributedProducts: text('distributed_products'),
  defaultCycle: integer('default_cycle').default(7),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_dist_branches_rep').on(table.repId),
  index('idx_dist_branches_name_area').on(table.name, table.coverageArea),
]);

export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  code: text('code'),
  category: text('category'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const doctorWorkingHospitals = sqliteTable('doctor_working_hospitals', {
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  hospitalId: text('hospital_id').notNull().references(() => hospitals.id, { onDelete: 'cascade' }),
}, (table) => [uniqueIndex('idx_doctor_hospital_unique').on(table.doctorId, table.hospitalId)]);

export const doctorNearbyPharmacies = sqliteTable('doctor_nearby_pharmacies', {
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  pharmacyId: text('pharmacy_id').notNull().references(() => pharmacies.id, { onDelete: 'cascade' }),
}, (table) => [uniqueIndex('idx_doctor_pharmacy_unique').on(table.doctorId, table.pharmacyId)]);

export const representativeVisitRates = sqliteTable('representative_visit_rates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'cascade' }),
  customerCategory: text('customer_category', { enum: ['HOSPITAL','DOCTOR','PHARMACY','DISTRIBUTION_BRANCH'] }).notNull(),
  dailyRate: integer('daily_rate').notNull().default(0),
  workingDaysPerWeek: integer('working_days_per_week').notNull().default(6),
  workingDaysPerMonth: integer('working_days_per_month').notNull().default(26),
  effectiveFrom: text('effective_from').notNull(),
  effectiveTo: text('effective_to'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_rep_visit_rate_period').on(table.repId, table.customerCategory, table.effectiveFrom),
  index('idx_rep_visit_rate_rep').on(table.repId),
]);

// ----------------------------------------------------
// 3. ACTIVITY LOGS / VISIT HISTORY (FACTS)
// ----------------------------------------------------
export const dailyReports = sqliteTable('daily_reports', {
  id: text('id').primaryKey(),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  reportDate: text('report_date').notNull(),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [index('idx_daily_reports_rep_date').on(table.repId, table.reportDate)]);

export const hospitalVisits = sqliteTable('hospital_visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  dailyReportId: text('daily_report_id').references(() => dailyReports.id, { onDelete: 'cascade' }),
  hospitalId: text('hospital_id').notNull().references(() => hospitals.id, { onDelete: 'restrict' }),
  objective: text('objective'),
  objectiveOtherText: text('objective_other_text'),
  dept: text('dept'),
  drsVisited: integer('drs_visited').default(0),
  doctorNames: text('doctor_names'),
  cycleDays: integer('cycle_days').default(0),
  lastVisitDate: text('last_visit_date'), // YYYY-MM-DD
  nextVisitDate: text('next_visit_date'), // YYYY-MM-DD
  visitType: text('visit_type').notNull().default('Single'), // 'Single' | 'Double'
  companion: text('companion'),
  ourProducts: text('our_products'),
  competitor: text('competitor'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_hosp_visits_rep').on(table.repId),
  index('idx_hosp_visits_hospital').on(table.hospitalId),
  index('idx_hosp_visits_date').on(table.lastVisitDate),
]);

export const hospitalVisitDoctors = sqliteTable('hospital_visit_doctors', {
  id: text('id').primaryKey(),
  hospitalVisitId: text('hospital_visit_id').notNull().references(() => hospitalVisits.id, { onDelete: 'cascade' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'restrict' }),
  specialtySnapshot: text('specialty_snapshot'),
  comment: text('comment'),
}, (table) => [index('idx_hospital_visit_doctors_visit').on(table.hospitalVisitId)]);

export const pharmacyVisits = sqliteTable('pharmacy_visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  pharmacyId: text('pharmacy_id').notNull().references(() => pharmacies.id, { onDelete: 'restrict' }),
  objective: text('objective'),
  objectiveOtherText: text('objective_other_text'),
  cycleDays: integer('cycle_days').default(0),
  lastVisitDate: text('last_visit_date'), // YYYY-MM-DD
  nextVisitDate: text('next_visit_date'), // YYYY-MM-DD
  visitType: text('visit_type').notNull().default('Single'), // 'Single' | 'Double'
  companion: text('companion'),
  ourProducts: text('our_products'),
  stockPerMonth: text('stock_per_month'),
  salesPerMonth: text('sales_per_month'),
  competitor: text('competitor'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_pharm_visits_rep').on(table.repId),
  index('idx_pharm_visits_pharmacy').on(table.pharmacyId),
]);

export const doctorVisits = sqliteTable('doctor_visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'restrict' }),
  objective: text('objective'),
  objectiveOtherText: text('objective_other_text'),
  prescriptionRate: text('prescription_rate'), // 'Awareness' | 'Trial' | 'Regular' | 'Loyal'
  nearbyPharmacy: text('nearby_pharmacy'),
  visitDate: text('visit_date'), // YYYY-MM-DD
  cycleDays: integer('cycle_days').default(0),
  nextVisitDate: text('next_visit_date'), // YYYY-MM-DD
  visitType: text('visit_type').notNull().default('Single'), // 'Single' | 'Double'
  companion: text('companion'),
  product1: text('product_1'),
  product2: text('product_2'),
  product3: text('product_3'),
  reminderProduct: text('reminder_product'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_dr_visits_rep').on(table.repId),
  index('idx_dr_visits_doctor').on(table.doctorId),
]);

export const branchVisits = sqliteTable('branch_visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  branchId: text('branch_id').notNull().references(() => distributionBranches.id, { onDelete: 'restrict' }),
  objective: text('objective'),
  objectiveOtherText: text('objective_other_text'),
  lastVisitDate: text('last_visit_date'), // YYYY-MM-DD
  cycleDays: integer('cycle_days').default(0),
  nextVisitDate: text('next_visit_date'), // YYYY-MM-DD
  visitType: text('visit_type').notNull().default('Single'), // 'Single' | 'Double'
  companion: text('companion'),
  products: text('products'),
  monthlyStock: text('monthly_stock'),
  monthlySales: text('monthly_sales'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_branch_visits_rep').on(table.repId),
  index('idx_branch_visits_branch').on(table.branchId),
]);

// ----------------------------------------------------
// 4. PRODUCT AVAILABILITY (MONTHLY SNAPSHOTS)
// ----------------------------------------------------
export const productAvailabilities = sqliteTable('product_availabilities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  hospitalId: text('hospital_id').notNull().references(() => hospitals.id, { onDelete: 'restrict' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  objective: text('objective'),
  month: text('month').notNull(), // Format: YYYY-MM (e.g. 2026-08)
  annualTarget: integer('annual_target').default(0),
  avgMonthlyTarget: integer('avg_monthly_target').default(0),
  salesUnits: integer('sales_units').notNull().default(0),
  potentiality: integer('potentiality').default(0),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_prod_avail_unique').on(table.repId, table.hospitalId, table.productId, table.month),
  index('idx_prod_avail_rep').on(table.repId),
  index('idx_prod_avail_month').on(table.month),
]);

// ----------------------------------------------------
// 5. EVENTS, TRAINING & SPECIAL TASKS (MEDICAL REP SHEET)
// ----------------------------------------------------
export const events = sqliteTable('events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  eventType: text('event_type').notNull(), // Conference, Symposium, Booth/Stand, Roundtable, Launch, Other
  eventDate: text('event_date').notNull(), // YYYY-MM-DD
  location: text('location'),
  attendeesCount: integer('attendees_count').default(0),
  targetSpecialty: text('target_specialty'),
  products: text('products'),
  budget: text('budget'),
  feedback: text('feedback'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_events_rep').on(table.repId),
  index('idx_events_date').on(table.eventDate),
]);

export const managerActivityEntries = sqliteTable('manager_activity_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  activityId: text('activity_id').notNull().references(() => managerActivities.id, { onDelete: 'cascade' }),
  period: text('period', { enum: ['AM', 'PM'] }).notNull(),
  entryType: text('entry_type', { enum: ['HOSPITAL', 'DIRECT_DOCTOR'] }).notNull(),
  hospitalId: text('hospital_id').references(() => hospitals.id, { onDelete: 'restrict' }),
  doctorId: text('doctor_id').references(() => doctors.id, { onDelete: 'restrict' }),
  nameSnapshot: text('name_snapshot').notNull(),
  specialtySnapshot: text('specialty_snapshot'),
  generalComment: text('general_comment'),
  displayOrder: integer('display_order').notNull().default(0),
}, (table) => [index('idx_mgr_activity_entries_activity').on(table.activityId), index('idx_mgr_activity_entries_period').on(table.period)]);

export const managerActivityEntryDoctors = sqliteTable('manager_activity_entry_doctors', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryId: text('entry_id').notNull().references(() => managerActivityEntries.id, { onDelete: 'cascade' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'restrict' }),
  nameSnapshot: text('name_snapshot').notNull(),
  specialtySnapshot: text('specialty_snapshot'),
  generalComment: text('general_comment'),
  displayOrder: integer('display_order').notNull().default(0),
}, (table) => [index('idx_mgr_activity_entry_doctors_entry').on(table.entryId)]);

export const managerActivityProducts = sqliteTable('manager_activity_products', {
  activityId: text('activity_id').notNull().references(() => managerActivities.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  productNameSnapshot: text('product_name_snapshot').notNull(),
}, (table) => [uniqueIndex('idx_mgr_activity_products_unique').on(table.activityId, table.productId)]);

export const trainings = sqliteTable('trainings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  trainingType: text('training_type').notNull(), // Product Knowledge, Scientific Workshop, Selling Skills, Field Coaching, Other
  trainingDate: text('training_date').notNull(), // YYYY-MM-DD
  trainer: text('trainer'),
  attendees: text('attendees'),
  durationHours: integer('duration_hours').default(1),
  outcomes: text('outcomes'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_trainings_rep').on(table.repId),
  index('idx_trainings_date').on(table.trainingDate),
]);

export const specialTasks = sqliteTable('special_tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  taskCategory: text('task_category').notNull(), // Market Survey, Competitor Intelligence, Office/Admin, Delivery, Urgent, Other
  taskDate: text('task_date').notNull(), // YYYY-MM-DD
  assignedBy: text('assigned_by'),
  priority: text('priority').notNull().default('Normal'), // Normal, High, Urgent
  status: text('status').notNull().default('Completed'), // Completed, In Progress, Follow-up Needed
  description: text('description'),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_special_tasks_rep').on(table.repId),
  index('idx_special_tasks_date').on(table.taskDate),
]);

// ----------------------------------------------------
// 6. WEEKLY PLANS (SATURDAY TO FRIDAY)
// ----------------------------------------------------
export const weeklyPlans = sqliteTable('weekly_plans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'cascade' }),
  startDate: text('start_date').notNull(), // YYYY-MM-DD or DD-MM-YYYY (e.g. 22-8-2026)
  endDate: text('end_date').notNull(), // YYYY-MM-DD or DD-MM-YYYY (e.g. 27-8-2026 or 28-8-2026)
  weekLabel: text('week_label'), // e.g. "22-8-2026 to 27-8-2026"
  saturdayAm: text('saturday_am').default(''),
  saturdayPm: text('saturday_pm').default(''),
  sundayAm: text('sunday_am').default(''),
  sundayPm: text('sunday_pm').default(''),
  mondayAm: text('monday_am').default(''),
  mondayPm: text('monday_pm').default(''),
  tuesdayAm: text('tuesday_am').default(''),
  tuesdayPm: text('tuesday_pm').default(''),
  wednesdayAm: text('wednesday_am').default(''),
  wednesdayPm: text('wednesday_pm').default(''),
  thursdayAm: text('thursday_am').default(''),
  thursdayPm: text('thursday_pm').default(''),
  fridayAm: text('friday_am').default(''),
  fridayPm: text('friday_pm').default(''),
  status: text('status', { enum: ['Draft', 'Submitted', 'Approved'] }).notNull().default('Submitted'),
  managerNotes: text('manager_notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_weekly_plans_rep').on(table.repId),
  index('idx_weekly_plans_dates').on(table.startDate, table.endDate),
]);

// ----------------------------------------------------
// 7. MANAGER ACTIVITIES (DM, AM, OM, BUM, PM, MM, SMD)
// ----------------------------------------------------
export const managerActivities = sqliteTable('manager_activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: text('activity_type', { enum: ['Visit', 'Event', 'Training', 'Office Working', 'Others'] }).notNull(),
  activityDate: text('activity_date').notNull(), // YYYY-MM-DD
  eventFeedback: text('event_feedback'),

  // Visit specific fields
  visitType: text('visit_type', { enum: ['Single', 'Double'] }),
  accompaniedPerson: text('accompanied_person'), // Required if visitType === 'Double'

  // Morning / AM block
  morningHospitalName: text('morning_hospital_name'),
  morningDoctorNames: text('morning_doctor_names'),
  morningSpecialty: text('morning_specialty'),
  morningHospitalComment: text('morning_hospital_comment'),

  // Afternoon / PM block
  afternoonDoctorNames: text('afternoon_doctor_names'),
  afternoonSpecialty: text('afternoon_specialty'),
  afternoonDoctorComment: text('afternoon_doctor_comment'),
  afternoonPharmacyName: text('afternoon_pharmacy_name'),
  afternoonPharmacyComment: text('afternoon_pharmacy_comment'),

  // General
  generalComment: text('general_comment'),

  // Event specific fields
  eventName: text('event_name'),
  eventType: text('event_type'),
  location: text('location'),
  attendees: text('attendees'),
  budget: text('budget'),

  // Training specific fields
  trainingType: text('training_type'),
  trainingTopic: text('training_topic'),
  trainingLocation: text('training_location'),
  participants: text('participants'),

  // Office Working & Others specific fields
  workSummary: text('work_summary'),
  description: text('description'),

  // Universal notes & timestamps
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_mgr_activities_user').on(table.userId),
  index('idx_mgr_activities_date').on(table.activityDate),
  index('idx_mgr_activities_type').on(table.activityType),
]);

// ----------------------------------------------------
// 8. MANAGER WEEKLY PLANS
// ----------------------------------------------------
export const managerWeeklyPlans = sqliteTable('manager_weekly_plans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(), // YYYY-MM-DD
  weekLabel: text('week_label'),
  saturdayAm: text('saturday_am').default(''),
  saturdayPm: text('saturday_pm').default(''),
  sundayAm: text('sunday_am').default(''),
  sundayPm: text('sunday_pm').default(''),
  mondayAm: text('monday_am').default(''),
  mondayPm: text('monday_pm').default(''),
  tuesdayAm: text('tuesday_am').default(''),
  tuesdayPm: text('tuesday_pm').default(''),
  wednesdayAm: text('wednesday_am').default(''),
  wednesdayPm: text('wednesday_pm').default(''),
  thursdayAm: text('thursday_am').default(''),
  thursdayPm: text('thursday_pm').default(''),
  fridayAm: text('friday_am').default(''),
  fridayPm: text('friday_pm').default(''),
  status: text('status', { enum: ['Draft', 'Submitted', 'Approved'] }).notNull().default('Submitted'),
  managerNotes: text('manager_notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_mgr_weekly_plans_user').on(table.userId),
  uniqueIndex('idx_mgr_weekly_plans_user_week').on(table.userId, table.startDate),
  index('idx_mgr_weekly_plans_dates').on(table.startDate, table.endDate),
]);

// ----------------------------------------------------
// RELATIONS
// ----------------------------------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [users.repId],
    references: [representatives.id],
  }),
  position: one(positions, {
    fields: [users.positionCode],
    references: [positions.code],
  }),
  sessions: many(sessions),
  salesAssignments: many(salesAssignments),
  directReports: many(organizationRelationships, { relationName: 'manager' }),
  supervisors: many(organizationRelationships, { relationName: 'subordinate' }),
  managerRepScopes: many(managerRepScopes),
  managerAreaScopes: many(managerAreaScopes),
  managerActivities: many(managerActivities),
  managerWeeklyPlans: many(managerWeeklyPlans),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const representativesRelations = relations(representatives, ({ one, many }) => ({
  user: one(users, {
    fields: [representatives.id],
    references: [users.repId],
  }),
  hospitalVisits: many(hospitalVisits),
  pharmacyVisits: many(pharmacyVisits),
  doctorVisits: many(doctorVisits),
  branchVisits: many(branchVisits),
  productAvailabilities: many(productAvailabilities),
  events: many(events),
  trainings: many(trainings),
  specialTasks: many(specialTasks),
  weeklyPlans: many(weeklyPlans),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  representative: one(representatives, {
    fields: [events.repId],
    references: [representatives.id],
  }),
}));

export const trainingsRelations = relations(trainings, ({ one }) => ({
  representative: one(representatives, {
    fields: [trainings.repId],
    references: [representatives.id],
  }),
}));

export const specialTasksRelations = relations(specialTasks, ({ one }) => ({
  representative: one(representatives, {
    fields: [specialTasks.repId],
    references: [representatives.id],
  }),
}));

export const weeklyPlansRelations = relations(weeklyPlans, ({ one }) => ({
  representative: one(representatives, {
    fields: [weeklyPlans.repId],
    references: [representatives.id],
  }),
}));

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  visits: many(hospitalVisits),
  availabilities: many(productAvailabilities),
}));

export const hospitalVisitsRelations = relations(hospitalVisits, ({ one }) => ({
  representative: one(representatives, {
    fields: [hospitalVisits.repId],
    references: [representatives.id],
  }),
  hospital: one(hospitals, {
    fields: [hospitalVisits.hospitalId],
    references: [hospitals.id],
  }),
}));

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  visits: many(pharmacyVisits),
}));

export const pharmacyVisitsRelations = relations(pharmacyVisits, ({ one }) => ({
  representative: one(representatives, {
    fields: [pharmacyVisits.repId],
    references: [representatives.id],
  }),
  pharmacy: one(pharmacies, {
    fields: [pharmacyVisits.pharmacyId],
    references: [pharmacies.id],
  }),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  visits: many(doctorVisits),
}));

export const doctorVisitsRelations = relations(doctorVisits, ({ one }) => ({
  representative: one(representatives, {
    fields: [doctorVisits.repId],
    references: [representatives.id],
  }),
  doctor: one(doctors, {
    fields: [doctorVisits.doctorId],
    references: [doctors.id],
  }),
}));

export const distributionBranchesRelations = relations(distributionBranches, ({ many }) => ({
  visits: many(branchVisits),
}));

export const branchVisitsRelations = relations(branchVisits, ({ one }) => ({
  representative: one(representatives, {
    fields: [branchVisits.repId],
    references: [representatives.id],
  }),
  branch: one(distributionBranches, {
    fields: [branchVisits.branchId],
    references: [distributionBranches.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  availabilities: many(productAvailabilities),
}));

export const productAvailabilitiesRelations = relations(productAvailabilities, ({ one }) => ({
  representative: one(representatives, {
    fields: [productAvailabilities.repId],
    references: [representatives.id],
  }),
  hospital: one(hospitals, {
    fields: [productAvailabilities.hospitalId],
    references: [hospitals.id],
  }),
  product: one(products, {
    fields: [productAvailabilities.productId],
    references: [products.id],
  }),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
  users: many(users),
  visitObjectives: many(visitObjectives),
}));

export const areasRelations = relations(areas, ({ many }) => ({
  salesAssignments: many(salesAssignments),
  managerAreaScopes: many(managerAreaScopes),
}));

export const salesAssignmentsRelations = relations(salesAssignments, ({ one, many }) => ({
  user: one(users, {
    fields: [salesAssignments.userId],
    references: [users.id],
  }),
  area: one(areas, {
    fields: [salesAssignments.areaId],
    references: [areas.id],
  }),
  representative: one(representatives, {
    fields: [salesAssignments.repId],
    references: [representatives.id],
  }),
  hierarchyPaths: many(hierarchyPaths),
}));

export const organizationRelationshipsRelations = relations(organizationRelationships, ({ one }) => ({
  subordinateUser: one(users, {
    fields: [organizationRelationships.subordinateUserId],
    references: [users.id],
    relationName: 'subordinate',
  }),
  managerUser: one(users, {
    fields: [organizationRelationships.managerUserId],
    references: [users.id],
    relationName: 'manager',
  }),
  subordinateAssignment: one(salesAssignments, {
    fields: [organizationRelationships.subordinateAssignmentId],
    references: [salesAssignments.id],
  }),
}));

export const hierarchyPathsRelations = relations(hierarchyPaths, ({ one }) => ({
  sourceAssignment: one(salesAssignments, {
    fields: [hierarchyPaths.sourceAssignmentId],
    references: [salesAssignments.id],
  }),
  sourceUser: one(users, {
    fields: [hierarchyPaths.sourceUserId],
    references: [users.id],
  }),
  ancestorUser: one(users, {
    fields: [hierarchyPaths.ancestorUserId],
    references: [users.id],
  }),
}));

export const managerActivitiesRelations = relations(managerActivities, ({ one }) => ({
  user: one(users, {
    fields: [managerActivities.userId],
    references: [users.id],
  }),
}));

export const managerWeeklyPlansRelations = relations(managerWeeklyPlans, ({ one }) => ({
  user: one(users, {
    fields: [managerWeeklyPlans.userId],
    references: [users.id],
  }),
}));

