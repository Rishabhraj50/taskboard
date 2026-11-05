import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDoc {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBoardDoc {
  _id: string;
  title: string;
  description?: string;
  ownerId: string;
  members: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface IColumnDoc {
  _id: string;
  boardId: string;
  title: string;
  order: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  _id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: string;
}

export interface ITaskDoc {
  _id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  assigneeId?: string | null;
  createdBy: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string | null;
  labels: string[];
  order: number;
  activityLog: IActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Database store with MongoDB-like semantics for hermetic execution
class InMemoryDb {
  users: Map<string, IUserDoc> = new Map();
  boards: Map<string, IBoardDoc> = new Map();
  columns: Map<string, IColumnDoc> = new Map();
  tasks: Map<string, ITaskDoc> = new Map();
  isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Seed realistic team users
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    const user1: IUserDoc = {
      _id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex@team.dev',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
    };

    const user2: IUserDoc = {
      _id: 'usr_priya',
      name: 'Priya Sharma',
      email: 'priya@team.dev',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      createdAt: new Date('2026-01-12'),
      updatedAt: new Date('2026-01-12'),
    };

    const user3: IUserDoc = {
      _id: 'usr_carlos',
      name: 'Carlos Mendez',
      email: 'carlos@team.dev',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    };

    const user4: IUserDoc = {
      _id: 'usr_sunidhi',
      name: 'Sunidhi Alok',
      email: 'sunidhi@team.dev',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
      createdAt: new Date('2026-01-18'),
      updatedAt: new Date('2026-01-18'),
    };

    this.users.set(user1._id, user1);
    this.users.set(user2._id, user2);
    this.users.set(user3._id, user3);
    this.users.set(user4._id, user4);

    // Seed Board 1: Product Engineering Sprint 14
    const board1: IBoardDoc = {
      _id: 'brd_sprint14',
      title: 'Product Engineering Sprint 14',
      description: 'Q1 milestone delivery for core application release, auth hardening, and drag-and-drop board.',
      ownerId: user1._id,
      members: [user1._id, user2._id, user3._id, user4._id],
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
    };

    // Seed Board 2: Mobile App Redesign
    const board2: IBoardDoc = {
      _id: 'brd_mobile',
      title: 'Mobile App Redesign',
      description: 'UX refresh, gesture interactions, and offline caching strategy.',
      ownerId: user2._id,
      members: [user1._id, user2._id, user3._id],
      createdAt: new Date('2026-02-10'),
      updatedAt: new Date('2026-02-10'),
    };

    this.boards.set(board1._id, board1);
    this.boards.set(board2._id, board2);

    // Seed Columns for Board 1
    const colBacklog: IColumnDoc = {
      _id: 'col_backlog',
      boardId: board1._id,
      title: 'Backlog',
      order: 0,
      color: '#64748B',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const colTodo: IColumnDoc = {
      _id: 'col_todo',
      boardId: board1._id,
      title: 'To Do',
      order: 1,
      color: '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const colInProgress: IColumnDoc = {
      _id: 'col_inprogress',
      boardId: board1._id,
      title: 'In Progress',
      order: 2,
      color: '#F59E0B',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const colReview: IColumnDoc = {
      _id: 'col_review',
      boardId: board1._id,
      title: 'Code Review',
      order: 3,
      color: '#8B5CF6',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const colDone: IColumnDoc = {
      _id: 'col_done',
      boardId: board1._id,
      title: 'Done',
      order: 4,
      color: '#10B981',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.columns.set(colBacklog._id, colBacklog);
    this.columns.set(colTodo._id, colTodo);
    this.columns.set(colInProgress._id, colInProgress);
    this.columns.set(colReview._id, colReview);
    this.columns.set(colDone._id, colDone);

    // Seed Tasks for Board 1
    const task1: ITaskDoc = {
      _id: 'tsk_101',
      boardId: board1._id,
      columnId: colTodo._id,
      title: 'JWT Token Refresh & Revocation Middleware',
      description: 'Implement secure Bearer token verification with central error handling and authorization guards.',
      assigneeId: user1._id,
      createdBy: user2._id,
      priority: 'High',
      dueDate: '2026-03-15',
      labels: ['Backend', 'Security'],
      order: 0,
      activityLog: [
        {
          _id: 'act_1',
          action: 'Created task',
          userId: user2._id,
          userName: user2.name,
          timestamp: new Date('2026-02-15T09:00:00Z'),
          details: 'Initial task specification defined with High priority.',
        },
        {
          _id: 'act_2',
          action: 'Assigned to Alex Rivera',
          userId: user2._id,
          userName: user2.name,
          timestamp: new Date('2026-02-15T09:05:00Z'),
        },
      ],
      createdAt: new Date('2026-02-15'),
      updatedAt: new Date('2026-02-15'),
    };

    const task2: ITaskDoc = {
      _id: 'tsk_102',
      boardId: board1._id,
      columnId: colInProgress._id,
      title: 'MongoDB Aggregation Pipeline for Board Stats',
      description: 'Construct $match, $group, and $lookup pipeline for real-time task count per column & assignee metrics.',
      assigneeId: user3._id,
      createdBy: user1._id,
      priority: 'High',
      dueDate: '2026-02-28',
      labels: ['Database', 'Aggregation'],
      order: 0,
      activityLog: [
        {
          _id: 'act_3',
          action: 'Created task',
          userId: user1._id,
          userName: user1.name,
          timestamp: new Date('2026-02-16T10:00:00Z'),
        },
        {
          _id: 'act_4',
          action: 'Moved from To Do to In Progress',
          userId: user3._id,
          userName: user3.name,
          timestamp: new Date('2026-02-17T11:20:00Z'),
          details: 'Started pipeline benchmark testing.',
        },
      ],
      createdAt: new Date('2026-02-16'),
      updatedAt: new Date('2026-02-17'),
    };

    const task3: ITaskDoc = {
      _id: 'tsk_103',
      boardId: board1._id,
      columnId: colInProgress._id,
      title: 'Optimistic Drag-and-Drop Column Reordering',
      description: 'Implement smooth drag events with instant local state updates and automatic rollback upon network error.',
      assigneeId: user2._id,
      createdBy: user1._id,
      priority: 'Medium',
      dueDate: '2026-03-01',
      labels: ['Frontend', 'UX'],
      order: 1,
      activityLog: [
        {
          _id: 'act_5',
          action: 'Created task',
          userId: user1._id,
          userName: user1.name,
          timestamp: new Date('2026-02-16T14:00:00Z'),
        },
      ],
      createdAt: new Date('2026-02-16'),
      updatedAt: new Date('2026-02-16'),
    };

    const task4: ITaskDoc = {
      _id: 'tsk_104',
      boardId: board1._id,
      columnId: colReview._id,
      title: 'Backend Input Validation using Zod Schemas',
      description: 'Define and enforce validation schemas for Board, Column, Task and Auth routes with 400 Bad Request responses.',
      assigneeId: user1._id,
      createdBy: user4._id,
      priority: 'Medium',
      dueDate: '2026-02-20',
      labels: ['Backend', 'Validation'],
      order: 0,
      activityLog: [
        {
          _id: 'act_6',
          action: 'Moved to Code Review',
          userId: user1._id,
          userName: user1.name,
          timestamp: new Date('2026-02-18T16:45:00Z'),
        },
      ],
      createdAt: new Date('2026-02-17'),
      updatedAt: new Date('2026-02-18'),
    };

    const task5: ITaskDoc = {
      _id: 'tsk_105',
      boardId: board1._id,
      columnId: colDone._id,
      title: 'Bcrypt Password Hashing & Salt Rounds Setup',
      description: 'Ensured 10 salt rounds and constant-time password comparison to prevent timing attacks.',
      assigneeId: user3._id,
      createdBy: user1._id,
      priority: 'Low',
      dueDate: '2026-02-10',
      labels: ['Security', 'Auth'],
      order: 0,
      activityLog: [
        {
          _id: 'act_7',
          action: 'Marked as Done',
          userId: user3._id,
          userName: user3.name,
          timestamp: new Date('2026-02-10T17:00:00Z'),
          details: 'Passes all password strength unit tests.',
        },
      ],
      createdAt: new Date('2026-02-08'),
      updatedAt: new Date('2026-02-10'),
    };

    const task6: ITaskDoc = {
      _id: 'tsk_106',
      boardId: board1._id,
      columnId: colBacklog._id,
      title: 'Audit Logging & Webhook Integrations',
      description: 'Stream task events to external monitoring platforms via transactional event outbox pattern.',
      assigneeId: null,
      createdBy: user2._id,
      priority: 'Low',
      dueDate: '2026-04-10',
      labels: ['DevOps', 'Stretch'],
      order: 0,
      activityLog: [
        {
          _id: 'act_8',
          action: 'Created task in Backlog',
          userId: user2._id,
          userName: user2.name,
          timestamp: new Date('2026-02-18T11:00:00Z'),
        },
      ],
      createdAt: new Date('2026-02-18'),
      updatedAt: new Date('2026-02-18'),
    };

    this.tasks.set(task1._id, task1);
    this.tasks.set(task2._id, task2);
    this.tasks.set(task3._id, task3);
    this.tasks.set(task4._id, task4);
    this.tasks.set(task5._id, task5);
    this.tasks.set(task6._id, task6);
  }
}

export const inMemoryDb = new InMemoryDb();

let isConnected = false;

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.startsWith('mongodb')) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${mongoUri.replace(/:[^:]*@/, ':****@')}`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });
      isConnected = true;
      console.log('[Database] Successfully connected to live MongoDB server!');
      return;
    } catch (err) {
      console.warn('[Database] External MongoDB connection not available. Falling back to native in-memory MongoDB store.', (err as Error).message);
    }
  }

  // Initialize in-memory seed database
  await inMemoryDb.init();
  isConnected = true;
  console.log('[Database] In-memory MongoDB-compatible datastore initialized with seed data.');
}

export function isDatabaseConnected() {
  return isConnected;
}
