import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDTO, UpdateClientDTO } from './dtos/client.dto';
import { parseDateOnly } from 'src/billing/billing';
import { CurrentUser, Roles } from 'src/auth/decorators';
import { AuthUser, ROLE } from 'src/auth/auth.types';

// Clients belong to a gym, so this area is for the gym owners (STAFF) only.
// Every handler uses user.gymId from the token, never a value sent by the client.
@Controller('clients')
@Roles(ROLE.STAFF)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async postClient(@CurrentUser() user: AuthUser, @Body() body: CreateClientDTO) {
    return await this.clientService.postClient(user.gymId, body);
  }

  // Declared before ':cpf', otherwise "due" would be read as a CPF.
  @Get('due')
  async getClientsDue(@CurrentUser() user: AuthUser, @Query('date') date?: string) {
    const day = date ? parseDateOnly(date) : new Date();
    if (!day) {
      throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD');
    }
    return await this.clientService.getClientsDueOn(day, user.gymId);
  }

  @Get(':cpf')
  async getClient(@CurrentUser() user: AuthUser, @Param('cpf') cpf: string) {
    return await this.clientService.getClient(user.gymId, cpf);
  }

  @Get()
  async getClients(@CurrentUser() user: AuthUser) {
    return await this.clientService.getAllClients(user.gymId);
  }

  @Patch(':cpf')
  async updateClient(
    @CurrentUser() user: AuthUser,
    @Param('cpf') cpf: string,
    @Body() body: UpdateClientDTO,
  ) {
    return await this.clientService.updateClient(user.gymId, cpf, body);
  }

  @Delete(':cpf')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClient(@CurrentUser() user: AuthUser, @Param('cpf') cpf: string) {
    await this.clientService.deleteClient(user.gymId, cpf);
  }
}
