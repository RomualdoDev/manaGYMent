import { Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from 'src/auth/decorators';
import { ROLE } from 'src/auth/auth.types';
import { GymsService } from './gyms.service';

@Controller('users')
@Roles(ROLE.ADMIN)
export class UsersController {
  constructor(private readonly gyms: GymsService) {}

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Param('id', ParseIntPipe) id: number) {
    return await this.gyms.resetPassword(id);
  }
}
