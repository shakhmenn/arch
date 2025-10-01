// Основные перечисления
export enum TaskStatus {
  TODO = 'TODO',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum TaskActivityType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  COMMENTED = 'COMMENTED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  ATTACHMENT_REMOVED = 'ATTACHMENT_REMOVED',
  DEPENDENCY_ADDED = 'DEPENDENCY_ADDED',
  DEPENDENCY_REMOVED = 'DEPENDENCY_REMOVED',
  SUBTASK_ADDED = 'SUBTASK_ADDED',
  SUBTASK_REMOVED = 'SUBTASK_REMOVED'
}

export type TaskType = 'PERSONAL' | 'TEAM';

// Дополнительные интерфейсы
export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  lastActiveAt?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  tableView: {
    columnsOrder: string[];
    hiddenColumns: string[];
    pageSize: number;
  };
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  color: string;
  teamId?: number;
  team?: Team;
  ownerId: number;
  owner: User;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  tasksCount: number;
  completedTasksCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  owner: User;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: number;
  userId: number;
  user: User;
  teamId: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface TaskAttachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  url: string;
  taskId: number;
  uploadedById: number;
  uploadedBy: User;
}

export interface TaskActivity {
  id: number;
  action: string;
  description: string;
  userId: number;
  user: User;
  taskId: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TaskDependency {
  id: number;
  dependentTaskId: number;
  blockingTaskId: number;
  blockingTask: Task;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;
  assignee?: User;
  creatorId: number;
  creator: User;
  projectId?: number;
  project?: Project;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  attachments: TaskAttachment[];
  activities: TaskActivity[];
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  subtasks?: Task[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number; // 0-100
  type: TaskType;
  teamId?: number | null;
  team?: Team;
  parentTaskId?: number | null;
  parentTask?: Task;
  _count?: {
    subtasks: number;
    dependencies: number;
    dependents: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetails extends Task {
  activity: TaskActivity[];
}

// API Request/Response интерфейсы
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  type: TaskType;
  assigneeId?: number;
  projectId?: number;
  teamId?: number;
  parentTaskId?: number;
  dueDate?: string;
  tags?: string[];
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  projectId?: number;
  dueDate?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  assigneeId?: number[];
  creatorId?: number[];
  projectId?: number[];
  teamId?: number[];
  parentTaskId?: number[];
  hasSubtasks?: boolean;
  hasDependencies?: boolean;
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  search?: string;
}

export interface TaskSortOptions {
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface GetTasksRequest {
  page?: number;
  limit?: number;
  filters?: TaskFilters;
  sort?: TaskSortOptions;
}

export interface GetTasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BulkUpdateTasksRequest {
  taskIds: number[];
  updates: Partial<UpdateTaskRequest>;
}

// Dependency management interfaces
export interface CreateTaskDependencyRequest {
  dependentTaskId: number;
  blockingTaskId: number;
}

export interface TaskDependencyResponse {
  id: number;
  dependentTaskId: number;
  blockingTaskId: number;
  blockingTask: {
    id: number;
    title: string;
    status: TaskStatus;
  };
  createdAt: string;
}

// Subtask management interfaces
export interface CreateSubtaskRequest {
  parentTaskId: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeId?: number;
  dueDate?: string;
  estimatedHours?: number;
}

export interface SubtaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

// Task hierarchy interfaces
export interface TaskHierarchy {
  task: Task;
  subtasks: TaskHierarchy[];
  level: number;
}

// Advanced filtering
export interface TaskSearchRequest {
  query?: string;
  filters?: TaskFilters;
  sort?: TaskSortOptions;
  includeSubtasks?: boolean;
  includeDependencies?: boolean;
  page?: number;
  limit?: number;
}

// WebSocket Events
export interface TaskUpdatedEvent {
  type: 'TASK_UPDATED';
  payload: {
    taskId: number;
    changes: Partial<Task>;
    updatedBy: {
      id: number;
      name: string;
    };
    timestamp: string;
  };
}

export interface TaskCreatedEvent {
  type: 'TASK_CREATED';
  payload: {
    task: Task;
    createdBy: {
      id: number;
      name: string;
    };
    timestamp: string;
  };
}

export interface TaskDeletedEvent {
  type: 'TASK_DELETED';
  payload: {
    taskId: number;
    deletedBy: {
      id: number;
      name: string;
    };
    timestamp: string;
  };
}

export type TaskEvent = TaskUpdatedEvent | TaskCreatedEvent | TaskDeletedEvent;

// Legacy support (deprecated)
export interface CreatePersonalTaskPayload {
  title: string;
  description?: string | null;
  type: 'PERSONAL';
  dueDate?: string;
  assigneeId?: number;
  priority?: TaskPriority;
  tags?: string[];
}

export interface CreateTeamTaskPayload {
  title: string;
  description?: string | null;
  type: 'TEAM';
  teamId: number;
  priority?: TaskPriority;
  tags?: string[];
}

export type CreateTaskPayload = CreatePersonalTaskPayload | CreateTeamTaskPayload;

export interface ChangeTaskStatusPayload {
  status: TaskStatus;
}
