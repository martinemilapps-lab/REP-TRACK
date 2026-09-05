import { randomBytes, randomInt } from 'crypto';
import { hashSync, compareSync } from 'bcrypt-ts';

// Safe character sets excluding easily confused characters (O, 0, I, l)
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*-_+=';

const ALL_CHARS = UPPER + LOWER + DIGITS + SYMBOLS;

/**
 * Generates a cryptographically secure random temporary password with high entropy.
 * Guaranteed to contain at least 2 uppercase, 2 lowercase, 2 digits, and 2 symbols.
 * Default length: 14 characters (~80 bits of cryptographic entropy).
 */
export function generateSecureTemporaryPassword(length = 14): string {
  if (length < 10) length = 10;

  const chars: string[] = [];

  // Guaranteed characters
  chars.push(UPPER[randomInt(UPPER.length)]);
  chars.push(UPPER[randomInt(UPPER.length)]);
  chars.push(LOWER[randomInt(LOWER.length)]);
  chars.push(LOWER[randomInt(LOWER.length)]);
  chars.push(DIGITS[randomInt(DIGITS.length)]);
  chars.push(DIGITS[randomInt(DIGITS.length)]);
  chars.push(SYMBOLS[randomInt(SYMBOLS.length)]);
  chars.push(SYMBOLS[randomInt(SYMBOLS.length)]);

  // Fill remaining characters
  const remaining = length - chars.length;
  const randomBuf = randomBytes(remaining);
  for (let i = 0; i < remaining; i++) {
    chars.push(ALL_CHARS[randomBuf[i] % ALL_CHARS.length]);
  }

  // Fisher-Yates shuffle using crypto.randomInt
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

export interface PasswordQualityResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates password quality against security standards:
 * - Minimum 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one digit
 * - Contains at least one special character
 * - Not a trivial/common pattern
 */
export function validatePasswordQuality(password: string): PasswordQualityResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['كلمة المرور مطلوبة'] };
  }

  if (password.length < 8) {
    errors.push('يجب ألا تقل كلمة المرور عن 8 أحرف');
  }

  if (password.length > 128) {
    errors.push('يجب ألا تزيد كلمة المرور عن 128 حرفاً');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل (a-z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (!@#$%^&*)');
  }

  const lower = password.toLowerCase();
  const forbiddenPatterns = [
    'password',
    '12345678',
    'admin123',
    'reptrack',
    'qwerty',
    'manager',
  ];

  for (const pattern of forbiddenPatterns) {
    if (lower.includes(pattern)) {
      errors.push('كلمة المرور تحتوي على نمط شائع أو سهل التخمين');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hashes a plaintext password using bcrypt-ts.
 */
export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    return compareSync(password, hash);
  } catch {
    return false;
  }
}
