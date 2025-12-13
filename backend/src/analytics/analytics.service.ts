import prisma from '../config/database';

export class AnalyticsService {
  async calculateEmployeeEfficiency(userId: string, startDate: Date, endDate: Date) {
    const workLogs = await prisma.workLog.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        endTime: {
          not: null,
        },
      },
      include: {
        task: {
          include: {
            machine: {
              select: {
                efficiencyNorm: true,
              },
            },
          },
        },
        pauses: true,
      },
    });

    let totalActual = 0;
    let totalExpected = 0;

    workLogs.forEach((log) => {
      if (log.endTime) {
        const totalDurationMs = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
        
        // Вычитаем время всех пауз
        let pauseTimeMs = 0;
        if (log.pauses) {
          log.pauses.forEach((pause) => {
            if (pause.pauseEnd) {
              pauseTimeMs += new Date(pause.pauseEnd).getTime() - new Date(pause.pauseStart).getTime();
            }
          });
        }
        
        const workDurationMs = totalDurationMs - pauseTimeMs;
        let durationHours = workDurationMs / (1000 * 60 * 60);

        // Ограничиваем время работы максимум 8 часами (стандартная смена)
        // Все, что больше 8 часов, считается переработкой и не учитывается в расчете КПД
        const STANDARD_WORK_HOURS = 8;
        if (durationHours > STANDARD_WORK_HOURS) {
          durationHours = STANDARD_WORK_HOURS;
        }

        const actual = log.quantityProduced;
        const expected = log.task.machine.efficiencyNorm * durationHours;

        totalActual += actual;
        totalExpected += expected;
      }
    });

    const efficiency = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

    return {
      userId,
      totalActual,
      totalExpected,
      efficiency: Math.round(efficiency * 100) / 100,
      workLogsCount: workLogs.length,
    };
  }

  async getTaskContribution(taskId: string) {
    const workLogs = await prisma.workLog.findMany({
      where: {
        taskId,
        endTime: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        pauses: true,
      },
    });

    const task = await prisma.productionTask.findUnique({
      where: { id: taskId },
      include: {
        machine: {
          select: {
            efficiencyNorm: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const contributions = workLogs.map((log) => {
      if (!log.endTime) return null;

      const totalDurationMs = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
      
      // Вычитаем время всех пауз
      let pauseTimeMs = 0;
      if (log.pauses) {
        log.pauses.forEach((pause) => {
          if (pause.pauseEnd) {
            pauseTimeMs += new Date(pause.pauseEnd).getTime() - new Date(pause.pauseStart).getTime();
          }
        });
      }
      
      const workDurationMs = totalDurationMs - pauseTimeMs;
      let durationHours = workDurationMs / (1000 * 60 * 60);

      // Ограничиваем время работы максимум 8 часами (стандартная смена)
      // Все, что больше 8 часов, считается переработкой и не учитывается в расчете КПД
      const STANDARD_WORK_HOURS = 8;
      if (durationHours > STANDARD_WORK_HOURS) {
        durationHours = STANDARD_WORK_HOURS;
      }

      const actual = log.quantityProduced;
      const expected = task.machine.efficiencyNorm * durationHours;
      const efficiency = expected > 0 ? (actual / expected) * 100 : 0;

      return {
        user: log.user,
        quantityProduced: actual,
        defectQuantity: log.defectQuantity,
        durationHours: Math.round(durationHours * 100) / 100,
        expected,
        efficiency: Math.round(efficiency * 100) / 100,
        startTime: log.startTime,
        endTime: log.endTime,
      };
    }).filter((c) => c !== null);

    return {
      taskId,
      taskName: task.operation,
      totalQuantity: task.totalQuantity,
      completedQuantity: task.completedQuantity,
      contributions,
    };
  }

  async getEmployeesEfficiency(startDate: Date, endDate: Date) {
    const users = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
      },
    });

    const efficiencies = await Promise.all(
      users.map((user) =>
        this.calculateEmployeeEfficiency(user.id, startDate, endDate)
      )
    );

    return efficiencies.sort((a, b) => b.efficiency - a.efficiency);
  }

  /**
   * Рассчитывает нагрузку на производство с учетом всех активных задач и производительности станков
   */
  async getProductionWorkload() {
    // Получаем все активные задачи (не завершенные)
    const activeTasks = await prisma.productionTask.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
            efficiencyNorm: true,
            quantity: true,
          },
        },
        order: {
          select: {
            id: true,
            title: true,
            deadline: true,
            priority: true,
          },
        },
      },
    });

    // Получаем уникальные ID станков из активных задач
    const machineIds = [...new Set(activeTasks.map(t => t.machineId))];

    // Для каждого станка находим сотрудников, которые работали на нем, и рассчитываем средний КПД
    const machineEfficiencyMap: Record<string, number> = {};
    const machineWorkersCountMap: Record<string, number> = {};
    
    for (const machineId of machineIds) {
      // Находим все завершенные WorkLog для этого станка за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const workLogs = await prisma.workLog.findMany({
        where: {
          task: {
            machineId: machineId,
          },
          startTime: {
            gte: thirtyDaysAgo,
          },
          endTime: {
            not: null,
          },
        },
        include: {
          task: {
            include: {
              machine: {
                select: {
                  efficiencyNorm: true,
                },
              },
            },
          },
          pauses: true,
        },
        distinct: ['userId'],
      });

      if (workLogs.length === 0) {
        // Если никто не работал на станке, используем базовую производительность
        machineEfficiencyMap[machineId] = 1.0;
        continue;
      }

      // Получаем уникальных пользователей
      const uniqueUserIds = [...new Set(workLogs.map(wl => wl.userId))];
      
      // Рассчитываем КПД для каждого пользователя на этом станке
      const userEfficiencies: number[] = [];
      
      for (const userId of uniqueUserIds) {
        const userWorkLogs = await prisma.workLog.findMany({
          where: {
            userId: userId,
            task: {
              machineId: machineId,
            },
            startTime: {
              gte: thirtyDaysAgo,
            },
            endTime: {
              not: null,
            },
          },
          include: {
            task: {
              include: {
                machine: {
                  select: {
                    efficiencyNorm: true,
                  },
                },
              },
            },
            pauses: true,
          },
        });

        let totalActual = 0;
        let totalExpected = 0;

        userWorkLogs.forEach((log) => {
          if (log.endTime) {
            const totalDurationMs = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
            
            // Вычитаем время всех пауз
            let pauseTimeMs = 0;
            if (log.pauses) {
              log.pauses.forEach((pause) => {
                if (pause.pauseEnd) {
                  pauseTimeMs += new Date(pause.pauseEnd).getTime() - new Date(pause.pauseStart).getTime();
                }
              });
            }
            
            const workDurationMs = totalDurationMs - pauseTimeMs;
            let durationHours = workDurationMs / (1000 * 60 * 60);

            // Ограничиваем время работы максимум 8 часами (стандартная смена)
            // Все, что больше 8 часов, считается переработкой и не учитывается в расчете КПД
            const STANDARD_WORK_HOURS = 8;
            if (durationHours > STANDARD_WORK_HOURS) {
              durationHours = STANDARD_WORK_HOURS;
            }

            const actual = log.quantityProduced;
            const expected = log.task.machine.efficiencyNorm * durationHours;

            totalActual += actual;
            totalExpected += expected;
          }
        });

        if (totalExpected > 0) {
          const efficiency = (totalActual / totalExpected) * 100;
          userEfficiencies.push(efficiency);
        }
      }

      // Рассчитываем средний КПД
      if (userEfficiencies.length > 0) {
        const avgEfficiency = userEfficiencies.reduce((sum, eff) => sum + eff, 0) / userEfficiencies.length;
        machineEfficiencyMap[machineId] = avgEfficiency / 100; // Преобразуем в коэффициент (0.8 = 80%)
      } else {
        machineEfficiencyMap[machineId] = 1.0; // Если не удалось рассчитать, используем 100%
      }

      // Сохраняем количество работников для этого станка
      machineWorkersCountMap[machineId] = uniqueUserIds.length || 1;
    }

    // Группируем задачи по станкам
    const machineWorkload: Record<string, {
      machineId: string;
      machineName: string;
      machineStatus: string;
      efficiencyNorm: number;
      quantity: number; // Количество станков данного типа
      totalEfficiencyNorm: number; // Общая производительность (efficiencyNorm * quantity)
      availableWorkersCount: number; // Количество людей, которые могут работать на станке
      totalRemainingQuantity: number;
      estimatedHours: number;
      estimatedHoursWithWorkers: number; // Время с учетом количества работников
      estimatedHoursWithMachines: number; // Время с учетом количества станков
      estimatedHoursWithMachinesAndWorkers: number; // Время с учетом количества станков и работников
      tasks: Array<{
        taskId: string;
        orderId: string;
        orderTitle: string;
        operation: string;
        remainingQuantity: number;
        deadline: Date;
        priority: string;
        estimatedHours: number;
        estimatedHoursWithWorkers: number;
        estimatedHoursWithMachines: number;
        estimatedHoursWithMachinesAndWorkers: number;
      }>;
    }> = {};

    activeTasks.forEach((task) => {
      const remainingQuantity = task.totalQuantity - task.completedQuantity;
      
      if (remainingQuantity <= 0 || task.machine.status === 'REPAIR') {
        return; // Пропускаем выполненные задачи и задачи на сломанных станках
      }

      const machineQuantity = task.machine.quantity || 1;
      const totalEfficiencyNorm = task.machine.efficiencyNorm * machineQuantity;

      // Рассчитываем оценочное время в часах для оставшегося количества
      // Время для одного станка (базовая производительность)
      const estimatedHours = task.machine.efficiencyNorm > 0 
        ? remainingQuantity / task.machine.efficiencyNorm 
        : 0;

      // Время с учетом количества станков (если станков несколько, общая производительность выше)
      const estimatedHoursWithMachines = totalEfficiencyNorm > 0
        ? remainingQuantity / totalEfficiencyNorm
        : estimatedHours;

      // Получаем средний КПД для этого станка
      const avgEfficiency = machineEfficiencyMap[task.machineId] || 1.0;
      
      // Время с учетом среднего КПД сотрудников, работавших на станке
      // Учитываем, что средний КПД влияет на фактическую производительность
      const adjustedEfficiencyNorm = task.machine.efficiencyNorm * avgEfficiency;
      const adjustedTotalEfficiencyNorm = adjustedEfficiencyNorm * machineQuantity;
      
      // Время с учетом среднего КПД (без учета количества работников)
      const estimatedHoursWithWorkers = adjustedEfficiencyNorm > 0
        ? remainingQuantity / adjustedEfficiencyNorm
        : estimatedHours;

      // Время с учетом и количества станков, и среднего КПД
      const estimatedHoursWithMachinesAndWorkers = adjustedTotalEfficiencyNorm > 0
        ? remainingQuantity / adjustedTotalEfficiencyNorm
        : estimatedHoursWithMachines;

      // Получаем количество уникальных сотрудников, работавших на этом станке (из предварительно рассчитанной карты)
      const availableWorkersCount = machineWorkersCountMap[task.machineId] || 1;

      if (!machineWorkload[task.machineId]) {
        machineWorkload[task.machineId] = {
          machineId: task.machine.id,
          machineName: task.machine.name,
          machineStatus: task.machine.status,
          efficiencyNorm: task.machine.efficiencyNorm,
          quantity: machineQuantity,
          totalEfficiencyNorm: totalEfficiencyNorm,
          availableWorkersCount: availableWorkersCount,
          totalRemainingQuantity: 0,
          estimatedHours: 0,
          estimatedHoursWithWorkers: 0,
          estimatedHoursWithMachines: 0,
          estimatedHoursWithMachinesAndWorkers: 0,
          tasks: [],
        };
      }

      machineWorkload[task.machineId].totalRemainingQuantity += remainingQuantity;
      machineWorkload[task.machineId].estimatedHours += estimatedHours;
      machineWorkload[task.machineId].estimatedHoursWithWorkers += estimatedHoursWithWorkers;
      machineWorkload[task.machineId].estimatedHoursWithMachines += estimatedHoursWithMachines;
      machineWorkload[task.machineId].estimatedHoursWithMachinesAndWorkers += estimatedHoursWithMachinesAndWorkers;

      machineWorkload[task.machineId].tasks.push({
        taskId: task.id,
        orderId: task.orderId,
        orderTitle: task.order.title,
        operation: task.operation,
        remainingQuantity,
        deadline: task.order.deadline,
        priority: task.order.priority,
        estimatedHours,
        estimatedHoursWithWorkers,
        estimatedHoursWithMachines,
        estimatedHoursWithMachinesAndWorkers,
      });
    });

    // Преобразуем в массив и сортируем по приоритету и дедлайну
    const workload = Object.values(machineWorkload).map((machine) => ({
      ...machine,
      tasks: machine.tasks.sort((a, b) => {
        // Сначала по приоритету
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                           priorityOrder[b.priority as keyof typeof priorityOrder];
        if (priorityDiff !== 0) return priorityDiff;
        // Затем по дедлайну
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }),
    }));

    // Общая статистика
    const totalRemainingQuantity = workload.reduce((sum, m) => sum + m.totalRemainingQuantity, 0);
    const totalEstimatedHours = workload.reduce((sum, m) => sum + m.estimatedHours, 0);
    const totalEstimatedHoursWithWorkers = workload.reduce((sum, m) => sum + m.estimatedHoursWithWorkers, 0);
    const totalEstimatedHoursWithMachines = workload.reduce((sum, m) => sum + m.estimatedHoursWithMachines, 0);
    const totalEstimatedHoursWithMachinesAndWorkers = workload.reduce((sum, m) => sum + m.estimatedHoursWithMachinesAndWorkers, 0);
    const activeMachinesCount = workload.filter((m) => m.machineStatus === 'WORKING').length;
    const machinesWithIssuesCount = workload.filter((m) => 
      m.machineStatus === 'REPAIR' || m.machineStatus === 'REQUIRES_ATTENTION'
    ).length;
    const totalMachinesCount = workload.reduce((sum, m) => sum + m.quantity, 0); // Общее количество всех станков
    const totalAvailableWorkers = workload.reduce((sum, m) => sum + m.availableWorkersCount, 0);
    const avgAvailableWorkers = workload.length > 0 ? totalAvailableWorkers / workload.length : 0;

    return {
      machines: workload,
      summary: {
        totalMachines: workload.length, // Количество типов станков
        totalMachinesCount, // Общее количество всех станков (с учетом quantity)
        activeMachines: activeMachinesCount,
        machinesWithIssues: machinesWithIssuesCount,
        availableWorkersCount: Math.round(avgAvailableWorkers * 10) / 10, // Среднее количество работников на станок
        totalRemainingQuantity,
        totalEstimatedHours: Math.round(totalEstimatedHours * 100) / 100,
        totalEstimatedHoursWithWorkers: Math.round(totalEstimatedHoursWithWorkers * 100) / 100,
        totalEstimatedHoursWithMachines: Math.round(totalEstimatedHoursWithMachines * 100) / 100,
        totalEstimatedHoursWithMachinesAndWorkers: Math.round(totalEstimatedHoursWithMachinesAndWorkers * 100) / 100,
        averageHoursPerMachine: workload.length > 0 
          ? Math.round((totalEstimatedHours / workload.length) * 100) / 100 
          : 0,
        averageHoursPerMachineWithWorkers: workload.length > 0 
          ? Math.round((totalEstimatedHoursWithWorkers / workload.length) * 100) / 100 
          : 0,
        averageHoursPerMachineWithMachinesAndWorkers: workload.length > 0 
          ? Math.round((totalEstimatedHoursWithMachinesAndWorkers / workload.length) * 100) / 100 
          : 0,
      },
    };
  }

  /**
   * Получает статистику производительности производства
   */
  async getProductionStatistics(startDate?: Date, endDate?: Date) {
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = endDate || now;

    // Получаем все завершенные workLogs за период
    const workLogs = await prisma.workLog.findMany({
      where: {
        startTime: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
        endTime: {
          not: null,
        },
      },
      include: {
        task: {
          include: {
            machine: {
              select: {
                id: true,
                name: true,
                efficiencyNorm: true,
                quantity: true,
              },
            },
          },
        },
        pauses: true,
      },
    });

    // Общая статистика
    let totalActualQuantity = 0;
    let totalExpectedQuantity = 0;
    let totalDefects = 0;
    let totalHours = 0;

    workLogs.forEach((log) => {
      if (log.endTime) {
        const totalDurationMs = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
        
        // Вычитаем время всех пауз
        let pauseTimeMs = 0;
        if (log.pauses) {
          log.pauses.forEach((pause) => {
            if (pause.pauseEnd) {
              pauseTimeMs += new Date(pause.pauseEnd).getTime() - new Date(pause.pauseStart).getTime();
            }
          });
        }
        
        const workDurationMs = totalDurationMs - pauseTimeMs;
        let durationHours = workDurationMs / (1000 * 60 * 60);

        // Ограничиваем время работы максимум 8 часами (стандартная смена)
        // Все, что больше 8 часов, считается переработкой и не учитывается в расчете КПД
        const STANDARD_WORK_HOURS = 8;
        if (durationHours > STANDARD_WORK_HOURS) {
          durationHours = STANDARD_WORK_HOURS;
        }

        const machineQuantity = log.task.machine.quantity || 1;
        const totalEfficiencyNorm = log.task.machine.efficiencyNorm * machineQuantity;
        
        totalActualQuantity += log.quantityProduced;
        totalDefects += log.defectQuantity;
        totalHours += durationHours;
        totalExpectedQuantity += totalEfficiencyNorm * durationHours;
      }
    });

    const overallEfficiency = totalExpectedQuantity > 0 
      ? (totalActualQuantity / totalExpectedQuantity) * 100 
      : 0;
    const defectRate = totalActualQuantity > 0 
      ? (totalDefects / totalActualQuantity) * 100 
      : 0;

    // Статистика по дням
    const dailyStats: Record<string, {
      date: string;
      actualQuantity: number;
      expectedQuantity: number;
      defects: number;
      hours: number;
      efficiency: number;
      defectRate: number;
    }> = {};

    workLogs.forEach((log) => {
      if (log.endTime) {
        const dateKey = new Date(log.startTime).toISOString().split('T')[0];
        const totalDurationMs = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
        
        // Вычитаем время всех пауз
        let pauseTimeMs = 0;
        if (log.pauses) {
          log.pauses.forEach((pause) => {
            if (pause.pauseEnd) {
              pauseTimeMs += new Date(pause.pauseEnd).getTime() - new Date(pause.pauseStart).getTime();
            }
          });
        }
        
        const workDurationMs = totalDurationMs - pauseTimeMs;
        let durationHours = workDurationMs / (1000 * 60 * 60);

        // Ограничиваем время работы максимум 8 часами (стандартная смена)
        // Все, что больше 8 часов, считается переработкой и не учитывается в расчете КПД
        const STANDARD_WORK_HOURS = 8;
        if (durationHours > STANDARD_WORK_HOURS) {
          durationHours = STANDARD_WORK_HOURS;
        }

        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            actualQuantity: 0,
            expectedQuantity: 0,
            defects: 0,
            hours: 0,
            efficiency: 0,
            defectRate: 0,
          };
        }

        const machineQuantity = log.task.machine.quantity || 1;
        const totalEfficiencyNorm = log.task.machine.efficiencyNorm * machineQuantity;
        
        dailyStats[dateKey].actualQuantity += log.quantityProduced;
        dailyStats[dateKey].defects += log.defectQuantity;
        dailyStats[dateKey].hours += durationHours;
        dailyStats[dateKey].expectedQuantity += totalEfficiencyNorm * durationHours;
      }
    });

    // Рассчитываем эффективность и процент брака для каждого дня
    const dailyStatistics = Object.values(dailyStats)
      .map((day) => ({
        ...day,
        efficiency: day.expectedQuantity > 0 
          ? Math.round((day.actualQuantity / day.expectedQuantity) * 100 * 100) / 100 
          : 0,
        defectRate: day.actualQuantity > 0 
          ? Math.round((day.defects / day.actualQuantity) * 100 * 100) / 100 
          : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Статистика по станкам
    const machineStats: Record<string, {
      machineId: string;
      machineName: string;
      actualQuantity: number;
      expectedQuantity: number;
      defects: number;
      hours: number;
      efficiency: number;
      defectRate: number;
    }> = {};

    workLogs.forEach((log) => {
      if (log.endTime) {
        const machineId = log.task.machine.id;
        const totalDurationMs = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
        
        // Вычитаем время всех пауз
        let pauseTimeMs = 0;
        if (log.pauses) {
          log.pauses.forEach((pause) => {
            if (pause.pauseEnd) {
              pauseTimeMs += new Date(pause.pauseEnd).getTime() - new Date(pause.pauseStart).getTime();
            }
          });
        }
        
        const workDurationMs = totalDurationMs - pauseTimeMs;
        let durationHours = workDurationMs / (1000 * 60 * 60);

        // Ограничиваем время работы максимум 8 часами (стандартная смена)
        // Все, что больше 8 часов, считается переработкой и не учитывается в расчете КПД
        const STANDARD_WORK_HOURS = 8;
        if (durationHours > STANDARD_WORK_HOURS) {
          durationHours = STANDARD_WORK_HOURS;
        }

        if (!machineStats[machineId]) {
          machineStats[machineId] = {
            machineId,
            machineName: log.task.machine.name,
            actualQuantity: 0,
            expectedQuantity: 0,
            defects: 0,
            hours: 0,
            efficiency: 0,
            defectRate: 0,
          };
        }

        const machineQuantity = log.task.machine.quantity || 1;
        const totalEfficiencyNorm = log.task.machine.efficiencyNorm * machineQuantity;
        
        machineStats[machineId].actualQuantity += log.quantityProduced;
        machineStats[machineId].defects += log.defectQuantity;
        machineStats[machineId].hours += durationHours;
        machineStats[machineId].expectedQuantity += totalEfficiencyNorm * durationHours;
      }
    });

    // Рассчитываем эффективность и процент брака для каждого станка
    const machineStatistics = Object.values(machineStats)
      .map((machine) => ({
        ...machine,
        efficiency: machine.expectedQuantity > 0 
          ? Math.round((machine.actualQuantity / machine.expectedQuantity) * 100 * 100) / 100 
          : 0,
        defectRate: machine.actualQuantity > 0 
          ? Math.round((machine.defects / machine.actualQuantity) * 100 * 100) / 100 
          : 0,
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    return {
      period: {
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      },
      overall: {
        totalActualQuantity,
        totalExpectedQuantity: Math.round(totalExpectedQuantity * 100) / 100,
        totalDefects,
        totalHours: Math.round(totalHours * 100) / 100,
        efficiency: Math.round(overallEfficiency * 100) / 100,
        defectRate: Math.round(defectRate * 100) / 100,
      },
      daily: dailyStatistics,
      byMachine: machineStatistics,
    };
  }
}

