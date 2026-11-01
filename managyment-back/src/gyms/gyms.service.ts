import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { generateTemporaryPassword, hashPassword } from 'src/auth/password';
import { toAuthUser } from 'src/auth/auth.types';
import { CreateGymDTO, UpdateGymDTO } from './dtos/gym.dto';

// Fields safe to return to the admin. Never select passwordHash.
const publicUserSelect = {
  id: true,
  username: true,
  name: true,
  role: true,
  active: true,
  mustChangePassword: true,
  gymId: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  // Creates the gym and its owner (STAFF) in one transaction. The temporary password is returned only here, once.
  async createGym(body: CreateGymDTO) {
    const username = body.ownerUsername
      ? await this.requireFreeUsername(body.ownerUsername)
      : await this.generateFreeUsername(body.name);
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    try {
      const { gym, user } = await this.prisma.$transaction(async (tx) => {
        const gym = await tx.gym.create({ data: { name: body.name } });
        const user = await tx.user.create({
          data: {
            username,
            name: body.ownerName,
            passwordHash,
            role: 'STAFF',
            mustChangePassword: true,
            gymId: gym.id,
          },
          select: publicUserSelect,
        });
        return { gym, user };
      });
      return { gym, user, temporaryPassword };
    } catch (error) {
      // Two requests picked the same username at the same time.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Usuário já existe');
      }
      throw error;
    }
  }

  async listGyms() {
    const gyms = await this.prisma.gym.findMany({
      orderBy: { id: 'asc' },
      include: { users: { select: publicUserSelect }, _count: { select: { clients: true } } },
    });
    return gyms.map(({ _count, ...gym }) => ({ ...gym, clientCount: _count.clients }));
  }

  async updateGym(id: number, body: UpdateGymDTO) {
    await this.findGymOrThrow(id);
    return await this.prisma.gym.update({ where: { id }, data: body });
  }

  // Gives the user a new temporary password and requires a change on the next login.
  async resetPassword(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const temporaryPassword = generateTemporaryPassword();
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true },
      select: publicUserSelect,
    });
    return { user: toAuthUser(updated), temporaryPassword };
  }

  private async findGymOrThrow(id: number) {
    const gym = await this.prisma.gym.findUnique({ where: { id } });
    if (!gym) {
      throw new NotFoundException('Academia não encontrada');
    }
    return gym;
  }

  private async requireFreeUsername(username: string): Promise<string> {
    if (await this.prisma.user.findUnique({ where: { username } })) {
      throw new ConflictException('Usuário já existe');
    }
    return username;
  }

  // Builds a username from the gym name ("Academia Força" -> "academia.forca"), adding a number when taken.
  private async generateFreeUsername(gymName: string): Promise<string> {
    const base = slugify(gymName) || 'academia';
    let username = base;
    for (let suffix = 2; await this.prisma.user.findUnique({ where: { username } }); suffix++) {
      username = `${base}${suffix}`;
    }
    return username;
  }
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}
