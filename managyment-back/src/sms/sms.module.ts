import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleSmsProvider } from './console-sms.provider';
import { SMS_PROVIDER, SmsProvider } from './sms-provider';

@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      // Picks the provider from SMS_PROVIDER. An unknown value stops the API from starting,
      // so reminders are never silently skipped because of a typo.
      useFactory: (config: ConfigService): SmsProvider => {
        const name = config.get<string>('SMS_PROVIDER', 'console');
        switch (name) {
          case 'console':
            return new ConsoleSmsProvider();
          default:
            throw new Error(`Unknown SMS_PROVIDER "${name}". Supported values: console`);
        }
      },
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
