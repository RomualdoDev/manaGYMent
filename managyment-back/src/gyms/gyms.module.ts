import { Module } from '@nestjs/common';
import { GymsController } from './gyms.controller';
import { GymsService } from './gyms.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [GymsController, UsersController],
  providers: [GymsService],
})
export class GymsModule {}
