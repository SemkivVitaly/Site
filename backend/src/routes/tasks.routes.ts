import { Router } from 'express';
import { TasksController } from '../tasks/tasks.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();
const tasksController = new TasksController();

router.get('/', authMiddleware, tasksController.getAll.bind(tasksController));
router.get('/available', authMiddleware, tasksController.getAvailableTasks.bind(tasksController));
router.get('/:id', authMiddleware, tasksController.getById.bind(tasksController));
router.post('/assign', authMiddleware, requireAdmin, tasksController.assignTask.bind(tasksController));
router.put('/:id', authMiddleware, tasksController.updateTask.bind(tasksController));

export default router;

