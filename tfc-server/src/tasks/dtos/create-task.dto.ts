import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { TaskType, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString() title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskType)
  type: TaskType; // PERSONAL или TEAM

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  @IsOptional()
  @IsNumber()
  parentTaskId?: number; // для подзадач

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  dependsOn?: number[]; // ID задач, от которых зависит
}
