export const DEFAULT_CUSTOM_BOOK_PRICE = 69;

const AUTHORIZED_ADMIN_EMAIL_SHA256 =
  '18846acf3f4006631b54bdacac5555a5870b4152c1e6c103652caafb34bf6e68';

export interface AdminSecurityRecord {
  email?: string;
  passwordHash?: string;
  salt?: string;
  password?: string;
  updatedAt?: unknown;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isSingleAuthorizedAdmin(
  email: string | null | undefined,
  emailVerified: boolean | null | undefined
): Promise<boolean> {
  if (!emailVerified || !email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized)
  );
  return constantTimeEqual(
    bytesToHex(new Uint8Array(digest)),
    AUTHORIZED_ADMIN_EMAIL_SHA256
  );
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function generateSaltHex(byteLength: number = 16): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashAdminPassword(
  password: string,
  salt?: string
): Promise<{ passwordHash: string; salt: string }> {
  const effectiveSalt = salt || generateSaltHex(16);
  const encoded = new TextEncoder().encode(`${effectiveSalt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  return {
    passwordHash: bytesToHex(new Uint8Array(digest)),
    salt: effectiveSalt,
  };
}

export function hasConfiguredPassword(record: AdminSecurityRecord | null): boolean {
  if (!record) return false;
  if (typeof record.passwordHash === 'string' && record.passwordHash.trim().length >= 32) {
    return typeof record.salt === 'string' && record.salt.trim().length >= 8;
  }
  if (typeof record.password === 'string' && record.password.length >= 4) {
    return true;
  }
  return false;
}

export async function verifyAdminPassword(
  inputPassword: string,
  record: AdminSecurityRecord | null
): Promise<boolean> {
  if (!record || !inputPassword) return false;

  if (
    typeof record.passwordHash === 'string' &&
    record.passwordHash.length >= 32 &&
    typeof record.salt === 'string' &&
    record.salt.length >= 8
  ) {
    const computed = await hashAdminPassword(inputPassword, record.salt);
    return constantTimeEqual(computed.passwordHash, record.passwordHash);
  }

  // Fallback for passwords entered directly in Firestore Console as `password`
  if (typeof record.password === 'string' && record.password.length >= 4) {
    return constantTimeEqual(inputPassword, record.password);
  }

  return false;
}
