import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/modules/auth/password';

describe('password hashing (argon2)', () => {
  it('hashes and verifies correctly', async () => {
    const hash = await hashPassword('s3cret-password');
    expect(hash).not.toContain('s3cret-password');
    expect(await verifyPassword(hash, 's3cret-password')).toBe(true);
    expect(await verifyPassword(hash, 'wrong')).toBe(false);
  });
});
