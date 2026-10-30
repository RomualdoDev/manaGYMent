import { Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider';

// Development provider: writes the message to the log instead of sending it.
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('ConsoleSmsProvider');

  async send(to: string, message: string): Promise<{ id?: string }> {
    this.logger.log(`SMS to ${to}: ${message}`);
    return { id: `console-${Date.now()}` };
  }
}
