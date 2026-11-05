import mongoose, { Schema, Document } from 'mongoose';
import { inMemoryDb, IColumnDoc } from '../db/connection.ts';

export interface IColumn extends Document {
  boardId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema = new Schema<IColumn>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    color: { type: String, default: '#64748B' },
  },
  { timestamps: true }
);

ColumnSchema.index({ boardId: 1, order: 1 });

export const ColumnModel = mongoose.models.Column || mongoose.model<IColumn>('Column', ColumnSchema);

export const ColumnRepository = {
  async findByBoardId(boardId: string): Promise<IColumnDoc[]> {
    if (mongoose.connection.readyState === 1) {
      const cols = await ColumnModel.find({ boardId }).sort({ order: 1 }).lean();
      return cols as unknown as IColumnDoc[];
    }
    return Array.from(inMemoryDb.columns.values())
      .filter((c) => c.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  },

  async findById(id: string): Promise<IColumnDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const col = await ColumnModel.findById(id).lean();
      return col ? (col as unknown as IColumnDoc) : null;
    }
    return inMemoryDb.columns.get(id) || null;
  },

  async create(data: { boardId: string; title: string; order?: number; color?: string }): Promise<IColumnDoc> {
    const existing = await this.findByBoardId(data.boardId);
    const order = data.order !== undefined ? data.order : existing.length;

    if (mongoose.connection.readyState === 1) {
      const col = new ColumnModel({
        boardId: data.boardId,
        title: data.title,
        order,
        color: data.color || '#64748B',
      });
      await col.save();
      return col.toObject() as unknown as IColumnDoc;
    }

    const newId = `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCol: IColumnDoc = {
      _id: newId,
      boardId: data.boardId,
      title: data.title,
      order,
      color: data.color || '#64748B',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDb.columns.set(newId, newCol);
    return newCol;
  },

  async update(id: string, updates: Partial<IColumnDoc>): Promise<IColumnDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const col = await ColumnModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      return col ? (col as unknown as IColumnDoc) : null;
    }

    const col = inMemoryDb.columns.get(id);
    if (!col) return null;
    const updated = { ...col, ...updates, updatedAt: new Date() };
    inMemoryDb.columns.set(id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (mongoose.connection.readyState === 1) {
      const res = await ColumnModel.findByIdAndDelete(id);
      return !!res;
    }
    return inMemoryDb.columns.delete(id);
  },

  async reorderColumns(boardId: string, orderedColumnIds: string[]): Promise<IColumnDoc[]> {
    if (mongoose.connection.readyState === 1) {
      const bulkOps = orderedColumnIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id, boardId },
          update: { $set: { order: index } },
        },
      }));
      if (bulkOps.length > 0) {
        await ColumnModel.bulkWrite(bulkOps);
      }
      return this.findByBoardId(boardId);
    }

    orderedColumnIds.forEach((id, index) => {
      const col = inMemoryDb.columns.get(id);
      if (col && col.boardId === boardId) {
        col.order = index;
        col.updatedAt = new Date();
      }
    });
    return this.findByBoardId(boardId);
  },
};
