import client from './client';

export interface ProductionTask {
  id: string;
  orderId: string;
  machineId: string;
  assignedUserId?: string;
  status: string;
  operation: string;
  totalQuantity: number;
  completedQuantity: number;
  defectQuantity: number;
  priority: string;
  sequence: number;
  machine: {
    id: string;
    name: string;
    status: string;
    efficiencyNorm: number;
    capabilities: string[];
  };
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  order?: {
    id: string;
    title: string;
    deadline?: string;
    priority?: string;
  };
  workLogs?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  orderId: string;
  machineId: string;
  operation: string;
  totalQuantity: number;
  priority?: string;
  sequence: number;
  assignedUserId?: string;
}

export interface CreateTechCardDto {
  orderId: string;
  tasks: Omit<CreateTaskDto, 'orderId'>[];
}

export const productionApi = {
  createTechCard: async (data: CreateTechCardDto): Promise<ProductionTask[]> => {
    const response = await client.post<ProductionTask[]>('/production/tech-cards', data);
    return response.data;
  },

  getTechCardByOrderId: async (orderId: string): Promise<ProductionTask[]> => {
    const response = await client.get<ProductionTask[]>(`/production/tech-cards/${orderId}`);
    return response.data;
  },

  addTask: async (data: CreateTaskDto): Promise<ProductionTask> => {
    const response = await client.post<ProductionTask>('/production/tasks', data);
    return response.data;
  },

  updateSequence: async (orderId: string, taskIds: string[]): Promise<ProductionTask[]> => {
    const response = await client.put<ProductionTask[]>(`/production/tech-cards/${orderId}/sequence`, { taskIds });
    return response.data;
  },

  updateTask: async (id: string, data: Partial<Omit<CreateTaskDto, 'orderId' | 'sequence'>>): Promise<ProductionTask> => {
    const response = await client.put<ProductionTask>(`/production/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await client.delete(`/production/tasks/${id}`);
  },
};

