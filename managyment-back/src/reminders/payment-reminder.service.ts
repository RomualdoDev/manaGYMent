import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, SmsNotification } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ClientService } from 'src/client/client.service';
import { SMS_PROVIDER, SmsProvider } from 'src/sms/sms-provider';
import { toE164 } from 'src/sms/phone';
import { parseDateOnly } from 'src/billing/billing';
import { buildReminderMessage } from './reminder-message';
import { STALE_PENDING_MS } from './reminders.constants';

export interface ReminderSummary {
  date: string;
  sent: number;
  failed: number;
  skipped: number;
  alreadySent: number;
}

@Injectable()
export class PaymentReminderService {
  private readonly logger = new Logger(PaymentReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  // Sends the reminder to every client whose monthly fee is due on `date` (YYYY-MM-DD).
  // Safe to run more than once: each client gets at most one SMS per due date.
  async sendRemindersFor(date: string): Promise<ReminderSummary> {
    const summary: ReminderSummary = { date, sent: 0, failed: 0, skipped: 0, alreadySent: 0 };
    const dueClients = await this.clients.getClientsDueOn(parseDateOnly(date) as Date);

    for (const client of dueClients) {
      try {
        const phone = toE164(client.phoneNumber);
        const message = buildReminderMessage(client.name, date);
        const reservation = await this.reserve(client.cpf, date, client.phoneNumber, message);
        if (!reservation) {
          summary.alreadySent++;
          continue;
        }

        if (!phone) {
          await this.update(reservation.id, { status: 'SKIPPED', error: 'Telefone inválido' });
          summary.skipped++;
          continue;
        }

        try {
          const result = await this.sms.send(phone, message);
          await this.update(reservation.id, { status: 'SENT', providerMessageId: result.id ?? null });
          summary.sent++;
        } catch (error) {
          await this.update(reservation.id, { status: 'FAILED', error: String(error) });
          summary.failed++;
        }
      } catch (error) {
        // One client's unexpected error must not stop the others.
        this.logger.error(`Reminder failed for client ${client.cpf}`, error as Error);
        summary.failed++;
      }
    }

    this.logger.log(JSON.stringify(summary));
    return summary;
  }

  // Claims the (client, due date) slot before sending. Returns null when another run
  // already sent it or is still sending it. FAILED and stale PENDING slots can be claimed again.
  private async reserve(
    cpf: string,
    dueDate: string,
    phoneNumber: string,
    message: string,
  ): Promise<{ id: number } | null> {
    try {
      const created = await this.prisma.smsNotification.create({
        data: { clientCpf: cpf, dueDate, phoneNumber, message, status: 'PENDING' },
      });
      return { id: created.id };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
    }

    const existing = await this.prisma.smsNotification.findUnique({
      where: { clientCpf_dueDate: { clientCpf: cpf, dueDate } },
    });
    if (!existing || !this.isClaimable(existing)) {
      return null;
    }

    // Optimistic claim: only one run wins, because the row must still look exactly as we read it.
    const claimed = await this.prisma.smsNotification.updateMany({
      where: { id: existing.id, status: existing.status, updatedAt: existing.updatedAt },
      data: { status: 'PENDING', error: null, phoneNumber, message },
    });
    return claimed.count === 1 ? { id: existing.id } : null;
  }

  private isClaimable(row: SmsNotification): boolean {
    if (row.status === 'FAILED') {
      return true;
    }
    return row.status === 'PENDING' && row.updatedAt.getTime() < Date.now() - STALE_PENDING_MS;
  }

  private async update(id: number, data: Prisma.SmsNotificationUpdateInput): Promise<void> {
    await this.prisma.smsNotification.update({ where: { id }, data });
  }
}
