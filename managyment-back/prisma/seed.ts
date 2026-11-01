import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password';

// Creates the system admin from ADMIN_USERNAME / ADMIN_PASSWORD (.env). Safe to run more than once.
async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error('Defina ADMIN_USERNAME e ADMIN_PASSWORD no .env');
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      console.log(`Admin "${username}" já existe`);
      return;
    }

    await prisma.user.create({
      data: {
        username,
        name: 'Administrador',
        passwordHash: await hashPassword(password),
        role: 'ADMIN',
        mustChangePassword: false,
      },
    });
    console.log(`Admin "${username}" criado`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
