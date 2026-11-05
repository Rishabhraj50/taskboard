import React from 'react';
import { Task } from '../types/index.ts';
import { Calendar, MessageSquare, AlertCircle, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isDoneColumn?: boolean;
  onOpenTask: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDoneColumn = false,
  onOpenTask,
  onDragStart,
  onDragEnd,
}) => {
  const isOverdue =
    !isDoneColumn &&
    task.dueDate &&
    task.dueDate.split('T')[0] < new Date().toISOString().split('T')[0];

  const priorityStyles = {
    High: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    Medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    Low: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  }[task.priority] || 'text-slate-600 bg-slate-100';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpenTask(task)}
      className="group relative bg-white dark:bg-slate-800 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top row: Priority & Drag Handle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${priorityStyles}`}
        >
          {task.priority} Priority
        </span>

        <div className="flex items-center gap-1">
          {isOverdue && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400"
              title="Task is overdue!"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue</span>
            </span>
          )}
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Description preview if present */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded"
            >
              #{label}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Due date, comments, assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${
                isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {task.activityLog && task.activityLog.length > 0 && (
            <div className="flex items-center gap-1" title={`${task.activityLog.length} activity events`}>
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="tabular-nums">{task.activityLog.length}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {task.assignee ? (
            <div
              className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200"
              title={`Assigned to ${task.assignee.name}`}
            >
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                task.assignee.name.charAt(0)
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};
