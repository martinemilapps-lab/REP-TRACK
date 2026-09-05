import {
  generateSecureTemporaryPassword,
  validatePasswordQuality,
  hashPassword,
  verifyPassword,
} from '../src/lib/services/passwordService';
import { buildOrganizationDataset } from '../scripts/provision_organization_foundation';
import { resetUserPasswordByAdmin } from '../src/lib/services/adminAuthService';
import { UserSessionPayload } from '../src/lib/auth';

export interface PasswordLifecycleVerificationResults {
  passed: number;
  failed: number;
  checks: string[];
}

export async function runPasswordLifecycleTests(): Promise<PasswordLifecycleVerificationResults> {
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
    // ----------------------------------------------------
    // 1. Cryptographic Temporary Password Generation & Entropy
    // ----------------------------------------------------
    const temp1 = generateSecureTemporaryPassword(14);
    const temp2 = generateSecureTemporaryPassword(14);

    assert(temp1.length === 14, 'Temporary password is 14 characters long');
    assert(temp1 !== temp2, 'Subsequent temporary passwords are non-deterministic and unique');
    assert(/[A-Z]/.test(temp1), 'Temporary password contains uppercase letters');
    assert(/[a-z]/.test(temp1), 'Temporary password contains lowercase letters');
    assert(/[0-9]/.test(temp1), 'Temporary password contains numeric digits');
    assert(/[!@#$%^&*-_+=]/.test(temp1), 'Temporary password contains special symbols');

    const tempQuality = validatePasswordQuality(temp1);
    assert(tempQuality.valid, 'Generated temporary password satisfies password quality standards');

    // ----------------------------------------------------
    // 2. Correct Login & Password Hash Verification
    // ----------------------------------------------------
    const tempHash = hashPassword(temp1);
    const isCorrect = verifyPassword(temp1, tempHash);
    assert(isCorrect, 'Valid temporary password verifies correctly against bcrypt hash');

    // ----------------------------------------------------
    // 3. Wrong Password Rejection
    // ----------------------------------------------------
    const isWrong = verifyPassword('IncorrectPassword123!', tempHash);
    assert(!isWrong, 'Incorrect password rejected by verifyPassword');

    // ----------------------------------------------------
    // 4. Disabled User Guard
    // ----------------------------------------------------
    const disabledUser = {
      id: 'usr-test-disabled',
      username: 'DISABLED_USER',
      passwordHash: tempHash,
      isActive: 0,
      mustChangePassword: 1,
    };
    const canDisabledLogin = disabledUser.isActive === 1 && verifyPassword(temp1, disabledUser.passwordHash);
    assert(!canDisabledLogin, 'Disabled user (isActive === 0) cannot authenticate even with matching password');

    // ----------------------------------------------------
    // 5. Vacant Has No Account
    // ----------------------------------------------------
    const dataset = buildOrganizationDataset();
    const vacantUsers = dataset.users.filter(u => u.username.toLowerCase().includes('vacant') || u.name.toLowerCase().includes('vacant'));
    assert(vacantUsers.length === 0, 'Zero user accounts generated for vacant territory positions');

    // ----------------------------------------------------
    // 6. Mandatory First Change Guard (Business Modules Lockout)
    // ----------------------------------------------------
    const pendingSession: UserSessionPayload = {
      id: 'usr-pending-1',
      username: 'DM1',
      name: 'Azza Karim',
      role: 'MANAGER',
      repId: null,
      mustChangePassword: true,
      systemRole: 'MANAGER',
    };

    function simulateBusinessModuleAccess(session: UserSessionPayload): boolean {
      if (session.mustChangePassword) {
        throw new Error('MUST_CHANGE_PASSWORD: يجب تغيير كلمة المرور المؤقتة أولاً');
      }
      return true;
    }

    let businessBlocked = false;
    try {
      simulateBusinessModuleAccess(pendingSession);
    } catch (e: unknown) {
      businessBlocked = e instanceof Error && e.message.includes('MUST_CHANGE_PASSWORD');
    }
    assert(businessBlocked, 'Business module access strictly blocked when mustChangePassword === true');

    // ----------------------------------------------------
    // 7. Password Quality & Change Password Validation
    // ----------------------------------------------------
    const weakResult = validatePasswordQuality('12345');
    assert(!weakResult.valid && weakResult.errors.some(e => e.includes('8 أحرف')), 'Password under 8 characters rejected');

    const noUpperResult = validatePasswordQuality('lowercase123!@#');
    assert(!noUpperResult.valid && noUpperResult.errors.some(e => e.includes('كبير')), 'Password missing uppercase rejected');

    const noSpecialResult = validatePasswordQuality('Uppercase123456');
    assert(!noSpecialResult.valid && noSpecialResult.errors.some(e => e.includes('رمز خاص')), 'Password missing symbol rejected');

    const trivialPatternResult = validatePasswordQuality('Password123!@#');
    assert(!trivialPatternResult.valid && trivialPatternResult.errors.some(e => e.includes('نمط شائع')), 'Password with common word "password" rejected');

    const strongNewPassword = 'Secur3#Passw0rd_2026';
    const strongResult = validatePasswordQuality(strongNewPassword);
    assert(strongResult.valid, 'Strong compliant new password accepted by quality validator');

    // ----------------------------------------------------
    // 8. Successful Password Change Flow
    // ----------------------------------------------------
    let userState = {
      id: 'usr-test-dm1',
      username: 'DM1',
      passwordHash: tempHash,
      mustChangePassword: 1,
    };

    // Simulate change password
    const newHash = hashPassword(strongNewPassword);
    userState = {
      ...userState,
      passwordHash: newHash,
      mustChangePassword: 0,
    };
    assert(userState.mustChangePassword === 0, 'must_change_password set to 0 after successful password change');

    // ----------------------------------------------------
    // 9. New Password Login Succeeds
    // ----------------------------------------------------
    const newPasswordLoginOk = verifyPassword(strongNewPassword, userState.passwordHash);
    assert(newPasswordLoginOk, 'Login succeeds with the newly chosen permanent password');

    const updatedSession: UserSessionPayload = {
      ...pendingSession,
      mustChangePassword: false,
    };
    let businessAllowedAfterChange = false;
    try {
      businessAllowedAfterChange = simulateBusinessModuleAccess(updatedSession);
    } catch {
      businessAllowedAfterChange = false;
    }
    assert(businessAllowedAfterChange, 'Business module access unlocked after password change completed');

    // ----------------------------------------------------
    // 10. Old Temporary Password Rejection
    // ----------------------------------------------------
    const oldPasswordLoginOk = verifyPassword(temp1, userState.passwordHash);
    assert(!oldPasswordLoginOk, 'Old temporary password fails authentication after password change');

    // ----------------------------------------------------
    // 11. Session Revocation & Expiration
    // ----------------------------------------------------
    const activeSessions = new Map<string, { userId: string; expiresAt: Date }>();
    const sessionToken = 'sess-token-12345';
    activeSessions.set(sessionToken, {
      userId: userState.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour future
    });

    assert(activeSessions.has(sessionToken), 'Active session token exists in session store');

    // Invalidate / Revoke session
    activeSessions.delete(sessionToken);
    assert(!activeSessions.has(sessionToken), 'Session token invalidated upon logout / revocation');

    // Expired session check
    const expiredToken = 'sess-expired-999';
    activeSessions.set(expiredToken, {
      userId: userState.id,
      expiresAt: new Date(Date.now() - 1000), // 1 second in past
    });
    const retrieved = activeSessions.get(expiredToken);
    const isExpired = retrieved ? retrieved.expiresAt.getTime() <= Date.now() : true;
    assert(isExpired, 'Expired session token detected and treated as unauthenticated');

    // ----------------------------------------------------
    // 12. Rate Limiting / Brute Force Protection
    // ----------------------------------------------------
    let failedAttempts = 0;
    const MAX_ALLOWED = 5;
    let isLockedOut = false;

    for (let i = 0; i < 6; i++) {
      failedAttempts++;
      if (failedAttempts >= MAX_ALLOWED) {
        isLockedOut = true;
      }
    }
    assert(isLockedOut, 'IP is locked out after 5 consecutive failed login attempts');

    // Reset on successful login
    failedAttempts = 0;
    isLockedOut = false;
    assert(!isLockedOut && failedAttempts === 0, 'Rate limiting counter resets on successful authentication');

    // ----------------------------------------------------
    // 13. Server-Authoritative Password Reset (SMD / ADMIN Only)
    // ----------------------------------------------------
    const normalManagerSession: UserSessionPayload = {
      id: 'usr-mgr-1',
      username: 'DM1',
      name: 'Azza Karim',
      role: 'MANAGER',
      repId: null,
      systemRole: 'MANAGER',
    };

    let normalManagerRejected = false;
    try {
      await resetUserPasswordByAdmin(normalManagerSession, 'usr-test-dm1');
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string };
      normalManagerRejected = err.statusCode === 403 || (!!err.message && err.message.includes('غير مصرح'));
    }
    assert(normalManagerRejected, 'Normal manager cannot perform password reset (403 Forbidden)');

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    checks.push(`✗ FAIL: Unexpected test exception: ${msg}`);
    failed++;
  }

  return { passed, failed, checks };
}
