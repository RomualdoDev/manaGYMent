import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDTO, UpdateClientDTO } from './dtos/client.dto';
import { PrismaService } from 'src/prisma.service';
import { Client, Prisma } from '@prisma/client';
import { dueBillingDays, nextDueDate, toDateOnly } from 'src/billing/billing';

// Client as returned by the API: the database row plus the next due date.
export type ClientView = Client & { nextDueDate: string };

// Every method takes gymId first. It always comes from the logged-in user, so a gym can only see its own clients.
@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  // Looks up the exact stored key. Never normalize it: legacy rows may store the CPF
  // formatted, and a normalized lookup could match a different row of the same person.
  async getClient(gymId: number, cpf: string): Promise<ClientView> {
    const client = await this.prisma.client.findUnique({ where: { gymId_cpf: { gymId, cpf } } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return this.withBilling(client);
  }

  async getAllClients(gymId: number): Promise<ClientView[]> {
    const clients = await this.prisma.client.findMany({ where: { gymId }, orderBy: { name: 'asc' } });
    return clients.map((client) => this.withBilling(client));
  }

  // Clients whose monthly fee is due on the given date.
  // Without gymId (the daily reminder job), it covers every active gym.
  async getClientsDueOn(date: Date, gymId?: number): Promise<ClientView[]> {
    const where: Prisma.ClientWhereInput = {
      billingDay: { in: dueBillingDays(date) },
      gym: { active: true },
    };
    if (gymId !== undefined) {
      where.gymId = gymId;
    }
    const clients = await this.prisma.client.findMany({ where, orderBy: { name: 'asc' } });
    return clients.map((client) => this.withBilling(client));
  }

  async postClient(gymId: number, body: CreateClientDTO): Promise<ClientView> {
    // Checks both forms, since legacy rows may still be stored with the mask.
    const formatted = body.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    const alreadyOnDB = await this.prisma.client.findFirst({
      where: { gymId, cpf: { in: [body.cpf, formatted] } },
    });
    if (alreadyOnDB) {
      throw new ConflictException('Já existe um cliente com este CPF');
    }
    const client = await this.prisma.client.create({ data: { ...body, gymId } });
    return this.withBilling(client);
  }

  async updateClient(gymId: number, cpf: string, body: UpdateClientDTO): Promise<ClientView> {
    const current = await this.getClient(gymId, cpf);
    const client = await this.prisma.client.update({
      where: { gymId_cpf: { gymId, cpf: current.cpf } },
      data: body,
    });
    return this.withBilling(client);
  }

  async deleteClient(gymId: number, cpf: string): Promise<void> {
    const current = await this.getClient(gymId, cpf);
    await this.prisma.client.delete({ where: { gymId_cpf: { gymId, cpf: current.cpf } } });
  }

  private withBilling(client: Client): ClientView {
    return { ...client, nextDueDate: toDateOnly(nextDueDate(client.billingDay)) };
  }
}
