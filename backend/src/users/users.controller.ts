import { Request, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tags?: string[];
  salary?: number;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  tags?: string[];
  salary?: number;
}

export class UsersController {
  async getAll(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tags: true,
          salary: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tags: true,
          salary: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateUserDto = req.body;

      if (!data.email || !data.password || !data.firstName || !data.lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || UserRole.EMPLOYEE,
          tags: data.tags || [],
          salary: data.salary,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tags: true,
          salary: true,
          createdAt: true,
        },
      });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateUserDto = req.body;

      const updateData: any = {};

      if (data.email) {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: 'Email already taken' });
        }
        updateData.email = data.email;
      }

      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName) updateData.lastName = data.lastName;
      if (data.role) updateData.role = data.role;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.salary !== undefined) updateData.salary = data.salary;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tags: true,
          salary: true,
          createdAt: true,
        },
      });

      res.json(user);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id },
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(400).json({ error: error.message });
    }
  }
}

