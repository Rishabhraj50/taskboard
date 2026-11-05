import React, { useState, useEffect } from 'react';
import { BoardStatsData } from '../types/index.ts';
import { api } from '../api/client.ts';
import {
  X,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Users,
  Code2,
  RefreshCw,
} from 'lucide-react';

interface StatsModalProps {
  boardId: string;
  boardTitle: string;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  boardId,
  boardTitle,
  onClose,
}) => {
  const [stats, setStats] = useState<BoardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'pipeline'>('visual');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBoardStats(boardId);
      setStats(res.stats);
    } catch (err) {
      setError((err as Error).message || 'Failed to load board stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [boardId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Board Statistics & Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live metrics for "{boardTitle}" via MongoDB Aggregation Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-4 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'visual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Metrics Overview
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>MongoDB Pipeline Logic</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span>Running MongoDB aggregation pipelines...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          ) : stats ? (
            activeTab === 'visual' ? (
              <div className="space-y-6">
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Total Tasks
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                      {stats.totalTasks}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Overdue
                    </div>
                    <div className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1 flex items-center gap-1.5">
                      {stats.overdueTasks > 0 && <AlertTriangle className="w-4 h-4" />}
                      <span>{stats.overdueTasks}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Columns
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                      {stats.byColumn.length}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Assignees
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{stats.byAssignee.length}</span>
                    </div>
                  </div>
                </div>

                {/* Tasks per Column */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-800/30">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                    Task Distribution by Column ($group: "$columnId")
                  </h3>
                  <div className="space-y-3">
                    {stats.byColumn.map((col) => {
                      const percentage =
                        stats.totalTasks > 0
                          ? Math.round((col.count / stats.totalTasks) * 100)
                          : 0;

                      return (
                        <div key={col.columnId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: col.columnColor }}
                              />
                              <span className="text-slate-800 dark:text-slate-200">
                                {col.columnTitle}
                              </span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                              {col.count} tasks ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: col.columnColor || '#3B82F6',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tasks per Assignee */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-800/30">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                    Workload Distribution by Assignee ($group: "$assigneeId")
                  </h3>
                  <div className="space-y-3">
                    {stats.byAssignee.map((assignee, idx) => {
                      const percentage =
                        stats.totalTasks > 0
                          ? Math.round((assignee.count / stats.totalTasks) * 100)
                          : 0;

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                {assignee.userName.charAt(0)}
                              </div>
                              <span className="text-slate-800 dark:text-slate-200">
                                {assignee.userName}
                              </span>
                              {assignee.userEmail && (
                                <span className="text-[11px] text-slate-400">
                                  ({assignee.userEmail})
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                              {assignee.count} tasks ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Pipeline Code Tab */
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">Live Pipeline Verification</p>
                  <p>
                    The stats endpoint is served at <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">GET /api/boards/:id/stats</code> and executes the two aggregation pipelines below.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    1. Column Counts Pipeline ($match → $group → $lookup → $project)
                  </h4>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
{`[
  { $match: { boardId: ObjectId("${boardId}") } },
  {
    $group: {
      _id: "$columnId",
      count: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "columns",
      localField: "_id",
      foreignField: "_id",
      as: "column"
    }
  },
  {
    $project: {
      columnId: "$_id",
      count: 1,
      columnTitle: { $arrayElemAt: ["$column.title", 0] },
      columnColor: { $arrayElemAt: ["$column.color", 0] }
    }
  }
]`}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    2. Assignee Counts Pipeline ($match → $group → $lookup → $project)
                  </h4>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
{`[
  { $match: { boardId: ObjectId("${boardId}") } },
  {
    $group: {
      _id: "$assigneeId",
      count: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $project: {
      assigneeId: "$_id",
      count: 1,
      userName: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Unassigned"] },
      userEmail: { $arrayElemAt: ["$user.email", 0] }
    }
  }
]`}
                  </pre>
                </div>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};
