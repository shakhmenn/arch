import React, { useState } from 'react';
import { CreateTeamData } from '@shared/types/team';
import { User } from '@shared/types/user';
import { Role } from '@shared/types/role';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import { Card } from '@shared/ui/card';
import { Plus, X, Users, Crown } from 'lucide-react';

interface CreateTeamFormProps {
  onSubmit: (data: CreateTeamData) => Promise<void> | void;
  onCancel?: () => void;
  availableUsers?: User[];
  isLoading?: boolean;
  className?: string;
}

interface FormData extends CreateTeamData {
  leaderId?: number;
}

interface FormErrors {
  name?: string;
  description?: string;
  maxMembers?: string;
  leaderId?: string;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({
  onSubmit,
  onCancel,
  availableUsers = [],
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    maxMembers: 10,
    leaderId: undefined
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Фильтруем пользователей, которые могут быть лидерами
  const potentialLeaders = availableUsers.filter(user => 
    user.role === Role.TEAM_LEADER || 
    user.role === Role.ADMIN
  );

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валидация названия
    if (!formData.name.trim()) {
      newErrors.name = 'Название команды обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Название не должно превышать 100 символов';
    }

    // Валидация описания
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Описание не должно превышать 500 символов';
    }

    // Валидация максимального количества участников
    if (formData.maxMembers && (formData.maxMembers < 1 || formData.maxMembers > 50)) {
      newErrors.maxMembers = 'Количество участников должно быть от 1 до 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData: CreateTeamData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        maxMembers: formData.maxMembers,
        leaderId: formData.leaderId
      };
      
      await onSubmit(submitData);
      
      // Сброс формы после успешной отправки
      setFormData({
        name: '',
        description: '',
        maxMembers: 10,
        leaderId: undefined
      });
      setErrors({});
    } catch (error) {
      console.error('Ошибка создания команды:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очистка ошибки при изменении поля
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      maxMembers: 10,
      leaderId: undefined
    });
    setErrors({});
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Создать новую команду</h2>
        </div>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Название команды */}
        <div className="space-y-2">
          <Label htmlFor="team-name" className="text-sm font-medium">
            Название команды *
          </Label>
          <Input
            id="team-name"
            type="text"
            value={formData.name}
            onChange={(e) => { handleInputChange('name', e.target.value); }}
            placeholder="Введите название команды"
            className={errors.name ? 'border-destructive' : ''}
            disabled={isLoading || isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Описание */}
        <div className="space-y-2">
          <Label htmlFor="team-description" className="text-sm font-medium">
            Описание
          </Label>
          <Textarea
            id="team-description"
            value={formData.description || ''}
            onChange={(e) => { handleInputChange('description', e.target.value); }}
            placeholder="Краткое описание команды (необязательно)"
            rows={3}
            className={errors.description ? 'border-destructive' : ''}
            disabled={isLoading || isSubmitting}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.description?.length || 0}/500 символов
          </p>
        </div>

        {/* Максимальное количество участников */}
        <div className="space-y-2">
          <Label htmlFor="max-members" className="text-sm font-medium">
            Максимальное количество участников
          </Label>
          <Input
            id="max-members"
            type="number"
            min="1"
            max="50"
            value={formData.maxMembers || ''}
            onChange={(e) => { handleInputChange('maxMembers', parseInt(e.target.value) || 10); }}
            className={errors.maxMembers ? 'border-destructive' : ''}
            disabled={isLoading || isSubmitting}
          />
          {errors.maxMembers && (
            <p className="text-sm text-destructive">{errors.maxMembers}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Рекомендуется: 8-12 участников для эффективной работы
          </p>
        </div>

        {/* Выбор лидера */}
        {potentialLeaders.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="team-leader" className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Лидер команды
              </div>
            </Label>
            <select
              id="team-leader"
              value={formData.leaderId || ''}
              onChange={(e) => { 
                const value = e.target.value;
                handleInputChange('leaderId', value ? parseInt(value) : undefined);
              }}
              className="w-full p-2 rounded-md border bg-background text-foreground disabled:opacity-50"
              disabled={isLoading || isSubmitting}
            >
              <option value="">Выберите лидера (необязательно)</option>
              {potentialLeaders.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.surname} ({user.role})
                </option>
              ))}
            </select>
            {errors.leaderId && (
              <p className="text-sm text-destructive">{errors.leaderId}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Лидера можно назначить позже
            </p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || isSubmitting || !formData.name.trim()}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Создать команду
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading || isSubmitting}
          >
            Очистить
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              Отмена
            </Button>
          )}
        </div>
      </form>

      {/* Информационная панель */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-medium mb-2">💡 Советы по созданию команды:</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Выберите понятное и запоминающееся название</li>
          <li>• Опишите цели и задачи команды в описании</li>
          <li>• Оптимальный размер команды: 8-12 человек</li>
          <li>• Лидера можно назначить сразу или позже</li>
        </ul>
      </div>
    </Card>
  );
};

export default CreateTeamForm;