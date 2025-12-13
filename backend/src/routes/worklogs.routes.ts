import { Router } from 'express';
import { WorkLogsController } from '../worklogs/worklogs.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const workLogsController = new WorkLogsController();

router.post('/start', authMiddleware, workLogsController.startWorkLog.bind(workLogsController));
router.post('/end', authMiddleware, workLogsController.endWorkLog.bind(workLogsController));
router.post('/pause/start', authMiddleware, workLogsController.startPause.bind(workLogsController));
router.post('/pause/end', authMiddleware, workLogsController.endPause.bind(workLogsController));
router.get('/active', authMiddleware, workLogsController.getActiveWorkLog.bind(workLogsController));
router.get('/task/:taskId', authMiddleware, workLogsController.getWorkLogsByTask.bind(workLogsController));
router.get('/user/:userId', authMiddleware, workLogsController.getWorkLogsByUserAndDate.bind(workLogsController));

export default router;

