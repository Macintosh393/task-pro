import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, Matches, ValidateIf } from 'class-validator';

import { MaxCodePoints } from '../../common/validators/max-code-points.decorator.js';

import {
  BOARD_BACKGROUNDS,
  BOARD_ICONS,
  DEFAULT_BOARD_BACKGROUND,
  DEFAULT_BOARD_ICON,
  type BoardBackground,
  type BoardIcon,
} from '../board-options.js';

export class CreateBoardDto {
  @ApiProperty({ example: 'Project Alpha', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  // Counts code points like PostgreSQL varchar(255); @MaxLength ignores U+FE0E/U+FE0F.
  @MaxCodePoints(255)
  // PostgreSQL rejects U+0000 in text (22021), which would surface as HTTP 500 instead of 400.
  @Matches(/^[^\0]*$/, { message: 'title must not contain null characters' })
  title: string;

  @ApiPropertyOptional({ enum: BOARD_ICONS, default: DEFAULT_BOARD_ICON })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsIn(BOARD_ICONS)
  icon?: BoardIcon;

  @ApiPropertyOptional({ enum: BOARD_BACKGROUNDS, default: DEFAULT_BOARD_BACKGROUND })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsIn(BOARD_BACKGROUNDS)
  background?: BoardBackground;
}
