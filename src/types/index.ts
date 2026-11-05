export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface BoardMember {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner?: BoardMember | null;
  members: BoardMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id: string;
  boardId: string;
  title: string;
  order: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

export interface Task {
  _id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  assigneeId?: string | null;
  assignee?: BoardMember | null;
  createdBy: string;
  creator?: { _id: string; name: string; email: string } | null;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string | null;
  labels: string[];
  order: number;
  activityLog: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ColumnStats {
  columnId: string;
  columnTitle: string;
  columnColor: string;
  count: number;
}

export interface AssigneeStats {
  assigneeId: string | null;
  count: number;
  userName: string;
  userEmail?: string;
  avatarUrl?: string;
}

export interface BoardStatsData {
  totalTasks: number;
  overdueTasks: number;
  byColumn: ColumnStats[];
  byAssignee: AssigneeStats[];
}

export interface TaskFilterState {
  assigneeId: string;
  priority: string;
  label: string;
  overdue: boolean;
  search: string;
}
