import client from './client';

export interface EmployeeEfficiency {
  userId: string;
  totalActual: number;
  totalExpected: number;
  efficiency: number;
  workLogsCount: number;
}

export interface TaskContribution {
  taskId: string;
  taskName: string;
  totalQuantity: number;
  completedQuantity: number;
  contributions: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    quantityProduced: number;
    defectQuantity: number;
    durationHours: number;
    expected: number;
    efficiency: number;
    startTime: string;
    endTime: string;
  }>;
}

export const analyticsApi = {
  getEmployeeEfficiency: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<EmployeeEfficiency> => {
    const response = await client.get<EmployeeEfficiency>(
      `/analytics/employee/${userId}?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },

  getTaskContribution: async (taskId: string): Promise<TaskContribution> => {
    const response = await client.get<TaskContribution>(`/analytics/task/${taskId}/contribution`);
    return response.data;
  },

  getEmployeesEfficiency: async (
    startDate: string,
    endDate: string
  ): Promise<EmployeeEfficiency[]> => {
    const response = await client.get<EmployeeEfficiency[]>(
      `/analytics/employees?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },

  getProductionWorkload: async (): Promise<ProductionWorkload> => {
    const response = await client.get<ProductionWorkload>('/analytics/production/workload');
    return response.data;
  },

  getProductionStatistics: async (
    startDate?: string,
    endDate?: string
  ): Promise<ProductionStatistics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await client.get<ProductionStatistics>(
      `/analytics/production/statistics?${params.toString()}`
    );
    return response.data;
  },
};

export interface ProductionWorkload {
  machines: Array<{
    machineId: string;
    machineName: string;
    machineStatus: string;
    efficiencyNorm: number;
    quantity: number;
    totalEfficiencyNorm: number;
    availableWorkersCount: number;
    totalRemainingQuantity: number;
    estimatedHours: number;
    estimatedHoursWithWorkers: number;
    estimatedHoursWithMachines: number;
    estimatedHoursWithMachinesAndWorkers: number;
    tasks: Array<{
      taskId: string;
      orderId: string;
      orderTitle: string;
      operation: string;
      remainingQuantity: number;
      deadline: string;
      priority: string;
      estimatedHours: number;
      estimatedHoursWithWorkers: number;
      estimatedHoursWithMachines: number;
      estimatedHoursWithMachinesAndWorkers: number;
    }>;
  }>;
  summary: {
    totalMachines: number;
    totalMachinesCount: number;
    activeMachines: number;
    machinesWithIssues: number;
    availableWorkersCount: number;
    totalRemainingQuantity: number;
    totalEstimatedHours: number;
    totalEstimatedHoursWithWorkers: number;
    totalEstimatedHoursWithMachines: number;
    totalEstimatedHoursWithMachinesAndWorkers: number;
    averageHoursPerMachine: number;
    averageHoursPerMachineWithWorkers: number;
    averageHoursPerMachineWithMachinesAndWorkers: number;
  };
}

export interface ProductionStatistics {
  period: {
    startDate: string;
    endDate: string;
  };
  overall: {
    totalActualQuantity: number;
    totalExpectedQuantity: number;
    totalDefects: number;
    totalHours: number;
    efficiency: number;
    defectRate: number;
  };
  daily: Array<{
    date: string;
    actualQuantity: number;
    expectedQuantity: number;
    defects: number;
    hours: number;
    efficiency: number;
    defectRate: number;
  }>;
  byMachine: Array<{
    machineId: string;
    machineName: string;
    actualQuantity: number;
    expectedQuantity: number;
    defects: number;
    hours: number;
    efficiency: number;
    defectRate: number;
  }>;
}

