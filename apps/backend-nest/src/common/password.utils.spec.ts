import { hashPassword, verifyPassword } from './password.utils';

describe('password.utils', () => {
  it('hashPassword produces a non-empty string different from the plain password', async () => {
    const hash = await hashPassword('supersecret');

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toBe('supersecret');
  });

  it('hashPassword produces a different hash each time (random salt)', async () => {
    const [a, b] = await Promise.all([
      hashPassword('supersecret'),
      hashPassword('supersecret'),
    ]);
    expect(a).not.toBe(b);
  });

  it('verifyPassword returns true for the matching plain password', async () => {
    const hash = await hashPassword('supersecret');
    await expect(verifyPassword('supersecret', hash)).resolves.toBe(true);
  });

  it('verifyPassword returns false for a non-matching plain password', async () => {
    const hash = await hashPassword('supersecret');
    await expect(verifyPassword('not-the-password', hash)).resolves.toBe(false);
  });
});
