import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiNoContentResponse } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Public } from './common/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Service is healthy' })
  getHealth(): void {}
}
