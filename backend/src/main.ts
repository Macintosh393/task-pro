import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { EnvironmentVariables } from './config/environment-variables.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const documentConfig = new DocumentBuilder()
    .setTitle('Task Pro')
    .setDescription('')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('docs', app, documentFactory, { swaggerOptions: { persistAuthorization: true } });

  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
