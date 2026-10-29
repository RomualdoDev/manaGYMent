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

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async postClient(@Body() body: CreateClientDTO) {
    return await this.clientService.postClient(body);
  }

  // Declared before ':cpf', otherwise "due" would be read as a CPF.
  @Get('due')
  async getClientsDue(@Query('date') date?: string) {
    const day = date ? parseDateOnly(date) : new Date();
    if (!day) {
      throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD');
    }
    return await this.clientService.getClientsDueOn(day);
  }

  @Get(':cpf')
  async getClient(@Param('cpf') cpf: string) {
    return await this.clientService.getClient(cpf);
  }

  @Get()
  async getClients() {
    return await this.clientService.getAllClients();
  }

  @Patch(':cpf')
  async updateClient(@Param('cpf') cpf: string, @Body() body: UpdateClientDTO) {
    return await this.clientService.updateClient(cpf, body);
  }

  @Delete(':cpf')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClient(@Param('cpf') cpf: string) {
    await this.clientService.deleteClient(cpf);
  }
}
