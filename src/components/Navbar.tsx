import React, { useState, useRef, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.tsx';
import { BarChart3, Database, FileCode2, ChevronDown, LogOut, Check, Menu } from 'lucide-react';

interface NavbarProps {
  onOpenStats: () => void;
  onOpenSchema: () => void;
  onOpenApiDocs: () => void;
  onToggleSidebar: () => void;
  activeBoardTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStats,
  onOpenSchema,
  onOpenApiDocs,
  onToggleSidebar,
  activeBoardTitle,
}) => {
  const { user, logout, switchDemoUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between gap-8 sticky top-0 z-30">
      {/* Zone 1: Brand wordmark & mobile sidebar toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          title="Toggle Board Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            TaskFlow
          </span>
          {activeBoardTitle && (
            <span className="hidden sm:inline-flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>
              <span className="max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                {activeBoardTitle}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation Links for Reviewers & Team */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
        >
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <span>Stats & Aggregations</span>
        </button>

        <button
          onClick={onOpenSchema}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
        >
          <Database className="w-4 h-4 text-emerald-500" />
          <span>DB Schema & Arch</span>
        </button>

        <button
          onClick={onOpenApiDocs}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
        >
          <FileCode2 className="w-4 h-4 text-violet-500" />
          <span>API Docs & Test</span>
        </button>
      </nav>

      {/* Zone 3: Demo Switcher & Account */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Reviewer Demo Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-semibold text-xs text-slate-700 dark:text-slate-200 shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="hidden sm:block text-left pr-1 leading-tight">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[110px]">
                {user?.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                {user?.email}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Demo Member
              </div>
              <div className="space-y-0.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = user?.email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      onClick={async () => {
                        await switchDemoUser(acc.email);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-left">
                        <div>{acc.name}</div>
                        <div className="text-[10px] text-slate-400">{acc.role} · {acc.email}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

              <button
                onClick={() => {
                  logout();
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
