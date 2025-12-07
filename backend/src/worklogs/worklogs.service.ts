import prisma from '../config/database';
import { TaskStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { ShiftsService } from '../shifts/shifts.service';

export interface StartWorkLogDto {
  taskId: string;
  userId: string;
}

export interface EndWorkLogDto {
  workLogId: string;
  quantityProduced: number;
  defectQuantity: number;
}

export class WorkLogsService {
  /**
   * Получает или создает смену для пользователя на указанную дату
   * Если смена существует, обновляет timeIn если его нет или если новый timeIn раньше
   */
  private async getOrCreateShift(userId: string, date: Date, timeIn?: Date) {
    // Получаем локальную дату без учета времени, используя UTC для избежания проблем с часовыми поясами
    // Создаем дату в UTC, чтобы она правильно сохранялась в базе данных как Date без времени
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateOnly = new Date(Date.UTC(year, month, day));

    let shift = await prisma.shift.findFirst({
      where: {
        userId,
        date: dateOnly,
      },
    });

    if (!shift) {
      // Создаем новую смену
      const shiftsService = new ShiftsService();
      shift = await shiftsService.createShift({
        userId,
        date: dateOnly,
      });
      logger.info(`Auto-created shift for user ${userId} on ${dateOnly.toISOString()}`);
    }

    // Обновляем timeIn если его нет или если новый timeIn раньше существующего
    if (timeIn) {
      const updateData: any = {};
      if (!shift.timeIn || new Date(timeIn) < new Date(shift.timeIn)) {
        updateData.timeIn = timeIn;
      }
      if (Object.keys(updateData).length > 0) {
        shift = await prisma.shift.update({
          where: { id: shift.id },
          data: updateData,
        });
      }
    }

    return shift;
  }

  async startWorkLog(data: StartWorkLogDto) {
    // Check if task exists and machine is not broken
    const task = await prisma.productionTask.findUnique({
      where: { id: data.taskId },
      include: { machine: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

      if (task.machine.status === 'REPAIR' || task.machine.status === 'REQUIRES_ATTENTION') {
      throw new Error('Cannot start work on broken machine');
    }

    // Check if user has active work log
    const activeWorkLog = await prisma.workLog.findFirst({
      where: {
        userId: data.userId,
        endTime: null,
      },
    });

    if (activeWorkLog) {
      throw new Error('User already has an active work log');
    }

    // Create work log - сохраняем статистику начала работы
    const startTime = new Date();
    
    // Автоматически создаем или обновляем смену при начале работы
    await this.getOrCreateShift(data.userId, startTime, startTime);

    const workLog = await prisma.workLog.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        startTime: startTime,
      },
      include: {
        task: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update task status to IN_PROGRESS if it's PENDING
    if (task.status === 'PENDING') {
      await prisma.productionTask.update({
        where: { id: data.taskId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Обновляем статус заказа при начале первой задачи
    if (workLog.task.order.status === 'NEW' || workLog.task.order.status === 'IN_QUEUE') {
      await prisma.order.update({
        where: { id: workLog.task.order.id },
        data: { status: 'IN_PROGRESS' },
      });
      logger.info(`Order ${workLog.task.order.id} status updated to IN_PROGRESS (task started)`);
    }

    logger.info(`Work log started: task ${data.taskId}, user ${data.userId}, time ${startTime.toISOString()}`);
    return workLog;
  }

  async endWorkLog(data: EndWorkLogDto) {
    const workLog = await prisma.workLog.findUnique({
      where: { id: data.workLogId },
      include: { task: true },
    });

    if (!workLog) {
      throw new Error('Work log not found');
    }

    if (workLog.endTime) {
      throw new Error('Work log already ended');
    }

    // Update work log - сохраняем статистику завершения работы
    const endTime = new Date();
    
    // Автоматически создаем или обновляем смену при завершении работы
    const shift = await this.getOrCreateShift(workLog.userId, endTime, new Date(workLog.startTime));
    
    // Обновляем timeOut если его нет или если новый timeOut позже существующего
    const updateShiftData: any = {};
    if (!shift.timeOut || new Date(endTime) > new Date(shift.timeOut)) {
      updateShiftData.timeOut = endTime;
    }
    if (Object.keys(updateShiftData).length > 0) {
      await prisma.shift.update({
        where: { id: shift.id },
        data: updateShiftData,
      });
      logger.info(`Auto-updated shift ${shift.id} timeOut to ${endTime.toISOString()}`);
    }

    const updatedWorkLog = await prisma.workLog.update({
      where: { id: data.workLogId },
      data: {
        endTime: endTime,
        quantityProduced: data.quantityProduced,
        defectQuantity: data.defectQuantity,
      },
      include: {
        task: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update task completed quantity
    const newCompletedQuantity =
      updatedWorkLog.task.completedQuantity + data.quantityProduced;

    await prisma.productionTask.update({
      where: { id: updatedWorkLog.taskId },
      data: {
        completedQuantity: newCompletedQuantity,
        defectQuantity: updatedWorkLog.task.defectQuantity + data.defectQuantity,
      },
    });

    // Consume materials for the task
    try {
      const { MaterialsService } = await import('../materials/materials.service');
      const materialsService = new MaterialsService();
      await materialsService.consumeMaterialForTask(
        updatedWorkLog.taskId,
        data.quantityProduced,
        data.defectQuantity
      );
    } catch (error: any) {
      // Log error but don't fail the work log update
      logger.error('Failed to consume materials:', error.message || error);
    }

    // Check if task is completed
    const taskCompleted = newCompletedQuantity >= updatedWorkLog.task.totalQuantity;
    const updateTaskData: any = {};
    
    if (taskCompleted) {
      // Задача полностью выполнена - устанавливаем статус COMPLETED
      updateTaskData.status = 'COMPLETED';
      logger.info(`Task ${updatedWorkLog.taskId} completed`);
    } else {
      // Задача не полностью выполнена - убеждаемся, что статус не COMPLETED
      // Если статус был COMPLETED, но задача не выполнена полностью, меняем на IN_PROGRESS
      if (updatedWorkLog.task.status === 'COMPLETED') {
        updateTaskData.status = 'IN_PROGRESS';
        logger.warn(`Task ${updatedWorkLog.taskId} was marked as COMPLETED but is not fully completed. Status changed to IN_PROGRESS.`);
      }
    }
    
    // Обновляем статус задачи, если нужно
    if (Object.keys(updateTaskData).length > 0) {
      await prisma.productionTask.update({
        where: { id: updatedWorkLog.taskId },
        data: updateTaskData,
      });
    }

    // Автоматически обновить прогресс заказа
    await this.updateOrderProgress(updatedWorkLog.task.orderId);

    logger.info(
      `Work log ended: task ${updatedWorkLog.taskId}, ` +
      `produced: ${data.quantityProduced}, defects: ${data.defectQuantity}, ` +
      `duration: ${Math.round((endTime.getTime() - updatedWorkLog.startTime.getTime()) / 1000 / 60)} min`
    );

    return updatedWorkLog;
  }

  /**
   * Обновляет прогресс выполнения заказа на основе выполненных задач
   */
  private async updateOrderProgress(orderId: string) {
    const { OrdersService } = await import('../orders/orders.service');
    const ordersService = new OrdersService();
    
    // Пересчитываем процент выполнения заказа
    const completionPercentage = await ordersService.calculateCompletionPercentage(orderId);
    
    // Получаем заказ с задачами для проверки статуса
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            totalQuantity: true,
            completedQuantity: true,
          },
        },
      },
    });

    if (!order) {
      return;
    }

    // Определяем новый статус заказа на основе выполнения задач
    let newStatus = order.status;
    const allTasksCompleted = order.tasks.every((task) => task.status === 'COMPLETED');
    const hasInProgressTasks = order.tasks.some((task) => task.status === 'IN_PROGRESS');
    const hasCompletedTasks = order.tasks.some((task) => task.status === 'COMPLETED');

    if (allTasksCompleted && order.tasks.length > 0) {
      newStatus = 'READY';
    } else if (hasInProgressTasks || hasCompletedTasks) {
      if (order.status === 'NEW' || order.status === 'IN_QUEUE') {
        newStatus = 'IN_PROGRESS';
      } else if (hasCompletedTasks && !allTasksCompleted) {
        newStatus = 'PARTIALLY_READY';
      }
    }

    // Обновляем заказ
    if (newStatus !== order.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
      logger.info(`Order ${orderId} status updated: ${order.status} -> ${newStatus}, completion: ${completionPercentage}%`);
    } else {
      logger.info(`Order ${orderId} progress updated: ${completionPercentage}% (status unchanged: ${newStatus})`);
    }
  }

  async getActiveWorkLog(userId: string) {
    return prisma.workLog.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        task: {
          include: {
            order: {
              select: {
                id: true,
                title: true,
              },
            },
            machine: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getWorkLogsByTask(taskId: string) {
    return prisma.workLog.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getWorkLogsByUserAndDate(userId: string, startDate: Date, endDate: Date) {
    return prisma.workLog.findMany({
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
          select: {
            id: true,
            operation: true,
            totalQuantity: true,
            machine: {
              select: {
                id: true,
                name: true,
              },
            },
            order: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }
}

