import { Router } from 'express';
import { IncidentsController } from '../incidents/incidents.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const incidentsController = new IncidentsController();

router.post('/', authMiddleware, incidentsController.createIncident.bind(incidentsController));
router.get('/', authMiddleware, incidentsController.getIncidents.bind(incidentsController));
router.get('/:id', authMiddleware, incidentsController.getIncidentById.bind(incidentsController));
router.post('/:id/assign', authMiddleware, incidentsController.assignIncident.bind(incidentsController));
router.post('/:id/resolve', authMiddleware, incidentsController.resolveIncident.bind(incidentsController));
router.delete('/:id', authMiddleware, incidentsController.deleteIncident.bind(incidentsController));

export default router;

