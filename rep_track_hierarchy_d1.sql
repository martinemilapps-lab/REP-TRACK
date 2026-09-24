-- REP-TRACK complete reporting hierarchy
-- Dialect: Cloudflare D1 / SQLite
-- Source of truth: attached Mermaid.js hierarchy supplied by the owner.
-- This file is idempotent for the 34 source positions. It does not create login users.

PRAGMA foreign_keys = ON;

-- Canonical titles. Variants are retained because they are present in the source.
CREATE TABLE IF NOT EXISTS org_titles (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  title_family  TEXT NOT NULL CHECK (title_family IN ('MR','DM','AM','OM','BUM','SMD')),
  hierarchy_rank INTEGER NOT NULL CHECK (hierarchy_rank BETWEEN 10 AND 60)
);

CREATE TABLE IF NOT EXISTS org_territories (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

-- account_user_id is intentionally nullable. Vacant positions must never have a login.
CREATE TABLE IF NOT EXISTS org_employees (
  id                 TEXT PRIMARY KEY,
  source_key         TEXT NOT NULL UNIQUE,
  full_name          TEXT NOT NULL,
  normalized_name    TEXT NOT NULL UNIQUE,
  title_id           TEXT NOT NULL,
  territory_id       TEXT,
  employment_status  TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (employment_status IN ('ACTIVE','INACTIVE','VACANT')),
  account_user_id    TEXT UNIQUE,
  created_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (title_id) REFERENCES org_titles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (territory_id) REFERENCES org_territories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CHECK (employment_status <> 'VACANT' OR account_user_id IS NULL)
);

-- One current immediate manager per employee. Managers are employees too, so this
-- naturally supports managers above managers at any depth.
CREATE TABLE IF NOT EXISTS org_reporting_relationships (
  employee_id  TEXT PRIMARY KEY,
  manager_id   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES org_employees(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES org_employees(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (employee_id <> manager_id)
);

CREATE INDEX IF NOT EXISTS idx_org_reporting_manager
  ON org_reporting_relationships(manager_id);

-- Closure table used for fast authorization and subtree queries.
-- depth 0 = self, depth 1 = direct report, depth > 1 = indirect report.
CREATE TABLE IF NOT EXISTS org_hierarchy_paths (
  ancestor_id    TEXT NOT NULL,
  descendant_id  TEXT NOT NULL,
  depth          INTEGER NOT NULL CHECK (depth >= 0),
  PRIMARY KEY (ancestor_id, descendant_id),
  FOREIGN KEY (ancestor_id) REFERENCES org_employees(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (descendant_id) REFERENCES org_employees(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CHECK (
    (depth = 0 AND ancestor_id = descendant_id) OR
    (depth > 0 AND ancestor_id <> descendant_id)
  )
);

CREATE INDEX IF NOT EXISTS idx_org_paths_descendant
  ON org_hierarchy_paths(descendant_id, depth);

-- Prevent a new or updated relationship from creating a cycle.
CREATE TRIGGER IF NOT EXISTS trg_org_reporting_no_cycle_insert
BEFORE INSERT ON org_reporting_relationships
FOR EACH ROW
BEGIN
  SELECT CASE WHEN EXISTS (
    WITH RECURSIVE managers(id) AS (
      SELECT manager_id
      FROM org_reporting_relationships
      WHERE employee_id = NEW.manager_id
      UNION ALL
      SELECT r.manager_id
      FROM org_reporting_relationships r
      JOIN managers m ON r.employee_id = m.id
    )
    SELECT 1 FROM managers WHERE id = NEW.employee_id
  ) THEN RAISE(ABORT, 'reporting relationship would create a cycle') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_org_reporting_no_cycle_update
BEFORE UPDATE OF employee_id, manager_id ON org_reporting_relationships
FOR EACH ROW
BEGIN
  SELECT CASE WHEN EXISTS (
    WITH RECURSIVE managers(id) AS (
      SELECT manager_id
      FROM org_reporting_relationships
      WHERE employee_id = NEW.manager_id
        AND employee_id <> OLD.employee_id
      UNION ALL
      SELECT r.manager_id
      FROM org_reporting_relationships r
      JOIN managers m ON r.employee_id = m.id
      WHERE r.employee_id <> OLD.employee_id
    )
    SELECT 1 FROM managers WHERE id = NEW.employee_id
  ) THEN RAISE(ABORT, 'reporting relationship would create a cycle') END;
END;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

INSERT INTO org_titles (id, code, display_name, title_family, hierarchy_rank) VALUES
  ('title_mr',   'MR',   'MR',   'MR',  10),
  ('title_mr2',  'MR2',  'MR2',  'MR',  10),
  ('title_dm',   'DM',   'DM',   'DM',  20),
  ('title_dm2',  'DM2',  'DM2',  'DM',  20),
  ('title_dm_2', 'DM 2', 'DM 2', 'DM',  20),
  ('title_am',   'AM',   'AM',   'AM',  30),
  ('title_om',   'OM',   'OM',   'OM',  40),
  ('title_bum2', 'BUM2', 'BUM2', 'BUM', 50),
  ('title_smd',  'SMD',  'SMD',  'SMD', 60)
ON CONFLICT(id) DO UPDATE SET
  code = excluded.code,
  display_name = excluded.display_name,
  title_family = excluded.title_family,
  hierarchy_rank = excluded.hierarchy_rank;

INSERT INTO org_territories (id, name) VALUES
  ('territory_national', 'National'),
  ('territory_giza', 'Giza'),
  ('territory_down_town_maadi', 'Down Town / Maadi'),
  ('territory_alex', 'Alex'),
  ('territory_fayoum_benisuef', 'Fayoum/Benisuef'),
  ('territory_gharbia_menofya_tanta', 'Gharbia/Menofya, Tanta'),
  ('territory_menofya_qalubia_manager', 'Menofya /Qalubia'),
  ('territory_sharkia_mansoura', 'Sharkia/Mansoura'),
  ('territory_giza_behira_kafr', 'Giza/Behira/Kafr el sheikh'),
  ('territory_sohag_qena_red_sea', 'Sohag, Qena, Red Sea'),
  ('territory_mina_assuit', 'Mina, Assuit'),
  ('territory_behira_kafr', 'Behira/Kafr el shiekh'),
  ('territory_doki_mohandseen', 'Doki/Mohandseen'),
  ('territory_october', 'October'),
  ('territory_haram_faisal', 'Haram/Faisal'),
  ('territory_down_town', 'Down Town'),
  ('territory_maadi_helwan', 'Vacant Maadi/Helwan'),
  ('territory_nasr_city', 'Vacant Nasr city'),
  ('territory_masr_el_gedida', 'Masr El gedida'),
  ('territory_cairo_east', 'Cairo East'),
  ('territory_shobra', 'Shobra /Shobra el Khema'),
  ('territory_alex_1', 'Alex 1'),
  ('territory_alex_2', 'Vacant Alex 2'),
  ('territory_tanta', 'Tanta'),
  ('territory_menofya_qalubia', 'Menofya/Qalubia'),
  ('territory_sharkya_portsaid', 'Sharkya /Portsaid'),
  ('territory_mansoura', 'Mansoura'),
  ('territory_minya', 'Minya'),
  ('territory_qena_red_sea', 'Qena /Red Sea'),
  ('territory_sohag', 'Sohag')
ON CONFLICT(id) DO UPDATE SET name = excluded.name;

-- ---------------------------------------------------------------------------
-- Employees and vacant positions (34 total: 30 people + 4 vacancies)
-- account_user_id remains NULL here and must be linked to existing auth users
-- by the application migration using stable existing user IDs.
-- ---------------------------------------------------------------------------

INSERT INTO org_employees
  (id, source_key, full_name, normalized_name, title_id, territory_id, employment_status)
VALUES
  ('emp_maged_raouf',       'NODE_SMD',       'Maged Raouf',         'maged raouf',          'title_smd',  NULL,                              'ACTIVE'),
  ('emp_osama_bert',        'NODE_BUM',       'Osama Bert',          'osama bert',           'title_bum2', 'territory_national',              'ACTIVE'),
  ('emp_bassem_hanna',      'NODE_DM_BAS',    'Bassem Hanna',        'bassem hanna',         'title_dm_2', 'territory_giza',                  'ACTIVE'),
  ('emp_marwa_shaaban',     'NODE_DM_MAR',    'Marwa Shaaban',       'marwa shaaban',        'title_dm2',  'territory_down_town_maadi',       'ACTIVE'),
  ('emp_mina_michel',       'NODE_OM_MIN',    'Mina Michel',         'mina michel',          'title_om',   'territory_alex',                  'ACTIVE'),
  ('emp_rafik_maged',       'NODE_DM_RAF',    'Rafik Maged',         'rafik maged',          'title_dm',   'territory_fayoum_benisuef',       'ACTIVE'),
  ('emp_peter_abdel_nour',  'NODE_OM_PET',    'Peter Abdel Nour',    'peter abdel nour',     'title_om',   'territory_gharbia_menofya_tanta', 'ACTIVE'),
  ('emp_marian_adel',       'NODE_DM_MARIAN', 'Marian Adel',         'marian adel',          'title_dm',   'territory_menofya_qalubia_manager','ACTIVE'),
  ('emp_peter_basily',      'NODE_DM_PETB',   'Peter Basily',        'peter basily',         'title_dm',   'territory_sharkia_mansoura',      'ACTIVE'),
  ('emp_michael_antonyo',   'NODE_AM_MIC',    'Michael Antonyo',     'michael antonyo',      'title_am',   'territory_giza_behira_kafr',      'ACTIVE'),
  ('emp_ashraf_shawky',     'NODE_DM_ASH',    'Ashraf Shawky',       'ashraf shawky',        'title_dm',   'territory_sohag_qena_red_sea',    'ACTIVE'),
  ('emp_wael_atef',         'NODE_OM_WAE',    'Wael Atef',           'wael atef',            'title_om',   'territory_mina_assuit',           'ACTIVE'),
  ('emp_maher_khamis',      'NODE_DM_MAH',    'Maher Khamis',        'maher khamis',         'title_dm',   'territory_behira_kafr',           'ACTIVE'),
  ('emp_sara_adel',         'NODE_MR_SAR',    'Sara Adel',           'sara adel',            'title_mr2',  'territory_doki_mohandseen',        'ACTIVE'),
  ('emp_mostafa_ahmed',     'NODE_MR_MOS',    'Mostafa Ahmed',       'mostafa ahmed',        'title_mr2',  'territory_october',               'ACTIVE'),
  ('emp_mohamed_baiomy',    'NODE_MR_MOH',    'Mohamed Baiomy',      'mohamed baiomy',       'title_mr2',  'territory_haram_faisal',          'ACTIVE'),
  ('emp_esraa_shehata',     'NODE_MR_ESR',    'Esraa Shehata',       'esraa shehata',        'title_mr2',  'territory_down_town',             'ACTIVE'),
  ('vac_maadi_helwan',      'NODE_MR_VACM',   'Vacant Maadi/Helwan', 'vacant maadi/helwan',  'title_mr2',  'territory_maadi_helwan',          'VACANT'),
  ('vac_nasr_city',         'NODE_MR_VACN',   'Vacant Nasr City',    'vacant nasr city',     'title_mr2',  'territory_nasr_city',             'VACANT'),
  ('emp_philip_nayer',      'NODE_MR_PHI',    'Philip Nayer',        'philip nayer',         'title_mr2',  'territory_masr_el_gedida',        'ACTIVE'),
  ('emp_fawzy_nasser',      'NODE_MR_FAW',    'Fawzy Nasser',        'fawzy nasser',         'title_mr2',  'territory_cairo_east',            'ACTIVE'),
  ('emp_engy_hosny',        'NODE_MR_ENG',    'Engy Hosny',          'engy hosny',           'title_mr2',  'territory_shobra',                'ACTIVE'),
  ('emp_helana_alex_1',     'NODE_MR_HEL',    'Helana Alex 1',       'helana alex 1',        'title_mr2',  'territory_alex_1',                'ACTIVE'),
  ('vac_alex_2',            'NODE_MR_VACA',   'Vacant Alex 2',       'vacant alex 2',        'title_mr2',  'territory_alex_2',                'VACANT'),
  ('emp_amanda_medhat',     'NODE_MR_AMA',    'Amanda Medhat',       'amanda medhat',        'title_mr2',  'territory_fayoum_benisuef',       'ACTIVE'),
  ('emp_marina_sameh',      'NODE_MR_MARS',   'Marina Sameh',        'marina sameh',         'title_mr2',  'territory_tanta',                 'ACTIVE'),
  ('emp_ahmed_hassan',      'NODE_MR_AHM',    'Ahmed Hassan',        'ahmed hassan',         'title_mr2',  'territory_menofya_qalubia',       'ACTIVE'),
  ('emp_ahmed_mesalamy',    'NODE_MR_AHE',    'Ahmed el Mesalamy',   'ahmed el mesalamy',    'title_mr2',  'territory_sharkya_portsaid',      'ACTIVE'),
  ('emp_emad_latif',        'NODE_MR_EMA',    'Emad Latif',          'emad latif',           'title_mr2',  'territory_mansoura',              'ACTIVE'),
  ('vac_minya',             'NODE_MR_VACMI',  'Vacant Minya',        'vacant minya',         'title_mr2',  'territory_minya',                 'VACANT'),
  ('emp_randa_magdy',       'NODE_MR_RAN',    'Randa Magdy',         'randa magdy',          'title_mr',   'territory_qena_red_sea',          'ACTIVE'),
  ('emp_kirollos_adel',     'NODE_MR_KIR',    'Kirollos Adel',       'kirollos adel',        'title_mr',   'territory_sohag',                 'ACTIVE'),
  ('emp_john_amin',         'NODE_MR_JOH',    'John Amin',           'john amin',            'title_mr',   NULL,                              'ACTIVE'),
  ('emp_ahmed_el_kot',      'NODE_MR_AHK',    'Ahmed El Kot',        'ahmed el kot',         'title_mr2',  NULL,                              'ACTIVE')
ON CONFLICT(id) DO UPDATE SET
  source_key = excluded.source_key,
  full_name = excluded.full_name,
  normalized_name = excluded.normalized_name,
  title_id = excluded.title_id,
  territory_id = excluded.territory_id,
  employment_status = excluded.employment_status,
  updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- Immediate reporting relationships. These 33 edges reproduce the supplied
-- Mermaid tree exactly. In particular, Rafik Maged, Peter Basily and Maher
-- Khamis report directly to Osama Bert; Michael Antonyo has no direct reports.
-- ---------------------------------------------------------------------------

INSERT INTO org_reporting_relationships (employee_id, manager_id) VALUES
  ('emp_osama_bert',       'emp_maged_raouf'),
  ('emp_bassem_hanna',     'emp_osama_bert'),
  ('emp_marwa_shaaban',    'emp_osama_bert'),
  ('emp_mina_michel',      'emp_osama_bert'),
  ('emp_rafik_maged',      'emp_osama_bert'),
  ('emp_peter_abdel_nour', 'emp_osama_bert'),
  ('emp_peter_basily',     'emp_osama_bert'),
  ('emp_michael_antonyo',  'emp_osama_bert'),
  ('emp_ashraf_shawky',    'emp_osama_bert'),
  ('emp_wael_atef',        'emp_osama_bert'),
  ('emp_maher_khamis',     'emp_osama_bert'),
  ('emp_philip_nayer',     'emp_osama_bert'),
  ('emp_fawzy_nasser',     'emp_osama_bert'),
  ('emp_engy_hosny',       'emp_osama_bert'),
  ('emp_sara_adel',        'emp_bassem_hanna'),
  ('emp_mostafa_ahmed',    'emp_bassem_hanna'),
  ('emp_mohamed_baiomy',   'emp_bassem_hanna'),
  ('emp_esraa_shehata',    'emp_marwa_shaaban'),
  ('vac_maadi_helwan',     'emp_marwa_shaaban'),
  ('vac_nasr_city',        'emp_marwa_shaaban'),
  ('emp_helana_alex_1',    'emp_mina_michel'),
  ('vac_alex_2',           'emp_mina_michel'),
  ('emp_amanda_medhat',    'emp_rafik_maged'),
  ('emp_marina_sameh',     'emp_peter_abdel_nour'),
  ('emp_marian_adel',      'emp_peter_abdel_nour'),
  ('emp_ahmed_hassan',     'emp_marian_adel'),
  ('emp_ahmed_mesalamy',   'emp_peter_basily'),
  ('emp_emad_latif',       'emp_peter_basily'),
  ('emp_randa_magdy',      'emp_ashraf_shawky'),
  ('emp_kirollos_adel',    'emp_ashraf_shawky'),
  ('vac_minya',            'emp_wael_atef'),
  ('emp_john_amin',        'emp_wael_atef'),
  ('emp_ahmed_el_kot',     'emp_maher_khamis')
ON CONFLICT(employee_id) DO UPDATE SET
  manager_id = excluded.manager_id,
  updated_at = CURRENT_TIMESTAMP;

-- Rebuild the closure table from the authoritative immediate relationships.
DELETE FROM org_hierarchy_paths;

INSERT INTO org_hierarchy_paths (ancestor_id, descendant_id, depth)
SELECT id, id, 0 FROM org_employees;

WITH RECURSIVE hierarchy (ancestor_id, descendant_id, depth, visited) AS (
  SELECT manager_id, employee_id, 1,
         ',' || manager_id || ',' || employee_id || ','
  FROM org_reporting_relationships

  UNION ALL

  SELECT h.ancestor_id, r.employee_id, h.depth + 1,
         h.visited || r.employee_id || ','
  FROM hierarchy h
  JOIN org_reporting_relationships r
    ON r.manager_id = h.descendant_id
  WHERE instr(h.visited, ',' || r.employee_id || ',') = 0
)
INSERT INTO org_hierarchy_paths (ancestor_id, descendant_id, depth)
SELECT ancestor_id, descendant_id, MIN(depth)
FROM hierarchy
GROUP BY ancestor_id, descendant_id
ON CONFLICT(ancestor_id, descendant_id) DO UPDATE SET depth = excluded.depth;

-- ---------------------------------------------------------------------------
-- Verification queries. Expected: 34 positions, 30 active people, 4 vacancies,
-- 33 immediate relationships, 1 root, 0 cycles, 0 orphaned non-root positions.
-- ---------------------------------------------------------------------------

SELECT
  COUNT(*) AS total_positions,
  SUM(CASE WHEN employment_status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_people,
  SUM(CASE WHEN employment_status = 'VACANT' THEN 1 ELSE 0 END) AS vacant_positions
FROM org_employees;

SELECT COUNT(*) AS immediate_relationships
FROM org_reporting_relationships;

SELECT e.id, e.full_name
FROM org_employees e
LEFT JOIN org_reporting_relationships r ON r.employee_id = e.id
WHERE r.employee_id IS NULL;

SELECT COUNT(*) AS invalid_self_or_cycle_paths
FROM org_hierarchy_paths
WHERE ancestor_id = descendant_id AND depth > 0;

SELECT e.full_name AS employee, m.full_name AS immediate_manager
FROM org_reporting_relationships r
JOIN org_employees e ON e.id = r.employee_id
JOIN org_employees m ON m.id = r.manager_id
ORDER BY m.full_name, e.full_name;

-- Example authorized subtree query. Replace :manager_id with the authenticated
-- employee ID. Exclude depth 0 to return descendants only; exclude vacancies
-- from user-facing selectors.
SELECT e.id, e.full_name, t.display_name AS title, p.depth
FROM org_hierarchy_paths p
JOIN org_employees e ON e.id = p.descendant_id
JOIN org_titles t ON t.id = e.title_id
WHERE p.ancestor_id = :manager_id
  AND p.depth > 0
  AND e.employment_status = 'ACTIVE'
ORDER BY p.depth, e.full_name;
