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
});
