import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { ALLOW_PENDING_PASSWORD_KEY, IS_PUBLIC_KEY } from './decorators';
import { AuthUser, canAuthenticate, JwtPayload, toAuthUser } from './auth.types';

// Global guard: every route needs a valid token unless marked @Public().
// The user is reloaded on every request, so deactivation and password changes take effect immediately.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, handler)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Token não informado');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { gym: true } });
    if (!user || !canAuthenticate(user)) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    request.user = toAuthUser(user);

    const allowPending = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_KEY, handler);
    if (user.mustChangePassword && !allowPending) {
      throw new ForbiddenException('Troque sua senha antes de continuar');
    }
    return true;
  }
}

function extractBearerToken(header: string | undefined): string | null {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : null;
}
