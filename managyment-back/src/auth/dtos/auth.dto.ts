import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDTO {
  @IsString()
  @IsNotEmpty({ message: 'Usuário é obrigatório' })
  readonly username: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  readonly password: string;
}

export class ChangePasswordDTO {
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  readonly currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  readonly newPassword: string;
}
