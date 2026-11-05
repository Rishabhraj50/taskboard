import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRepository } from '../models/User.ts';
import { signToken } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await UserRepository.findByEmail(normalizedEmail);
      if (existing) {
        return next(new AppError('A user with this email already exists', 409));
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await UserRepository.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });

      const token = signToken({
        id: user._id,
        email: user.email,
        name: user.name,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = await UserRepository.findByEmail(normalizedEmail);
      if (!user) {
        return next(new AppError('Invalid email or password', 401));
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return next(new AppError('Invalid email or password', 401));
      }

      const token = signToken({
        id: user._id,
        email: user.email,
        name: user.name,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new AppError('Unauthorized', 401));
      }

      const user = await UserRepository.findById(req.user.id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserRepository.listAll();
      res.status(200).json({
        success: true,
        users,
      });
    } catch (err) {
      next(err);
    }
  },
};
