import { Request, Response } from 'express';
import { TechCardsService, CreateTechCardDto, CreateTaskDto } from './tech-cards.service';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { io } from '../index';

const techCardsService = new TechCardsService();

export class TechCardsController {
  async createTechCard(req: AuthRequest, res: Response) {
    try {
      const data: CreateTechCardDto = req.body;
      const user = req.user;

      if (!data.orderId || !data.tasks || data.tasks.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Проверка прав: менеджеры могут создавать техкарты только для своих заказов
      if (user?.role === 'MANAGER') {
        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          select: { managerId: true },
        });

        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        if (order.managerId !== user.userId) {
          return res.status(403).json({ error: 'You can only create tech cards for your own orders' });
        }
      }

      const tasks = await techCardsService.createTechCard(data);
      
      // Send notifications to assigned employees
      for (const task of tasks) {
        // Load full task data with order information
        const fullTask = await prisma.productionTask.findUnique({
          where: { id: task.id },
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
              },
            },
          },
        });

        if (fullTask) {
          // Отправляем уведомления всем назначенным сотрудникам через assignments
          if (task.assignments && task.assignments.length > 0) {
            for (const assignment of task.assignments) {
              io.emit(`notification:${assignment.user.id}`, {
                type: 'TASK_ASSIGNED',
                task: {
                  id: fullTask.id,
                  operation: fullTask.operation,
                  order: fullTask.order,
                  machine: fullTask.machine,
                  priority: fullTask.priority,
                },
                message: `Вам назначена новая задача: ${fullTask.operation}`,
              });
            }
          }
          // Также отправляем уведомление через assignedUser для обратной совместимости
          else if (task.assignedUser && task.assignedUser.id) {
            io.emit(`notification:${task.assignedUser.id}`, {
              type: 'TASK_ASSIGNED',
              task: {
                id: fullTask.id,
                operation: fullTask.operation,
                order: fullTask.order,
                machine: fullTask.machine,
                priority: fullTask.priority,
              },
              message: `Вам назначена новая задача: ${fullTask.operation}`,
            });
          }
        }
      }
      
      res.status(201).json(tasks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTechCardByOrderId(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const tasks = await techCardsService.getTechCardByOrderId(orderId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addTask(req: AuthRequest, res: Response) {
    try {
      const data: CreateTaskDto = req.body;
      const user = req.user;

      if (!data.orderId || !data.machineId || !data.operation || !data.totalQuantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Проверка прав: менеджеры могут добавлять задачи только к своим заказам
      if (user?.role === 'MANAGER') {
        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          select: { managerId: true },
        });

        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        if (order.managerId !== user.userId) {
          return res.status(403).json({ error: 'You can only add tasks to your own orders' });
        }
      }

      const task = await techCardsService.addTaskToTechCard(data);
      
      // Send notification if task is assigned to a specific user
      if (task.assignedUser && task.assignedUser.id) {
        // Load full task data with order information
        const fullTask = await prisma.productionTask.findUnique({
          where: { id: task.id },
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
              },
            },
          },
        });

        if (fullTask) {
          io.emit(`notification:${task.assignedUser.id}`, {
            type: 'TASK_ASSIGNED',
            task: {
              id: fullTask.id,
              operation: fullTask.operation,
              order: fullTask.order,
              machine: fullTask.machine,
              priority: fullTask.priority,
            },
            message: `Вам назначена новая задача: ${fullTask.operation}`,
          });
        }
      }
      
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateSequence(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { taskIds } = req.body;

      if (!Array.isArray(taskIds)) {
        return res.status(400).json({ error: 'taskIds must be an array' });
      }

      const tasks = await techCardsService.updateTaskSequence(orderId, taskIds);
      res.json(tasks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateTask(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const user = req.user;

      // Get task to check order ownership
      const existingTask = await prisma.productionTask.findUnique({
        where: { id },
        include: {
          order: {
            select: {
              managerId: true,
            },
          },
        },
      });

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Проверка прав: менеджеры могут редактировать задачи только в своих заказах
      if (user?.role === 'MANAGER') {
        if (existingTask.order.managerId !== user.userId) {
          return res.status(403).json({ error: 'You can only edit tasks in your own orders' });
        }
      }

      const task = await techCardsService.updateTask(id, data);
      
      // Send notifications if assigned users changed
      if (data.assignedUserIds !== undefined || data.assignedUserId !== undefined) {
        // Load full task data with order information
        const fullTask = await prisma.productionTask.findUnique({
          where: { id: task.id },
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
              },
            },
          },
        });

        if (fullTask) {
          // Отправляем уведомления всем назначенным сотрудникам через assignments
          if (task.assignments && task.assignments.length > 0) {
            for (const assignment of task.assignments) {
              io.emit(`notification:${assignment.user.id}`, {
                type: 'TASK_ASSIGNED',
                task: {
                  id: fullTask.id,
                  operation: fullTask.operation,
                  order: fullTask.order,
                  machine: fullTask.machine,
                  priority: fullTask.priority,
                },
                message: `Вам назначена задача: ${fullTask.operation}`,
              });
            }
          }
          // Также отправляем уведомление через assignedUser для обратной совместимости
          else if (task.assignedUser && task.assignedUser.id) {
            const oldAssignedUserId = existingTask.assignedUserId;
            if (oldAssignedUserId !== task.assignedUser.id) {
              io.emit(`notification:${task.assignedUser.id}`, {
                type: 'TASK_ASSIGNED',
                task: {
                  id: fullTask.id,
                  operation: fullTask.operation,
                  order: fullTask.order,
                  machine: fullTask.machine,
                  priority: fullTask.priority,
                },
                message: `Вам назначена задача: ${fullTask.operation}`,
              });
            }
          }
        }
      }
      
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteTask(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;

      // Get task to check order ownership
      const existingTask = await prisma.productionTask.findUnique({
        where: { id },
        include: {
          order: {
            select: {
              managerId: true,
            },
          },
        },
      });

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Проверка прав: менеджеры могут удалять задачи только из своих заказов
      if (user?.role === 'MANAGER') {
        if (existingTask.order.managerId !== user.userId) {
          return res.status(403).json({ error: 'You can only delete tasks from your own orders' });
        }
      }

      await techCardsService.deleteTask(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

