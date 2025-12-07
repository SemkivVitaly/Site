import { Request, Response } from 'express';
import { OrdersService, CreateOrderDto, UpdateOrderDto } from './orders.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderStatus } from '@prisma/client';

const ordersService = new OrdersService();

export class OrdersController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;

      // Managers see only their orders, Admins see all
      const managerId = role === 'MANAGER' ? userId : undefined;

      const orders = await ordersService.getAll(managerId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await ordersService.getById(id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Calculate completion percentage
      const completionPercentage = await ordersService.calculateCompletionPercentage(id);

      res.json({ ...order, completionPercentage });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data: CreateOrderDto = {
        ...req.body,
        managerId: userId,
      };

      if (!data.title || !data.client || !data.printRun || !data.deadline) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const order = await ordersService.create(data);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateOrderDto = req.body;

      const order = await ordersService.update(id, data);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ordersService.delete(id);
      res.json({ message: 'Order deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const order = await ordersService.updateStatus(id, status);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

