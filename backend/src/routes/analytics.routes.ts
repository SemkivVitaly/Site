import { Router } from 'express';
import { AnalyticsController } from '../analytics/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin, requireManager } from '../middleware/role.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

router.get('/employee/:userId', authMiddleware, analyticsController.getEmployeeEfficiency.bind(analyticsController));
router.get('/task/:taskId/contribution', authMiddleware, analyticsController.getTaskContribution.bind(analyticsController));
router.get('/employees', authMiddleware, requireAdmin, analyticsController.getEmployeesEfficiency.bind(analyticsController));
router.get('/production/workload', authMiddleware, requireManager, analyticsController.getProductionWorkload.bind(analyticsController));
router.get('/production/statistics', authMiddleware, requireAdmin, analyticsController.getProductionStatistics.bind(analyticsController));

export default router;

