import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/environment-variables.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RefreshTokensService } from './refresh-tokens.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const ttlMinutes = config.get('ACCESS_TOKEN_TTL_MINUTES', { infer: true });

        return {
          secret: config.get('JWT_SECRET', { infer: true }),
          signOptions: {
            expiresIn: `${ttlMinutes}m`,
          },
        };
      },
    }),
  ],
  providers: [AuthService, { provide: APP_GUARD, useClass: JwtAuthGuard }, RefreshTokensService],
  controllers: [AuthController],
})
export class AuthModule {}
