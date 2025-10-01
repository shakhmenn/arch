import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useBusinessContext,
  useCreateBusinessContext,
  useUpdateBusinessContext,
  CreateBusinessContextDto,
  UpdateBusinessContextDto,
} from '@entities/profile';
import { Button } from '@shared/ui/button.tsx';
import { Input } from '@shared/ui/input.tsx';
import { Textarea } from '@shared/ui/textarea.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card.tsx';
import { Label } from '@shared/ui/label.tsx';
import { Save, ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const businessContextSchema = z.object({
  industry: z.string().optional(),
  businessStage: z.string().optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional().or(z.literal('')),
  location: z.string().optional(),
  mainProducts: z.string().optional(),
  targetAudience: z.string().optional(),
  businessModel: z.string().optional(),
  marketSize: z.number().min(0).optional().or(z.literal('')),
  competitorCount: z.number().min(0).optional().or(z.literal('')),
});

type BusinessContextFormData = z.infer<typeof businessContextSchema>;

export const BusinessContextPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: businessContext, isLoading: isLoadingBusinessContext } = useBusinessContext();
  const createBusinessContext = useCreateBusinessContext();
  const updateBusinessContext = useUpdateBusinessContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BusinessContextFormData>({
    resolver: zodResolver(businessContextSchema),
    defaultValues: {
      industry: businessContext?.industry || '',
      businessStage: businessContext?.businessStage || '',
      foundedYear: businessContext?.foundedYear || '',
      location: businessContext?.location || '',
      mainProducts: businessContext?.mainProducts || '',
      targetAudience: businessContext?.targetAudience || '',
      businessModel: businessContext?.businessModel || '',
      marketSize: businessContext?.marketSize || '',
      competitorCount: businessContext?.competitorCount || '',
    },
  });

  React.useEffect(() => {
    if (businessContext) {
      reset({
        industry: businessContext.industry || '',
        businessStage: businessContext.businessStage || '',
        foundedYear: businessContext.foundedYear || '',
        location: businessContext.location || '',
        mainProducts: businessContext.mainProducts || '',
        targetAudience: businessContext.targetAudience || '',
        businessModel: businessContext.businessModel || '',
        marketSize: businessContext.marketSize || '',
        competitorCount: businessContext.competitorCount || '',
      });
    }
  }, [businessContext, reset]);

  const onSubmit = async (data: BusinessContextFormData) => {
    try {
      const formattedData: CreateBusinessContextDto | UpdateBusinessContextDto = {
        industry: data.industry,
        businessStage: data.businessStage,
        foundedYear: data.foundedYear === '' ? undefined : Number(data.foundedYear),
        location: data.location,
        mainProducts: data.mainProducts,
        targetAudience: data.targetAudience,
        businessModel: data.businessModel,
        marketSize: data.marketSize === '' ? undefined : Number(data.marketSize),
        competitorCount: data.competitorCount === '' ? undefined : Number(data.competitorCount),
        dataRelevanceDate: new Date().toISOString(),
      };

      if (businessContext) {
        await updateBusinessContext.mutateAsync(formattedData);
        toast.success('Бизнес-контекст успешно обновлен');
      } else {
        await createBusinessContext.mutateAsync(formattedData as CreateBusinessContextDto);
        toast.success('Бизнес-контекст успешно создан');
      }
      
      navigate('/profile');
    } catch (error) {
      console.error('Business context save error:', error);
      toast.error('Ошибка при сохранении бизнес-контекста');
    }
  };

  if (isLoadingBusinessContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
          <Building2 className="w-8 h-8" />
          {businessContext ? 'Редактировать бизнес-контекст' : 'Настроить бизнес-контекст'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация о бизнесе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Отрасль</Label>
                <Input
                  id="industry"
                  {...register('industry')}
                  placeholder="Например: IT, Розничная торговля"
                />
                {errors.industry && (
                  <p className="text-sm text-red-600 mt-1">{errors.industry.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="businessStage">Стадия бизнеса</Label>
                <Input
                  id="businessStage"
                  {...register('businessStage')}
                  placeholder="Например: Стартап, Рост, Зрелость"
                />
                {errors.businessStage && (
                  <p className="text-sm text-red-600 mt-1">{errors.businessStage.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="foundedYear">Год основания</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  {...register('foundedYear', { valueAsNumber: true })}
                  placeholder="2020"
                />
                {errors.foundedYear && (
                  <p className="text-sm text-red-600 mt-1">{errors.foundedYear.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Местоположение</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Город, страна"
                />
                {errors.location && (
                  <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Продукты и аудитория */}
        <Card>
          <CardHeader>
            <CardTitle>Продукты и целевая аудитория</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mainProducts">Основные продукты/услуги</Label>
              <Textarea
                id="mainProducts"
                {...register('mainProducts')}
                placeholder="Опишите ваши основные продукты или услуги"
                rows={3}
              />
              {errors.mainProducts && (
                <p className="text-sm text-red-600 mt-1">{errors.mainProducts.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="targetAudience">Целевая аудитория</Label>
              <Textarea
                id="targetAudience"
                {...register('targetAudience')}
                placeholder="Опишите вашу целевую аудitorию"
                rows={3}
              />
              {errors.targetAudience && (
                <p className="text-sm text-red-600 mt-1">{errors.targetAudience.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="businessModel">Бизнес-модель</Label>
              <Input
                id="businessModel"
                {...register('businessModel')}
                placeholder="Например: B2B, B2C, Подписка, Маркетплейс"
              />
              {errors.businessModel && (
                <p className="text-sm text-red-600 mt-1">{errors.businessModel.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Рыночная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Рыночная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marketSize">Размер рынка (₽)</Label>
                <Input
                  id="marketSize"
                  type="number"
                  min="0"
                  {...register('marketSize', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.marketSize && (
                  <p className="text-sm text-red-600 mt-1">{errors.marketSize.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="competitorCount">Количество конкурентов</Label>
                <Input
                  id="competitorCount"
                  type="number"
                  min="0"
                  {...register('competitorCount', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.competitorCount && (
                  <p className="text-sm text-red-600 mt-1">{errors.competitorCount.message}</p>
                )}
              </div>
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
            {businessContext ? 'Сохранить изменения' : 'Создать бизнес-контекст'}
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