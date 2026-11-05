import { Board, Column, Task, BoardStatsData, User } from '../types/index.ts';

const TOKEN_KEY = 'taskflow_auth_token';
const USER_KEY = 'taskflow_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredAuth();
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.details ? JSON.stringify(data.details) : `Request failed with status ${response.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

// API Methods
export const api = {
  // Auth
  async login(email: string, password: string) {
    return apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string) {
    return apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async getMe() {
    return apiRequest<{ success: boolean; user: User }>('/api/auth/me');
  },

  async listUsers() {
    return apiRequest<{ success: boolean; users: User[] }>('/api/auth/users');
  },

  // Boards
  async listBoards() {
    return apiRequest<{ success: boolean; boards: Board[] }>('/api/boards');
  },

  async getBoard(id: string) {
    return apiRequest<{ success: boolean; board: Board; columns: Column[]; tasks: Task[] }>(
      `/api/boards/${id}`
    );
  },

  async createBoard(title: string, description?: string) {
    return apiRequest<{ success: boolean; board: Board; columns: Column[] }>('/api/boards', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  async updateBoard(id: string, data: { title?: string; description?: string }) {
    return apiRequest<{ success: boolean; board: Board }>(`/api/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteBoard(id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/api/boards/${id}`, {
      method: 'DELETE',
    });
  },

  async inviteMember(boardId: string, email: string) {
    return apiRequest<{ success: boolean; message: string; board: Board }>(
      `/api/boards/${boardId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  // Board Stats via MongoDB Aggregation Pipeline
  async getBoardStats(boardId: string) {
    return apiRequest<{ success: boolean; boardId: string; stats: BoardStatsData }>(
      `/api/boards/${boardId}/stats`
    );
  },

  // Columns
  async createColumn(boardId: string, title: string, color?: string) {
    return apiRequest<{ success: boolean; column: Column }>('/api/columns', {
      method: 'POST',
      body: JSON.stringify({ boardId, title, color }),
    });
  },

  async updateColumn(columnId: string, data: { title?: string; color?: string }) {
    return apiRequest<{ success: boolean; column: Column }>(`/api/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteColumn(columnId: string) {
    return apiRequest<{ success: boolean; message: string }>(`/api/columns/${columnId}`, {
      method: 'DELETE',
    });
  },

  async reorderColumns(boardId: string, orderedColumnIds: string[]) {
    return apiRequest<{ success: boolean; columns: Column[] }>('/api/columns/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ boardId, orderedColumnIds }),
    });
  },

  // Tasks with backend filters
  async getFilteredTasks(params: {
    boardId: string;
    assigneeId?: string;
    priority?: string;
    label?: string;
    overdue?: boolean;
    search?: string;
  }) {
    const query = new URLSearchParams();
    query.set('boardId', params.boardId);
    if (params.assigneeId) query.set('assigneeId', params.assigneeId);
    if (params.priority) query.set('priority', params.priority);
    if (params.label) query.set('label', params.label);
    if (params.overdue) query.set('overdue', 'true');
    if (params.search) query.set('search', params.search);

    return apiRequest<{ success: boolean; count: number; tasks: Task[] }>(
      `/api/tasks?${query.toString()}`
    );
  },

  async getTask(id: string) {
    return apiRequest<{ success: boolean; task: Task }>(`/api/tasks/${id}`);
  },

  async createTask(data: {
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    assigneeId?: string | null;
    priority?: 'Low' | 'Medium' | 'High';
    dueDate?: string | null;
    labels?: string[];
  }) {
    return apiRequest<{ success: boolean; task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, updates: Partial<Task>) {
    return apiRequest<{ success: boolean; task: Task }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async moveTask(taskId: string, targetColumnId: string, newOrder: number) {
    return apiRequest<{ success: boolean; task: Task }>(`/api/tasks/${taskId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetColumnId, newOrder }),
    });
  },

  async deleteTask(id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // OpenAPI spec
  async getOpenApiSpec() {
    return apiRequest<Record<string, unknown>>('/api/docs');
  },
};
