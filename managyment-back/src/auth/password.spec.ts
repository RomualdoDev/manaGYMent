import { generateTemporaryPassword, hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('senha-correta');

    expect(hash).not.toContain('senha-correta');
    await expect(verifyPassword('senha-correta', hash)).resolves.toBe(true);
    await expect(verifyPassword('outra-senha', hash)).resolves.toBe(false);
  });

  it('generates temporary passwords without easily confused characters', () => {
    for (let i = 0; i < 50; i++) {
      const password = generateTemporaryPassword();

      expect(password).toHaveLength(10);
      expect(password).toMatch(/^[a-zA-Z2-9]+$/);
      expect(password).not.toMatch(/[lIO01]/);
    }
  });
});
