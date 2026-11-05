import mongoose, { Schema, Document } from 'mongoose';
import { inMemoryDb, IBoardDoc } from '../db/connection.ts';
import { UserRepository } from './User.ts';

export interface IBoard extends Document {
  title: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  },
  { timestamps: true }
);

BoardSchema.index({ members: 1 });

export const BoardModel = mongoose.models.Board || mongoose.model<IBoard>('Board', BoardSchema);

export const BoardRepository = {
  async findById(id: string): Promise<IBoardDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const board = await BoardModel.findById(id).lean();
      return board ? (board as unknown as IBoardDoc) : null;
    }
    return inMemoryDb.boards.get(id) || null;
  },

  async findForUser(userId: string): Promise<IBoardDoc[]> {
    if (mongoose.connection.readyState === 1) {
      const boards = await BoardModel.find({
        $or: [{ ownerId: userId }, { members: userId }],
      })
        .sort({ updatedAt: -1 })
        .lean();
      return boards as unknown as IBoardDoc[];
    }
    return Array.from(inMemoryDb.boards.values())
      .filter((b) => b.ownerId === userId || b.members.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async create(data: { title: string; description?: string; ownerId: string }): Promise<IBoardDoc> {
    if (mongoose.connection.readyState === 1) {
      const board = new BoardModel({
        title: data.title,
        description: data.description || '',
        ownerId: data.ownerId,
        members: [data.ownerId],
      });
      await board.save();
      return board.toObject() as unknown as IBoardDoc;
    }

    const newId = `brd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newBoard: IBoardDoc = {
      _id: newId,
      title: data.title,
      description: data.description || '',
      ownerId: data.ownerId,
      members: [data.ownerId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDb.boards.set(newId, newBoard);
    return newBoard;
  },

  async update(id: string, updates: Partial<IBoardDoc>): Promise<IBoardDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const board = await BoardModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      return board ? (board as unknown as IBoardDoc) : null;
    }

    const board = inMemoryDb.boards.get(id);
    if (!board) return null;
    const updated = { ...board, ...updates, updatedAt: new Date() };
    inMemoryDb.boards.set(id, updated);
    return updated;
  },

  async addMember(boardId: string, userId: string): Promise<IBoardDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const board = await BoardModel.findByIdAndUpdate(
        boardId,
        { $addToSet: { members: userId } },
        { new: true }
      ).lean();
      return board ? (board as unknown as IBoardDoc) : null;
    }

    const board = inMemoryDb.boards.get(boardId);
    if (!board) return null;
    if (!board.members.includes(userId)) {
      board.members.push(userId);
      board.updatedAt = new Date();
      inMemoryDb.boards.set(boardId, board);
    }
    return board;
  },

  async delete(id: string): Promise<boolean> {
    if (mongoose.connection.readyState === 1) {
      const res = await BoardModel.findByIdAndDelete(id);
      return !!res;
    }
    return inMemoryDb.boards.delete(id);
  },

  async populateBoard(board: IBoardDoc) {
    const owner = await UserRepository.findById(board.ownerId);
    const members = await UserRepository.findByIds(board.members);
    return {
      ...board,
      owner: owner ? { _id: owner._id, name: owner.name, email: owner.email, avatarUrl: owner.avatarUrl } : null,
      members: members.map((m) => ({
        _id: m._id,
        name: m.name,
        email: m.email,
        avatarUrl: m.avatarUrl,
      })),
    };
  },
};
