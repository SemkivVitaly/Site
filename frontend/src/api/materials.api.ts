import client from './client';

export interface Material {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialDto {
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

export interface UpdateMaterialDto {
  name?: string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
}

export interface AssignMaterialToTaskDto {
  taskId: string;
  materialId: string;
  quantity: number;
}

export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    const response = await client.get<Material[]>('/materials');
    return response.data;
  },

  getById: async (id: string): Promise<Material> => {
    const response = await client.get<Material>(`/materials/${id}`);
    return response.data;
  },

  create: async (data: CreateMaterialDto): Promise<Material> => {
    const response = await client.post<Material>('/materials', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMaterialDto): Promise<Material> => {
    const response = await client.put<Material>(`/materials/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/materials/${id}`);
  },

  assignMaterialToTask: async (data: AssignMaterialToTaskDto): Promise<any> => {
    const response = await client.post('/materials/assign', data);
    return response.data;
  },

  getLowStockMaterials: async (): Promise<Material[]> => {
    const response = await client.get<Material[]>('/materials/low-stock');
    return response.data;
  },
};

