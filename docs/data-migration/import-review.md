# REP TRACK — Final Areas Sheet Audit & Account Manifest Review

> **Migration Step**: STEP 1 — Final Areas Sheet Audit, Employee Cleanup & Account Manifest  
> **Authoritative Source**: `Final Areas sheet.xlsx`  
> **Audit Date**: 2026-09-04  
> **Audit Mode**: DATA AUDIT ONLY (No database records modified, no accounts created, no Cloudflare resources provisioned)  

---

## 1. Executive Summary & Core Metrics

| Metric | Count | Description |
|---|---|---|
| **Total Source Records (Rows 3-84)** | **82** | Exact count of physical data rows in `Final Areas sheet.xlsx` |
| **Proposed Active Employee Accounts** | **63** | Distinct active personnel receiving sequential usernames |
| **Vacant Territory Records** | **13** | Preserved for territory definitions; zero accounts assigned |
| **Superseded Duplicate Rows** | **6** | Historical/redundant rows flagged as inactive duplicates |
| **Missing Titles (Unlabeled Roles)** | **5** | Final management rows lacking explicit Title column values |
| **Inferred Management Accounts** | **5** | PM (3), MM (1), and SMD (1) mapped from reporting structure |
| **Missing Direct DM Assignments (MRs)** | **12** | MR rows reporting directly to AM, OM, or BUM without DM |
| **Missing AM/OM Intermediate Layer** | **26** | MR or DM rows lacking intermediate AM or OM supervision |
| **Multi-BUM Governance Records** | **13** | Records explicitly governed by multiple Business Unit Managers |

---

## 2. Proposed Active Accounts by Official Position

Every confirmed active employee receives one unique sequential username formatted as `<POSITION><NUMBER>`, strictly following spreadsheet appearance order within their finalized position.

| Official Position Code | Position Name / Level | Active Account Count | Username Range | Status |
|---|---|---|---|---|
| **MR** | Medical Representative | **36** | `MR1` – `MR36` | Confirmed / Requires Confirmation for name variant |
| **DM** | District Manager | **14** | `DM1` – `DM14` | Confirmed (includes 5 promoted personnel) |
| **AM** | Area Manager | **2** | `AM1` – `AM2` | Confirmed |
| **OM** | Operations Manager | **3** | `OM1` – `OM3` | Confirmed |
| **BUM** | Business Unit Manager | **3** | `BUM1` – `BUM3` | Confirmed |
| **PM** | Product Manager | **3** | `PM1` – `PM3` | **INFERRED_FROM_HIERARCHY** (Requires Confirmation) |
| **MM** | Marketing Manager | **1** | `MM1` | **INFERRED_FROM_HIERARCHY** (Requires Confirmation) |
| **SMD** | Senior Managing Director | **1** | `SMD1` | **INFERRED_FROM_HIERARCHY** (Requires Confirmation) |
| **TOTAL ACTIVE ACCOUNTS** | | **63** | | **All 8 Official Position Types Represented** |

---

## 3. Vacancy Audit (13 Rows)

In accordance with migration rules, any row where Employee Name begins with `Vacant` is **excluded from user account creation**. Their geographic and line management data are preserved to populate future Area/Territory masters.

