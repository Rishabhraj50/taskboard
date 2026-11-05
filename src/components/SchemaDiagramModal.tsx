import React, { useState } from 'react';
import {
  X,
  Database,
  Layers,
  Key,
  Shield,
  Zap,
  FolderTree,
  CheckCircle,
} from 'lucide-react';

interface SchemaDiagramModalProps {
  onClose: () => void;
}

export const SchemaDiagramModal: React.FC<SchemaDiagramModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'embed_vs_ref' | 'indexes' | 'jwt' | 'scaling' | 'structure'>('diagram');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                MongoDB Schema Design & Architectural Defense
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed data modeling, index strategy, and live review defense guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 px-6 pt-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs shrink-0">
          {[
            { id: 'diagram', label: 'Schema Diagram', icon: Layers },
            { id: 'embed_vs_ref', label: 'Why Embed vs Ref', icon: Database },
            { id: 'indexes', label: 'Indexes & Query Plans', icon: Zap },
            { id: 'jwt', label: 'JWT Storage & Security', icon: Key },
            { id: 'scaling', label: '100x Traffic & Scaling', icon: Shield },
            { id: 'structure', label: 'Folder Architecture', icon: FolderTree },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-2.5 px-2 font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {activeTab === 'diagram' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Users Collection */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700 font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">users</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Collection</span>
                  </div>
                  <ul className="space-y-1 text-[11px]">
                    <li><strong className="text-blue-600">_id:</strong> ObjectId (PK)</li>
                    <li><strong>name:</strong> String</li>
                    <li><strong className="text-amber-600">email:</strong> String (Unique Index)</li>
                    <li><strong>password:</strong> String (bcrypt-hashed)</li>
                    <li><strong>avatarUrl:</strong> String</li>
                    <li><strong>createdAt:</strong> Date</li>
                  </ul>
                </div>

                {/* Boards Collection */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700 font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">boards</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Collection</span>
                  </div>
                  <ul className="space-y-1 text-[11px]">
                    <li><strong className="text-blue-600">_id:</strong> ObjectId (PK)</li>
                    <li><strong>title:</strong> String</li>
                    <li><strong>description:</strong> String</li>
                    <li><strong className="text-purple-600">ownerId:</strong> ObjectId → users._id</li>
                    <li><strong className="text-purple-600">members:</strong> [ObjectId → users._id] (Multikey)</li>
                    <li><strong>createdAt:</strong> Date</li>
                  </ul>
                </div>

                {/* Columns Collection */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700 font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">columns</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Collection</span>
                  </div>
                  <ul className="space-y-1 text-[11px]">
                    <li><strong className="text-blue-600">_id:</strong> ObjectId (PK)</li>
                    <li><strong className="text-purple-600">boardId:</strong> ObjectId → boards._id</li>
                    <li><strong>title:</strong> String</li>
                    <li><strong className="text-amber-600">order:</strong> Number (Compound: boardId + order)</li>
                    <li><strong>color:</strong> String</li>
                  </ul>
                </div>

                {/* Tasks Collection */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700 font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">tasks</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Collection</span>
                  </div>
                  <ul className="space-y-1 text-[11px]">
                    <li><strong className="text-blue-600">_id:</strong> ObjectId (PK)</li>
                    <li><strong className="text-purple-600">boardId:</strong> ObjectId → boards._id</li>
                    <li><strong className="text-purple-600">columnId:</strong> ObjectId → columns._id</li>
                    <li><strong>title:</strong> String (Text search index)</li>
                    <li><strong>description:</strong> String</li>
                    <li><strong className="text-purple-600">assigneeId:</strong> ObjectId? → users._id</li>
                    <li><strong className="text-amber-600">priority:</strong> 'Low' | 'Medium' | 'High'</li>
                    <li><strong className="text-amber-600">dueDate:</strong> ISODate string</li>
                    <li><strong>labels:</strong> [String] (Multikey index)</li>
                    <li><strong className="text-amber-600">order:</strong> Number (Compound: columnId + order)</li>
                    <li className="text-emerald-600 dark:text-emerald-400"><strong>activityLog:</strong> [Embedded Document]</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'embed_vs_ref' && (
            <div className="space-y-4 font-sans">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Justification: Why We Embedded vs Referenced
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>REFERENCED ENTITIES</span>
                  </h4>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                    <li>
                      <strong>Users on Boards & Tasks:</strong> Users exist independently across multiple workspaces. Referencing prevents sync anomalies when a user updates their profile or password.
                    </li>
                    <li>
                      <strong>Columns & Tasks:</strong> Boards can grow to thousands of cards over years. If all tasks were embedded in a single Board document, it would rapidly risk breaching MongoDB's <strong>16MB BSON document limit</strong> and trigger heavy write-lock contention during drag-and-drop.
                    </li>
                    <li>
                      <strong>Ordered Columns:</strong> Storing columns as distinct documents allows atomic column reordering via compound index <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">{`{ boardId: 1, order: 1 }`}</code> without locking other columns.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>EMBEDDED ENTITIES</span>
                  </h4>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                    <li>
                      <strong>Task ActivityLog:</strong> Activity logs have a strict 1:Few bounded relationship to their parent task. They are only ever read when viewing that specific task. Embedding them eliminates expensive $lookup joins and allows atomic logging when a task is updated.
                    </li>
                    <li>
                      <strong>Task Labels:</strong> Labels are lightweight string arrays embedded in the task document. Multikey indexes on <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">labels</code> provide instantaneous tag filtering without a separate normalization join table.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'indexes' && (
            <div className="space-y-4 font-sans">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Index Strategy & Query Optimization
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    tasks.index({`{ columnId: 1, order: 1 }`})
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Powers the Kanban board render. Fetches all cards in a column pre-sorted by their drag-and-drop rank using an index-only scan (IXSCAN) with zero in-memory sorting.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    tasks.index({`{ boardId: 1, assigneeId: 1 }`}) & tasks.index({`{ boardId: 1, priority: 1 }`})
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Compound indexes optimizing backend search filters: allows filtering by board and assignee or priority in sub-millisecond execution without collection scans (COLLSCAN).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    users.index({`{ email: 1 }, { unique: true }`})
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Enforces uniqueness across all registrations and provides O(1) B-tree lookup during authentication.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jwt' && (
            <div className="space-y-4 font-sans">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Where JWT is Stored & Security Threat Mitigations
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Storage Strategy & Trade-offs</h4>
                  <p className="mb-2">
                    In our frontend SPA, the JWT access token is stored in <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">localStorage</code> and transmitted via the standard HTTP <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">Authorization: Bearer &lt;token&gt;</code> header.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                      <strong className="text-amber-800 dark:text-amber-300">Trade-off / Risk:</strong>
                      <p className="text-[11px] text-amber-900 dark:text-amber-200 mt-1">
                        Accessible to client-side scripts, meaning Cross-Site Scripting (XSS) could extract the token.
                      </p>
                    </div>
                    <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                      <strong className="text-emerald-800 dark:text-emerald-300">Mitigation:</strong>
                      <p className="text-[11px] text-emerald-900 dark:text-emerald-200 mt-1">
                        Short expiration window, strict Content Security Policy (CSP), zero innerHTML usage, and automatic 401 token invalidation on the client.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Production Evolution</h4>
                  <p>
                    For financial or high-security enterprise tiers, use a dual-token setup: short-lived access token in memory (15 mins) + httpOnly, Secure, SameSite=Strict refresh token cookie.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scaling' && (
            <div className="space-y-4 font-sans">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                What Breaks First at 100x Traffic & How to Scale
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
                  <strong className="text-rose-700 dark:text-rose-300">1. Reorder Index Collisions:</strong>
                  <p className="mt-1">
                    When 100 teammates reorder cards concurrently, updating sequential integer orders (<code className="font-mono">0, 1, 2, ...</code>) leads to write conflicts.
                    <br />
                    <em>Fix:</em> Switch to <strong>Fractional Indexing</strong> (Lexorank strings like <code className="font-mono">"a0", "a1", "am"</code>). Moving a task only writes 1 record with no neighbor cascading!
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                  <strong className="text-blue-700 dark:text-blue-300">2. Stats Aggregation Saturation:</strong>
                  <p className="mt-1">
                    Running full MongoDB aggregation pipelines on every board load at 100x traffic will consume heavy CPU on the primary database node.
                    <br />
                    <em>Fix:</em> Direct read queries to MongoDB secondary read replicas, or maintain pre-calculated column/assignee counters on the Board document using atomic <code className="font-mono">$inc</code>.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
                  <strong className="text-purple-700 dark:text-purple-300">3. Live Real-Time Collaboration:</strong>
                  <p className="mt-1">
                    At 100x scale, polling for changes causes unnecessary load.
                    <br />
                    <em>Fix:</em> Introduce WebSocket / Server-Sent Events (SSE) with Redis Pub/Sub adapter to push optimistic board updates across server clusters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-4 font-sans">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Clean Separation of Concerns: Backend & Frontend
              </h3>
              <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed">
{`/server/
  ├── db/
  │   └── connection.ts    # MongoDB / Mongoose connection + In-Memory fallback store
  ├── models/
  │   ├── User.ts          # User Mongoose schema, bcrypt compare, UserRepository
  │   ├── Board.ts         # Board Mongoose schema, BoardRepository with populate
  │   ├── Column.ts        # Column Mongoose schema, ColumnRepository with reorder
  │   └── Task.ts          # Task Mongoose schema, filters & Aggregation Pipeline
  ├── controllers/
  │   ├── authController.ts
  │   ├── boardController.ts
  │   ├── columnController.ts
  │   ├── taskController.ts
  │   └── statsController.ts
  ├── middleware/
  │   ├── auth.ts          # Bearer JWT verification & board member authorization
  │   ├── validate.ts      # Zod validation schema middleware
  │   └── errorHandler.ts  # Custom AppError & centralized Express error handler
  ├── routes/
  │   ├── authRoutes.ts
  │   ├── boardRoutes.ts
  │   ├── columnRoutes.ts
  │   └── taskRoutes.ts
  └── docs/
      └── openapi.json     # OpenAPI 3.0 API Documentation specification`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
