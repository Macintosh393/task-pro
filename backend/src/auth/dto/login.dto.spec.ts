import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginDto } from './login.dto.js';

async function check(payload: unknown) {
  const dto = plainToInstance(LoginDto, payload);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

  return { dto, fields: errors.map((error) => error.property) };
}

const valid = { email: 'user@example.com', password: 'secret-password' };

describe('LoginDto', () => {
  describe('valid input', () => {
    it('accepts an email and a password', async () => {
      const { fields } = await check(valid);

      expect(fields).toEqual([]);
    });

    it('accepts an email of exactly 255 code points', async () => {
      const { fields } = await check({ ...valid, email: `${'a'.repeat(243)}@example.com` });

      expect(fields).toEqual([]);
    });

    // The registration minimum is not repeated: a short password is just a wrong one (401).
    it.each([
      ['shorter than the registration minimum', 'short'],
      ['a single space', ' '],
      ['of exactly 72 ASCII bytes', 'a'.repeat(72)],
      ['of 36 Cyrillic letters (72 bytes)', 'ж'.repeat(36)],
      ['of 12 hearts with variation selectors (72 bytes)', '❤️'.repeat(12)],
    ])('accepts a password %s', async (_label, password) => {
      const { fields } = await check({ ...valid, password });

      expect(fields).toEqual([]);
    });

    it('does not validate the email format (an unknown email is a 401, not a 400)', async () => {
      const { fields } = await check({ ...valid, email: 'not-an-email' });

      expect(fields).toEqual([]);
    });

    it('keeps the password exactly as sent', async () => {
      const password = '  Pássword  ';
      const { dto } = await check({ ...valid, password });

      expect(dto.password).toBe(password);
    });
  });

  describe('invalid email', () => {
    it.each([
      ['missing', undefined],
      ['empty string', ''],
      ['256 code points', `${'a'.repeat(244)}@example.com`],
      ['over 255 code points only when counting variation selectors', `${'❤️'.repeat(122)}@example.com`],
      ['a number', 1],
      ['null', null],
      ['an array', ['user@example.com']],
      ['an object', { value: 'user@example.com' }],
    ])('rejects an email that is %s', async (_label, email) => {
      const { fields } = await check({ ...valid, email });

      expect(fields).toContain('email');
    });
  });

  describe('invalid password', () => {
    it.each([
      ['missing', undefined],
      ['empty string', ''],
      ['a number', 12345678],
      ['null', null],
      ['an array', ['secret-password']],
      ['an object', { value: 'secret-password' }],
      ['73 ASCII bytes (over the bcrypt limit enforced at registration)', 'a'.repeat(73)],
      ['37 Cyrillic letters (74 bytes)', 'ж'.repeat(37)],
      ['13 hearts with variation selectors (78 bytes)', '❤️'.repeat(13)],
    ])('rejects a password that is %s', async (_label, password) => {
      const { fields } = await check({ ...valid, password });

      expect(fields).toContain('password');
    });
  });

  describe('unexpected fields', () => {
    it.each(['name', 'id', 'passwordHash', 'rememberMe'])('rejects the extra field "%s"', async (field) => {
      const { fields } = await check({ ...valid, [field]: 'x' });

      expect(fields).toContain(field);
    });
  });
});
