import prisma from '../config/database';
import { Priority } from '@prisma/client';

export interface CreateTaskDto {
  orderId: string;
  machineId: string;
  operation: string;
  totalQuantity: number;
  priority?: Priority;
  sequence: number;
  assignedUserId?: string; // Оставляем для обратной совместимости
  assignedUserIds?: string[]; // Новое поле для множественных назначений
}

export interface CreateTechCardDto {
  orderId: string;
  tasks: Omit<CreateTaskDto, 'orderId'>[];
}

export class TechCardsService {
  async createTechCard(data: CreateTechCardDto) {
    // Validate order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Create all tasks
    const tasks = await Promise.all(
      data.tasks.map(async (task) => {
        const createdTask = await prisma.productionTask.create({
          data: {
            orderId: data.orderId,
            machineId: task.machineId,
            operation: task.operation,
            totalQuantity: task.totalQuantity,
            priority: task.priority || Priority.MEDIUM,
            sequence: task.sequence,
            assignedUserId: task.assignedUserId, // Оставляем для обратной совместимости
            // Создаем множественные назначения, если указаны
            assignments: task.assignedUserIds && task.assignedUserIds.length > 0
              ? {
                  create: task.assignedUserIds.map((userId) => ({
                    userId,
                  })),
                }
              : undefined,
          },
          include: {
            machine: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });
        return createdTask;
      })
    );

    // Update order status to IN_QUEUE
    await prisma.order.update({
      where: { id: data.orderId },
      data: { status: 'IN_QUEUE' },
    });

    return tasks;
  }

  async getTechCardByOrderId(orderId: string) {
    return prisma.productionTask.findMany({
      where: { orderId },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
            efficiencyNorm: true,
            capabilities: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        workLogs: {
          select: {
            id: true,
            userId: true,
            startTime: true,
            endTime: true,
            quantityProduced: true,
            defectQuantity: true,
          },
        },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  async addTaskToTechCard(data: CreateTaskDto) {
    // Validate machine is not broken
    const machine = await prisma.machine.findUnique({
      where: { id: data.machineId },
    });

    if (!machine) {
      throw new Error('Machine not found');
    }

    if (machine.status === 'REPAIR' || machine.status === 'REQUIRES_ATTENTION') {
      throw new Error('Cannot assign task to broken machine');
    }

    return prisma.productionTask.create({
      data: {
        orderId: data.orderId,
        machineId: data.machineId,
        operation: data.operation,
        totalQuantity: data.totalQuantity,
        priority: data.priority || Priority.MEDIUM,
        sequence: data.sequence,
        assignedUserId: data.assignedUserId, // Оставляем для обратной совместимости
        // Создаем множественные назначения, если указаны
        assignments: data.assignedUserIds && data.assignedUserIds.length > 0
          ? {
              create: data.assignedUserIds.map((userId) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async updateTaskSequence(orderId: string, taskIds: string[]) {
    // Update sequence for all tasks
    const updates = taskIds.map((taskId, index) =>
      prisma.productionTask.update({
        where: { id: taskId },
        data: { sequence: index + 1 },
      })
    );

    await Promise.all(updates);

    return this.getTechCardByOrderId(orderId);
  }

  async updateTask(id: string, data: Partial<Omit<CreateTaskDto, 'orderId' | 'sequence'>>) {
    // Validate machine if being changed
    if (data.machineId) {
      const machine = await prisma.machine.findUnique({
        where: { id: data.machineId },
      });

      if (!machine) {
        throw new Error('Machine not found');
      }

      if (machine.status === 'REPAIR' || machine.status === 'REQUIRES_ATTENTION') {
        throw new Error('Cannot assign task to broken machine');
      }
    }

    // Если указаны assignedUserIds, обновляем множественные назначения
    if (data.assignedUserIds !== undefined) {
      // Удаляем все существующие назначения
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      // Создаем новые назначения
      if (data.assignedUserIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: data.assignedUserIds.map((userId) => ({
            taskId: id,
            userId,
          })),
        });
      }
    }

    return prisma.productionTask.update({
      where: { id },
      data: {
        ...(data.machineId && { machineId: data.machineId }),
        ...(data.operation && { operation: data.operation }),
        ...(data.totalQuantity !== undefined && { totalQuantity: data.totalQuantity }),
        ...(data.priority && { priority: data.priority }),
        ...(data.assignedUserId !== undefined && { assignedUserId: data.assignedUserId || null }),
      },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteTask(id: string) {
    // Check if task exists
    const task = await prisma.productionTask.findUnique({
      where: { id },
      include: {
        workLogs: true,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if task has work logs
    if (task.workLogs.length > 0) {
      throw new Error('Cannot delete task with work logs');
    }

    // Get orderId before deletion for updating sequence
    const orderId = task.orderId;

    // Delete the task
    await prisma.productionTask.delete({
      where: { id },
    });

    // Update sequence for remaining tasks
    const remainingTasks = await prisma.productionTask.findMany({
      where: { orderId },
      orderBy: { sequence: 'asc' },
    });

    // Reorder sequences
    const updates = remainingTasks.map((t, index) =>
      prisma.productionTask.update({
        where: { id: t.id },
        data: { sequence: index + 1 },
      })
    );

    await Promise.all(updates);

    return { success: true };
  }
}

