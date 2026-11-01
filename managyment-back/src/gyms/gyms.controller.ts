import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from 'src/auth/decorators';
import { ROLE } from 'src/auth/auth.types';
import { GymsService } from './gyms.service';
import { CreateGymDTO, UpdateGymDTO } from './dtos/gym.dto';

// Only the system admin manages gyms and their owners.
@Controller('gyms')
@Roles(ROLE.ADMIN)
export class GymsController {
  constructor(private readonly gyms: GymsService) {}

  @Post()
  async createGym(@Body() body: CreateGymDTO) {
    return await this.gyms.createGym(body);
  }

  @Get()
  async listGyms() {
    return await this.gyms.listGyms();
  }

  @Patch(':id')
  async updateGym(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateGymDTO) {
    return await this.gyms.updateGym(id, body);
  }
}
