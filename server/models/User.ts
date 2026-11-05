import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { inMemoryDb, IUserDoc } from '../db/connection.ts';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Data Access Layer supporting both Mongoose and In-Memory Datastore
export const UserRepository = {
  async findByEmail(email: string): Promise<IUserDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      return user ? (user as unknown as IUserDoc) : null;
    }
    for (const user of inMemoryDb.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  },

  async findById(id: string): Promise<IUserDoc | null> {
    if (mongoose.connection.readyState === 1) {
      const user = await UserModel.findById(id).lean();
      return user ? (user as unknown as IUserDoc) : null;
    }
    return inMemoryDb.users.get(id) || null;
  },

  async findByIds(ids: string[]): Promise<IUserDoc[]> {
    if (mongoose.connection.readyState === 1) {
      const users = await UserModel.find({ _id: { $in: ids } }).lean();
      return users as unknown as IUserDoc[];
    }
    return ids.map((id) => inMemoryDb.users.get(id)).filter(Boolean) as IUserDoc[];
  },

  async create(userData: { name: string; email: string; password: string; avatarUrl?: string }): Promise<IUserDoc> {
    if (mongoose.connection.readyState === 1) {
      const user = new UserModel({
        ...userData,
        email: userData.email.toLowerCase(),
      });
      await user.save();
      return user.toObject() as unknown as IUserDoc;
    }

    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: IUserDoc = {
      _id: newId,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDb.users.set(newId, newUser);
    return newUser;
  },

  async listAll(): Promise<Omit<IUserDoc, 'password'>[]> {
    if (mongoose.connection.readyState === 1) {
      const users = await UserModel.find({}, '-password').lean();
      return users as unknown as Omit<IUserDoc, 'password'>[];
    }
    return Array.from(inMemoryDb.users.values()).map(({ password: _, ...rest }) => rest);
  },
};
