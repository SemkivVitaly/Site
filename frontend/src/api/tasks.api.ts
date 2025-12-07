import client from './client';
import { ProductionTask } from './production.api';

export type { ProductionTask };

export interface AssignTaskDto {
  taskId: string;
  userId?: string;
  priority?: string;
}

export interface UpdateTaskDto {
  status?: string;
  priority?: string;
  assignedUserId?: string | null;
}

export const tasksApi = {
  getAll: async (filters?: {
    status?: string;
    assignedUserId?: string | null;
    machineId?: string;
    completedOnly?: string;
  }): Promise<ProductionTask[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignedUserId !== undefined) {
      params.append('assignedUserId', filters.assignedUserId || 'null');
    }
    if (filters?.machineId) params.append('machineId', filters.machineId);
    if (filters?.completedOnly) params.append('completedOnly', filters.completedOnly);

    const response = await client.get<ProductionTask[]>(
      `/tasks?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<ProductionTask> => {
    const response = await client.get<ProductionTask>(`/tasks/${id}`);
    return response.data;
  },

  assignTask: async (data: AssignTaskDto): Promise<ProductionTask> => {
    const response = await client.post<ProductionTask>('/tasks/assign', data);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskDto): Promise<ProductionTask> => {
    const response = await client.put<ProductionTask>(`/tasks/${id}`, data);
    return response.data;
  },

  getAvailableTasks: async (): Promise<ProductionTask[]> => {
    const response = await client.get<ProductionTask[]>('/tasks/available');
    return response.data;
  },
};

