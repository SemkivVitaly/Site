import { Router } from 'express';
import { UsersController } from '../users/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();
const usersController = new UsersController();

router.get('/', authMiddleware, usersController.getAll.bind(usersController));
router.get('/:id', authMiddleware, usersController.getById.bind(usersController));
router.post('/', authMiddleware, requireAdmin, usersController.create.bind(usersController));
router.put('/:id', authMiddleware, requireAdmin, usersController.update.bind(usersController));
router.delete('/:id', authMiddleware, requireAdmin, usersController.delete.bind(usersController));

export default router;

