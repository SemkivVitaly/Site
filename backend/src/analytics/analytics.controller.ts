import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getEmployeeEfficiency(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const efficiency = await analyticsService.calculateEmployeeEfficiency(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(efficiency);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTaskContribution(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const contribution = await analyticsService.getTaskContribution(taskId);
      res.json(contribution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmployeesEfficiency(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const efficiencies = await analyticsService.getEmployeesEfficiency(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(efficiencies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProductionWorkload(req: Request, res: Response) {
    try {
      const workload = await analyticsService.getProductionWorkload();
      res.json(workload);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProductionStatistics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const statistics = await analyticsService.getProductionStatistics(start, end);
      res.json(statistics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

