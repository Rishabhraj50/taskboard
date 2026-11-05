import React, { useState } from 'react';
import { Column, Task } from '../types/index.ts';
import { ColumnComponent } from './ColumnComponent.tsx';
import { Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BoardViewProps {
  columns: Column[];
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onOpenTask: (task: Task) => void;
  onAddColumn: (title: string) => Promise<void>;
  onUpdateColumn: (columnId: string, title: string, color?: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onMoveTaskOptimistic: (taskId: string, targetColumnId: string, newOrder: number) => Promise<void>;
}

export const BoardView: React.FC<BoardViewProps> = ({
  columns,
  tasks,
  onAddTask,
  onOpenTask,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onMoveTaskOptimistic,
}) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    await onAddColumn(newColumnTitle.trim());
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const handleDragStartTask = (e: React.DragEvent, task: Task) => {
    setDraggedTaskId(task._id);
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEndTask = () => {
    setDraggedTaskId(null);
  };

  const handleDropTask = async (
    _e: React.DragEvent,
    targetColumnId: string,
    dropIndex: number
  ) => {
    if (!draggedTaskId) return;

    const task = tasks.find((t) => t._id === draggedTaskId);
    if (!task) return;

    // Check if target column is Done
    const targetCol = columns.find((c) => c._id === targetColumnId);
    if (targetCol && targetCol.title.toLowerCase().includes('done') && task.columnId !== targetColumnId) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // no-op
      }
    }

    await onMoveTaskOptimistic(draggedTaskId, targetColumnId, dropIndex);
    setDraggedTaskId(null);
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6 flex items-start gap-4">
      {columns.map((column) => {
        const columnTasks = tasks
          .filter((t) => t.columnId === column._id)
          .sort((a, b) => a.order - b.order);

        return (
          <ColumnComponent
            key={column._id}
            column={column}
            tasks={columnTasks}
            onAddTask={onAddTask}
            onOpenTask={onOpenTask}
            onUpdateColumn={onUpdateColumn}
            onDeleteColumn={onDeleteColumn}
            onDragStartTask={handleDragStartTask}
            onDragEndTask={handleDragEndTask}
            onDropTask={handleDropTask}
          />
        );
      })}

      {/* Add New Column Box */}
      <div className="shrink-0 w-80">
        {isAddingColumn ? (
          <form
            onSubmit={handleCreateColumn}
            className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-300 dark:border-slate-800"
          >
            <input
              type="text"
              placeholder="Column title (e.g. QA Testing)..."
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              autoFocus
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Add Column
              </button>
              <button
                type="button"
                onClick={() => setIsAddingColumn(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingColumn(true)}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium bg-slate-50/50 dark:bg-slate-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add another column</span>
          </button>
        )}
      </div>
    </div>
  );
};
