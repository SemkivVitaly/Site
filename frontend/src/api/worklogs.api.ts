import client from './client';

export interface WorkLogPause {
  id: string;
  workLogId: string;
  pauseStart: string;
  pauseEnd?: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  quantityProduced: number;
  defectQuantity: number;
  task?: any;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  pauses?: WorkLogPause[];
  createdAt: string;
}

export interface StartWorkLogDto {
  taskId: string;
}

export interface EndWorkLogDto {
  workLogId: string;
  quantityProduced: number;
  defectQuantity: number;
}

export const worklogsApi = {
  startWorkLog: async (data: StartWorkLogDto): Promise<WorkLog> => {
    const response = await client.post<WorkLog>('/worklogs/start', data);
    return response.data;
  },

  endWorkLog: async (data: EndWorkLogDto): Promise<WorkLog> => {
    const response = await client.post<WorkLog>('/worklogs/end', data);
    return response.data;
  },

  getActiveWorkLog: async (): Promise<WorkLog | null> => {
    const response = await client.get<WorkLog>('/worklogs/active');
    return response.data;
  },

  getWorkLogsByTask: async (taskId: string): Promise<WorkLog[]> => {
    const response = await client.get<WorkLog[]>(`/worklogs/task/${taskId}`);
    return response.data;
  },

  getWorkLogsByUserAndDate: async (userId: string, startDate: string, endDate: string): Promise<WorkLog[]> => {
    const response = await client.get<WorkLog[]>(
      `/worklogs/user/${userId}?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },

  startPause: async (workLogId: string): Promise<WorkLogPause> => {
    const response = await client.post<WorkLogPause>('/worklogs/pause/start', { workLogId });
    return response.data;
  },

  endPause: async (pauseId: string): Promise<WorkLogPause> => {
    const response = await client.post<WorkLogPause>('/worklogs/pause/end', { pauseId });
    return response.data;
  },
};

