import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { JwtPayload } from '../../auth/jwt-payload.interface.js';

export const CurrentUser = createParamDecorator((data: keyof JwtPayload | undefined, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>();

  return data ? request.user[data] : request.user;
});
