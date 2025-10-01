import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  patronymic?: string;

  @IsOptional()
  @IsDateString({}, { message: 'birthDate must be a valid ISO date string' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  personalTelegram?: string;

  @IsOptional()
  @IsString()
  personalInstagram?: string;

  @IsOptional()
  @IsString()
  personalPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  yearsInBusiness?: number;

  @IsOptional()
  @IsString()
  hobbies?: string;
}
