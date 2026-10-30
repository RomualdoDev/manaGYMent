// Contract every SMS provider implements. Adding a real provider means one new class
// plus one case in the factory in sms.module.ts.
export interface SmsProvider {
  send(to: string, message: string): Promise<{ id?: string }>;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';