| Source Row | Sheet "No" | Vacant Record Name | Legacy Title | Territory | DM Supervisor | AM / OM Supervisor | BUM | SMD |
|---|---|---|---|---|---|---|---|---|
| Row 5 | - | **Vacant Haram faisyal** | `MR1` | Vacant Haram faisyal | Kirollos Rizk | AM: Michael Antonyo | Fady Nassif | Maged Raouf |
| Row 10 | - | **Vacant Maadi/Helwan** | `MR1` | Vacant Maadi/Helwan | Esraa el shimy | - | Fady Nassif | Maged Raouf |
| Row 11 | - | **Vacant Maadi/Helwan** | `MR2` | Vacant Maadi/Helwan | Marwa shaaban | - | Osama Bert | Maged Raouf |
| Row 12 | - | **Vacant Cairo East** | `MR1` | Vacant Cairo East | Esraa el shimy | - | Fady Nassif | Maged Raouf |
| Row 18 | - | **Vacant Alex 2** | `MR2` | Vacant Alex 2 | None | OM: Mina Michel | Osama Bert | Maged Raouf |
| Row 19 | - | **Vacant Alex 2** | `MR3` | Vacant Alex 2 | Milad Mikhaeel | OM: None | Noha samir | Maged Raouf |
| Row 29 | - | **Vacant Nasr city** | `MR2` | Vacant Nasr city | Marwa shaaban | - | Osama Bert | Maged Raouf |
| Row 41 | - | **Vacant october** | `MR3` | October | Naguib Mahfouz | - | Noha samir | Maged Raouf |
| Row 46 | - | **Vacant Minya** | `MR2` | Minya | - | OM: Wael Atef | Osama Bert | Maged Raouf |
| Row 69 | - | **Vacant Minya** | `MR3` | *Unassigned* | None | OM: Wael Atef | Noha samir | Maged Raouf |
| Row 77 | - | **Vacant Behira** | `MR3` | *Unassigned* | Maher Khamis | AM: Michael Antonyo | Noha samir | Maged Raouf |
| Row 78 | - | **Vacant Menofya 3** | `MR3` | *Unassigned* | Marian Adel | OM: Peter Abdel Nour | Noha samir | Maged Raouf |
| Row 79 | - | **Vacant Nasr city** | `MR3` | *Unassigned* | Ramy Yousef | - | Noha samir | Maged Raouf |

---

## 4. Duplicate Names & Cross-Position Conflicts

Six active individuals appear in the workbook under two distinct positions or typographical variants (an active `DM` entry and an unlinked/historical `MR` entry). To prevent duplicate logins, each person has been assigned a single primary account corresponding to their confirmed supervisory role:

| Employee Name | Primary Record (Active) | Duplicate Record (Inactive) | Hierarchy Evidence & Resolution Rational | Migration Status |
|---|---|---|---|---|
| **Azza Karim** | **Row 4** (`DM1` → `DM1`, Nasr city) | **Row 70** (`MR1`, Masr El gedida) | Row 4 explicitly supervises Row 3 (`Awad Tmsah`, MR1). Row 70 is a legacy MR listing without subordinates. | **RESOLVED: Primary DM1** |
| **Kirollos Rizk** | **Row 6** (`DM1` → `DM2`, Haram/Faisal) | **Row 71** (`MR1`, typo 'Kiollos', Doki) | Confirmed single individual. Row 6 supervises Row 5 (`Vacant Haram faisyal`). Row 71 is a legacy MR typo row. | **RESOLVED: Primary DM2** |
| **Esraa el shimy** | **Row 9** (`DM1` → `DM3`, Down Town/Maadi) | **Row 73** (`MR1`, unassigned terr.) | Row 9 explicitly supervises Row 10 (`Vacant Maadi`) and Row 12 (`Vacant Cairo East`). Row 73 lacks territory and supervisors. | **RESOLVED: Primary DM3** |
| **Maher Khamis** | **Row 66** (`DM` → `DM13`, Behira/Kafr el shiekh) | **Row 14** (`MR1`, Vacant Behira) | Row 66 is the regional DM supervising Row 76 (`Ahmed El Kot`) and Row 77 (`Vacant Behira`). Row 14 lists Maher as his own DM. | **RESOLVED: Primary DM13** |
| **Marian Adel** | **Row 64** (`DM` → `DM11`, Menofya/Qalubia) | **Row 72** (`MR1`, unassigned terr.) | Row 64 explicitly supervises Row 33 (`Ahmed Hassan`) and Row 78 (`Vacant Menofya 3`). Row 72 is an unlinked MR listing. | **RESOLVED: Primary DM11** |
| **Beshoy Samy** | **Row 67** (`DM3` → `DM14`, Shobra) | **Row 74** (`MR3`, unassigned terr.) | Row 67 is the DM supervising Row 75 (`Fady Kamal`, MR3). Row 74 is a redundant MR entry. | **RESOLVED: Primary DM14** |

---

## 5. Inferred PM / MM / SMD Management Roles

Rows 80 to 84 in `Final Areas sheet.xlsx` lack values in the `Title` column. However, their organizational relationships establish the commercial marketing and executive leadership:

