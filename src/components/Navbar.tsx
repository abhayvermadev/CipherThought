import { Shield, ShieldCheck, Sparkles, Plus, BookOpen, Lock, LogIn, LogOut, User as UserIcon, Activity } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  activeView: 'editor' | 'archive' | 'mood';
  setActiveView: (view: 'editor' | 'archive' | 'mood') => void;
  onOpenSecurityCockpit: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNewSession: () => void;
  entriesCount: number;
}

export function Navbar({
  user,
  activeView,
  setActiveView,
  onOpenSecurityCockpit,
  onOpenAuth,
  onSignOut,
  onNewSession,
  entriesCount,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Cipher<span className="text-blue-600">Thought</span>
            </span>
          </div>
        </div>

        {/* Center Navigation Segment */}
        <div className="hidden md:flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            id="nav-editor-btn"
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              activeView === 'editor'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Studio</span>
          </button>
          <button
            id="nav-archive-btn"
            onClick={() => setActiveView('archive')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              activeView === 'archive'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
            <span>Journal Vault</span>
            {entriesCount > 0 && (
              <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                {entriesCount}
              </span>
            )}
          </button>
          <button
            id="nav-mood-btn"
            onClick={() => setActiveView('mood')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              activeView === 'mood'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-blue-600" />
            <span>Mood Analytics</span>
          </button>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center space-x-4">
          {/* Cloud Secret Manager Status */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-slate-500">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloud Secret Manager Connected</span>
          </div>

          <button
            id="open-security-cockpit-btn"
            onClick={onOpenSecurityCockpit}
            title="Open Security Cockpit & Threat Model Inspector"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
          >
            <Shield className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Security Cockpit</span>
          </button>

          {activeView === 'editor' && (
            <button
              id="nav-new-session-btn"
              onClick={onNewSession}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Entry</span>
            </button>
          )}

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center space-x-3 border-l pl-4 border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.displayName || (user.isAnonymous ? 'Guest User' : user.email?.split('@')[0])}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  UID: {user.uid.slice(0, 8)}...
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 border-2 border-white shadow-xs text-xs font-bold shrink-0">
                {user.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <button
                id="sign-out-btn"
                onClick={onSignOut}
                title="Sign out of Firebase"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="nav-sign-in-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
