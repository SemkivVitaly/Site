import client from './client';

export interface Order {
  id: string;
  title: string;
  client: string;
  clientContacts: string;
  description?: string;
  referencePhotos: string[];
  printRun: number;
  deadline: string;
  budget?: number;
  status: string;
  priority: string;
  isImportant?: boolean;
  estimatedReadyDate?: string;
  completionPercentage?: number;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
  };
  tasks?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  title: string;
  client: string;
  clientContacts: string;
  description?: string;
  referencePhotos?: string[];
  printRun: number;
  deadline: string;
  budget?: number;
  priority?: string;
  isImportant?: boolean;
}

export interface UpdateOrderDto {
  title?: string;
  client?: string;
  clientContacts?: string;
  description?: string;
  referencePhotos?: string[];
  printRun?: number;
  deadline?: string;
  budget?: number;
  status?: string;
  priority?: string;
  isImportant?: boolean;
}

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const response = await client.get<Order[]>('/orders');
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await client.get<Order>(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await client.post<Order>('/orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOrderDto): Promise<Order> => {
    const response = await client.put<Order>(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/orders/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const response = await client.patch<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },
};

