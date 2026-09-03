import { useState } from 'react';
import {
  Search,
  Lock,
  Sparkles,
  Calendar,
  Tag,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  Plus,
  Compass,
  Lightbulb,
  Brain,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { JournalEntry, SessionMode } from '../types';

interface JournalListProps {
  entries: JournalEntry[];
  loading: boolean;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewSession: () => void;
  userId?: string;
}

export function JournalList({
  entries,
  loading,
  onSelectEntry,
  onNewSession,
  userId,
}: JournalListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      entries.flatMap((e) => (Array.isArray(e.tags) ? e.tags.map((t) => t.toLowerCase()) : []))
    )
  );

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (!entry.isEncrypted && entry.content.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMode = modeFilter === 'all' || entry.promptMode === modeFilter;
    const matchesTag = !selectedTag || (entry.tags && entry.tags.map((t) => t.toLowerCase()).includes(selectedTag));

    return matchesSearch && matchesMode && matchesTag;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header & Stats Banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
            Isolated Journal & Reflection Vault
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically partitioned storage in Cloud Firestore under{' '}
            <code className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1 py-0.5 rounded">
              /users/{userId ? userId.slice(0, 8) + '...' : 'uid'}/entries
            </code>
          </p>
        </div>

        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Journal Session</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="search-entries-input"
            type="text"
            placeholder="Search reflections, breakthroughs, titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <select
            id="filter-mode-select"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
          >
            <option value="all">All Modes</option>
            <option value="freeform">Empathetic Reflection</option>
            <option value="socratic">Socratic Inquiry</option>
            <option value="strategic">Strategic Clarity</option>
            <option value="reframing">Stoic & CBT Reframe</option>
            <option value="brainstorm">Lateral Ideation</option>
          </select>

          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200"
            >
              <span>Tag: #{selectedTag}</span>
              <span className="ml-1 text-blue-500 hover:text-blue-800">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Popular Tags Strip */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-bold mr-1 text-[10px] uppercase tracking-widest">
            Filter by Topics:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Entry Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchTerm || modeFilter !== 'all' || selectedTag
              ? 'No matching reflections found'
              : 'Your vault is awaiting its first reflection'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || modeFilter !== 'all' || selectedTag
              ? 'Try adjusting your search terms or filter settings.'
              : 'Begin a new session to brainstorm, unpick thoughts with Gemini, and persist structured summaries to Cloud Firestore.'}
          </p>
          <button
            onClick={onNewSession}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Start Journaling</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md cursor-pointer"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    {entry.isEncrypted ? (
                      <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200">
                        <Lock className="h-3 w-3" /> Encrypted
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                        {entry.promptMode}
                      </span>
                    )}
                    {entry.sentiment && (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-100">
                        {entry.sentiment}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                  {entry.title}
                </h3>

                {/* Excerpt / Summary */}
                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {entry.summary
                    ? entry.summary
                    : entry.isEncrypted
                    ? '•••••••••••••••••••••••••••••••• (Encrypted Vault Content - Click with passphrase to unlock)'
                    : entry.content}
                </p>
              </div>

              {/* Footer details */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex flex-wrap items-center gap-1">
                  {entry.tags && entry.tags.slice(0, 2).map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium"
                    >
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                  {entry.tags && entry.tags.length > 2 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      +{entry.tags.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-blue-600">
                  <span>View</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
