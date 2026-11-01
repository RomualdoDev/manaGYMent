import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { join } from 'path';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

// Runs against a throwaway SQLite file, never against the development database.
const TEST_DB = join(__dirname, `e2e-${Date.now()}.db`);
const ADMIN = { username: 'admin', password: 'admin-senha-123' };

describe('Auth and tenant isolation (e2e)', () => {
  let app: INestApplication;

  // Migrations and seed run as child processes (~7s), so the hook needs more than Jest's 5s default.
  beforeAll(async () => {
    process.env.DATABASE_URL = `file:${TEST_DB.replace(/\\/g, '/')}`;
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.ADMIN_USERNAME = ADMIN.username;
    process.env.ADMIN_PASSWORD = ADMIN.password;
    execSync('npx prisma migrate deploy && npx ts-node prisma/seed.ts', {
      env: process.env,
      stdio: 'ignore',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      // The login rate limit has its own unit coverage; here many logins run in a row.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
    rmSync(TEST_DB, { force: true });
  });

  const server = () => app.getHttpServer();

  // Returns the supertest request itself, so callers can chain .expect(...).
  function login(username: string, password: string) {
    return request(server()).post('/auth/login').send({ username, password });
  }

  it('rejects requests without a token', async () => {
    await request(server()).get('/clients').expect(401);
  });

  it('rejects wrong credentials with a generic message', async () => {
    const res = await login(ADMIN.username, 'errada').expect(401);
    expect(res.body.message).toBe('Usuário ou senha inválidos');
  });

  it('lets the admin create a gym and returns a temporary owner password once', async () => {
    const { body: session } = await login(ADMIN.username, ADMIN.password).expect(200);
    const auth = { Authorization: `Bearer ${session.accessToken}` };

    const { body } = await request(server())
      .post('/gyms')
      .set(auth)
      .send({ name: 'Academia Força', ownerName: 'Ana Dona' })
      .expect(201);

    expect(body.user.username).toBe('academia.forca');
    expect(body.user.mustChangePassword).toBe(true);
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(body.temporaryPassword).toHaveLength(10);
  });

  it('forces the owner to change the temporary password before using the API', async () => {
    const { body: adminSession } = await login(ADMIN.username, ADMIN.password);
    const { body: created } = await request(server())
      .post('/gyms')
      .set('Authorization', `Bearer ${adminSession.accessToken}`)
      .send({ name: 'Academia Titan', ownerName: 'Bruno Dono' })
      .expect(201);

    const { body: session } = await login(created.user.username, created.temporaryPassword).expect(200);
    const auth = { Authorization: `Bearer ${session.accessToken}` };

    await request(server()).get('/clients').set(auth).expect(403);

    await request(server())
      .post('/auth/change-password')
      .set(auth)
      .send({ currentPassword: created.temporaryPassword, newPassword: 'nova-senha-forte' })
      .expect(204);

    await request(server()).get('/clients').set(auth).expect(200);
  });

  it('keeps each gym’s clients separate', async () => {
    const { body: adminSession } = await login(ADMIN.username, ADMIN.password);
    const adminAuth = { Authorization: `Bearer ${adminSession.accessToken}` };

    const owner1 = await createOwner('Academia Um', adminAuth);
    const owner2 = await createOwner('Academia Dois', adminAuth);

    const client = {
      cpf: '52998224725',
      name: 'Ana Souza',
      age: 30,
      phoneNumber: '11999999999',
      email: 'ana@example.com',
      billingDay: 10,
    };
    await request(server()).post('/clients').set(owner1).send(client).expect(201);

    await request(server()).get('/clients').set(owner1).expect(200).expect((res) => {
      expect(res.body).toHaveLength(1);
    });
    await request(server()).get('/clients').set(owner2).expect(200).expect((res) => {
      expect(res.body).toHaveLength(0);
    });
    await request(server()).get(`/clients/${client.cpf}`).set(owner2).expect(404);
    await request(server()).delete(`/clients/${client.cpf}`).set(owner2).expect(404);

    // The same CPF can be registered in another gym.
    await request(server()).post('/clients').set(owner2).send(client).expect(201);
  });

  it('blocks staff from admin routes and admins from client routes', async () => {
    const { body: adminSession } = await login(ADMIN.username, ADMIN.password);
    const adminAuth = { Authorization: `Bearer ${adminSession.accessToken}` };
    const owner = await createOwner('Academia Tres', adminAuth);

    await request(server()).get('/gyms').set(owner).expect(403);
    await request(server()).post('/reminders/run').set(owner).expect(403);
    await request(server()).get('/clients').set(adminAuth).expect(403);
  });

  // Creates a gym, logs in as its owner, changes the temporary password, and returns the owner's auth header.
  async function createOwner(gymName: string, adminAuth: { Authorization: string }) {
    const { body: created } = await request(server())
      .post('/gyms')
      .set(adminAuth)
      .send({ name: gymName, ownerName: 'Dono' })
      .expect(201);
    const { body: session } = await login(created.user.username, created.temporaryPassword).expect(200);
    const auth = { Authorization: `Bearer ${session.accessToken}` };
    await request(server())
      .post('/auth/change-password')
      .set(auth)
      .send({ currentPassword: created.temporaryPassword, newPassword: 'senha-do-dono-1' })
      .expect(204);
    return auth;
  }
});
