import {
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxMembers?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
