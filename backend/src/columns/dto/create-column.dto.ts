import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

import { MaxCodePoints } from '../../common/validators/max-code-points.decorator.js';

export class CreateColumnDto {
  @ApiProperty({ example: 'To Do', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  // Counts code points like PostgreSQL varchar(255); @MaxLength ignores U+FE0E/U+FE0F.
  @MaxCodePoints(255)
  // PostgreSQL rejects U+0000 in text (22021), which would surface as HTTP 500 instead of 400.
  @Matches(/^[^\0]*$/, { message: 'title must not contain null characters' })
  title: string;
}
