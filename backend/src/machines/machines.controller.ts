import { Request, Response } from 'express';
import { MachinesService, CreateMachineDto, UpdateMachineDto } from './machines.service';
import path from 'path';
import fs from 'fs';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const machinesService = new MachinesService();

export class MachinesController {
  async getAll(req: Request, res: Response) {
    try {
      const machines = await machinesService.getAll();
      res.json(machines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const machine = await machinesService.getById(id);
      
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }

      res.json(machine);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateMachineDto = req.body;
      
      if (!data.name || !data.efficiencyNorm || !data.capabilities) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const machine = await machinesService.create(data);
      res.status(201).json(machine);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: MulterRequest, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateMachineDto = req.body;

      // If file was uploaded, update photoUrl
      if (req.file) {
        const photoUrl = `/uploads/${req.file.filename}`;
        data.photoUrl = photoUrl;

        // Delete old photo if exists
        const oldMachine = await machinesService.getById(id);
        if (oldMachine?.photoUrl && oldMachine.photoUrl.startsWith('/uploads/')) {
          const oldPhotoPath = path.join(__dirname, '../../public', oldMachine.photoUrl);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
      }

      const machine = await machinesService.update(id, data);
      res.json(machine);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async uploadPhoto(req: MulterRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const photoUrl = `/uploads/${req.file.filename}`;

      // Delete old photo if exists
      const oldMachine = await machinesService.getById(id);
      if (oldMachine?.photoUrl && oldMachine.photoUrl.startsWith('/uploads/')) {
        const oldPhotoPath = path.join(__dirname, '../../public', oldMachine.photoUrl);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      const machine = await machinesService.update(id, { photoUrl });
      res.json(machine);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deletePhoto(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const machine = await machinesService.getById(id);
      if (!machine) {
        return res.status(404).json({ error: 'Machine not found' });
      }

      // Delete photo file if exists
      if (machine.photoUrl && machine.photoUrl.startsWith('/uploads/')) {
        const photoPath = path.join(__dirname, '../../public', machine.photoUrl);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      const updatedMachine = await machinesService.update(id, { photoUrl: undefined });
      res.json(updatedMachine);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await machinesService.delete(id);
      res.json({ message: 'Machine deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const history = await machinesService.getHistory(id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

