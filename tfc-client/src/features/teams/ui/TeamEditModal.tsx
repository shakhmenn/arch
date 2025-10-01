import React, { useState, useEffect } from 'react';
import { Team, UpdateTeamData } from '@shared/types/team';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import { Settings } from 'lucide-react';

interface TeamEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onSubmit: (teamId: number, data: UpdateTeamData) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  maxMembers: number;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  maxMembers?: string;
}

const TeamEditModal: React.FC<TeamEditModalProps> = ({
  open,
  onOpenChange,
  team,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    maxMembers: 5,
    isActive: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Заполнение формы данными команды при открытии модального окна
  useEffect(() => {
    if (team && open) {
      setFormData({
        name: team.name,
        description: team.description || '',
        maxMembers: team.maxMembers,
        isActive: team.isActive,
      });
      setErrors({});
    }
  }, [team, open]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валидация имени
    if (!formData.name.trim()) {
      newErrors.name = 'Название команды обязательно';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Название должно содержать минимум 3 символа';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Название не должно превышать 50 символов';
    }

    // Валидация описания
    if (formData.description.length > 200) {
      newErrors.description = 'Описание не должно превышать 200 символов';
    }

    // Валидация максимального количества участников
    const currentMembersCount = team?.members?.length || 0;
    if (formData.maxMembers < 2) {
      newErrors.maxMembers = 'Минимальное количество участников: 2';
    } else if (formData.maxMembers > 20) {
      newErrors.maxMembers = 'Максимальное количество участников: 20';
    } else if (formData.maxMembers < currentMembersCount) {
      newErrors.maxMembers = `Нельзя установить лимит меньше текущего количества участников (${currentMembersCount})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: UpdateTeamData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        maxMembers: formData.maxMembers,
        isActive: formData.isActive,
      };

      await onSubmit(team.id, submitData);
      onOpenChange(false);
    } catch (error) {
      console.error('Ошибка при обновлении команды:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очистка ошибки при изменении поля
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setErrors({});
      onOpenChange(false);
    }
  };

  if (!team) {
    return null;
  }

  const currentMembersCount = team.members?.length || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Редактировать команду
          </DialogTitle>
          <DialogDescription>
            Измените настройки команды "{team.name}". Текущее количество участников: {currentMembersCount}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-team-name">Название команды *</Label>
            <Input
              id="edit-team-name"
              type="text"
              placeholder="Введите название команды"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting || isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-team-description">Описание</Label>
            <Textarea
              id="edit-team-description"
              placeholder="Опишите цели и задачи команды (необязательно)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting || isLoading}
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formData.description.length}/200 символов</span>
              {errors.description && (
                <span className="text-red-500">{errors.description}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-max-members">Максимальное количество участников</Label>
            <Input
              id="edit-max-members"
              type="number"
              min={Math.max(2, currentMembersCount)}
              max={20}
              value={formData.maxMembers}
              onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value) || 2)}
              disabled={isSubmitting || isLoading}
              className={errors.maxMembers ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Минимум: {Math.max(2, currentMembersCount)} (текущее количество участников: {currentMembersCount})
            </p>
            {errors.maxMembers && (
              <p className="text-sm text-red-500">{errors.maxMembers}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="edit-is-active"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              disabled={isSubmitting || isLoading}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="edit-is-active" className="text-sm font-normal">
              Команда активна
            </Label>
          </div>
          {!formData.isActive && (
            <p className="text-xs text-amber-600">
              Неактивные команды не отображаются в общем списке и не могут принимать новых участников.
            </p>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="mt-2 sm:mt-0"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full sm:w-auto"
            >
              {isSubmitting || isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </DialogFooter>
        </form>


      </DialogContent>
    </Dialog>
  );
};

export default TeamEditModal;