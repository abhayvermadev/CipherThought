import { useState } from 'react';
import { Shield, Lock, X, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInAnonymously } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google');
      setError(null);
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      // Popup might be blocked in iframe; provide friendly advice
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        setError('Popup was blocked or closed. You can also use Instant Guest Sign-In below.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setLoading('anon');
      setError(null);
      await signInAnonymously(auth);
      onClose();
    } catch (err: any) {
      console.error('Anonymous Sign In Error:', err);
      setError(err.message || 'Failed to sign in anonymously');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 border border-slate-200">
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute right-4 top-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="Close sign in dialog"
        >
          <X className="h-3.5 w-3.5" />
          <span>Close</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            Authenticated Journal Access
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
            Firebase Authentication establishes your cryptographic UID to enforce strict Cloud Firestore database isolation.
          </p>
        </div>

        {/* Security Isolation Guarantee Banner */}
        <div className="my-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-left text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-semibold text-emerald-800">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Zero Cross-User Leakage Mandate</span>
          </div>
          <p className="mt-1 text-emerald-700 leading-relaxed text-[11px]">
            Your entries, Gemini summaries, and reflections are sandboxed inside{' '}
            <code className="rounded bg-emerald-100/80 px-1 py-0.5 font-mono text-[10px] text-emerald-950">
              /users/&#123;your_uid&#125;/**
            </code>
            . Firestore security rules strictly reject all cross-tenant reads or writes.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Sign-in Options */}
        <div className="space-y-3">
          <button
            id="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={Boolean(loading)}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              or instant sandbox
            </span>
          </div>

          <button
            id="auth-anonymous-btn"
            onClick={handleAnonymousSignIn}
            disabled={Boolean(loading)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-2.5 px-4 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-60"
          >
            <UserCheck className="h-4 w-4 text-white" />
            <span>
              {loading === 'anon' ? 'Provisioning UID Session...' : 'Instant Guest Sign-In (Firebase Auth)'}
            </span>
          </button>

          {/* Dedicated Close Button on Sign In Option */}
          <button
            id="auth-cancel-btn"
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
            <span>Close / Continue without Signing In</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Keys protected on server via Secret Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Firestore rules verified with zero cross-tenant access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Optional client-side AES-GCM Zero-Knowledge Vault</span>
          </div>
        </div>
      </div>
    </div>
  );
}
