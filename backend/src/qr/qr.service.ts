import prisma from '../config/database';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { QRPointType } from '@prisma/client';

export class QRService {
  async generateQRPoint(type: QRPointType, name: string) {
    // Generate unique hash
    const hash = crypto.randomBytes(32).toString('hex');

    // Create QR point in database
    const qrPoint = await prisma.qRPoint.create({
      data: {
        hash,
        type,
        name,
      },
    });

    // Generate QR code image
    const qrData = JSON.stringify({
      type: 'QR_POINT',
      hash,
      pointType: type,
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
    });

    return {
      qrPoint,
      qrCodeDataURL,
    };
  }

  async getAllQRPoints() {
    return prisma.qRPoint.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQRPointByHash(hash: string) {
    return prisma.qRPoint.findUnique({
      where: { hash },
    });
  }

  async deleteQRPoint(id: string) {
    return prisma.qRPoint.delete({
      where: { id },
    });
  }
}

