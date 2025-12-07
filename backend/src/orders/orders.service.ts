import prisma from '../config/database';
import { OrderStatus, Priority } from '@prisma/client';

export interface CreateOrderDto {
  title: string;
  client: string;
  clientContacts: string;
  description?: string;
  referencePhotos?: string[];
  printRun: number;
  deadline: Date;
  budget?: number;
  priority?: Priority;
  isImportant?: boolean;
  managerId: string;
}

export interface UpdateOrderDto {
  title?: string;
  client?: string;
  clientContacts?: string;
  description?: string;
  referencePhotos?: string[];
  printRun?: number;
  deadline?: Date;
  budget?: number;
  status?: OrderStatus;
  priority?: Priority;
  isImportant?: boolean;
}

export class OrdersService {
  async getAll(managerId?: string) {
    const where = managerId ? { managerId } : {};
    return prisma.order.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            totalQuantity: true,
            completedQuantity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tasks: {
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
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async create(data: CreateOrderDto) {
    // Calculate estimated ready date based on current workload
    const estimatedReadyDate = await this.calculateEstimatedReadyDate(data.printRun);

    return prisma.order.create({
      data: {
        ...data,
        deadline: new Date(data.deadline),
        estimatedReadyDate,
        priority: data.priority || Priority.MEDIUM,
        isImportant: data.isImportant || false,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateOrderDto) {
    return prisma.order.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
  }

  async delete(id: string) {
    // Проверяем, что заказ готов к удалению (READY или ISSUED)
    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.READY && order.status !== OrderStatus.ISSUED) {
      throw new Error('Can only delete orders with status READY or ISSUED');
    }

    return prisma.order.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async calculateCompletionPercentage(orderId: string): Promise<number> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tasks: true,
      },
    });

    if (!order || order.tasks.length === 0) {
      return 0;
    }

    // Улучшенный расчет: учитываем не только количество завершенных задач,
    // но и прогресс выполнения каждой задачи
    let totalProgress = 0;
    
    order.tasks.forEach((task) => {
      if (task.status === 'COMPLETED') {
        totalProgress += 100; // Задача полностью выполнена
      } else if (task.totalQuantity > 0) {
        // Рассчитываем процент выполнения задачи
        const taskProgress = Math.min(
          (task.completedQuantity / task.totalQuantity) * 100,
          100
        );
        totalProgress += taskProgress;
      }
    });

    // Средний процент выполнения всех задач
    const averageProgress = totalProgress / order.tasks.length;
    return Math.round(averageProgress);
  }

  private async calculateEstimatedReadyDate(printRun: number): Promise<Date> {
    // Simple estimation: assume average production capacity
    // This should be improved with actual workload analysis
    const averageCapacity = 1000; // units per day
    const daysNeeded = Math.ceil(printRun / averageCapacity);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
    return estimatedDate;
  }
}

