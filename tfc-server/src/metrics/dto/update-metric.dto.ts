import { PartialType } from '@nestjs/mapped-types';
import {
  CreateMetricValueDto,
  CreateBusinessContextDto,
} from './create-metric.dto';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { MetricChangeType } from '@prisma/client';

// DTO для обновления значения метрики
export class UpdateMetricValueDto extends PartialType(CreateMetricValueDto) {
  changeType!: MetricChangeType; // Обязательный тип изменения
  changeReason?: string; // Причина изменения для истории
  effectiveDate?: string; // Дата, на которую заносятся данные (для UPDATE)
}

// DTO для обновления бизнес-контекста
export class UpdateBusinessContextDto extends PartialType(
  CreateBusinessContextDto,
) {}
