import React, { useState } from 'react';
import { Column, Task } from '../types/index.ts';
import { TaskCard } from './TaskCard.tsx';
import { Plus, MoreHorizontal, Trash2, Edit2, Check, X } from 'lucide-react';

interface ColumnComponentProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onOpenTask: (task: Task) => void;
  onUpdateColumn: (columnId: string, title: string, color?: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onDragStartTask: (e: React.DragEvent, task: Task) => void;
  onDragEndTask: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, targetColumnId: string, dropIndex: number) => void;
}

export const ColumnComponent: React.FC<ColumnComponentProps> = ({
  column,
  tasks,
  onAddTask,
  onOpenTask,
  onUpdateColumn,
  onDeleteColumn,
  onDragStartTask,
  onDragEndTask,
  onDropTask,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isDoneColumn = column.title.toLowerCase().includes('done');

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;
    await onUpdateColumn(column._id, editTitle.trim());
    setIsEditing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to false if leaving column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Find drop index based on mouse position
    const cardElements = Array.from(e.currentTarget.querySelectorAll('[data-task-id]'));
    let dropIndex = tasks.length;

    for (let i = 0; i < cardElements.length; i++) {
      const rect = cardElements[i].getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      if (e.clientY < midPoint) {
        dropIndex = i;
        break;
      }
    }

    onDropTask(e, column._id, dropIndex);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`shrink-0 w-80 bg-slate-100/80 dark:bg-slate-900/40 rounded-xl p-3 flex flex-col max-h-[calc(100vh-10.5rem)] border transition-colors ${
        isDragOver
          ? 'border-blue-400 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 mr-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
              className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: column.color || '#3B82F6' }}
            />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
              {column.title}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
              ({tasks.length})
            </span>
          </div>
        )}

        <div className="relative flex items-center gap-1">
          <button
            onClick={() => onAddTask(column._id)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors"
            title="Add task to column"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors"
            title="Column actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-7 w-36 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Rename</span>
              </button>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  if (confirm(`Delete column "${column.title}" and all its tasks?`)) {
                    await onDeleteColumn(column._id);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task List container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[120px]">
        {tasks.map((task) => (
          <div key={task._id} data-task-id={task._id}>
            <TaskCard
              task={task}
              isDoneColumn={isDoneColumn}
              onOpenTask={onOpenTask}
              onDragStart={onDragStartTask}
              onDragEnd={onDragEndTask}
            />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-600 text-xs text-center p-3 select-none">
            <span>No tasks in this column</span>
            <button
              onClick={() => onAddTask(column._id)}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Create one</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom quick add button */}
      <button
        onClick={() => onAddTask(column._id)}
        className="mt-2 w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add task</span>
      </button>
    </div>
  );
};
