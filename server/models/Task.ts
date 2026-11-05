import mongoose, { Schema, Document } from 'mongoose';
import { inMemoryDb, ITaskDoc, IActivityLog } from '../db/connection.ts';
import { UserRepository } from './User.ts';
import { ColumnRepository } from './Column.ts';

export interface ITask extends Document {
  boardId: mongoose.Types.ObjectId;
  columnId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assigneeId?: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string | null;
  labels: string[];
  order: number;
  activityLog: {
    action: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    timestamp: Date;
    details?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema({
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String },
});

const TaskSchema = new Schema<ITask>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    columnId: { type: Schema.Types.ObjectId, ref: 'Column', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium', index: true },
    dueDate: { type: String, default: null, index: true },
    labels: [{ type: String, trim: true, index: true }],
    order: { type: Number, required: true, default: 0 },
    activityLog: [ActivityLogSchema],
  },
  { timestamps: true }
);

TaskSchema.index({ columnId: 1, order: 1 });
TaskSchema.index({ boardId: 1, priority: 1 });
TaskSchema.index({ boardId: 1, assigneeId: 1 });

export const TaskModel = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export interface TaskFilterOptions {
  assigneeId?: string;
  priority?: string;
  label?: string;
  overdue?: boolean;
  search?: string;
}

