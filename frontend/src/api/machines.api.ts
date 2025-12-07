import client from './client';

export interface Machine {
  id: string;
  name: string;
  photoUrl?: string;
  status: string;
  efficiencyNorm: number;
  quantity: number;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineDto {
  name: string;
  photoUrl?: string;
  status?: string;
  efficiencyNorm: number;
  quantity?: number;
  capabilities: string[];
}

export interface UpdateMachineDto {
  name?: string;
  photoUrl?: string;
  status?: string;
  efficiencyNorm?: number;
  quantity?: number;
  capabilities?: string[];
}

export const machinesApi = {
  getAll: async (): Promise<Machine[]> => {
    const response = await client.get<Machine[]>('/machines');
    return response.data;
  },

  getById: async (id: string): Promise<Machine> => {
    const response = await client.get<Machine>(`/machines/${id}`);
    return response.data;
  },

  create: async (data: CreateMachineDto): Promise<Machine> => {
    const response = await client.post<Machine>('/machines', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMachineDto): Promise<Machine> => {
    const response = await client.put<Machine>(`/machines/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/machines/${id}`);
  },

  getHistory: async (id: string): Promise<any[]> => {
    const response = await client.get(`/machines/${id}/history`);
    return response.data;
  },

  uploadPhoto: async (id: string, file: File): Promise<Machine> => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await client.post<Machine>(`/machines/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePhoto: async (id: string): Promise<Machine> => {
    const response = await client.delete<Machine>(`/machines/${id}/photo`);
    return response.data;
  },
};

