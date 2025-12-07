import client from './client';

export interface Shift {
  id: string;
  userId: string;
  date: string;
  plannedStart?: string;
  timeIn?: string;
  timeOut?: string;
  lunchStart?: string;
  lunchEnd?: string;
  isLate: boolean;
  lunchOvertime?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProcessQRScanDto {
  qrHash: string;
}

export interface CreateShiftDto {
  userId: string;
  date: string;
  plannedStart?: string;
}

export const shiftsApi = {
  processQRScan: async (data: ProcessQRScanDto): Promise<Shift> => {
    const response = await client.post<Shift>('/shifts/scan', data);
    return response.data;
  },

  getCurrentShift: async (): Promise<Shift | null> => {
    const response = await client.get<Shift>('/shifts/current');
    return response.data;
  },

  getShifts: async (filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Shift[]> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await client.get<Shift[]>(`/shifts?${params.toString()}`);
    return response.data;
  },

  getShiftById: async (id: string): Promise<Shift> => {
    const response = await client.get<Shift>(`/shifts/${id}`);
    return response.data;
  },

  createShift: async (data: CreateShiftDto): Promise<Shift> => {
    const response = await client.post<Shift>('/shifts', data);
    return response.data;
  },

  getShiftCalendar: async (startDate: string, endDate: string): Promise<Record<string, Shift[]>> => {
    const response = await client.get<Record<string, Shift[]>>(
      `/shifts/calendar?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },

  processLunch: async (action: 'start' | 'end'): Promise<Shift> => {
    const response = await client.post<Shift>('/shifts/lunch', { action });
    return response.data;
  },

  markNoLunch: async (): Promise<Shift> => {
    const response = await client.post<Shift>('/shifts/no-lunch');
    return response.data;
  },

  deleteShift: async (id: string): Promise<void> => {
    await client.delete(`/shifts/${id}`);
  },
};

