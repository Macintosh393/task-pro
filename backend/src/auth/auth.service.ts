import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokensService } from './refresh-tokens.service.js';
import { TokenPair } from './token-pair.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenPair> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (user === null) {
      throw new UnauthorizedException('Wrong email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Wrong email or password');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    const refreshToken = await this.refreshTokensService.issue(user.id);

    return { accessToken, refreshToken };
  }

  async refresh(token: string): Promise<TokenPair> {
    const { userId, token: refreshToken } = await this.refreshTokensService.rotate(token);

    const accessToken = await this.jwtService.signAsync({ sub: userId });

    return { accessToken, refreshToken };
  }

  async logout(token: string): Promise<void> {
    await this.refreshTokensService.revoke(token);
  }
}
