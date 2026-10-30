import { Module } from '@nestjs/common';
import { ClientModule } from 'src/client/client.module';
import { SmsModule } from 'src/sms/sms.module';
import { PaymentReminderService } from './payment-reminder.service';
import { PaymentReminderScheduler } from './payment-reminder.scheduler';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [ClientModule, SmsModule],
  controllers: [RemindersController],
  providers: [PaymentReminderService, PaymentReminderScheduler],
})
export class RemindersModule {}
