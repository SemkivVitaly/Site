import prisma from '../config/database';
import { TaskStatus, Priority } from '@prisma/client';

export interface AssignTaskDto {
  taskId: string;
  userId?: string; // null for "general queue" (оставляем для обратной совместимости)
  userIds?: string[]; // Новое поле для множественных назначений
  priority?: Priority;
}

export interface UpdateTaskDto {
  status?: TaskStatus;
  priority?: Priority;
  assignedUserId?: string | null;
}

export class TasksService {
  async getAll(filters?: {
    status?: TaskStatus;
    assignedUserId?: string | null;
    machineId?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.assignedUserId !== undefined) {
      if (filters.assignedUserId === null) {
        where.assignedUserId = null;
      } else {
        where.assignedUserId = filters.assignedUserId;
      }
    }

    if (filters?.machineId) {
      where.machineId = filters.machineId;
    }

    return prisma.productionTask.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            title: true,
            deadline: true,
            priority: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
            efficiencyNorm: true,
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
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async getById(id: string) {
    return prisma.productionTask.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            title: true,
            deadline: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
            efficiencyNorm: true,
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
        },
      },
    });
  }

  async assignTask(data: AssignTaskDto) {
    const task = await prisma.productionTask.findUnique({
      where: { id: data.taskId },
      include: { machine: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Validate machine is not broken
    if (task.machine.status === 'REPAIR' || task.machine.status === 'REQUIRES_ATTENTION') {
      throw new Error('Cannot assign task to broken machine');
    }

    const updateData: UpdateTaskDto = {
      assignedUserId: data.userId || null, // Оставляем для обратной совместимости
    };

    if (data.priority) {
      updateData.priority = data.priority;
    }

    // Обновляем задачу
    const updatedTask = await prisma.productionTask.update({
      where: { id: data.taskId },
      data: updateData,
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
      },
    });

    // Если указаны userIds, обновляем множественные назначения
    if (data.userIds !== undefined) {
      // Удаляем все существующие назначения
      await prisma.taskAssignment.deleteMany({
        where: { taskId: data.taskId },
      });

      // Создаем новые назначения
      if (data.userIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: data.userIds.map((userId) => ({
            taskId: data.taskId,
            userId,
          })),
        });
      }

      // Загружаем обновленную задачу с назначениями
      return prisma.productionTask.findUnique({
        where: { id: data.taskId },
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

    return updatedTask;
  }

  async updateTask(id: string, data: UpdateTaskDto) {
    // Validate machine if status is being changed to IN_PROGRESS
    if (data.status === 'IN_PROGRESS') {
      const task = await prisma.productionTask.findUnique({
        where: { id },
        include: { machine: true },
      });

      if (task && (task.machine.status === 'REPAIR' || task.machine.status === 'REQUIRES_ATTENTION')) {
        throw new Error('Cannot start task on broken machine');
      }
    }

    return prisma.productionTask.update({
      where: { id },
      data,
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
      },
    });
  }

  async getAvailableTasks(userId?: string) {
    // Get all tasks with status PENDING or IN_PROGRESS, regardless of assignment
    // This allows employees to see all tasks for each order, even if someone already took them
    const where: any = {
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
    };

    // Exclude tasks on broken machines
    const tasks = await prisma.productionTask.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            title: true,
            deadline: true,
            priority: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
            efficiencyNorm: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { order: { priority: 'desc' } },
        { order: { deadline: 'asc' } },
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Filter out tasks on broken machines
    return tasks.filter(
      (task) =>
        task.machine.status !== 'REPAIR' &&
        task.machine.status !== 'REQUIRES_ATTENTION'
    );
  }

  async getCompletedTasks(userId?: string, userRole?: string) {
    // Для сотрудников: показываем задачи, которые либо назначены им, либо по которым у них есть завершенные workLog
    // Для менеджеров: задачи из заказов, которыми они управляют
    // Для админов: все задачи
    const where: any = {
      // Получаем задачи, которые либо:
      // 1. Имеют статус COMPLETED, либо
      // 2. Имеют хотя бы один завершенный workLog (endTime не null)
      OR: [
        // Задачи со статусом COMPLETED
        { status: 'COMPLETED' },
        // Задачи с хотя бы одним завершенным workLog
        {
          workLogs: {
            some: {
              endTime: {
                not: null,
              },
            },
          },
        },
      ],
    };

    // Применяем фильтры доступа
    if (userRole === 'EMPLOYEE' && userId) {
      // Для сотрудников показываем задачи, которые:
      // 1. Имеют завершенные workLog (статус COMPLETED ИЛИ есть завершенные workLog)
      // 2. И (назначены им ИЛИ у них есть завершенный workLog для этой задачи)
      where.AND = [
        {
          OR: [
            { assignedUserId: userId },
            {
              workLogs: {
                some: {
                  userId: userId,
                  endTime: {
                    not: null,
                  },
                },
              },
            },
          ],
        },
      ];
    } else if (userRole === 'MANAGER' && userId) {
      // Получаем задачи из заказов, которыми управляет этот менеджер
      where.order = {
        managerId: userId,
      };
    }
    // Для ADMIN, дополнительный фильтр не нужен (показываем все)

    // Получаем задачи с включением связанных данных
    const tasks = await prisma.productionTask.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            title: true,
            deadline: true,
            priority: true,
            managerId: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
            efficiencyNorm: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        workLogs: {
          select: {
            endTime: true,
            userId: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Для сотрудников: дополнительно фильтруем задачи, у которых есть хотя бы один завершенный workLog от этого сотрудника
    // Для других ролей: фильтруем задачи, у которых есть хотя бы один завершенный workLog
    if (userRole === 'EMPLOYEE' && userId) {
      return tasks.filter((task) => 
        task.workLogs.some((log) => log.endTime !== null && log.userId === userId)
      );
    }
    
    // Для менеджеров и админов: показываем задачи с хотя бы одним завершенным workLog
    return tasks.filter((task) => 
      task.workLogs.some((log) => log.endTime !== null)
    );
  }
}

