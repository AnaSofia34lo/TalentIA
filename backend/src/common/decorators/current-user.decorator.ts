import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (property: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user: Record<string, unknown> }>();
    return property ? request.user?.[property] : request.user;
  },
);
