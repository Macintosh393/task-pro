import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entities/user.entity.js';
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
}
