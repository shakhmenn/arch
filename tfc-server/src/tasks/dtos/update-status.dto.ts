import { IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus; // PENDING, IN_PROGRESS, DONE
}
