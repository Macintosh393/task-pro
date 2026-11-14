import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { BCRYPT_MAX_PASSWORD_BYTES } from './register.dto.js';
import { SkipNormalization } from '../../common/decorators/skip-normalization.decorator.js';
import { MaxBytes } from '../../common/validators/max-bytes.decorator.js';
import { MaxCodePoints } from '../../common/validators/max-code-points.decorator.js';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  // No stored email is longer (varchar(255)), so a longer one can never match an account.
  @MaxCodePoints(255)
  email: string;

  @ApiProperty({ example: 'secret-password' })
  @SkipNormalization()
  @IsString()
  @IsNotEmpty()
  // Registration rejects longer passwords, so a longer one can never be correct. The minimum length is
  // deliberately not repeated here: a short password is simply wrong, which is a 401, not a 400.
  @MaxBytes(BCRYPT_MAX_PASSWORD_BYTES)
  password: string;
}
