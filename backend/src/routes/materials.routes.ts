import { Router } from 'express';
import { MaterialsController } from '../materials/materials.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();
const materialsController = new MaterialsController();

router.get('/', authMiddleware, materialsController.getAll.bind(materialsController));
router.get('/low-stock', authMiddleware, materialsController.getLowStockMaterials.bind(materialsController));
router.get('/:id', authMiddleware, materialsController.getById.bind(materialsController));
router.post('/', authMiddleware, requireAdmin, materialsController.create.bind(materialsController));
router.put('/:id', authMiddleware, requireAdmin, materialsController.update.bind(materialsController));
router.delete('/:id', authMiddleware, requireAdmin, materialsController.delete.bind(materialsController));
router.post('/assign', authMiddleware, requireAdmin, materialsController.assignMaterialToTask.bind(materialsController));

export default router;

