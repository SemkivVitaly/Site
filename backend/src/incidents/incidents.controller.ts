import { Request, Response } from 'express';
import { IncidentsService, CreateIncidentDto } from './incidents.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { IncidentStatus, IncidentType } from '@prisma/client';
import { io } from '../index';

const incidentsService = new IncidentsService();

export class IncidentsController {
  async createIncident(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data: CreateIncidentDto = {
        ...req.body,
        createdById: userId,
      };

      if (!data.type || !data.title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const incident = await incidentsService.createIncident(data);

      // Get recipients and send notifications
      const recipients = await incidentsService.getRecipientsForIncident(data);

      // Emit notification to all recipients
      recipients.forEach((recipientId) => {
        io.emit(`notification:${recipientId}`, {
          type: 'INCIDENT_CREATED',
          incident,
          message: `Создан инцидент: ${incident.title}`,
        });
      });

      res.status(201).json(incident);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignIncident(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const incident = await incidentsService.assignIncident(id, userId!);

      // Notify creator that someone took the incident
      io.emit(`notification:${incident.creator.id}`, {
        type: 'INCIDENT_ASSIGNED',
        incident,
        message: `${incident.resolver?.firstName} ${incident.resolver?.lastName} взял инцидент в работу`,
      });

      // Notify all other potential recipients that incident is taken
      io.emit('incident:assigned', {
        incidentId: id,
        resolverId: userId,
        resolverName: `${incident.resolver?.firstName} ${incident.resolver?.lastName}`,
      });

      res.json(incident);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resolveIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const incident = await incidentsService.resolveIncident(id);

      io.emit('incident:resolved', {
        incidentId: id,
      });

      res.json(incident);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getIncidents(req: Request, res: Response) {
    try {
      const { status, type, machineId } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (machineId) filters.machineId = machineId as string;

      const incidents = await incidentsService.getIncidents(filters);
      res.json(incidents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getIncidentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const incident = await incidentsService.getIncidentById(id);

      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      res.json(incident);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteIncident(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await incidentsService.deleteIncident(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

