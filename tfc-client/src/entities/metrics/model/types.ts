// Enum типы (соответствуют Prisma схеме)
export enum MetricCategory {
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  STRATEGIC = 'STRATEGIC',
  CUSTOMER = 'CUSTOMER',
  PRODUCTIVITY = 'PRODUCTIVITY',
}

export enum MetricPeriodType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum MetricUnit {
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
  COUNT = 'COUNT',
  RATIO = 'RATIO',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}

export enum MetricChangeType {
  CORRECTION = 'CORRECTION',
  UPDATE = 'UPDATE',
}

export enum MetricDirection {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER',
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',
}

// Интерфейсы для определений метрик
export interface MetricDefinition {
  id: number;
  name: string;
  description?: string;
  category: MetricCategory;
  unit: MetricUnit;
  direction: MetricDirection;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Интерфейсы для значений метрик
export interface MetricValue {
  id: number;
  value?: number;
  targetValue?: number;
  periodType: MetricPeriodType;
  periodDate: string; // Упрощенная дата периода
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  metricDefinitionId: number;
  metricDefinition: MetricDefinition;
  history?: MetricHistory[];
}

// Интерфейсы для истории метрик
export interface MetricHistory {
  id: number;
  oldValue?: number;
  newValue?: number;
  oldTarget?: number;
  newTarget?: number;
  changeType: MetricChangeType; // Тип изменения
  changeReason?: string;
  changedAt: string;
  userId: number;
  metricValueId: number;
}

// DTO для создания значения метрики
export interface CreateMetricValueDto {
  metricDefinitionId: number;
  value?: number;
  targetValue?: number;
  periodType: MetricPeriodType;
  periodDate: string; // Упрощенная дата периода
  notes?: string;
}

// DTO для обновления значения метрики
export interface UpdateMetricValueDto extends Partial<CreateMetricValueDto> {
  changeType: MetricChangeType; // Обязательный тип изменения
  changeReason?: string;
  effectiveDate?: string; // Дата, на которую заносятся данные (для UPDATE)
}

// Интерфейс для анализа категорий
export interface CategoryAnalysis {
  category: MetricCategory;
  totalPlanned: number;
  totalActual: number;
  variance: number;
  metricsCount: number;
}

// Интерфейс для последних метрик
export interface RecentMetric {
  id: number;
  name: string;
  category: MetricCategory;
  value?: number;
  targetValue?: number;
  unit: MetricUnit;
  direction: MetricDirection;
  periodDate: string; // Упрощенная дата периода
  variance?: number | null;
}

// Интерфейс для истории изменений
export interface RecentHistoryItem {
  id: number;
  metricName: string;
  oldValue?: number;
  newValue?: number;
  changeType: MetricChangeType; // Тип изменения
  changeReason?: string;
  changedAt: string;
}

// Интерфейс для дашборда метрик
export interface MetricsDashboard {
  businessContext?: any;
  metricsByCategory: Record<MetricCategory, MetricValue[]>;
  categoryAnalysis: CategoryAnalysis[];
  recentMetrics: RecentMetric[];
  recentHistory: RecentHistoryItem[];
}

// Фильтры для метрик
export interface MetricsFilters {
  category?: MetricCategory;
  periodType?: MetricPeriodType;
  startDate?: string;
  endDate?: string;
}