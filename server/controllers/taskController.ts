import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskRepository } from '../models/Task.ts';
import { ColumnRepository } from '../models/Column.ts';
import { BoardRepository } from '../models/Board.ts';
import { AppError } from '../middleware/errorHandler.ts';

export const filterTasksQuerySchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  assigneeId: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  label: z.string().optional(),
  overdue: z.string().optional(),
  search: z.string().optional(),
});

export const createTaskSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  columnId: z.string().min(1, 'Column ID is required'),
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  columnId: z.string().optional(),
  order: z.number().optional(),
});

export const moveTaskSchema = z.object({
  targetColumnId: z.string().min(1, 'Target column ID is required'),
  newOrder: z.number().min(0, 'newOrder must be 0 or greater'),
});

export const TaskController = {
  async listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { boardId, assigneeId, priority, label, overdue, search } = req.query as {
        boardId: string;
        assigneeId?: string;
        priority?: 'Low' | 'Medium' | 'High';
        label?: string;
        overdue?: string;
        search?: string;
      };

      const board = await BoardRepository.findById(boardId);
      if (!board) {
        return next(new AppError('Board not found', 404));
      }

      const tasks = await TaskRepository.findFiltered(boardId, {
        assigneeId,
        priority,
        label,
        overdue: overdue === 'true',
        search,
      });

      const populated = await TaskRepository.populateTasks(tasks);

      res.status(200).json({
        success: true,
        count: populated.length,
        tasks: populated,
      });
    } catch (err) {
      next(err);
    }
  },

  async getTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id;
      const task = await TaskRepository.findById(taskId);
      if (!task) {
        return next(new AppError('Task not found', 404));
      }

      const [populated] = await TaskRepository.populateTasks([task]);
      res.status(200).json({
        success: true,
        task: populated,
      });
    } catch (err) {
      next(err);
    }
  },

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userName = req.user!.name;
      const { boardId, columnId, title, description, assigneeId, priority, dueDate, labels } = req.body;

      const column = await ColumnRepository.findById(columnId);
      if (!column || column.boardId !== boardId) {
        return next(new AppError('Invalid column for this board', 400));
      }

      const newTask = await TaskRepository.create({
        boardId,
        columnId,
        title,
        description,
        assigneeId: assigneeId || null,
        createdBy: userId,
        creatorName: userName,
        priority,
        dueDate: dueDate || null,
        labels: labels || [],
      });

      const [populated] = await TaskRepository.populateTasks([newTask]);

      res.status(201).json({
        success: true,
        task: populated,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id;
      const user = req.user!;
      const updates = req.body;

      const existing = await TaskRepository.findById(taskId);
      if (!existing) {
        return next(new AppError('Task not found', 404));
      }

      const updated = await TaskRepository.update(taskId, updates, {
        id: user.id,
        name: user.name,
      });

      const [populated] = await TaskRepository.populateTasks([updated!]);

      res.status(200).json({
        success: true,
        task: populated,
      });
    } catch (err) {
      next(err);
    }
  },

  async moveTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id;
      const user = req.user!;
      const { targetColumnId, newOrder } = req.body;

      const task = await TaskRepository.findById(taskId);
      if (!task) {
        return next(new AppError('Task not found', 404));
      }

      const targetCol = await ColumnRepository.findById(targetColumnId);
      if (!targetCol || targetCol.boardId !== task.boardId) {
        return next(new AppError('Invalid destination column', 400));
      }

      const updated = await TaskRepository.moveAndReorder({
        taskId,
        targetColumnId,
        newOrder,
        actor: { id: user.id, name: user.name },
      });

      const [populated] = await TaskRepository.populateTasks([updated!]);

      res.status(200).json({
        success: true,
        message: 'Task moved successfully',
        task: populated,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id;
      const task = await TaskRepository.findById(taskId);
      if (!task) {
        return next(new AppError('Task not found', 404));
      }

      await TaskRepository.delete(taskId);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};
