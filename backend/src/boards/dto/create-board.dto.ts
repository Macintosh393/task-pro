import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

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
  @MaxLength(255)
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
