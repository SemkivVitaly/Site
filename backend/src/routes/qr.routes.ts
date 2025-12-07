import { Router } from 'express';
import { QRController } from '../qr/qr.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();
const qrController = new QRController();

router.post('/', authMiddleware, requireAdmin, qrController.generateQRPoint.bind(qrController));
router.get('/', authMiddleware, qrController.getAllQRPoints.bind(qrController));
router.get('/:hash', authMiddleware, qrController.getQRPointByHash.bind(qrController));
router.delete('/:id', authMiddleware, requireAdmin, qrController.deleteQRPoint.bind(qrController));

export default router;

