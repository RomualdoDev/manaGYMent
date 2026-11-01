import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  // Releases the database file when the app closes (needed for the e2e tests on Windows).
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
