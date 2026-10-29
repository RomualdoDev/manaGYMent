import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDTO, UpdateClientDTO } from './dtos/client.dto';
import { PrismaService } from 'src/prisma.service';
import { Client } from '@prisma/client';
import { dueBillingDays, nextDueDate, toDateOnly } from 'src/billing/billing';

// Client as returned by the API: the database row plus the next due date.
export type ClientView = Client & { nextDueDate: string };

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  // Looks up the exact stored key. Never normalize it: legacy rows may store the CPF
  // formatted, and a normalized lookup could match a different row of the same person.
  async getClient(cpf: string): Promise<ClientView> {
    const client = await this.prisma.client.findUnique({ where: { cpf } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return this.withBilling(client);
  }

  async getAllClients(): Promise<ClientView[]> {
    const clients = await this.prisma.client.findMany({ orderBy: { name: 'asc' } });
    return clients.map((client) => this.withBilling(client));
  }

  // Clients whose monthly fee is due on the given date. This is the query the SMS notification will use.
  async getClientsDueOn(date: Date): Promise<ClientView[]> {
    const clients = await this.prisma.client.findMany({
      where: { billingDay: { in: dueBillingDays(date) } },
      orderBy: { name: 'asc' },
    });
    return clients.map((client) => this.withBilling(client));
  }

  async postClient(body: CreateClientDTO): Promise<ClientView> {
    // Checks both forms, since legacy rows may still be stored with the mask.
    const formatted = body.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    const alreadyOnDB = await this.prisma.client.findFirst({
      where: { cpf: { in: [body.cpf, formatted] } },
    });
    if (alreadyOnDB) {
      throw new ConflictException('Já existe um cliente com este CPF');
    }
    const client = await this.prisma.client.create({ data: body });
    return this.withBilling(client);
  }

  async updateClient(cpf: string, body: UpdateClientDTO): Promise<ClientView> {
    const current = await this.getClient(cpf);
    const client = await this.prisma.client.update({ where: { cpf: current.cpf }, data: body });
    return this.withBilling(client);
  }

  async deleteClient(cpf: string): Promise<void> {
    const current = await this.getClient(cpf);
    await this.prisma.client.delete({ where: { cpf: current.cpf } });
  }

  private withBilling(client: Client): ClientView {
    return { ...client, nextDueDate: toDateOnly(nextDueDate(client.billingDay)) };
  }
}
