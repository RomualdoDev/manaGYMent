import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { todayIn } from 'src/billing/billing';
import { PaymentReminderService } from './payment-reminder.service';
import { ACADEMY_TIME_ZONE } from './reminders.constants';

export const PAYMENT_REMINDER_JOB = 'payment-reminders';

@Injectable()
export class PaymentReminderScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(PaymentReminderScheduler.name);

  constructor(
    private readonly reminders: PaymentReminderService,
    private readonly schedules: SchedulerRegistry,
  ) {}

  // Logs when the job will next run, so the schedule and time zone can be checked at startup.
  onApplicationBootstrap(): void {
    const next = this.schedules.getCronJob(PAYMENT_REMINDER_JOB).nextDate();
    this.logger.log(`Next payment reminder run: ${next.toString()} (America/Sao_Paulo)`);
  }

  @Cron('0 9 * * *', { name: PAYMENT_REMINDER_JOB, timeZone: 'America/Sao_Paulo' })
  async runDaily(): Promise<void> {
    await this.reminders.sendRemindersFor(todayIn(ACADEMY_TIME_ZONE));
  }
}
