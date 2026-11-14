import { validate } from 'class-validator';
import { RegisterDto } from './register.dto.js';

describe('RegisterDto', () => {
  it('accepts valid registration data', async () => {
    const dto = new RegisterDto();
    dto.name = 'Test User';
    dto.email = 'test@example.com';
    dto.password = 'TestPassword123!';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid email and short password', async () => {
    const dto = new RegisterDto();
    dto.name = 'Test';
    dto.email = 'wrong-email';
    dto.password = '123';

    const errors = await validate(dto);
    const fields = errors.map((error) => error.property);

    expect(fields).toContain('email');
    expect(fields).toContain('password');
  });

  it('rejects a name containing only spaces', async () => {
    const dto = new RegisterDto();
    dto.name = '     ';
    dto.email = 'test@example.com';
    dto.password = 'TestPassword123!';

    const errors = await validate(dto);
    const fields = errors.map((error) => error.property);

    expect(fields).toContain('name');
  });

  describe('length limits', () => {
    const valid = { name: 'Test User', email: 'test@example.com', password: 'TestPassword123!' };

    async function fieldsFor(overrides: Partial<typeof valid>) {
      const errors = await validate(Object.assign(new RegisterDto(), valid, overrides));

      return errors.map((error) => error.property);
    }

    it.each([
      ['72 ASCII characters', 'a'.repeat(72)],
      ['36 Cyrillic letters (72 bytes)', '\u0436'.repeat(36)],
      ['18 four-byte emoji (72 bytes)', '\u{1F680}'.repeat(18)],
    ])('accepts a password of %s', async (_label, password) => {
      expect(await fieldsFor({ password })).toEqual([]);
    });

    // bcrypt ignores everything after 72 bytes, so such passwords would be silently truncated.
    it.each([
      ['73 ASCII characters', 'a'.repeat(73)],
      ['37 Cyrillic letters (74 bytes)', '\u0436'.repeat(37)],
      ['19 four-byte emoji (76 bytes)', '\u{1F680}'.repeat(19)],
      ['71 ASCII characters plus a lone surrogate (74 bytes)', `${'a'.repeat(71)}\uD800`],
    ])('rejects a password of %s', async (_label, password) => {
      expect(await fieldsFor({ password })).toContain('password');
    });

    it('accepts a name of exactly 32 code points including variation selectors', async () => {
      expect(await fieldsFor({ name: '\u2764\uFE0F'.repeat(16) })).toEqual([]);
    });

    it('rejects a name over 32 code points that validator.isLength would undercount', async () => {
      expect(await fieldsFor({ name: '\u2764\uFE0F'.repeat(17) })).toContain('name');
    });
  });
});