| Source Row | Employee Name | Raw Title | Inferred Position | Proposed Username | Reporting Line | Inferred Rationale | Review Status |
|---|---|---|---|---|---|---|---|
| **Row 80** | **Mario Nader** | *(empty)* | **PM** | `PM1` | MM: Magdy Nassif → SMD: Maged Raouf | Reports to Marketing Manager | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |
| **Row 81** | **Wael Morad** | *(empty)* | **PM** | `PM2` | MM: Magdy Nassif → SMD: Maged Raouf | Reports to Marketing Manager | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |
| **Row 82** | **Amr El Hoseny** | *(empty)* | **PM** | `PM3` | MM: Magdy Nassif → SMD: Maged Raouf | Reports to Marketing Manager | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |
| **Row 83** | **Magdy Nassif** | *(empty)* | **MM** | `MM1` | SMD: Maged Raouf | Referenced as MM in rows 80-82 | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |
| **Row 84** | **Maged Raouf** | *(empty)* | **SMD** | `SMD1` | *Head of Company* | Referenced as SMD across entire sheet | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |

---

## 6. Hierarchy Architecture & Reporting Line Analysis

### A. Missing Direct DM Assignments (16 Clean MR Records)
The source data exhibits structural variations where field representatives report directly to Area Managers, Operations Managers, or Business Unit Managers:

1. **Direct to Area Manager (AM)**:
   - Row 7: `Christena Roshdy` (October) → Reports directly to AM `Michael Antonyo`
   - Row 8: `Peter Emad` (Shobra) → Reports directly to AM `Michael Raafat`
2. **Direct to Operations Manager (OM)**:
   - Row 15: `Kirollos Girgis` (Minya) → Reports directly to OM `Wael Atef`
   - Row 16: `Yasser Yosry` (Alex 1) → Reports directly to OM `Mina Michel`
   - Row 17: `Eman -Alex` (Eman Alex 1) → Reports directly to OM `Mina Michel`
   - Row 31: `Helana Alex 1` (Alex 1) → Reports directly to OM `Mina Michel`
   - Row 32: `Marina Sameh` (Tanta) → Reports directly to OM `Peter Abdel Nour`
   - Row 44: `Peter william` (Tanta) → Reports directly to OM `Peter Abdel Nour`
   - Row 45: `John Amin` (Assuit) → Reports directly to OM `Wael Atef`
3. **Direct to Business Unit Manager (BUM)** (Missing both DM and AM/OM):
   - Row 22: `Philip Nayer` (Masr El gedida) → Reports directly to BUM `Osama Bert`
   - Row 23: `Fawzy Nasser` (Cairo East) → Reports directly to BUM `Osama Bert`
   - Row 25: `Engy Hosny` (Shobra) → Reports directly to BUM `Osama Bert`

### B. Missing Intermediate AM / OM Layer (15 MR Records)
Multiple MR records have a direct DM assigned, but the intermediate AM and OM columns are left empty, reporting directly up to the BUM:
- `Esraa shehata` (Row 24, DM: Marwa shaaban, BUM: Osama Bert)
- `Sara Adel` (Row 26, DM: Bassem Hanna, BUM: Osama Bert)
- `Mostafa Ahmed` (Row 27, DM: Bassem Hanna, BUM: Osama Bert)
- `Mohamed Baiomy` (Row 28, DM: Bassem Hanna, BUM: Osama Bert)
- `Amanda Medhat` (Row 30, DM: Rafik Maged, BUM: Osama Bert)
- `Katrin Hosny` (Row 36, DM: Rafik Maged, BUM: Noha samir)
- `Martina Micheel` (Row 37, DM: Ramy Yousef, BUM: Noha samir)
- `Silvia Medhat` (Row 38, DM: Ramy Yousef, BUM: Noha samir)
- `Yara` (Row 39, DM: Naguib Mahfouz, BUM: Noha samir)
- `Ahmed el Behiry` (Row 40, DM: Naguib Mahfouz, BUM: Noha samir)
- `Mohamed Ezzat` (Row 42, DM: Milad Mikhaeel, BUM: Noha samir)
- `Randa Magdy` (Row 47, DM: Ashraf Shawky, BUM: Fady Nassif, Osama Bert, Noha samir)
- `Kirollos Adel` (Row 48, DM: Ashraf Shawky, BUM: Fady Nassif, Osama Bert, Noha samir)
- `Neven` (Row 68, DM: Naguib Mahfouz, BUM: Noha samir)
- `Fady Kamal` (Row 75, DM: Beshoy Samy, BUM: Noha Samir)

