import prisma from '../config/database';
import { IncidentType, IncidentStatus, MachineStatus } from '@prisma/client';

export interface CreateIncidentDto {
  type: IncidentType;
  title: string;
  description?: string;
  machineId?: string;
  taskId?: string;
  createdById: string;
}

export class IncidentsService {
  async createIncident(data: CreateIncidentDto) {
    const incident = await prisma.incident.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        machineId: data.machineId,
        taskId: data.taskId,
        createdById: data.createdById,
        status: IncidentStatus.OPEN,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If machine breakdown, mark machine as requires attention
    if (data.type === IncidentType.MACHINE_BREAKDOWN && data.machineId) {
      await prisma.machine.update({
        where: { id: data.machineId },
        data: { status: MachineStatus.REQUIRES_ATTENTION },
      });
    }

    return incident;
  }

  async assignIncident(incidentId: string, userId: string) {
    // Check if incident is already assigned
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.status !== IncidentStatus.OPEN) {
      throw new Error('Incident is already assigned or resolved');
    }

    return prisma.incident.update({
      where: { id: incidentId },
      data: {
        resolvedById: userId,
        status: IncidentStatus.IN_PROGRESS,
      },
      include: {
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async resolveIncident(incidentId: string) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { machine: true },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    // If machine breakdown was resolved, mark machine as working
    if (
      incident.type === IncidentType.MACHINE_BREAKDOWN &&
      incident.machineId &&
      incident.machine
    ) {
      await prisma.machine.update({
        where: { id: incident.machineId },
        data: { status: MachineStatus.WORKING },
      });
    }

    return prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }

  async getIncidents(filters?: {
    status?: IncidentStatus;
    type?: IncidentType;
    machineId?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.machineId) {
      where.machineId = filters.machineId;
    }

    return prisma.incident.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getIncidentById(id: string) {
    return prisma.incident.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async deleteIncident(incidentId: string) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    return prisma.incident.delete({
      where: { id: incidentId },
    });
  }

  async getRecipientsForIncident(incident: CreateIncidentDto): Promise<string[]> {
    const recipients: string[] = [];

    if (incident.type === IncidentType.MACHINE_BREAKDOWN) {
      // Get all users and filter by tags in memory (Prisma JSON filtering is limited)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'ADMIN' },
            { role: 'MANAGER' }, // Managers can also help
          ],
        },
        select: { id: true, tags: true, role: true },
      });

      // Filter users with "Настройщик" tag
      const filteredUsers = users.filter((user) => {
        if (user.role === 'ADMIN') return true;
        if (user.tags && Array.isArray(user.tags)) {
          return (user.tags as string[]).includes('Настройщик');
        }
        return false;
      });

      recipients.push(...filteredUsers.map((u) => u.id));
    } else if (incident.type === IncidentType.TASK_QUESTION) {
      // Only ADMIN
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      recipients.push(...admins.map((u) => u.id));
    }

    return recipients;
  }
}

