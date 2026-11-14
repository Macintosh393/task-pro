import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

import { SkipNormalization } from '../../common/decorators/skip-normalization.decorator.js';
import { MaxBytes } from '../../common/validators/max-bytes.decorator.js';
import { MaxCodePoints } from '../../common/validators/max-code-points.decorator.js';

export const BCRYPT_MAX_PASSWORD_BYTES = 72;

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Name cannot contain only spaces' })
  @MaxCodePoints(32)
  name: string;

  @IsEmail()
  @MaxCodePoints(255)
  email: string;

  @SkipNormalization()
  @IsString()
  @MinLength(8)
  // bcrypt ignores everything after the first 72 bytes, so longer passwords would be silently truncated.
  @MaxBytes(BCRYPT_MAX_PASSWORD_BYTES)
  password: string;
}
