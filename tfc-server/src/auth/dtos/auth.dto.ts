import { IsString, Matches, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Телефон должен содержать только цифры и “+”',
  })
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Пароль минимум 6 символов' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Имя минимум 2 символа' })
  name: string;
}

export class LoginRequestDto {
  @Matches(/^\+?[0-9]{10,15}$/)
  phone: string;

  @IsString()
  password: string;
}
