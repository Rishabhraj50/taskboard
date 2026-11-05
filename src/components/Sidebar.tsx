import React, { useState } from 'react';
import { Board } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Plus,
  Users,
  Trash2,
  Edit2,
  UserPlus,
  X,
  ShieldCheck,
  MoreVertical,
} from 'lucide-react';

interface SidebarProps {
  boards: Board[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onOpenCreateBoard: () => void;
  onOpenInviteMember: (board: Board) => void;
  onOpenRenameBoard: (board: Board) => void;
  onDeleteBoard: (board: Board) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  boards,
  selectedBoardId,
  onSelectBoard,
  onOpenCreateBoard,
  onOpenInviteMember,
  onOpenRenameBoard,
  onDeleteBoard,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeMenuBoardId, setActiveMenuBoardId] = useState<string | null>(null);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 w-64 p-3 select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <LayoutDashboard className="w-4 h-4" />
            <span>Workspace Boards</span>
          </div>
          <button
            onClick={onOpenCreateBoard}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Create Board"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Board List */}
        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {boards.length === 0 ? (
            <div className="text-center py-6 px-2 text-xs text-slate-400">
              No boards found. Click the + button above to create one.
            </div>
          ) : (
            boards.map((b) => {
              const isSelected = b._id === selectedBoardId;
              const isOwner = b.ownerId === user?.id;

              return (
                <div
                  key={b._id}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectBoard(b._id);
                      onClose();
                    }}
                    className="flex-1 text-left truncate flex items-center gap-2"
                  >
                    <span className="truncate">{b.title}</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Member Count */}
                    <div
                      className={`flex items-center gap-0.5 text-[10px] ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                      title={`${b.members?.length || 1} members`}
                    >
                      <Users className="w-3 h-3" />
                      <span>{b.members?.length || 1}</span>
                    </div>

                    {/* Actions Menu Toggle */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuBoardId(activeMenuBoardId === b._id ? null : b._id);
                        }}
                        className={`p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${
                          isSelected
                            ? 'text-white hover:bg-blue-700'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuBoardId === b._id && (
                        <div
                          className="absolute right-0 top-6 w-40 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-40"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setActiveMenuBoardId(null);
                              onOpenInviteMember(b);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-blue-500" />
                            <span>Invite Member</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuBoardId(null);
                              onOpenRenameBoard(b);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>Rename Board</span>
                          </button>

                          {isOwner && (
                            <button
                              onClick={() => {
                                setActiveMenuBoardId(null);
                                onDeleteBoard(b);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete Board</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protected Team Space</span>
        </div>
        <div className="px-2 text-[10px] text-slate-400">
          Only invited members can view and collaborate on boards.
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-50 h-full w-64 shadow-2xl flex">
            {sidebarContent}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
