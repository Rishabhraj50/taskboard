import { Request, Response, NextFunction } from 'express';
import { TaskRepository } from '../models/Task.ts';
import { BoardRepository } from '../models/Board.ts';
import { AppError } from '../middleware/errorHandler.ts';

export const StatsController = {
  async getBoardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = req.params.id;
      const board = await BoardRepository.findById(boardId);
      if (!board) {
        return next(new AppError('Board not found', 404));
      }

      // Execute MongoDB aggregation pipeline
      const stats = await TaskRepository.getBoardStats(boardId);

      res.status(200).json({
        success: true,
        boardId,
        boardTitle: board.title,
        stats,
      });
    } catch (err) {
      next(err);
    }
  },
};
