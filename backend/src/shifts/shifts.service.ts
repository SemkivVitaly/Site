import prisma from '../config/database';
import { QRPointType } from '@prisma/client';

export interface ProcessQRScanDto {
  userId: string;
  qrHash: string;
}

export interface CreateShiftDto {
  userId: string;
  date: Date;
  plannedStart?: Date;
}

export class ShiftsService {
  async processQRScan(data: ProcessQRScanDto) {
    const qrPoint = await prisma.qRPoint.findUnique({
      where: { hash: data.qrHash },
    });

    if (!qrPoint) {
      throw new Error('Invalid QR code');
    }

    // Обработка разных типов QR-точек
    if (qrPoint.type === QRPointType.LUNCH) {
      // Обед обрабатывается отдельными методами processLunch
      throw new Error('Lunch QR codes should be processed through lunch endpoints');
    }
    
    if (qrPoint.type === QRPointType.BREAK_AREA) {
      // Зона отдыха - можно использовать для отслеживания перерывов
      // Пока обрабатываем как обычный вход/выход
    }

    // Создаем дату "сегодня" в UTC для правильного сохранения в базе данных
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const today = new Date(Date.UTC(year, month, day));

    // Find or create shift for today
    let shift = await prisma.shift.findFirst({
      where: {
        userId: data.userId,
        date: today,
      },
    });

    if (!shift) {
      shift = await prisma.shift.create({
        data: {
          userId: data.userId,
          date: today,
        },
      });
    }

    // Используем уже созданную переменную now для времени сканирования
    // Если уже есть вход, то это выход, иначе - вход
    if (shift.timeIn && !shift.timeOut) {
      // Выход
      return prisma.shift.update({
        where: { id: shift.id },
        data: {
          timeOut: now,
        },
      });
    } else if (!shift.timeIn) {
      // Вход - проверка на опоздание
      const isLate = shift.plannedStart
        ? now > new Date(shift.plannedStart.getTime() + 15 * 60 * 1000) // 15 min grace period
        : false;

      return prisma.shift.update({
        where: { id: shift.id },
        data: {
          timeIn: now,
          isLate,
        },
      });
    } else {
      // Уже есть и вход и выход - повторное сканирование не обрабатываем
      return shift;
    }
  }

  async processLunch(userId: string, action: 'start' | 'end') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let shift = await prisma.shift.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    if (!shift) {
      throw new Error('Shift not found. Please scan QR code first to start your shift.');
    }

    const now = new Date();

    if (action === 'start') {
      if (shift.lunchStart) {
        throw new Error('Lunch already started');
      }
      return prisma.shift.update({
        where: { id: shift.id },
        data: {
          lunchStart: now,
        },
      });
    } else {
      // end
      if (!shift.lunchStart) {
        throw new Error('Lunch not started');
      }
      const lunchEnd = now;
      const lunchDuration = Math.floor(
        (lunchEnd.getTime() - shift.lunchStart.getTime()) / (1000 * 60)
      );
      const lunchOvertime = lunchDuration > 60 ? lunchDuration - 60 : null;

      return prisma.shift.update({
        where: { id: shift.id },
        data: {
          lunchEnd,
          lunchOvertime,
        },
      });
    }
  }

  async markNoLunch(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let shift = await prisma.shift.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    if (!shift) {
      throw new Error('Shift not found. Please scan QR code first to start your shift.');
    }

    // Mark as no lunch by setting lunchStart and lunchEnd to a special marker
    // We'll use a specific date to indicate "no lunch" (e.g., 1970-01-01)
    const noLunchMarker = new Date('1970-01-01T00:00:00.000Z');

    return prisma.shift.update({
      where: { id: shift.id },
      data: {
        lunchStart: noLunchMarker,
        lunchEnd: noLunchMarker,
        lunchOvertime: null,
      },
    });
  }

  async createShift(data: CreateShiftDto) {
    // Убеждаемся, что дата создается правильно для сохранения в PostgreSQL как Date
    const inputDate = new Date(data.date);
    const year = inputDate.getFullYear();
    const month = inputDate.getMonth();
    const day = inputDate.getDate();
    const dateOnly = new Date(Date.UTC(year, month, day));
    
    return prisma.shift.create({
      data: {
        userId: data.userId,
        date: dateOnly,
        plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getShifts(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    return prisma.shift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getShiftById(id: string) {
    return prisma.shift.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getCurrentShift(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.shift.findFirst({
      where: {
        userId,
        date: today,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getShiftCalendar(startDate: Date, endDate: Date) {
    // Преобразуем входные даты в локальные компоненты, затем в UTC для корректного сравнения
    // Это нужно, так как frontend отправляет ISO строки, которые могут быть в UTC,
    // но мы хотим работать с локальной датой пользователя
    const startInput = new Date(startDate);
    const endInput = new Date(endDate);
    
    // Используем локальные компоненты даты из входной даты
    // Это гарантирует, что мы работаем с датой, которую видит пользователь
    const startUTC = new Date(Date.UTC(
      startInput.getFullYear(), 
      startInput.getMonth(), 
      startInput.getDate()
    ));
    const endUTC = new Date(Date.UTC(
      endInput.getFullYear(), 
      endInput.getMonth(), 
      endInput.getDate()
    ));
    // Добавляем 1 день к endUTC, чтобы включить весь последний день
    endUTC.setUTCDate(endUTC.getUTCDate() + 1);
    endUTC.setUTCMilliseconds(endUTC.getUTCMilliseconds() - 1);
    
    const shifts = await prisma.shift.findMany({
      where: {
        date: {
          gte: startUTC,
          lte: endUTC,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Group by date using UTC date components since dates are stored in UTC
    const calendar: Record<string, any[]> = {};
    shifts.forEach((shift) => {
      // Используем UTC компоненты даты, так как даты хранятся в UTC в базе данных
      const shiftDate = new Date(shift.date);
      const year = shiftDate.getUTCFullYear();
      const month = String(shiftDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(shiftDate.getUTCDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      calendar[dateKey].push(shift);
    });

    return calendar;
  }

  async deleteShift(shiftId: string, userId: string, userRole: string) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    // Only allow deletion if:
    // 1. User is admin, OR
    // 2. User owns the shift AND shift hasn't started yet (no timeIn)
    if (userRole !== 'ADMIN') {
      if (shift.userId !== userId) {
        throw new Error('You can only delete your own shifts');
      }
      if (shift.timeIn) {
        throw new Error('Cannot delete a shift that has already started');
      }
    }

    // Only allow deletion of planned shifts (no timeIn)
    if (shift.timeIn) {
      throw new Error('Cannot delete a shift that has already started');
    }

    return prisma.shift.delete({
      where: { id: shiftId },
    });
  }
}

