import React, { useState, useEffect } from 'react';
import { Task, Column, BoardMember } from '../types/index.ts';
import {
  X,
  Calendar,
  UserCheck,
  Flame,
  Tag,
  Clock,
  Trash2,
  Columns as ColumnIcon,
  Plus,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null; // null if creating a new task
  initialColumnId?: string;
  columns: Column[];
  members: BoardMember[];
  boardId: string;
  onClose: () => void;
  onSaveTask: (data: {
    title: string;
    description: string;
    columnId: string;
    assigneeId: string | null;
    priority: 'Low' | 'Medium' | 'High';
    dueDate: string | null;
    labels: string[];
  }) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  initialColumnId,
  columns,
  members,
  onClose,
  onSaveTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState(task ? task.title : '');
  const [description, setDescription] = useState(task ? task.description : '');
  const [columnId, setColumnId] = useState(
    task ? task.columnId : initialColumnId || columns[0]?._id || ''
  );
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId || '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>(
    task ? task.priority : 'Medium'
  );
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate ? task.dueDate.split('T')[0] : ''
  );
  const [labels, setLabels] = useState<string[]>(task?.labels || []);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAddLabel = () => {
    const trimmed = newLabelInput.trim().replace(/^#/, '');
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setNewLabelInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((l) => l !== labelToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveTask({
        title: title.trim(),
        description: description.trim(),
        columnId,
        assigneeId: assigneeId || null,
        priority,
        dueDate: dueDate || null,
        labels,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {task ? 'Task Details' : 'Create New Task'}
            </h2>
            {task && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeTab === 'details'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Activity ({task.activityLog?.length || 0})
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                className="w-full text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Add context, acceptance criteria, or technical details..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Grid properties: Column & Priority & Assignee & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Column */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <ColumnIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Column</span>
                </label>
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {columns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Flame className="w-3.5 h-3.5 text-slate-400" />
                  <span>Priority</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assignee</span>
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Labels Manager */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Labels & Tags</span>
              </label>

              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {labels.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md"
                  >
                    <span>#{l}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(l)}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New label (e.g. Frontend, DevOps)..."
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {task && onDeleteTask ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
                      await onDeleteTask(task._id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium py-2 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Task</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Activity Log Audit Trail */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Sequential audit trail of all changes recorded for this task.
            </div>

            {task?.activityLog && task.activityLog.length > 0 ? (
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                {task.activityLog
                  .slice()
                  .reverse()
                  .map((log) => (
                    <div key={log._id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {log.action}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {log.userName} · {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.details && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-md">
                          {log.details}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No activity recorded yet for this task.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
