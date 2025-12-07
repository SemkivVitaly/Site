import prisma from '../config/database';

export interface CreateMaterialDto {
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

export interface UpdateMaterialDto {
  name?: string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
}

export interface AssignMaterialToTaskDto {
  taskId: string;
  materialId: string;
  quantity: number;
}

export class MaterialsService {
  async getAll() {
    return prisma.material.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    return prisma.material.findUnique({
      where: { id },
      include: {
        taskMaterials: {
          include: {
            task: {
              select: {
                id: true,
                operation: true,
                order: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async create(data: CreateMaterialDto) {
    return prisma.material.create({
      data,
    });
  }

  async update(id: string, data: UpdateMaterialDto) {
    return prisma.material.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    // Check if material is used in tasks
    const taskMaterials = await prisma.taskMaterial.findFirst({
      where: { materialId: id },
    });

    if (taskMaterials) {
      throw new Error('Cannot delete material that is assigned to tasks');
    }

    return prisma.material.delete({
      where: { id },
    });
  }

  async assignMaterialToTask(data: AssignMaterialToTaskDto) {
    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId },
    });

    if (!material) {
      throw new Error('Material not found');
    }

    // Check if already assigned
    const existing = await prisma.taskMaterial.findFirst({
      where: {
        taskId: data.taskId,
        materialId: data.materialId,
      },
    });

    if (existing) {
      throw new Error('Material already assigned to this task');
    }

    return prisma.taskMaterial.create({
      data: {
        taskId: data.taskId,
        materialId: data.materialId,
        quantity: data.quantity,
      },
      include: {
        material: true,
        task: {
          select: {
            id: true,
            operation: true,
          },
        },
      },
    });
  }

  async consumeMaterialForTask(taskId: string, quantityProduced: number, defectQuantity: number) {
    // Get task materials
    const taskMaterials = await prisma.taskMaterial.findMany({
      where: { taskId },
      include: { material: true },
    });

    // Calculate total quantity needed (produced + defect)
    const totalQuantity = quantityProduced + defectQuantity;

    // Update material stock for each assigned material
    const updates = taskMaterials.map(async (taskMaterial) => {
      const quantityToConsume = (taskMaterial.quantity / taskMaterial.task.totalQuantity) * totalQuantity;

      const newStock = taskMaterial.material.currentStock - quantityToConsume;

      if (newStock < 0) {
        throw new Error(`Insufficient stock for ${taskMaterial.material.name}`);
      }

      return prisma.material.update({
        where: { id: taskMaterial.materialId },
        data: {
          currentStock: newStock,
        },
      });
    });

    await Promise.all(updates);

    // Check for low stock and return warnings
    const warnings: string[] = [];
    for (const taskMaterial of taskMaterials) {
      const material = await prisma.material.findUnique({
        where: { id: taskMaterial.materialId },
      });

      if (material && material.currentStock <= material.minStock) {
        warnings.push(`${material.name}: остаток ниже минимального (${material.currentStock} ${material.unit})`);
      }
    }

    return { warnings };
  }

  async getLowStockMaterials() {
    const allMaterials = await prisma.material.findMany({
      orderBy: { currentStock: 'asc' },
    });
    
    // Filter materials where currentStock <= minStock
    return allMaterials.filter(
      (material) => material.currentStock <= material.minStock
    );
  }
}

