import React, { useState } from 'react';
import { Board } from '../types/index.ts';
import { X, UserPlus, Users, Check } from 'lucide-react';

interface InviteMemberModalProps {
  board: Board;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  board,
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleInvitees = [
    { name: 'Sunidhi Alok', email: 'sunidhi@team.dev' },
    { name: 'Carlos Mendez', email: 'carlos@team.dev' },
    { name: 'Priya Sharma', email: 'priya@team.dev' },
    { name: 'Alex Rivera', email: 'alex@team.dev' },
  ].filter((u) => !board.members.some((m) => m.email.toLowerCase() === u.email.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onInvite(email.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Invite Member to Board
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Add team members to <strong className="text-slate-900 dark:text-white font-semibold">"{board.title}"</strong> so they can view, create, and update tasks.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Member Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. sunidhi@team.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Click sample registered users */}
          {sampleInvitees.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                Quick add registered member:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleInvitees.map((s) => (
                  <button
                    key={s.email}
                    type="button"
                    onClick={() => setEmail(s.email)}
                    className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded transition-colors"
                  >
                    + {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Board Members list */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Current Members ({board.members.length})</span>
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {board.members.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {m.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{m.email}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? 'Adding...' : 'Add to Board'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
