import {
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsArray,
  IsString,
  IsBoolean,
} from 'class-validator';
import { TaskStatus, TaskPriority, TaskType } from '@prisma/client';

export class FilterTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
  
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
  
  @IsOptional()
  @IsInt()
  assigneeId?: number;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;
  
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;
  
  @IsOptional()
  @IsString()
  search?: string;
  
  @IsOptional()
  @IsString()
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
  
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  // Новые поля фильтрации согласно архитектуре
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsInt()
  teamId?: number;

  @IsOptional()
  @IsInt()
  creatorId?: number;

  @IsOptional()
  @IsInt()
  parentTaskId?: number;

  @IsOptional()
  @IsBoolean()
  hasSubtasks?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDependencies?: boolean;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsDateString()
  updatedFrom?: string;

  @IsOptional()
  @IsDateString()
  updatedTo?: string;

  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 20;
}