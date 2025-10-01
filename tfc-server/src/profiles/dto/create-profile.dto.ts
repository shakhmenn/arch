import {
  IsOptional,
  IsString,
  IsNumber,
  IsDecimal,
  IsUrl,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  userAge?: number;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  currentRevenue?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  targetRevenue?: number;

  @IsOptional()
  @IsNumber()
  currentEmployees?: number;

  @IsOptional()
  @IsNumber()
  targetEmployees?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
