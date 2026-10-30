import { Prisma } from '@prisma/client';
import { PaymentReminderService } from './payment-reminder.service';
import { STALE_PENDING_MS } from './reminders.constants';
import { SmsProvider } from 'src/sms/sms-provider';

type Row = {
  id: number;
  clientCpf: string;
  dueDate: string;
  phoneNumber: string;
  message: string;
  status: string;
  error: string | null;
  providerMessageId: string | null;
  updatedAt: Date;
};

// In-memory stand-in for the smsNotification table, enforcing the (clientCpf, dueDate) unique key.
function fakePrisma() {
  const rows: Row[] = [];
  let nextId = 1;
  const find = (where: { id?: number; clientCpf_dueDate?: { clientCpf: string; dueDate: string } }) =>
    rows.find((row) =>
      where.id !== undefined
        ? row.id === where.id
        : row.clientCpf === where.clientCpf_dueDate?.clientCpf && row.dueDate === where.clientCpf_dueDate?.dueDate,
    );

  return {
    rows,
    smsNotification: {
      create: async ({ data }: { data: Omit<Row, 'id' | 'error' | 'providerMessageId' | 'updatedAt'> & Partial<Row> }) => {
        if (find({ clientCpf_dueDate: { clientCpf: data.clientCpf, dueDate: data.dueDate } })) {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '6.0.1',
          });
        }
        const row: Row = { id: nextId++, error: null, providerMessageId: null, updatedAt: new Date(), ...data } as Row;
        rows.push(row);
        return row;
      },
      findUnique: async ({ where }: { where: { clientCpf_dueDate: { clientCpf: string; dueDate: string } } }) =>
        find(where) ?? null,
      updateMany: async ({ where, data }: { where: Partial<Row>; data: Partial<Row> }) => {
        const matches = rows.filter(
          (row) =>
            row.id === where.id &&
            row.status === where.status &&
            row.updatedAt.getTime() === (where.updatedAt as Date).getTime(),
        );
        matches.forEach((row) => Object.assign(row, data, { updatedAt: new Date() }));
        return { count: matches.length };
      },
      update: async ({ where, data }: { where: { id: number }; data: Partial<Row> }) => {
        const row = find(where) as Row;
        Object.assign(row, data, { updatedAt: new Date() });
        return row;
      },
    },
  };
}

const dueClient = (overrides: Partial<{ cpf: string; name: string; phoneNumber: string }> = {}) => ({
  cpf: '52998224725',
  name: 'Ana Souza',
  phoneNumber: '11999999999',
  ...overrides,
});

function setup(dueClients: ReturnType<typeof dueClient>[], send = jest.fn(async () => ({ id: 'msg-1' }))) {
  const prisma = fakePrisma();
  const clients = { getClientsDueOn: jest.fn(async () => dueClients) };
  const sms: SmsProvider = { send };
  const service = new PaymentReminderService(prisma as any, clients as any, sms);
  return { service, prisma, send };
}

describe('PaymentReminderService', () => {
  it('sends one SMS to each client due on the date', async () => {
    const { service, send, prisma } = setup([dueClient(), dueClient({ cpf: '11144477735', name: 'Bruno', phoneNumber: '34997467405' })]);

    const summary = await service.sendRemindersFor('2026-11-10');

    expect(summary).toEqual({ date: '2026-11-10', sent: 2, failed: 0, skipped: 0, alreadySent: 0 });
    expect(send).toHaveBeenCalledWith('+5511999999999', expect.stringContaining('Ana'));
    expect(prisma.rows.map((row) => row.status)).toEqual(['SENT', 'SENT']);
    expect(prisma.rows[0].providerMessageId).toBe('msg-1');
  });

  it('does not send the same reminder twice for the same due date', async () => {
    const { service, send } = setup([dueClient()]);

    await service.sendRemindersFor('2026-11-10');
    const second = await service.sendRemindersFor('2026-11-10');

    expect(send).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ sent: 0, alreadySent: 1 });
  });

  it('skips clients without a valid phone and records why', async () => {
    const { service, send, prisma } = setup([dueClient({ phoneNumber: '' })]);

    const summary = await service.sendRemindersFor('2026-11-10');

    expect(send).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ skipped: 1, sent: 0 });
    expect(prisma.rows[0]).toMatchObject({ status: 'SKIPPED', error: 'Telefone inválido' });
  });

  it('marks a provider failure as FAILED without stopping the other clients', async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error('provider down'))
      .mockResolvedValueOnce({ id: 'msg-2' });
    const { service, prisma } = setup(
      [dueClient(), dueClient({ cpf: '11144477735', name: 'Bruno', phoneNumber: '34997467405' })],
      send,
    );

    const summary = await service.sendRemindersFor('2026-11-10');

    expect(summary).toMatchObject({ sent: 1, failed: 1 });
    expect(prisma.rows.map((row) => row.status)).toEqual(['FAILED', 'SENT']);
    expect(prisma.rows[0].error).toContain('provider down');
  });

  it('retries a FAILED reminder on the next run', async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error('provider down'))
      .mockResolvedValueOnce({ id: 'msg-3' });
    const { service, prisma } = setup([dueClient()], send);

    await service.sendRemindersFor('2026-11-10');
    const second = await service.sendRemindersFor('2026-11-10');

    expect(second).toMatchObject({ sent: 1, failed: 0 });
    expect(prisma.rows[0]).toMatchObject({ status: 'SENT', providerMessageId: 'msg-3' });
  });

  it('does not resend while another run is still fresh in PENDING', async () => {
    const { service, prisma, send } = setup([dueClient()]);
    prisma.rows.push({
      id: 99,
      clientCpf: '52998224725',
      dueDate: '2026-11-10',
      phoneNumber: '11999999999',
      message: 'x',
      status: 'PENDING',
      error: null,
      providerMessageId: null,
      updatedAt: new Date(),
    });

    const summary = await service.sendRemindersFor('2026-11-10');

    expect(send).not.toHaveBeenCalled();
    expect(summary.alreadySent).toBe(1);
  });

  it('claims a PENDING reminder left behind by a crashed run', async () => {
    const { service, prisma, send } = setup([dueClient()]);
    prisma.rows.push({
      id: 98,
      clientCpf: '52998224725',
      dueDate: '2026-11-10',
      phoneNumber: '11999999999',
      message: 'x',
      status: 'PENDING',
      error: null,
      providerMessageId: null,
      updatedAt: new Date(Date.now() - STALE_PENDING_MS - 1000),
    });

    const summary = await service.sendRemindersFor('2026-11-10');

    expect(send).toHaveBeenCalledTimes(1);
    expect(summary.sent).toBe(1);
  });
});
