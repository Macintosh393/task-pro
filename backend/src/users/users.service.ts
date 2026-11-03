import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: Pick<User, 'username' | 'email' | 'passwordHash'>): Promise<User> {
    if (await this.findByEmail(data.email)) {
      throw new ConflictException('Email is already registered');
    }

    try {
      return await this.usersRepository.save(this.usersRepository.create(data));
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (user === null) {
      throw new NotFoundException(`User with id: ${id} not found`);
    }

    return user;
  }
}
