import { Router } from 'express';
import { MachinesController } from '../machines/machines.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { uploadMachinePhoto } from '../middleware/upload.middleware';

const router = Router();
const machinesController = new MachinesController();

router.get('/', authMiddleware, machinesController.getAll.bind(machinesController));
router.get('/:id', authMiddleware, machinesController.getById.bind(machinesController));
router.get('/:id/history', authMiddleware, machinesController.getHistory.bind(machinesController));
router.post('/', authMiddleware, requireAdmin, machinesController.create.bind(machinesController));
router.put('/:id', authMiddleware, requireAdmin, machinesController.update.bind(machinesController));
router.post('/:id/photo', authMiddleware, requireAdmin, uploadMachinePhoto.single('photo'), machinesController.uploadPhoto.bind(machinesController));
router.delete('/:id/photo', authMiddleware, requireAdmin, machinesController.deletePhoto.bind(machinesController));
router.delete('/:id', authMiddleware, requireAdmin, machinesController.delete.bind(machinesController));

export default router;

