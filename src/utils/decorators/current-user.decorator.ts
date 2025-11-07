import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

/*
Usage example:

import { CurrentUser } from '../utils/decorators/current-user.decorator';

@Controller('profile')
export class ProfileController {
  @UseGuards(AuthGuard)
  @Get()
  getProfile(@CurrentUser() user: any) {
    // user contains decoded JWT payload: { id, email }
    return { userId: user.id, email: user.email };
  }

  // Or get specific field
  @UseGuards(AuthGuard)
  @Get('email')
  getEmail(@CurrentUser('email') email: string) {
    return { email };
  }
}
*/