### C. Multi-BUM Governance Analysis
Several territories and lines in upper Egypt and Delta are shared across multiple Business Unit Managers. Per migration requirements, all listed BUM relationships are preserved:
- **Row 45 (John Amin, Assuit)**: `Fady Nassif, Osama Bert, Noha samir`
- **Row 47 (Randa Magdy, Qena / Red Sea)**: `Fady Nassif, Osama Bert, Noha samir`
- **Row 48 (Kirollos Adel, Sohag)**: `Fady Nassif, Osama Bert, Noha samir`
- **Row 34 (Ahmed el Mesalamy, Sharkya / Portsaid)**: `Osama Bert, Noha samir`
- **Mid-Management Shared Rows**: Michael Antonyo (Row 53), Rafik Maged (Row 54), Peter Basily (Row 55), Peter Abdel Nour (Row 56), Mina Michel (Row 57), Ashraf Shawky (Row 58), Wael Atef (Row 59), Marian Adel (Row 64), Maher Khamis (Row 66)

---

## 7. Territory Master Considerations

1. **Multi-Region Territories**: Strings such as `Qena / Red Sea`, `Masr El gedida / Nasr City / Shobra`, `Fayoum/Benisuef`, `Sharkia /Mansoura, Mansoura /Sharkia`, and `Sohag , Qena , Red Sea` are preserved verbatim in accordance with Section I to safeguard commercial boundary definitions.
2. **Trailing MRs with Unassigned Territory**:
   - Row 75 (`Fady Kamal`, MR3): Territory blank in sheet (DM: Beshoy Samy, Shobra line).
   - Row 76 (`Ahmed El Kot`, MR2): Territory blank in sheet (DM: Maher Khamis, Behira line).
   - Confirmation needed before committing territory records.

---

## 8. Unresolved Questions & Decision Points for Human Approval

Before proceeding to **Step 2 (Database Schema & Migration Scripts)**, the following human confirmations are required:

1. [ ] **Cross-Position Promotions Confirmation**: Confirm that the 5 employees (`Azza Karim`, `Esraa el shimy`, `Maher Khamis`, `Marian Adel`, `Beshoy Samy`) should strictly receive `DM` accounts, and that their secondary `MR` rows should be permanently retired without login accounts.
2. [ ] **Kirollos vs Kiollos Rizk Identity**: Confirm whether `Kiollos Rizk` (Row 71, MR) is a spelling error for `Kirollos Rizk` (Row 6, DM), or if they are two distinct employees requiring separate usernames (`DM2` and `MR35`).
3. [ ] **Commercial Leadership Titles**: Confirm the proposed positions for the 5 unlabeled executive rows:
   - `Mario Nader` → `PM1` (Product Manager)
   - `Wael Morad` → `PM2` (Product Manager)
   - `Amr El Hoseny` → `PM3` (Product Manager)
   - `Magdy Nassif` → `MM1` (Marketing Manager)
   - `Maged Raouf` → `SMD1` (Senior Managing Director)
4. [ ] **Direct Reporting Approvals**: Confirm acceptance of direct reporting structures where MRs report directly to AMs, OMs, or BUMs without an intermediate DM.
5. [ ] **Territory Assignments for Trailing MRs**: Provide confirmed territory names for `Fady Kamal` (Row 75) and `Ahmed El Kot` (Row 76).

---

## 9. Security & Governance Verification

- **Passwords**: Zero passwords generated or stored.
- **Authentication**: Existing authentication logic remained completely untouched.
- **Cloudflare / D1 / Turso**: No network connections, migrations, or D1 resources created.
- **State**: The application remains in its current working production state on Vercel.

**Status: PENDING HUMAN APPROVAL TO PROCEED TO STEP 2**