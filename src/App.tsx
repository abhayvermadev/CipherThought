import { useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  firebaseSignOut,
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  User,
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { JournalEditor } from './components/JournalEditor';
import { JournalList } from './components/JournalList';
import { AuthModal } from './components/AuthModal';
import { SecurityCockpitModal } from './components/SecurityCockpitModal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { MoodDashboard } from './components/MoodDashboard';
import { DEMO_JOURNAL_ENTRIES } from './data/demoEntries';
import { JournalEntry } from './types';
import { ShieldCheck, Lock, Sparkles, KeyRound, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSignInBanner, setShowSignInBanner] = useState(true);
  const [activeView, setActiveView] = useState<'editor' | 'archive' | 'mood'>('editor');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSecurityCockpitOpen, setIsSecurityCockpitOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Monitor Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to User-Isolated Firestore Entries
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    // Strict isolation query: /users/{user.uid}/entries
    const entriesRef = collection(db, 'users', user.uid, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as JournalEntry);
        });
        setEntries(fetched);
        setEntriesLoading(false);
      },
      (error) => {
        console.error('Error fetching isolated Firestore entries:', error);
        setEntriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) {
      // If demo mode, just close
      setSelectedEntry(null);
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'entries', id));
      setSelectedEntry(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Visible entries (isolated Firestore entries for signed in user, or demo reflections for guests)
  const displayEntries = user ? entries : entries.length > 0 ? entries : DEMO_JOURNAL_ENTRIES;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSecurityCockpit={() => setIsSecurityCockpitOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        onNewSession={() => {
          setActiveView('editor');
        }}
        entriesCount={displayEntries.length}
      />

      {/* Guest/Unauthenticated Security Notice Banner if not signed in */}
      {!user && !authLoading && showSignInBanner && (
        <div className="relative border-b border-blue-200/80 bg-linear-to-r from-blue-50/90 via-white to-blue-50/90 px-4 py-2 text-center text-xs text-blue-900 shadow-2xs">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 pr-6">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>Zero-Trust Database Isolation:</strong> Showing sample psychometric reflections. Sign in to establish your isolated Cloud Firestore namespace.
            </span>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="ml-2 font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2"
            >
              Sign In Now →
            </button>
          </div>
          <button
            onClick={() => setShowSignInBanner(false)}
            aria-label="Dismiss sign in notice"
            title="Dismiss notice"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-blue-100 hover:text-slate-700 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {activeView === 'editor' ? (
          <JournalEditor
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSaveSuccess={() => setActiveView('archive')}
            onOpenSecurityCockpit={() => setIsSecurityCockpitOpen(true)}
          />
        ) : activeView === 'archive' ? (
          <JournalList
            entries={displayEntries}
            loading={entriesLoading}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onNewSession={() => setActiveView('editor')}
            userId={user?.uid}
          />
        ) : (
          <MoodDashboard
            entries={displayEntries}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onNewSession={() => setActiveView('editor')}
          />
        )}
      </main>

      {/* Security Architecture Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Google AI Studio Security Constitution Compliant</span>
            <span className="text-slate-300">•</span>
            <span>STRIDE Defensive Guardrails Active</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSecurityCockpitOpen(true)}
              className="hover:text-blue-600 underline underline-offset-2 transition"
            >
              View Threat Model & Constitution
            </button>
            <span>•</span>
            <span className="text-slate-400">Zero Cross-Tenant Leakage</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <SecurityCockpitModal
        isOpen={isSecurityCockpitOpen}
        onClose={() => setIsSecurityCockpitOpen(false)}
        userId={user?.uid}
      />

      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onDelete={handleDeleteEntry}
      />
    </div>
  );
}
