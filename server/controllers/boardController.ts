import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BoardRepository } from '../models/Board.ts';
import { ColumnRepository } from '../models/Column.ts';
import { TaskRepository } from '../models/Task.ts';
import { UserRepository } from '../models/User.ts';
import { AppError } from '../middleware/errorHandler.ts';

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Board title is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1, 'Board title is required').max(100).optional(),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid member email address'),
});

export const BoardController = {
  async listBoards(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const boards = await BoardRepository.findForUser(userId);
      const populated = await Promise.all(boards.map((b) => BoardRepository.populateBoard(b)));

      res.status(200).json({
        success: true,
        boards: populated,
      });
    } catch (err) {
      next(err);
    }
  },

  async getBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = req.params.id;
      const userId = req.user!.id;

      const board = await BoardRepository.findById(boardId);
      if (!board) {
        return next(new AppError('Board not found', 404));
      }

      const isMember = board.members.includes(userId) || board.ownerId === userId;
      if (!isMember) {
        return next(new AppError('Access denied. You are not a member of this board.', 403));
      }

      const populatedBoard = await BoardRepository.populateBoard(board);
      const columns = await ColumnRepository.findByBoardId(boardId);
      const tasks = await TaskRepository.findByBoardId(boardId);
      const populatedTasks = await TaskRepository.populateTasks(tasks);

      res.status(200).json({
        success: true,
        board: populatedBoard,
        columns,
        tasks: populatedTasks,
      });
    } catch (err) {
      next(err);
    }
  },

  async createBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { title, description } = req.body;

      const newBoard = await BoardRepository.create({
        title,
        description,
        ownerId: userId,
      });

      // Automatically create standard default columns
      const defaultColumns = [
        { title: 'To Do', color: '#3B82F6' },
        { title: 'In Progress', color: '#F59E0B' },
        { title: 'Code Review', color: '#8B5CF6' },
        { title: 'Done', color: '#10B981' },
      ];

      for (let i = 0; i < defaultColumns.length; i++) {
        await ColumnRepository.create({
          boardId: newBoard._id,
          title: defaultColumns[i].title,
          color: defaultColumns[i].color,
          order: i,
        });
      }

      const populated = await BoardRepository.populateBoard(newBoard);
      const columns = await ColumnRepository.findByBoardId(newBoard._id);

      res.status(201).json({
        success: true,
        message: 'Board created successfully with default columns',
        board: populated,
        columns,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = req.params.id;
      const userId = req.user!.id;
      const { title, description } = req.body;

      const board = await BoardRepository.findById(boardId);
      if (!board) {
        return next(new AppError('Board not found', 404));
      }

      if (board.ownerId !== userId && !board.members.includes(userId)) {
        return next(new AppError('Access denied', 403));
      }

      const updated = await BoardRepository.update(boardId, {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
      });

      res.status(200).json({
        success: true,
        board: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = req.params.id;
      const userId = req.user!.id;

      const board = await BoardRepository.findById(boardId);
      if (!board) {
        return next(new AppError('Board not found', 404));
      }

      if (board.ownerId !== userId) {
        return next(new AppError('Only the board owner can delete this board', 403));
      }

      // Cascade delete board's columns and tasks
      const columns = await ColumnRepository.findByBoardId(boardId);
      for (const col of columns) {
        await ColumnRepository.delete(col._id);
      }
      const tasks = await TaskRepository.findByBoardId(boardId);
      for (const t of tasks) {
        await TaskRepository.delete(t._id);
      }
      await BoardRepository.delete(boardId);

      res.status(200).json({
        success: true,
        message: 'Board and related columns and tasks deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = req.params.id;
      const { email } = req.body;
      const userToInvite = await UserRepository.findByEmail(email.toLowerCase().trim());

      if (!userToInvite) {
        return next(new AppError(`No registered user found with email "${email}". Make sure they sign up first.`, 404));
      }

      const board = await BoardRepository.findById(boardId);
      if (!board) {
        return next(new AppError('Board not found', 404));
      }

      if (board.members.includes(userToInvite._id)) {
        return next(new AppError(`${userToInvite.name} is already a member of this board.`, 400));
      }

      const updated = await BoardRepository.addMember(boardId, userToInvite._id);
      const populated = await BoardRepository.populateBoard(updated!);

      res.status(200).json({
        success: true,
        message: `${userToInvite.name} has been added to the board!`,
        board: populated,
      });
    } catch (err) {
      next(err);
    }
  },
};
