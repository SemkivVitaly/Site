import { Request, Response } from 'express';
import { WorkLogsService, StartWorkLogDto, EndWorkLogDto } from './worklogs.service';
import { AuthRequest } from '../middleware/auth.middleware';

const workLogsService = new WorkLogsService();

export class WorkLogsController {
  async startWorkLog(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { taskId } = req.body;

      if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const workLog = await workLogsService.startWorkLog({
        taskId,
        userId,
      });

      res.json(workLog);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async endWorkLog(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { workLogId, quantityProduced, defectQuantity } = req.body;

      if (!workLogId || quantityProduced === undefined || defectQuantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const workLog = await workLogsService.endWorkLog({
        workLogId,
        quantityProduced,
        defectQuantity,
      });

      res.json(workLog);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getActiveWorkLog(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workLog = await workLogsService.getActiveWorkLog(userId);
      res.json(workLog);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWorkLogsByTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const workLogs = await workLogsService.getWorkLogsByTask(taskId);
      res.json(workLogs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWorkLogsByUserAndDate(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const workLogs = await workLogsService.getWorkLogsByUserAndDate(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(workLogs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

