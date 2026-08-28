import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

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
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

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
// 2. MASTER ENTITIES (DIMENSIONS)
// ----------------------------------------------------
export const hospitals = sqliteTable('hospitals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').references(() => representatives.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  area: text('area').notNull(),
  type: text('type').notNull().default('Private'), // Private, Government, University, Insurance, Other
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
  area: text('area').notNull(),
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

// ----------------------------------------------------
// 3. ACTIVITY LOGS / VISIT HISTORY (FACTS)
// ----------------------------------------------------
export const hospitalVisits = sqliteTable('hospital_visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  hospitalId: text('hospital_id').notNull().references(() => hospitals.id, { onDelete: 'restrict' }),
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

export const pharmacyVisits = sqliteTable('pharmacy_visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  pharmacyId: text('pharmacy_id').notNull().references(() => pharmacies.id, { onDelete: 'restrict' }),
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
  index('idx_pharm_visits_rep').on(table.repId),
  index('idx_pharm_visits_pharmacy').on(table.pharmacyId),
]);

export const doctorVisits = sqliteTable('doctor_visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  repId: text('rep_id').notNull().references(() => representatives.id, { onDelete: 'restrict' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'restrict' }),
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
  lastVisitDate: text('last_visit_date'), // YYYY-MM-DD
  cycleDays: integer('cycle_days').default(0),
  nextVisitDate: text('next_visit_date'), // YYYY-MM-DD
  visitType: text('visit_type').notNull().default('Single'), // 'Single' | 'Double'
  companion: text('companion'),
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
  month: text('month').notNull(), // Format: YYYY-MM (e.g. 2026-08)
  salesUnits: integer('sales_units').notNull().default(0),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('idx_prod_avail_unique').on(table.repId, table.hospitalId, table.productId, table.month),
  index('idx_prod_avail_rep').on(table.repId),
  index('idx_prod_avail_month').on(table.month),
]);

// ----------------------------------------------------
// 5. WEEKLY PLANS (SATURDAY TO FRIDAY)
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
// RELATIONS
// ----------------------------------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [users.repId],
    references: [representatives.id],
  }),
  sessions: many(sessions),
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
  weeklyPlans: many(weeklyPlans),
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
