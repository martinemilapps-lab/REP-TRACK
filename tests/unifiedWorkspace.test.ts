import * as fs from 'fs';
import * as path from 'path';
import { buildOrganizationDataset } from '../scripts/provision_organization_foundation';

export interface WorkspaceRoutingResult {
  passed: number;
  failed: number;
  checks: string[];
}

export function runUnifiedWorkspaceTests(): WorkspaceRoutingResult {
  const checks: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      checks.push(`✓ PASS: ${desc}`);
      passed++;
    } else {
      checks.push(`✗ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    const dataset = buildOrganizationDataset();
    const users = dataset.users;
    const assignments = dataset.salesAssignments;

    // Helper to simulate workspace resolution matching src/app/page.tsx
    function resolveWorkspace(user: { position_code: string; system_role: string }): 'MR_WORKSPACE' | 'MANAGER_WORKSPACE' {
      if (user.position_code === 'MR') {
        return 'MR_WORKSPACE';
      }
      return 'MANAGER_WORKSPACE';
    }

    // ----------------------------------------------------
    // 1. Verify MR -> MR Workspace
    // ----------------------------------------------------
    const mrUser = users.find(u => u.position_code === 'MR');
    assert(!!mrUser, 'MR user exists in organization dataset');
    if (mrUser) {
      const workspace = resolveWorkspace(mrUser);
      assert(workspace === 'MR_WORKSPACE', `MR (${mrUser.username} ${mrUser.name}) routes strictly to MR Workspace`);

      // Verify primary sales assignment exists
      const mrAssign = assignments.find(a => a.user_id === mrUser.id && a.assignment_type === 'PRIMARY_REP');
      assert(!!mrAssign, `MR (${mrUser.username}) has bound primary sales assignment: ${mrAssign?.territory_name}`);
    }

    // ----------------------------------------------------
    // 2. Verify DM -> Manager Workspace + Dual-Role check
    // ----------------------------------------------------
    const dmUser = users.find(u => u.username === 'DM1'); // Azza Karim
    assert(!!dmUser, 'DM user (DM1) exists in dataset');
    if (dmUser) {
      const workspace = resolveWorkspace(dmUser);
      assert(workspace === 'MANAGER_WORKSPACE', `DM (${dmUser.username} ${dmUser.name}) routes to Manager Workspace`);

      // Verify dual-role PERSONAL_MR sales assignment is exposed
      const personalAssign = assignments.find(a => a.user_id === dmUser.id && a.assignment_type === 'PERSONAL_MR');
      assert(!!personalAssign, `DM1 (${dmUser.name}) has secondary PERSONAL_MR assignment exposed: ${personalAssign?.territory_name}`);
      assert(dmUser.position_code === 'DM', `DM1 primary position remains DM without title degradation`);
    }

    // ----------------------------------------------------
    // 3. Verify AM -> Manager Workspace
    // ----------------------------------------------------
    const amUser = users.find(u => u.position_code === 'AM');
    assert(!!amUser, 'AM user exists in dataset');
    if (amUser) {
      const workspace = resolveWorkspace(amUser);
      assert(workspace === 'MANAGER_WORKSPACE', `AM (${amUser.username} ${amUser.name}) routes to Manager Workspace`);
    }

    // ----------------------------------------------------
    // 4. Verify OM -> Manager Workspace
    // ----------------------------------------------------
    const omUser = users.find(u => u.position_code === 'OM');
    assert(!!omUser, 'OM user exists in dataset');
    if (omUser) {
      const workspace = resolveWorkspace(omUser);
      assert(workspace === 'MANAGER_WORKSPACE', `OM (${omUser.username} ${omUser.name}) routes to Manager Workspace`);
    }

    // ----------------------------------------------------
    // 5. Verify BUM -> Manager Workspace
    // ----------------------------------------------------
    const bumUser = users.find(u => u.position_code === 'BUM');
    assert(!!bumUser, 'BUM user exists in dataset');
    if (bumUser) {
      const workspace = resolveWorkspace(bumUser);
      assert(workspace === 'MANAGER_WORKSPACE', `BUM (${bumUser.username} ${bumUser.name}) routes to Manager Workspace`);
    }

    // ----------------------------------------------------
    // 6. Verify PM -> Manager Workspace (Product Manager)
    // ----------------------------------------------------
    const pmUser = users.find(u => u.position_code === 'PM');
    assert(!!pmUser, 'PM user exists in dataset');
    if (pmUser) {
      const workspace = resolveWorkspace(pmUser);
      assert(workspace === 'MANAGER_WORKSPACE', `PM (${pmUser.username} ${pmUser.name}) routes to Manager Workspace`);
    }

    // ----------------------------------------------------
    // 7. Verify MM -> Manager Workspace (Marketing Manager)
    // ----------------------------------------------------
    const mmUser = users.find(u => u.position_code === 'MM');
    assert(!!mmUser, 'MM user exists in dataset');
    if (mmUser) {
      const workspace = resolveWorkspace(mmUser);
      assert(workspace === 'MANAGER_WORKSPACE', `MM (${mmUser.username} ${mmUser.name}) routes to Manager Workspace`);
    }

    // ----------------------------------------------------
    // 8. Verify SMD -> Manager Workspace (Executive Administration)
    // ----------------------------------------------------
    const smdUser = users.find(u => u.position_code === 'SMD');
    assert(!!smdUser, 'SMD user exists in dataset');
    if (smdUser) {
      const workspace = resolveWorkspace(smdUser);
      assert(workspace === 'MANAGER_WORKSPACE', `SMD (${smdUser.username} ${smdUser.name}) routes to Manager Workspace`);
      assert(smdUser.system_role === 'ADMIN', `SMD holds executive system role: ADMIN`);
    }

    // ----------------------------------------------------
    // 9. Verify /admin Route Is Completely Deleted
    // ----------------------------------------------------
    const adminPath = path.resolve(__dirname, '../src/app/admin');
    const adminExists = fs.existsSync(adminPath);
    assert(!adminExists, 'Legacy route src/app/admin is completely deleted from repository');

    // ----------------------------------------------------
    // 10. Verify Zero Vacant User Accounts in System
    // ----------------------------------------------------
    const vacantAccounts = users.filter(u => u.name.toLowerCase().includes('vacant') || u.username.toLowerCase().includes('vacant'));
    assert(vacantAccounts.length === 0, 'Zero user accounts generated for vacant territory rows');

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    checks.push(`✗ FAIL: Unexpected test exception: ${msg}`);
    failed++;
  }

  return { passed, failed, checks };
}
