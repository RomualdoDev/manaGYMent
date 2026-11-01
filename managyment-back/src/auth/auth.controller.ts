import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AllowPendingPassword, CurrentUser, Public } from './decorators';
import { ChangePasswordDTO, LoginDTO } from './dtos/auth.dto';
import { AuthUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Rate-limited (5 attempts per minute per IP) to slow down password guessing.
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDTO) {
    return await this.authService.login(body.username, body.password);
  }

  @AllowPendingPassword()
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @AllowPendingPassword()
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@CurrentUser() user: AuthUser, @Body() body: ChangePasswordDTO) {
    await this.authService.changePassword(user.id, body);
  }
}
