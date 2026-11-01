import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateGymDTO {
  @IsString()
  @IsNotEmpty({ message: 'Nome da academia é obrigatório' })
  readonly name: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome do dono é obrigatório' })
  readonly ownerName: string;

  // Optional: when missing, it is generated from the gym name.
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'Usuário deve ter apenas letras minúsculas, números, ponto, traço ou underline',
  })
  readonly ownerUsername?: string;
}

export class UpdateGymDTO {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nome da academia não pode ser vazio' })
  readonly name?: string;

  @IsOptional()
  @IsBoolean()
  readonly active?: boolean;
}
