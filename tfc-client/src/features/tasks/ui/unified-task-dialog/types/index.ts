import { TaskPriority, CreateTaskRequest, CreateSubtaskRequest } from '@/entities/task/model/types';
import type { TaskType } from '@/entities/task/model/types';

export type DialogMode = 'task' | 'subtask';

export interface UnifiedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  parentTaskId?: number;
  onSuccess?: () => void;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  type?: TaskType;
  assigneeId?: number;
  projectId?: number;
  teamId?: number;
  dueDate?: string;
  estimatedHours?: number;
}

export interface TaskFormConfig {
  mode: DialogMode;
  parentTaskId?: number;
  showTypeField: boolean;
  showProjectField: boolean;
  showTeamField: boolean;
  showAssigneeField: boolean;
  showDueDateField: boolean;
  showEstimatedHoursField: boolean;
}

export interface TaskMutationPayload {
  mode: DialogMode;
  data: TaskFormData;
  parentTaskId?: number;
}

export type CreateTaskPayload = CreateTaskRequest;
export type CreateSubtaskPayload = CreateSubtaskRequest;

// Component props types
export interface AssigneeSelectProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  teamId?: number;
  placeholder?: string;
  disabled?: boolean;
}

export interface DatePickerProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Team member type for AssigneeSelect
export interface TeamMember {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}