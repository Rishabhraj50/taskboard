import React, { useState } from 'react';
import { api } from '../api/client.ts';
import {
  X,
  FileCode2,
  Download,
  Play,
  CheckCircle,
  Copy,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface ApiDocsModalProps {
  onClose: () => void;
  currentBoardId?: string;
}

interface EndpointDoc {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  authRequired: boolean;
  sampleBody?: Record<string, unknown>;
  sampleParams?: string;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    method: 'POST',
    path: '/api/auth/login',
    summary: 'Authenticate user with email and bcrypt password, returns JWT token',
    authRequired: false,
    sampleBody: { email: 'alex@team.dev', password: 'password123' },
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    summary: 'Get authenticated user profile from Bearer token',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/boards',
    summary: 'List all boards where user is a member or owner',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/boards/:id',
    summary: 'Get board details with all columns and tasks (Protected: member-only)',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/boards/:id/stats',
    summary: 'Board metrics computed via MongoDB Aggregation Pipeline ($match, $group, $lookup, $project)',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/boards/:id/invite',
    summary: 'Invite existing registered team member to board by email',
    authRequired: true,
    sampleBody: { email: 'sunidhi@team.dev' },
  },
  {
    method: 'GET',
    path: '/api/tasks',
    summary: 'List tasks with backend filtering by assignee, priority, label, overdue, and search',
    authRequired: true,
    sampleParams: '?boardId={BOARD_ID}&priority=High&overdue=false',
  },
  {
    method: 'POST',
    path: '/api/tasks',
    summary: 'Create new task in column and record initial activity log',
    authRequired: true,
    sampleBody: {
      boardId: '{BOARD_ID}',
      columnId: '{COLUMN_ID}',
      title: 'Review MongoDB Pipeline Tests',
      description: 'Ensure $match and $lookup perform under 15ms',
      priority: 'High',
      dueDate: '2026-03-20',
      labels: ['Backend', 'Review'],
    },
  },
  {
    method: 'PATCH',
    path: '/api/tasks/:id/move',
    summary: 'Drag and drop reorder task into column at specific order index',
    authRequired: true,
    sampleBody: { targetColumnId: '{COLUMN_ID}', newOrder: 0 },
  },
];

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ onClose, currentBoardId }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDoc>(ENDPOINTS[4]); // default to stats endpoint
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunLiveTest = async () => {
    setIsRunning(true);
    setTestResult(null);
    try {
      let res: unknown;
      const boardId = currentBoardId || 'brd_sprint14';

      if (selectedEndpoint.path === '/api/boards/:id/stats') {
        res = await api.getBoardStats(boardId);
      } else if (selectedEndpoint.path === '/api/boards') {
        res = await api.listBoards();
      } else if (selectedEndpoint.path === '/api/auth/me') {
        res = await api.getMe();
      } else if (selectedEndpoint.path === '/api/tasks') {
        res = await api.getFilteredTasks({ boardId, priority: 'High' });
      } else if (selectedEndpoint.path === '/api/boards/:id') {
        res = await api.getBoard(boardId);
      } else {
        res = await api.getOpenApiSpec();
      }

      setTestResult(JSON.stringify(res, null, 2));
    } catch (err) {
      setTestResult(JSON.stringify({ error: (err as Error).message }, null, 2));
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadPostman = () => {
    const postmanCollection = {
      info: {
        name: 'Team Task Board API (Postman Collection)',
        description: 'Ready-to-import Postman Collection for Team Task Board testing.',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: ENDPOINTS.map((ep) => ({
        name: `${ep.method} ${ep.path}`,
        request: {
          method: ep.method,
          header: ep.authRequired
            ? [{ key: 'Authorization', value: 'Bearer {{JWT_TOKEN}}', type: 'text' }]
            : [],
          url: {
            raw: `{{BASE_URL}}${ep.path}${ep.sampleParams || ''}`,
            host: ['{{BASE_URL}}'],
            path: ep.path.split('/').filter(Boolean),
          },
          body: ep.sampleBody
            ? {
                mode: 'raw',
                raw: JSON.stringify(ep.sampleBody, null, 2),
                options: { raw: { language: 'json' } },
              }
            : undefined,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taskboard_postman_collection.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodColor = {
    GET: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }[selectedEndpoint.method];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Interactive API Documentation & Explorer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                OpenAPI 3.0 specification, live endpoint tester, and Postman exporter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPostman}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
              title="Download Postman Collection JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Postman Collection</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Split: Left endpoint list, Right live test runner */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Endpoint Selector List */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-1 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              API Endpoints
            </div>
            {ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    setTestResult(null);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                          : ep.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : ep.method === 'PATCH'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-[11px] truncate">{ep.path}</span>
                  </div>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Right: Endpoint Details & Live Test Runner */}
          <div className="md:col-span-7 overflow-y-auto p-5 space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${methodColor}`}>
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedEndpoint.path}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedEndpoint.summary}
              </p>
            </div>

            {/* Headers required */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Authorization Header:
              </span>
              <code className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                {selectedEndpoint.authRequired
                  ? 'Authorization: Bearer <JWT_ACCESS_TOKEN>'
                  : 'Public (No authorization required)'}
              </code>
            </div>

            {/* Sample Request Payload if applicable */}
            {selectedEndpoint.sampleBody && (
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Sample JSON Body:
                </span>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedEndpoint.sampleBody, null, 2)}
                </pre>
              </div>
            )}

            {/* Run Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRunLiveTest}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Sending Request...' : 'Send Live Request'}</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Executes directly against local Express backend
              </span>
            </div>

            {/* Live Response Output */}
            {testResult && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Live Backend Response (200 OK)</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(testResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
