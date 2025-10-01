import { Control, Controller } from 'react-hook-form';
import { TaskFormData, TaskFormConfig } from '../types';
import { PrioritySelect } from './PrioritySelect';
import { AssigneeSelect } from './AssigneeSelect';
import { DatePicker } from './DatePicker';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

interface TaskFormFieldsProps {
  control: Control<TaskFormData>;
  config: TaskFormConfig;
  isLoading?: boolean;
}

export const TaskFormFields = ({ control, config, isLoading }: TaskFormFieldsProps) => {
  return (
    <div className="space-y-4">
      {/* Название задачи */}
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Название *</FormLabel>
            <FormControl>
              <Input
                placeholder="Введите название задачи"
                disabled={isLoading}
                {...field}
              />
            </FormControl>
            {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
          </FormItem>
        )}
      />

      {/* Описание */}
      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Описание</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Введите описание задачи"
                disabled={isLoading}
                rows={3}
                {...field}
              />
            </FormControl>
            {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
          </FormItem>
        )}
      />

      {/* Приоритет */}
      <Controller
        control={control}
        name="priority"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Приоритет *</FormLabel>
            <FormControl>
              <PrioritySelect
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              />
            </FormControl>
            {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
          </FormItem>
        )}
      />

      {/* Тип задачи (только для задач) */}
      {config.showTypeField && (
        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Тип задачи *</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип задачи" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Личная</SelectItem>
                    <SelectItem value="TEAM">Командная</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
            </FormItem>
          )}
        />
      )}

      {/* Исполнитель (только для подзадач) */}
      {config.showAssigneeField && (
        <Controller
          control={control}
          name="assigneeId"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Исполнитель</FormLabel>
              <FormControl>
                <AssigneeSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  teamId={1} // TODO: Get from context or props
                  disabled={isLoading}
                />
              </FormControl>
              {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
            </FormItem>
          )}
        />
      )}

      {/* Срок выполнения */}
      {config.showDueDateField && (
        <Controller
          control={control}
          name="dueDate"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Срок выполнения</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
            </FormItem>
          )}
        />
      )}

      {/* Оценка времени */}
      {config.showEstimatedHoursField && (
        <Controller
          control={control}
          name="estimatedHours"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Оценка времени (часы)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
            </FormItem>
          )}
        />
      )}
    </div>
  );
};