import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { ChangePasswordDTO } from './dtos/auth.dto';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password';
import { AuthUser, canAuthenticate, JwtPayload, Role, toAuthUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
    const user = await this.prisma.user.findUnique({ where: { username }, include: { gym: true } });
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    // Same message for every failure, so it does not reveal whether the username exists.
    if (!user || !passwordOk || !canAuthenticate(user)) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload: JwtPayload = { sub: user.id, role: user.role as Role, gymId: user.gymId };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, user: toAuthUser(user) };
  }

  // Uses 400 for a wrong current password on purpose: the frontend logs out on 401.
  async changePassword(userId: number, body: ChangePasswordDTO): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Senha atual incorreta');
    }
    if (body.newPassword === body.currentPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(body.newPassword), mustChangePassword: false },
    });
  }
}
