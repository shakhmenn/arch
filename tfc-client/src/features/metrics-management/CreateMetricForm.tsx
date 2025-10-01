import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MetricCategory,
  MetricPeriodType,
  useMetricDefinitions,
  useCreateMetricValue,
  CreateMetricValueDto,
} from '@entities/metrics';
import { Button } from '@shared/ui/button.tsx';
import { Input } from '@shared/ui/input.tsx';
import { Textarea } from '@shared/ui/textarea.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Label } from '@shared/ui/label.tsx';
import { MonthYearPicker } from '@shared/ui/month-year-picker.tsx';
import { Save, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const createMetricSchema = z.object({
  metricDefinitionId: z.number().min(1, 'Выберите метрику'),
  value: z.number().min(0).optional().or(z.literal('')),
  targetValue: z.number().min(0).optional().or(z.literal('')),
  periodType: z.nativeEnum(MetricPeriodType).refine((val) => val !== undefined, {
    message: 'Выберите тип периода',
  }),
  periodMonth: z.string().min(1, 'Укажите месяц и год'),
  notes: z.string().optional(),
});

type CreateMetricFormData = z.infer<typeof createMetricSchema>;

interface CreateMetricFormProps {
  onSuccess?: () => void;
  initialCategory?: MetricCategory;
}

export const CreateMetricForm: React.FC<CreateMetricFormProps> = ({ 
  onSuccess, 
  initialCategory 
}) => {
  const navigate = useNavigate();
  const { data: metricDefinitions, isLoading: isLoadingDefinitions } = useMetricDefinitions();
  const createMetricValue = useCreateMetricValue();
  const [selectedCategory, setSelectedCategory] = React.useState<MetricCategory | undefined>(initialCategory);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateMetricFormData>({
    resolver: zodResolver(createMetricSchema),
    defaultValues: {
      periodType: MetricPeriodType.MONTHLY,
      periodMonth: `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`,
    },
  });

  const selectedMetricId = watch('metricDefinitionId');
  const selectedMetric = metricDefinitions?.find(m => m.id === selectedMetricId);

  // Фильтруем определения метрик по выбранной категории
  const filteredDefinitions = React.useMemo(() => {
    if (!metricDefinitions) return [];
    if (!selectedCategory) return metricDefinitions;
    return metricDefinitions.filter(def => def.category === selectedCategory);
  }, [metricDefinitions, selectedCategory]);

  const onSubmit = async (data: CreateMetricFormData) => {
    try {
      // Преобразуем месяц в дату (первое число месяца)
      const [year, month] = data.periodMonth.split('-');
      const periodDate = `${year}-${month}-01`;

      const formattedData: CreateMetricValueDto = {
        ...data,
        value: data.value === '' ? undefined : Number(data.value),
        targetValue: data.targetValue === '' ? undefined : Number(data.targetValue),
        periodDate,
      };

      // Удаляем periodMonth из данных
      delete (formattedData as any).periodMonth;

      await createMetricValue.mutateAsync(formattedData);
      toast.success('Метрика успешно создана');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Create metric error:', error);
      toast.error('Ошибка при создании метрики');
    }
  };

  if (isLoadingDefinitions) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { navigate('/profile'); }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Plus className="w-8 h-8" />
          Создать метрику
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Выбор категории */}
        <Card>
          <CardHeader>
            <CardTitle>Категория метрики</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.values(MetricCategory).map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedCategory(category); }}
                  className="justify-start"
                >
                  {getCategoryName(category)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Выбор метрики */}
        <Card>
          <CardHeader>
            <CardTitle>Выбор метрики</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="metricDefinitionId">Метрика</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={watch('metricDefinitionId')?.toString() || ''}
                onChange={(e) => { setValue('metricDefinitionId', parseInt(e.target.value)); }}
              >
                <option value="" disabled>Выберите метрику</option>
                {filteredDefinitions.map((definition) => (
                  <option key={definition.id} value={definition.id.toString()}>
                    {definition.name}
                    {definition.description && ` - ${definition.description}`}
                  </option>
                ))}
              </select>
              {errors.metricDefinitionId && (
                <p className="text-sm text-red-600 mt-1">{errors.metricDefinitionId.message}</p>
              )}
            </div>

            {selectedMetric && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Описание:</strong> {selectedMetric.description || 'Нет описания'}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  <strong>Единица измерения:</strong> {getUnitName(selectedMetric.unit)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Значения и период */}
        <Card>
          <CardHeader>
            <CardTitle>Значения и период</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Текущее значение</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('value', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.value && (
                  <p className="text-sm text-red-600 mt-1">{errors.value.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="targetValue">Целевое значение</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('targetValue', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.targetValue && (
                  <p className="text-sm text-red-600 mt-1">{errors.targetValue.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="periodType">Тип периода</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={watch('periodType') || ''}
                onChange={(e) => { setValue('periodType', e.target.value as MetricPeriodType); }}
              >
                <option value="" disabled>Выберите период</option>
                {Object.values(MetricPeriodType).map((type) => (
                  <option key={type} value={type}>
                    {getPeriodTypeName(type)}
                  </option>
                ))}
              </select>
              {errors.periodType && (
                <p className="text-sm text-red-600 mt-1">{errors.periodType.message}</p>
              )}
            </div>

            <MonthYearPicker
              label="Месяц и год"
              value={watch('periodMonth')}
              onChange={(value) => { setValue('periodMonth', value); }}
              error={errors.periodMonth?.message}
              required
            />

            <div>
              <Label htmlFor="notes">Заметки (необязательно)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Дополнительная информация о метрике"
                rows={3}
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Создать метрику
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { navigate('/profile'); }}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
};

// Вспомогательные функции для отображения названий
function getCategoryName(category: MetricCategory): string {
  const names = {
    [MetricCategory.FINANCIAL]: 'Финансовые',
    [MetricCategory.OPERATIONAL]: 'Операционные',
    [MetricCategory.STRATEGIC]: 'Стратегические',
    [MetricCategory.CUSTOMER]: 'Клиентские',
    [MetricCategory.PRODUCTIVITY]: 'Продуктивность',
  };
  return names[category];
}

function getUnitName(unit: string): string {
  const names = {
    CURRENCY: 'Валюта (₽)',
    PERCENTAGE: 'Проценты (%)',
    COUNT: 'Количество',
    RATIO: 'Коэффициент',
    HOURS: 'Часы',
    DAYS: 'Дни',
  };
  return names[unit as keyof typeof names] || unit;
}

function getPeriodTypeName(type: MetricPeriodType): string {
  const names = {
    [MetricPeriodType.DAILY]: 'Ежедневно',
    [MetricPeriodType.WEEKLY]: 'Еженедельно',
    [MetricPeriodType.MONTHLY]: 'Ежемесячно',
    [MetricPeriodType.QUARTERLY]: 'Ежеквартально',
    [MetricPeriodType.YEARLY]: 'Ежегодно',
  };
  return names[type];
}