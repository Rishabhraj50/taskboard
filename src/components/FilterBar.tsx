import React from 'react';
import { BoardMember, TaskFilterState } from '../types/index.ts';
import { Search, Filter, RotateCcw, Clock, Tag, UserCheck, Flame } from 'lucide-react';

interface FilterBarProps {
  filters: TaskFilterState;
  onFilterChange: (newFilters: TaskFilterState) => void;
  members: BoardMember[];
  availableLabels: string[];
  totalTaskCount: number;
  filteredTaskCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  members,
  availableLabels,
  totalTaskCount,
  filteredTaskCount,
}) => {
  const isFiltered =
    Boolean(filters.assigneeId) ||
    Boolean(filters.priority) ||
    Boolean(filters.label) ||
    filters.overdue ||
    Boolean(filters.search);

  const handleReset = () => {
    onFilterChange({
      assigneeId: '',
      priority: '',
      label: '',
      overdue: false,
      search: '',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left side: Search & Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search */}
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks (backend)..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.assigneeId}
            onChange={(e) => onFilterChange({ ...filters, assigneeId: e.target.value })}
            className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1">
          <Flame className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
            className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Label Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.label}
            onChange={(e) => onFilterChange({ ...filters, label: e.target.value })}
            className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
          >
            <option value="">All Labels</option>
            {availableLabels.map((lbl) => (
              <option key={lbl} value={lbl}>
                {lbl}
              </option>
            ))}
          </select>
        </div>

        {/* Overdue Toggle */}
        <button
          onClick={() => onFilterChange({ ...filters, overdue: !filters.overdue })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors ${
            filters.overdue
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 font-medium'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Overdue</span>
        </button>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right side: Filtered Count */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
        <Filter className="w-3.5 h-3.5" />
        <span>
          Showing <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">{filteredTaskCount}</strong> of{' '}
          <span className="tabular-nums">{totalTaskCount}</span> tasks
        </span>
      </div>
    </div>
  );
};
