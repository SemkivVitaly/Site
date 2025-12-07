import { Router } from 'express';
import { OrdersController } from '../orders/orders.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireManager } from '../middleware/role.middleware';

const router = Router();
const ordersController = new OrdersController();

router.get('/', authMiddleware, ordersController.getAll.bind(ordersController));
router.get('/:id', authMiddleware, ordersController.getById.bind(ordersController));
router.post('/', authMiddleware, requireManager, ordersController.create.bind(ordersController));
router.put('/:id', authMiddleware, requireManager, ordersController.update.bind(ordersController));
router.delete('/:id', authMiddleware, requireManager, ordersController.delete.bind(ordersController));
router.patch('/:id/status', authMiddleware, ordersController.updateStatus.bind(ordersController));

export default router;

