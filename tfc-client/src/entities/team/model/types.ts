import type { User } from '@entities/user/model/types';
import type { Task } from '@entities/task/model/types';

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  maxMembers: number;
  isActive: boolean;
  updatedAt: string;
  leaderId?: number;
  leader?: User;
  members?: User[];
}

export interface TeamWithMembers extends Team {
  maxMembers: number;
  isActive: boolean;
  updatedAt: string;
  leaderId?: number;
  leader?: User;
  members?: User[]; // optional to be resilient to backend variations
  users?: User[];   // backend may return `users` instead of `members`
  tasks?: Task[];   // tasks returned by backend for the team
}

export interface CreateTeamPayload {
  name: string;
  description?: string | null;
}

export interface AssignUserToTeamPayload {
  userId: number;
}
