import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Convenience middleware for specific roles
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireManager = requireRole(UserRole.MANAGER, UserRole.ADMIN);
export const requireEmployee = requireRole(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.MANAGER);

