import prisma from '../config/database';
import { MachineStatus } from '@prisma/client';

export interface CreateMachineDto {
  name: string;
  photoUrl?: string;
  status?: MachineStatus;
  efficiencyNorm: number;
  quantity?: number;
  capabilities: string[];
}

export interface UpdateMachineDto {
  name?: string;
  photoUrl?: string | null;
  status?: MachineStatus;
  efficiencyNorm?: number;
  quantity?: number;
  capabilities?: string[];
}

export class MachinesService {
  async getAll() {
    return prisma.machine.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.machine.findUnique({
      where: { id },
      include: {
        incidents: {
          where: {
            type: 'MACHINE_BREAKDOWN',
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
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
          },
        },
      },
    });
  }

  async create(data: CreateMachineDto) {
    return prisma.machine.create({
      data: {
        name: data.name,
        photoUrl: data.photoUrl,
        status: data.status || MachineStatus.WORKING,
        efficiencyNorm: data.efficiencyNorm,
        quantity: data.quantity || 1,
        capabilities: data.capabilities,
      },
    });
  }

  async update(id: string, data: UpdateMachineDto) {
    return prisma.machine.update({
      where: { id },
      data: {
        ...data,
        capabilities: data.capabilities ? data.capabilities : undefined,
      },
    });
  }

  async delete(id: string) {
    // Check if machine has active tasks
    const activeTasks = await prisma.productionTask.findFirst({
      where: {
        machineId: id,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    if (activeTasks) {
      throw new Error('Cannot delete machine with active tasks');
    }

    return prisma.machine.delete({
      where: { id },
    });
  }

  async getHistory(id: string) {
    return prisma.incident.findMany({
      where: {
        machineId: id,
        type: 'MACHINE_BREAKDOWN',
      },
      orderBy: { createdAt: 'desc' },
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
      },
    });
  }
}

