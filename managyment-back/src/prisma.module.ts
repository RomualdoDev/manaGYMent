import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// One shared PrismaService (one database connection) for every feature module.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
