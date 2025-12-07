import { Router } from 'express';
import { TechCardsController } from '../production/tech-cards.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireManager } from '../middleware/role.middleware';

const router = Router();
const techCardsController = new TechCardsController();

// Менеджеры и администраторы могут создавать технологические карты
router.post('/tech-cards', authMiddleware, requireManager, techCardsController.createTechCard.bind(techCardsController));
router.get('/tech-cards/:orderId', authMiddleware, techCardsController.getTechCardByOrderId.bind(techCardsController));
router.post('/tasks', authMiddleware, requireManager, techCardsController.addTask.bind(techCardsController));
router.put('/tasks/:id', authMiddleware, requireManager, techCardsController.updateTask.bind(techCardsController));
router.delete('/tasks/:id', authMiddleware, requireManager, techCardsController.deleteTask.bind(techCardsController));
router.put('/tech-cards/:orderId/sequence', authMiddleware, requireManager, techCardsController.updateSequence.bind(techCardsController));

export default router;

