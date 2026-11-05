import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.ts';
import { BoardRepository } from '../models/Board.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-super-secret-jwt-key-2026-production-ready';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: { id: string; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
}

export async function authorizeBoardMember(req: Request, _res: Response, next: NextFunction) {
  const boardId = req.params.boardId || req.params.id || req.body.boardId;
  const user = req.user;

  if (!user) {
    return next(new AppError('Unauthorized', 401));
  }

  if (!boardId) {
    return next(new AppError('Board ID is required', 400));
  }

  const board = await BoardRepository.findById(boardId);
  if (!board) {
    return next(new AppError('Board not found', 404));
  }

  const isMember = board.members.includes(user.id) || board.ownerId === user.id;
  if (!isMember) {
    return next(new AppError('Access denied. You are not a member of this board.', 403));
  }

  next();
}
