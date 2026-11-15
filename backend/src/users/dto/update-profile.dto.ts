import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, ValidateBy } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Ivetta', maxLength: 32 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @ValidateBy({
    name: 'isPostgresUsername',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && !value.includes('\u0000') && Array.from(value).length <= 32,
      defaultMessage: () => 'username must contain at most 32 Unicode code points and must not contain NUL',
    },
  })
  username: string;

  @ApiProperty({ example: 'ivetta@example.com', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(255)
  email: string;
}
