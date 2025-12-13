import { Request, Response } from 'express';
import { TasksService, AssignTaskDto, UpdateTaskDto } from './tasks.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { TaskStatus } from '@prisma/client';
import { io } from '../index';

const tasksService = new TasksService();

export class TasksController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { status, assignedUserId, machineId, completedOnly } = req.query;

      // If completedOnly is true, use getCompletedTasks instead
      if (completedOnly === 'true') {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        // For ADMIN, pass undefined to show all tasks
        const tasks = await tasksService.getCompletedTasks(
          userRole === 'ADMIN' ? undefined : userId,
          userRole
        );
        return res.json(tasks);
      }

      const filters: any = {};
      if (status) filters.status = status;
      if (assignedUserId !== undefined) {
        filters.assignedUserId = assignedUserId === 'null' ? null : assignedUserId;
      }
      if (machineId) filters.machineId = machineId as string;

      const tasks = await tasksService.getAll(filters);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await tasksService.getById(id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async assignTask(req: AuthRequest, res: Response) {
    try {
      const data: AssignTaskDto = req.body;

      if (!data.taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const task = await tasksService.assignTask(data);
      
      // Send notifications to all assigned employees
      if (task) {
        // Отправляем уведомления всем назначенным сотрудникам через assignments
        if (task.assignments && task.assignments.length > 0) {
          for (const assignment of task.assignments) {
            io.emit(`notification:${assignment.user.id}`, {
              type: 'TASK_ASSIGNED',
              task: {
                id: task.id,
                operation: task.operation,
                order: task.order,
                machine: task.machine,
                priority: task.priority,
              },
              message: `Вам назначена задача: ${task.operation}`,
            });
          }
        }
        // Также отправляем уведомление через assignedUser для обратной совместимости
        else if (task.assignedUser && task.assignedUser.id) {
          io.emit(`notification:${task.assignedUser.id}`, {
            type: 'TASK_ASSIGNED',
            task: {
              id: task.id,
              operation: task.operation,
              order: task.order,
              machine: task.machine,
              priority: task.priority,
            },
            message: `Вам назначена задача: ${task.operation}`,
          });
        }
      }

      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateTaskDto = req.body;

      const task = await tasksService.updateTask(id, data);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAvailableTasks(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const tasks = await tasksService.getAvailableTasks(userId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

