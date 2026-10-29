import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsCPF, IsPhone } from 'brazilian-class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';

// Strips every non-digit character, so CPF and phone are stored as digits only.
const onlyDigits = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\D/g, '') : value;

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, index) => index + 1);

export class CreateClientDTO {
  @Transform(onlyDigits)
  @IsCPF({ message: 'CPF inválido' })
  readonly cpf: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  readonly name: string;

  @IsInt({ message: 'Idade deve ser um número inteiro' })
  @Min(0, { message: 'Idade não pode ser negativa' })
  @Max(150, { message: 'Idade inválida' })
  readonly age: number;

  @IsOptional()
  @IsInt({ message: 'Tamanho deve ser um número inteiro' })
  @Min(0)
  readonly size?: number;

  @Transform(onlyDigits)
  @IsPhone({ message: 'Telefone inválido. Informe DDD + número' })
  readonly phoneNumber: string;

  @IsEmail({}, { message: 'Email inválido' })
  readonly email: string;

  @IsIn(DAYS_OF_MONTH, { message: 'Dia de vencimento deve ser entre 1 e 31' })
  readonly billingDay: number;

  @IsOptional()
  @IsNumber()
  readonly beginDate?: number;
}

// The CPF is the client's key, so it cannot be changed on update.
export class UpdateClientDTO extends PartialType(OmitType(CreateClientDTO, ['cpf'] as const)) {}
