import { IsArray, IsInt, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class BulkUpdateStatusDto {
  @IsArray()
  @IsInt({ each: true })
  taskIds: number[];

  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class BulkAssignDto {
  @IsArray()
  @IsInt({ each: true })
  taskIds: number[];

  @IsInt()
  assigneeId: number;
}

export class BulkDeleteDto {
  @IsArray()
  @IsInt({ each: true })
  taskIds: number[];
}

export class AddDependencyDto {
  @IsInt()
  dependsOnId: number;
}