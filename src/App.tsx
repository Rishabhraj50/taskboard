import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Board, Column, Task, TaskFilterState } from './types/index.ts';
import { api } from './api/client.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { BoardView } from './components/BoardView.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { SchemaDiagramModal } from './components/SchemaDiagramModal.tsx';
import { ApiDocsModal } from './components/ApiDocsModal.tsx';
import { CreateBoardModal } from './components/CreateBoardModal.tsx';
import { InviteMemberModal } from './components/InviteMemberModal.tsx';
import { RenameBoardModal } from './components/RenameBoardModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ToastContainer, ToastMessage } from './components/Toast.tsx';
import { Loader2, Plus, Sparkles, FolderPlus } from 'lucide-react';

function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allBoardTasksCount, setAllBoardTasksCount] = useState<number>(0);
  const [boardLoading, setBoardLoading] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<TaskFilterState>({
    assigneeId: '',
    priority: '',
    label: '',
    overdue: false,
    search: '',
  });

  // Modals state
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [inviteModalBoard, setInviteModalBoard] = useState<Board | null>(null);
  const [renameModalBoard, setRenameModalBoard] = useState<Board | null>(null);
  const [taskModalTarget, setTaskModalTarget] = useState<{
    task: Task | null;
    columnId?: string;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'error' | 'success' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch boards for user
  const loadBoards = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.listBoards();
      setBoards(res.boards);
      if (res.boards.length > 0) {
        setSelectedBoardId((prev) => {
          if (prev && res.boards.some((b) => b._id === prev)) {
            return prev;
          }
          return res.boards[0]._id;
        });
      } else {
        setSelectedBoardId(null);
        setCurrentBoard(null);
        setColumns([]);
        setTasks([]);
      }
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // Load single board data (columns + tasks)
  const loadBoardData = useCallback(async (boardId: string) => {
    setBoardLoading(true);
    try {
      const res = await api.getBoard(boardId);
      setCurrentBoard(res.board);
      setColumns(res.columns);
      setTasks(res.tasks);
      setAllBoardTasksCount(res.tasks.length);
    } catch (err) {
      addToast('error', (err as Error).message);
    } finally {
      setBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBoardId) {
      loadBoardData(selectedBoardId);
    }
  }, [selectedBoardId, loadBoardData]);

  // Load backend-filtered tasks when filters change
  const applyBackendFilters = useCallback(async () => {
    if (!selectedBoardId) return;
    try {
      const res = await api.getFilteredTasks({
        boardId: selectedBoardId,
        assigneeId: filters.assigneeId || undefined,
        priority: filters.priority || undefined,
        label: filters.label || undefined,
        overdue: filters.overdue,
        search: filters.search || undefined,
      });
      setTasks(res.tasks);
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  }, [selectedBoardId, filters]);

  useEffect(() => {
    applyBackendFilters();
  }, [applyBackendFilters]);

  // Available labels collected across tasks for the filter bar
  const availableLabels = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.labels?.forEach((l) => set.add(l)));
    return Array.from(set).sort();
  }, [tasks]);

  // --- Task Operations ---
  const handleSaveTask = async (data: {
    title: string;
    description: string;
    columnId: string;
    assigneeId: string | null;
    priority: 'Low' | 'Medium' | 'High';
    dueDate: string | null;
    labels: string[];
  }) => {
    if (!selectedBoardId) return;

    if (taskModalTarget?.task) {
      // Update existing task
      const taskId = taskModalTarget.task._id;
      try {
        const res = await api.updateTask(taskId, data);
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.task : t)));
        addToast('success', 'Task updated successfully');
      } catch (err) {
        addToast('error', (err as Error).message);
      }
    } else {
      // Create new task
      try {
        const res = await api.createTask({
          boardId: selectedBoardId,
          ...data,
        });
        setTasks((prev) => [...prev, res.task]);
        setAllBoardTasksCount((prev) => prev + 1);
        addToast('success', 'Task created successfully');
      } catch (err) {
        addToast('error', (err as Error).message);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setAllBoardTasksCount((prev) => Math.max(0, prev - 1));
      addToast('success', 'Task deleted');
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  };

  // Optimistic Drag and Drop with Rollback on API failure
  const handleMoveTaskOptimistic = async (
    taskId: string,
    targetColumnId: string,
    newOrder: number
  ) => {
    const previousTasks = [...tasks];

    // 1. Instant optimistic update
    setTasks((current) => {
      const moved = current.find((t) => t._id === taskId);
      if (!moved) return current;

      const rest = current.filter((t) => t._id !== taskId);
      const targetColTasks = rest
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order);

      targetColTasks.splice(newOrder, 0, {
        ...moved,
        columnId: targetColumnId,
        order: newOrder,
      });

      targetColTasks.forEach((t, idx) => {
        t.order = idx;
      });

      const otherCols = rest.filter((t) => t.columnId !== targetColumnId);
      return [...otherCols, ...targetColTasks];
    });

    // 2. Persist to Express backend
    try {
      const res = await api.moveTask(taskId, targetColumnId, newOrder);
      // Sync with populated server response
      setTasks((current) =>
        current.map((t) => (t._id === taskId ? res.task : t))
      );
    } catch (err) {
      // 3. Rollback on failure!
      setTasks(previousTasks);
      addToast('error', `Failed to move task: ${(err as Error).message}. Rolled back.`);
    }
  };

  // --- Column Operations ---
  const handleAddColumn = async (title: string) => {
    if (!selectedBoardId) return;
    try {
      const res = await api.createColumn(selectedBoardId, title);
      setColumns((prev) => [...prev, res.column]);
      addToast('success', `Column "${title}" created`);
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  };

  const handleUpdateColumn = async (columnId: string, title: string, color?: string) => {
    try {
      const res = await api.updateColumn(columnId, { title, color });
      setColumns((prev) => prev.map((c) => (c._id === columnId ? res.column : c)));
      addToast('success', 'Column renamed');
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await api.deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c._id !== columnId));
      setTasks((prev) => prev.filter((t) => t.columnId !== columnId));
      addToast('success', 'Column deleted');
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  };

  // --- Board Operations ---
  const handleCreateBoard = async (title: string, description?: string) => {
    try {
      const res = await api.createBoard(title, description);
      setBoards((prev) => [res.board, ...prev]);
      setSelectedBoardId(res.board._id);
      addToast('success', `Board "${title}" created!`);
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  };

  const handleRenameBoard = async (id: string, title: string, description?: string) => {
    try {
      const res = await api.updateBoard(id, { title, description });
      setBoards((prev) => prev.map((b) => (b._id === id ? res.board : b)));
      if (currentBoard?._id === id) {
        setCurrentBoard(res.board);
      }
      addToast('success', 'Board renamed');
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  };

  const handleDeleteBoard = async (board: Board) => {
    if (!confirm(`Are you sure you want to delete board "${board.title}"?`)) return;
    try {
      await api.deleteBoard(board._id);
      setBoards((prev) => prev.filter((b) => b._id !== board._id));
      if (selectedBoardId === board._id) {
        const remaining = boards.filter((b) => b._id !== board._id);
        setSelectedBoardId(remaining[0]?._id || null);
      }
      addToast('success', `Board "${board.title}" deleted`);
    } catch (err) {
      addToast('error', (err as Error).message);
    }
  };

  const handleInviteMember = async (email: string) => {
    if (!inviteModalBoard) return;
    try {
      const res = await api.inviteMember(inviteModalBoard._id, email);
      setBoards((prev) => prev.map((b) => (b._id === inviteModalBoard._id ? res.board : b)));
      if (currentBoard?._id === inviteModalBoard._id) {
        setCurrentBoard(res.board);
      }
      addToast('success', res.message);
    } catch (err) {
      addToast('error', (err as Error).message);
      throw err;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="font-medium">Connecting to TaskFlow backend & database...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-100 dark:selection:bg-blue-900/40">
      {/* Top Navbar */}
      <Navbar
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSchema={() => setIsSchemaOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeBoardTitle={currentBoard?.title}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Sidebar */}
        <Sidebar
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelectBoard={(id) => setSelectedBoardId(id)}
          onOpenCreateBoard={() => setIsCreateBoardOpen(true)}
          onOpenInviteMember={(b) => setInviteModalBoard(b)}
          onOpenRenameBoard={(b) => setRenameModalBoard(b)}
          onDeleteBoard={handleDeleteBoard}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {boardLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span>Loading board and tasks...</span>
            </div>
          ) : currentBoard ? (
            <>
              {/* Backend Filter Bar */}
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                members={currentBoard.members || []}
                availableLabels={availableLabels}
                totalTaskCount={allBoardTasksCount}
                filteredTaskCount={tasks.length}
              />

              {/* Kanban Column View */}
              <BoardView
                columns={columns}
                tasks={tasks}
                onAddTask={(colId) => setTaskModalTarget({ task: null, columnId: colId })}
                onOpenTask={(t) => setTaskModalTarget({ task: t, columnId: t.columnId })}
                onAddColumn={handleAddColumn}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
                onMoveTaskOptimistic={handleMoveTaskOptimistic}
              />
            </>
          ) : (
            /* Empty State: No Board Selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <FolderPlus className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No Board Selected
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                Create your first team board to organize tasks, assign teammates, and track milestones.
              </p>
              <button
                onClick={() => setIsCreateBoardOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Board</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Task Modal (Create or Edit + Activity Log) */}
      {taskModalTarget && currentBoard && (
        <TaskModal
          task={taskModalTarget.task}
          initialColumnId={taskModalTarget.columnId}
          columns={columns}
          members={currentBoard.members || []}
          boardId={currentBoard._id}
          onClose={() => setTaskModalTarget(null)}
          onSaveTask={handleSaveTask}
          onDeleteTask={taskModalTarget.task ? handleDeleteTask : undefined}
        />
      )}

      {/* Stats & Aggregation Pipeline Modal */}
      {isStatsOpen && currentBoard && (
        <StatsModal
          boardId={currentBoard._id}
          boardTitle={currentBoard.title}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {/* Schema Diagram & Live Review Defense Modal */}
      {isSchemaOpen && (
        <SchemaDiagramModal onClose={() => setIsSchemaOpen(false)} />
      )}

      {/* OpenAPI Explorer & Postman Modal */}
      {isApiDocsOpen && (
        <ApiDocsModal
          onClose={() => setIsApiDocsOpen(false)}
          currentBoardId={selectedBoardId || undefined}
        />
      )}

      {/* Create Board Modal */}
      {isCreateBoardOpen && (
        <CreateBoardModal
          onClose={() => setIsCreateBoardOpen(false)}
          onCreate={handleCreateBoard}
        />
      )}

      {/* Invite Member Modal */}
      {inviteModalBoard && (
        <InviteMemberModal
          board={inviteModalBoard}
          onClose={() => setInviteModalBoard(null)}
          onInvite={handleInviteMember}
        />
      )}

      {/* Rename Board Modal */}
      {renameModalBoard && (
        <RenameBoardModal
          board={renameModalBoard}
          onClose={() => setRenameModalBoard(null)}
          onUpdate={handleRenameBoard}
        />
      )}

      {/* Auth Modal (if unauthenticated) */}
      <AuthModal isOpen={!isAuthenticated} />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