export const TaskRepository = {
  async findById(id: string): Promise<ITaskDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const task = await TaskModel.findById(id).lean();
      return task ? (task as unknown as ITaskDoc) : null;
    }
    return inMemoryDb.tasks.get(id) || null;
  },

  async findByBoardId(boardId: string): Promise<ITaskDoc[]> {
    if (mongoose.connection.readyState === 1) {
      const tasks = await TaskModel.find({ boardId }).sort({ order: 1 }).lean();
      return tasks as unknown as ITaskDoc[];
    }
    return Array.from(inMemoryDb.tasks.values())
      .filter((t) => t.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  },

  async findFiltered(boardId: string, filters: TaskFilterOptions): Promise<ITaskDoc[]> {
    const todayStr = new Date().toISOString().split('T')[0];

    if (mongoose.connection.readyState === 1) {
      const query: Record<string, unknown> = { boardId };

      if (filters.assigneeId) {
        if (filters.assigneeId === 'unassigned') {
          query.assigneeId = null;
        } else {
          query.assigneeId = filters.assigneeId;
        }
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      if (filters.label) {
        query.labels = filters.label;
      }

      if (filters.overdue) {
        query.dueDate = { $ne: null, $lt: todayStr };
      }

      if (filters.search) {
        const regex = new RegExp(filters.search, 'i');
        query.$or = [{ title: regex }, { description: regex }];
      }

      const tasks = await TaskModel.find(query).sort({ order: 1 }).lean();
      return tasks as unknown as ITaskDoc[];
    }

    // In-Memory filtering with exact MongoDB query semantics
    return Array.from(inMemoryDb.tasks.values())
      .filter((task) => {
        if (task.boardId !== boardId) return false;

        if (filters.assigneeId) {
          if (filters.assigneeId === 'unassigned') {
            if (task.assigneeId) return false;
          } else if (task.assigneeId !== filters.assigneeId) {
            return false;
          }
        }

        if (filters.priority && task.priority !== filters.priority) {
          return false;
        }

        if (filters.label && !task.labels.includes(filters.label)) {
          return false;
        }

        if (filters.overdue) {
          if (!task.dueDate) return false;
          const taskDate = task.dueDate.split('T')[0];
          if (taskDate >= todayStr) return false;
        }

        if (filters.search) {
          const s = filters.search.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(s);
          const matchDesc = task.description.toLowerCase().includes(s);
          const matchLabel = task.labels.some((l) => l.toLowerCase().includes(s));
          if (!matchTitle && !matchDesc && !matchLabel) return false;
        }

        return true;
      })
      .sort((a, b) => a.order - b.order);
  },

  async create(data: {
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    assigneeId?: string | null;
    createdBy: string;
    creatorName: string;
    priority?: 'Low' | 'Medium' | 'High';
    dueDate?: string | null;
    labels?: string[];
  }): Promise<ITaskDoc> {
    const existingInCol = (await this.findByBoardId(data.boardId)).filter(
      (t) => t.columnId === data.columnId
    );
    const order = existingInCol.length;

    const initialActivity: IActivityLog = {
      _id: `act_${Date.now()}`,
      action: 'Created task',
      userId: data.createdBy,
      userName: data.creatorName,
      timestamp: new Date(),
      details: `Priority set to ${data.priority || 'Medium'}`,
    };

    if (mongoose.connection.readyState === 1) {
      const task = new TaskModel({
        boardId: data.boardId,
        columnId: data.columnId,
        title: data.title,
        description: data.description || '',
        assigneeId: data.assigneeId || null,
        createdBy: data.createdBy,
        priority: data.priority || 'Medium',
        dueDate: data.dueDate || null,
        labels: data.labels || [],
        order,
        activityLog: [initialActivity],
      });
      await task.save();
      return task.toObject() as unknown as ITaskDoc;
    }

    const newId = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTask: ITaskDoc = {
      _id: newId,
      boardId: data.boardId,
      columnId: data.columnId,
      title: data.title,
      description: data.description || '',
      assigneeId: data.assigneeId || null,
      createdBy: data.createdBy,
      priority: data.priority || 'Medium',
      dueDate: data.dueDate || null,
      labels: data.labels || [],
      order,
      activityLog: [initialActivity],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDb.tasks.set(newId, newTask);
    return newTask;
  },

  async update(id: string, updates: Partial<ITaskDoc>, actor?: { id: string; name: string }): Promise<ITaskDoc | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const activityLogs: IActivityLog[] = [...existing.activityLog];
    if (actor) {
      if (updates.priority && updates.priority !== existing.priority) {
        activityLogs.push({
          _id: `act_${Date.now()}_p`,
          action: `Priority changed to ${updates.priority}`,
          userId: actor.id,
          userName: actor.name,
          timestamp: new Date(),
        });
      }
      if (updates.assigneeId !== undefined && updates.assigneeId !== existing.assigneeId) {
        const newAssignee = updates.assigneeId ? await UserRepository.findById(updates.assigneeId) : null;
        activityLogs.push({
          _id: `act_${Date.now()}_a`,
          action: newAssignee ? `Assigned to ${newAssignee.name}` : 'Unassigned',
          userId: actor.id,
          userName: actor.name,
          timestamp: new Date(),
        });
      }
      if (updates.columnId && updates.columnId !== existing.columnId) {
        const fromCol = await ColumnRepository.findById(existing.columnId);
        const toCol = await ColumnRepository.findById(updates.columnId);
        activityLogs.push({
          _id: `act_${Date.now()}_m`,
          action: `Moved from "${fromCol?.title || 'Column'}" to "${toCol?.title || 'Column'}"`,
          userId: actor.id,
          userName: actor.name,
          timestamp: new Date(),
        });
      }
    }

    if (mongoose.connection.readyState === 1) {
      const task = await TaskModel.findByIdAndUpdate(
        id,
        { ...updates, activityLog: activityLogs, updatedAt: new Date() },
        { new: true }
      ).lean();
      return task ? (task as unknown as ITaskDoc) : null;
    }

    const updatedTask: ITaskDoc = {
      ...existing,
      ...updates,
      activityLog: activityLogs,
      updatedAt: new Date(),
    };
    inMemoryDb.tasks.set(id, updatedTask);
    return updatedTask;
  },

  async moveAndReorder(params: {
    taskId: string;
    targetColumnId: string;
    newOrder: number;
    actor: { id: string; name: string };
  }): Promise<ITaskDoc | null> {
    const task = await this.findById(params.taskId);
    if (!task) return null;

    const sourceColumnId = task.columnId;
    const targetColumnId = params.targetColumnId;
    const isDifferentColumn = sourceColumnId !== targetColumnId;

    // Fetch all tasks in board to re-index cleanly
    const boardTasks = await this.findByBoardId(task.boardId);

    // Filter target column tasks excluding moved task
    const targetColTasks = boardTasks
      .filter((t) => t.columnId === targetColumnId && t._id !== task._id)
      .sort((a, b) => a.order - b.order);

    // Insert task at new index
    targetColTasks.splice(params.newOrder, 0, {
      ...task,
      columnId: targetColumnId,
      order: params.newOrder,
    });

    // Re-index target column
    targetColTasks.forEach((t, idx) => {
      t.order = idx;
    });

    // If source column is different, re-index source column as well
    if (isDifferentColumn) {
      const sourceColTasks = boardTasks
        .filter((t) => t.columnId === sourceColumnId && t._id !== task._id)
        .sort((a, b) => a.order - b.order);
      sourceColTasks.forEach((t, idx) => {
        t.order = idx;
      });

      // Update in memory/db
      for (const t of sourceColTasks) {
        if (mongoose.connection.readyState === 1) {
          await TaskModel.findByIdAndUpdate(t._id, { order: t.order });
        } else {
          inMemoryDb.tasks.set(t._id, { ...t, updatedAt: new Date() });
        }
      }
    }

    // Save target column tasks
    for (const t of targetColTasks) {
      if (t._id === task._id) continue;
      if (mongoose.connection.readyState === 1) {
        await TaskModel.findByIdAndUpdate(t._id, { order: t.order });
      } else {
        inMemoryDb.tasks.set(t._id, { ...t, updatedAt: new Date() });
      }
    }

    // Update target task with column change and activity log
    return this.update(
      task._id,
      {
        columnId: targetColumnId,
        order: params.newOrder,
      },
      params.actor
    );
  },

  async delete(id: string): Promise<boolean> {
    if (mongoose.connection.readyState === 1) {
      const res = await TaskModel.findByIdAndDelete(id);
      return !!res;
    }
    return inMemoryDb.tasks.delete(id);
  },

  // GET /boards/:id/stats: Built using MongoDB Aggregation Pipeline
  async getBoardStats(boardId: string) {
    if (mongoose.connection.readyState === 1) {
      // 1. Column counts aggregation pipeline
      const columnStatsPipeline = [
        { $match: { boardId: new mongoose.Types.ObjectId(boardId) } },
        {
          $group: {
            _id: '$columnId',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'columns',
            localField: '_id',
            foreignField: '_id',
            as: 'column',
          },
        },
        {
          $project: {
            columnId: '$_id',
            count: 1,
            columnTitle: { $arrayElemAt: ['$column.title', 0] },
            columnColor: { $arrayElemAt: ['$column.color', 0] },
          },
        },
      ];

      // 2. Assignee counts aggregation pipeline
      const assigneeStatsPipeline = [
        { $match: { boardId: new mongoose.Types.ObjectId(boardId) } },
        {
          $group: {
            _id: '$assigneeId',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $project: {
            assigneeId: '$_id',
            count: 1,
            userName: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, 'Unassigned'] },
            userEmail: { $arrayElemAt: ['$user.email', 0] },
            avatarUrl: { $arrayElemAt: ['$user.avatarUrl', 0] },
          },
        },
      ];

      const [byColumn, byAssignee] = await Promise.all([
        TaskModel.aggregate(columnStatsPipeline),
        TaskModel.aggregate(assigneeStatsPipeline),
      ]);

      const totalTasks = await TaskModel.countDocuments({ boardId });
      const overdueTasks = await TaskModel.countDocuments({
        boardId,
        dueDate: { $ne: null, $lt: new Date().toISOString().split('T')[0] },
      });

      return {
        totalTasks,
        overdueTasks,
        byColumn,
        byAssignee,
      };
    }

    // In-Memory Aggregation Pipeline Simulation (matches identical output schema)
    const boardTasks = Array.from(inMemoryDb.tasks.values()).filter((t) => t.boardId === boardId);
    const columns = Array.from(inMemoryDb.columns.values()).filter((c) => c.boardId === boardId);
    const users = Array.from(inMemoryDb.users.values());

    const colMap = new Map(columns.map((c) => [c._id, c]));
    const userMap = new Map(users.map((u) => [u._id, u]));

    // Group by column
    const colCountMap = new Map<string, number>();
    for (const c of columns) {
      colCountMap.set(c._id, 0);
    }
    for (const t of boardTasks) {
      colCountMap.set(t.columnId, (colCountMap.get(t.columnId) || 0) + 1);
    }
    const byColumn = Array.from(colCountMap.entries()).map(([colId, count]) => {
      const col = colMap.get(colId);
      return {
        columnId: colId,
        columnTitle: col?.title || 'Unknown',
        columnColor: col?.color || '#64748B',
        count,
      };
    });

    // Group by assignee
    const assigneeCountMap = new Map<string | null, number>();
    for (const t of boardTasks) {
      const key = t.assigneeId || null;
      assigneeCountMap.set(key, (assigneeCountMap.get(key) || 0) + 1);
    }
    const byAssignee = Array.from(assigneeCountMap.entries()).map(([assigneeId, count]) => {
      const user = assigneeId ? userMap.get(assigneeId) : null;
      return {
        assigneeId,
        count,
        userName: user ? user.name : 'Unassigned',
        userEmail: user?.email,
        avatarUrl: user?.avatarUrl,
      };
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = boardTasks.filter((t) => t.dueDate && t.dueDate.split('T')[0] < todayStr).length;

    return {
      totalTasks: boardTasks.length,
      overdueTasks,
      byColumn,
      byAssignee,
    };
  },

  async populateTasks(tasks: ITaskDoc[]) {
    const users = await UserRepository.listAll();
    const userMap = new Map(users.map((u) => [u._id, u]));

    return tasks.map((task) => {
      const assignee = task.assigneeId ? userMap.get(task.assigneeId) : null;
      const creator = userMap.get(task.createdBy);
      return {
        ...task,
        assignee: assignee ? { _id: assignee._id, name: assignee.name, email: assignee.email, avatarUrl: assignee.avatarUrl } : null,
        creator: creator ? { _id: creator._id, name: creator.name, email: creator.email } : null,
      };
    });
  },
};
