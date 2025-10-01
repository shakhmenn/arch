import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  surname?: string; // Фамилия

  @IsOptional()
  @IsString()
  patronymic?: string; // Отчество

  @IsOptional()
  @IsDateString()
  birthDate?: string; // Дата рождения

  @IsOptional()
  @IsString()
  personalTelegram?: string; // Личный Telegram

  @IsOptional()
  @IsString()
  personalInstagram?: string; // Личный Instagram

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  yearsInBusiness?: number; // Сколько лет в бизнесе

  @IsOptional()
  @IsString()
  hobbies?: string; // Увлечения
}
