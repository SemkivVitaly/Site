import { Request, Response } from 'express';
import { MaterialsService, CreateMaterialDto, UpdateMaterialDto, AssignMaterialToTaskDto } from './materials.service';

const materialsService = new MaterialsService();

export class MaterialsController {
  async getAll(req: Request, res: Response) {
    try {
      const materials = await materialsService.getAll();
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const material = await materialsService.getById(id);

      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }

      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateMaterialDto = req.body;

      if (!data.name || !data.unit) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const material = await materialsService.create(data);
      res.status(201).json(material);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateMaterialDto = req.body;

      const material = await materialsService.update(id, data);
      res.json(material);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await materialsService.delete(id);
      res.json({ message: 'Material deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignMaterialToTask(req: Request, res: Response) {
    try {
      const data: AssignMaterialToTaskDto = req.body;

      if (!data.taskId || !data.materialId || !data.quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const taskMaterial = await materialsService.assignMaterialToTask(data);
      res.status(201).json(taskMaterial);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getLowStockMaterials(req: Request, res: Response) {
    try {
      const materials = await materialsService.getLowStockMaterials();
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

