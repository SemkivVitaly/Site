import client from './client';
import { IncidentType } from '../types';

export interface Incident {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string;
  machineId?: string;
  taskId?: string;
  createdById: string;
  resolvedById?: string;
  resolvedAt?: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  resolver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  machine?: {
    id: string;
    name: string;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentDto {
  type: IncidentType;
  title: string;
  description?: string;
  machineId?: string;
  taskId?: string;
}

export const incidentsApi = {
  createIncident: async (data: CreateIncidentDto): Promise<Incident> => {
    const response = await client.post<Incident>('/incidents', data);
    return response.data;
  },

  getIncidents: async (filters?: {
    status?: string;
    type?: string;
    machineId?: string;
  }): Promise<Incident[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.machineId) params.append('machineId', filters.machineId);

    const response = await client.get<Incident[]>(`/incidents?${params.toString()}`);
    return response.data;
  },

  getIncidentById: async (id: string): Promise<Incident> => {
    const response = await client.get<Incident>(`/incidents/${id}`);
    return response.data;
  },

  assignIncident: async (id: string): Promise<Incident> => {
    const response = await client.post<Incident>(`/incidents/${id}/assign`);
    return response.data;
  },

  resolveIncident: async (id: string): Promise<Incident> => {
    const response = await client.post<Incident>(`/incidents/${id}/resolve`);
    return response.data;
  },

  deleteIncident: async (id: string): Promise<void> => {
    await client.delete(`/incidents/${id}`);
  },
};

