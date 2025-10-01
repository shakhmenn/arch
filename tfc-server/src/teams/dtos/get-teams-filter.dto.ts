import {
  IsOptional,
  IsBoolean,
  IsString,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTeamsFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsPositive()
  leaderId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsPositive()
  limit?: number = 10;
}
