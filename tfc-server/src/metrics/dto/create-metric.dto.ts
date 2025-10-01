import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MetricPeriodType } from '@prisma/client';

// DTO для создания значения метрики
export class CreateMetricValueDto {
  metricDefinitionId!: number;
  value?: number;
  targetValue?: number;
  periodType!: MetricPeriodType;
  periodDate!: string; // Упрощенная дата периода
  notes?: string;
}

// DTO для создания бизнес-контекста
export class CreateBusinessContextDto {
  industry?: string;
  businessStage?: string;
  foundedYear?: number;
  location?: string;
  mainProducts?: string;
  targetAudience?: string;
  businessModel?: string;
  marketSize?: number;
  competitorCount?: number;
  dataRelevanceDate!: string;
}
