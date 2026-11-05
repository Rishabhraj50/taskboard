import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ColumnRepository } from '../models/Column.ts';
import { BoardRepository } from '../models/Board.ts';
import { TaskRepository } from '../models/Task.ts';
import { AppError } from '../middleware/errorHandler.ts';

export const createColumnSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  title: z.string().min(1, 'Column title is required').max(50),
  color: z.string().optional(),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50).optional(),
  color: z.string().optional(),
});

export const reorderColumnsSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  orderedColumnIds: z.array(z.string()).min(1, 'orderedColumnIds must contain at least 1 column ID'),
});

export const ColumnController = {
  async createColumn(req: Request, res: Response, next: NextFunction) {
    try {
      const { boardId, title, color } = req.body;
      const board = await BoardRepository.findById(boardId);
      if (!board) {
        return next(new AppError('Board not found', 404));
      }

      const newColumn = await ColumnRepository.create({
        boardId,
        title,
        color,
      });

      res.status(201).json({
        success: true,
        column: newColumn,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateColumn(req: Request, res: Response, next: NextFunction) {
    try {
      const columnId = req.params.id;
      const { title, color } = req.body;

      const column = await ColumnRepository.findById(columnId);
      if (!column) {
        return next(new AppError('Column not found', 404));
      }

      const updated = await ColumnRepository.update(columnId, {
        ...(title !== undefined ? { title } : {}),
        ...(color !== undefined ? { color } : {}),
      });

      res.status(200).json({
        success: true,
        column: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteColumn(req: Request, res: Response, next: NextFunction) {
    try {
      const columnId = req.params.id;
      const column = await ColumnRepository.findById(columnId);
      if (!column) {
        return next(new AppError('Column not found', 404));
      }

      // Delete tasks inside this column
      const tasks = await TaskRepository.findByBoardId(column.boardId);
      const colTasks = tasks.filter((t) => t.columnId === columnId);
      for (const t of colTasks) {
        await TaskRepository.delete(t._id);
      }

      await ColumnRepository.delete(columnId);

      res.status(200).json({
        success: true,
        message: 'Column and associated tasks deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  async reorderColumns(req: Request, res: Response, next: NextFunction) {
    try {
      const { boardId, orderedColumnIds } = req.body;
      const updated = await ColumnRepository.reorderColumns(boardId, orderedColumnIds);

      res.status(200).json({
        success: true,
        columns: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
