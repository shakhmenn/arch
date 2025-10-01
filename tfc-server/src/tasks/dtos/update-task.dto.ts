import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
  
  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  @IsDateString()
  dueDate?: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
  
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedHours?: number;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  actualHours?: number;
  
  @IsOptional()
  @IsInt()
  assigneeId?: number;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}