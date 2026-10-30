import { BadRequestException, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { parseDateOnly, todayIn } from 'src/billing/billing';
import { PaymentReminderService } from './payment-reminder.service';
import { ACADEMY_TIME_ZONE } from './reminders.constants';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: PaymentReminderService) {}

  // Runs the reminders by hand, e.g. after an outage. Without `date`, uses today in the academy's time zone.
  // TODO: protect this route before publishing; each call can cost SMS once a real provider is set.
  @Post('run')
  @HttpCode(HttpStatus.OK)
  async run(@Query('date') date?: string) {
    const day = date ?? todayIn(ACADEMY_TIME_ZONE);
    if (!parseDateOnly(day)) {
      throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD');
    }
    return await this.reminders.sendRemindersFor(day);
  }
}
