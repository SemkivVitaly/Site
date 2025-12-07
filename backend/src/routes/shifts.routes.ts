import { Router } from 'express';
import { ShiftsController } from '../shifts/shifts.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const shiftsController = new ShiftsController();

router.post('/scan', authMiddleware, shiftsController.processQRScan.bind(shiftsController));
router.post('/lunch', authMiddleware, shiftsController.processLunch.bind(shiftsController));
router.post('/no-lunch', authMiddleware, shiftsController.markNoLunch.bind(shiftsController));
router.get('/current', authMiddleware, shiftsController.getCurrentShift.bind(shiftsController));
router.get('/calendar', authMiddleware, shiftsController.getShiftCalendar.bind(shiftsController));
router.get('/', authMiddleware, shiftsController.getShifts.bind(shiftsController));
router.get('/:id', authMiddleware, shiftsController.getShiftById.bind(shiftsController));
router.post('/', authMiddleware, shiftsController.createShift.bind(shiftsController));
router.delete('/:id', authMiddleware, shiftsController.deleteShift.bind(shiftsController));

export default router;

