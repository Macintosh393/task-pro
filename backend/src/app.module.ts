import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate, EnvironmentVariables } from './config/environment-variables.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        type: 'postgres',
        uuidExtension: 'pgcrypto',
        host: config.get('POSTGRES_HOST', { infer: true }),
        port: config.get('POSTGRES_PORT', { infer: true }),
        username: config.get('POSTGRES_USER', { infer: true }),
        password: config.get('POSTGRES_PASSWORD', { infer: true }),
        database: config.get('POSTGRES_DB', { infer: true }),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
