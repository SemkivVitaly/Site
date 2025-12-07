import { Request, Response } from 'express';
import { QRService } from './qr.service';
import { QRPointType } from '@prisma/client';

const qrService = new QRService();

export class QRController {
  async generateQRPoint(req: Request, res: Response) {
    try {
      const { type, name } = req.body;

      if (!type || !name) {
        return res.status(400).json({ error: 'Type and name are required' });
      }

      if (!Object.values(QRPointType).includes(type)) {
        return res.status(400).json({ error: 'Invalid QR point type' });
      }

      const result = await qrService.generateQRPoint(type, name);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllQRPoints(req: Request, res: Response) {
    try {
      const points = await qrService.getAllQRPoints();
      res.json(points);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getQRPointByHash(req: Request, res: Response) {
    try {
      const { hash } = req.params;
      const point = await qrService.getQRPointByHash(hash);

      if (!point) {
        return res.status(404).json({ error: 'QR point not found' });
      }

      res.json(point);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteQRPoint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await qrService.deleteQRPoint(id);
      res.json({ message: 'QR point deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

