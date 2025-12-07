import { Request, Response } from 'express';
import { ShiftsService, ProcessQRScanDto, CreateShiftDto } from './shifts.service';
import { AuthRequest } from '../middleware/auth.middleware';

const shiftsService = new ShiftsService();

export class ShiftsController {
  async processQRScan(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { qrHash } = req.body;

      if (!qrHash) {
        return res.status(400).json({ error: 'QR hash is required' });
      }

      const shift = await shiftsService.processQRScan({
        userId,
        qrHash,
      });

      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createShift(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data: CreateShiftDto = req.body;

      // If user is not admin, they can only create shifts for themselves
      if (req.user?.role !== 'ADMIN' && data.userId && data.userId !== userId) {
        return res.status(403).json({ error: 'You can only create shifts for yourself' });
      }

      // Use authenticated user's ID if not provided or if user is not admin
      const shiftData: CreateShiftDto = {
        ...data,
        userId: req.user?.role === 'ADMIN' && data.userId ? data.userId : userId,
      };

      if (!shiftData.date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      const shift = await shiftsService.createShift(shiftData);
      res.status(201).json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getShifts(req: Request, res: Response) {
    try {
      const { userId, startDate, endDate } = req.query;

      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const shifts = await shiftsService.getShifts(filters);
      res.json(shifts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShiftById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const shift = await shiftsService.getShiftById(id);

      if (!shift) {
        return res.status(404).json({ error: 'Shift not found' });
      }

      res.json(shift);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCurrentShift(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const shift = await shiftsService.getCurrentShift(userId);
      res.json(shift);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShiftCalendar(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      // Парсим строки формата YYYY-MM-DD в даты
      // new Date("YYYY-MM-DD") интерпретирует строку как UTC полночь, что нам и нужно
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const calendar = await shiftsService.getShiftCalendar(start, end);
      res.json(calendar);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async processLunch(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { action } = req.body;

      if (!action || (action !== 'start' && action !== 'end')) {
        return res.status(400).json({ error: 'Action must be "start" or "end"' });
      }

      const shift = await shiftsService.processLunch(userId, action);
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markNoLunch(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const shift = await shiftsService.markNoLunch(userId);
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteShift(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      await shiftsService.deleteShift(id, userId, userRole || 'EMPLOYEE');
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

