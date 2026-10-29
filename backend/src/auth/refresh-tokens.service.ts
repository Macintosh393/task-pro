import { randomBytes, createHash } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RefreshToken } from './entities/refresh-token.entity.js';
import { EnvironmentVariables } from '../config/environment-variables.js';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async issue(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const ttlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        tokenHash: this.hash(token),
        userId,
        expiresAt,
      }),
    );

    return token;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async rotate(token: string): Promise<{ userId: string; token: string }> {
    const result = await this.refreshTokensRepository
      .createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where('tokenHash = :tokenHash', { tokenHash: this.hash(token) })
      .returning(['userId', 'expiresAt'])
      .execute();

    const [deleted] = result.raw as { userId: string; expiresAt: Date }[];

    if (deleted === undefined || deleted.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    return { userId: deleted.userId, token: await this.issue(deleted.userId) };
  }

  async revoke(token: string): Promise<void> {
    await this.refreshTokensRepository.delete({ tokenHash: this.hash(token) });
  }
}
