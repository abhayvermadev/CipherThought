import { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Sparkles,
  Calendar,
  Tag,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  Flame,
  Brain,
  MessageSquare,
  ShieldCheck,
  Activity,
  Smile,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { decryptWithVault } from '../lib/cryptoVault';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function EntryDetailModal({ entry, onClose, onDelete }: EntryDetailModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  if (!entry) return null;

  const handleDecrypt = async () => {
    if (!passphrase.trim()) {
      setDecryptError('Please enter the vault passphrase.');
      return;
    }
    if (!entry.iv || !entry.salt) {
      setDecryptError('Cryptographic initialization vector missing.');
      return;
    }

    setDecrypting(true);
    setDecryptError(null);

    try {
      const plaintext = await decryptWithVault(entry.content, entry.iv, entry.salt, passphrase);
      setDecryptedText(plaintext);
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setDecryptError('Decryption failed: Incorrect passphrase or tampered ciphertext.');
    } finally {
      setDecrypting(false);
    }
  };

  const exportAsMarkdown = () => {
    const rawContent = entry.isEncrypted
      ? decryptedText || '[ENCRYPTED_VAULT_CONTENT - UNLOCK TO VIEW]'
      : entry.content;

    let md = `# ${entry.title}\n\n`;
    md += `*Date: ${new Date(entry.createdAt).toLocaleString()}*\n`;
    md += `*Mode: ${entry.promptMode}*\n`;
    if (entry.sentiment) md += `*Sentiment: ${entry.sentiment}*\n`;
    md += `\n---\n\n## Journal Entry\n\n${rawContent}\n\n`;

    if (entry.summary) {
      md += `## Gemini Executive Summary\n\n${entry.summary}\n\n`;
    }

    if (entry.cognitiveReframe) {
      md += `## Cognitive Reframe\n\n${entry.cognitiveReframe}\n\n`;
    }

    if (entry.insights && entry.insights.length > 0) {
      md += `## Key Insights\n\n`;
      entry.insights.forEach((item) => (md += `- ${item}\n`));
      md += '\n';
    }

    if (entry.actionItems && entry.actionItems.length > 0) {
      md += `## Action Items\n\n`;
      entry.actionItems.forEach((item) => (md += `- [ ] ${item}\n`));
      md += '\n';
    }

    if (entry.messages && entry.messages.length > 0) {
      md += `## Gemini Dialogue Transcript\n\n`;
      entry.messages.forEach((m) => {
        md += `**${m.role === 'user' ? 'Journaler' : 'Gemini'}**: ${m.content}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journal.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLocked = entry.isEncrypted && decryptedText === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              {entry.isEncrypted ? <Lock className="h-5 w-5 text-purple-600" /> : <Sparkles className="h-5 w-5 text-amber-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {entry.title}
                </h3>
                {entry.isEncrypted && (
                  <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-purple-200">
                    AES-GCM Encrypted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
                <span>•</span>
                <span className="capitalize">{entry.promptMode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAsMarkdown}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              title="Download as Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
              title="Delete from Firestore"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700">
          {/* Zero-Knowledge Decryption Prompt if Encrypted & Locked */}
          {isLocked ? (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-6 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <Lock className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-purple-950">
                Encrypted with Client-Side Zero-Knowledge Cryptography
              </h4>
              <p className="mt-1 text-xs text-purple-800 max-w-md mx-auto">
                This entry was encrypted with AES-256-GCM using your personal passphrase before saving to Cloud Firestore. Enter your passphrase to decrypt in browser memory.
              </p>

              {decryptError && (
                <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 max-w-sm mx-auto">
                  {decryptError}
                </div>
              )}

              <div className="mt-4 flex max-w-sm mx-auto items-center gap-2">
                <input
                  type="password"
                  placeholder="Enter vault passphrase..."
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                  className="flex-1 rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-800 focus:border-purple-500 focus:outline-hidden"
                />
                <button
                  onClick={handleDecrypt}
                  disabled={decrypting}
                  className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                >
                  {decrypting ? 'Decrypting...' : 'Unlock'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Journal Thoughts
                </h4>
                {entry.isEncrypted && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    <Unlock className="h-3 w-3" /> Decrypted in Memory
                  </span>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap border border-slate-200">
                {entry.isEncrypted ? decryptedText : entry.content}
              </div>
            </div>
          )}

          {/* Gemini Summary & Extraction Section */}
          {entry.summary && (
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Gemini Executive Summary & Extraction
                  </span>
                </div>
                {entry.sentiment && (
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {entry.sentiment}
                  </span>
                )}
              </div>

              <p className="text-xs text-blue-950 leading-relaxed bg-white p-3.5 rounded-xl border border-blue-100">
                "{entry.summary}"
              </p>

              {/* Mood & Sentiment Metrics if available */}
              {(entry.sentimentScore !== undefined || entry.primaryMood) && (
                <div className="rounded-xl border border-blue-200/80 bg-white p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Activity className="h-3.5 w-3.5 text-blue-600" />
                      <span>{entry.primaryMood || 'Reflective'}</span>
                      {entry.energyLevel && (
                        <span className="font-mono text-[11px] text-slate-500 font-normal">
                          • {entry.energyLevel} Energy
                        </span>
                      )}
                    </div>
                    {entry.sentimentScore !== undefined && (
                      <span className="font-mono font-bold text-blue-700">
                        Score: {entry.sentimentScore}/100
                      </span>
                    )}
                  </div>
                  {entry.sentimentScore !== undefined && (
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          entry.sentimentScore >= 75
                            ? 'bg-emerald-500'
                            : entry.sentimentScore >= 60
                            ? 'bg-blue-600'
                            : entry.sentimentScore >= 45
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, entry.sentimentScore))}%` }}
                      />
                    </div>
                  )}
                  {entry.emotionalDimensions && (
                    <div className="grid grid-cols-4 gap-2 pt-1 text-[10px]">
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                        <span className="text-slate-500 block">Joy</span>
                        <span className="font-mono font-bold text-emerald-700">{entry.emotionalDimensions.joy}%</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                        <span className="text-slate-500 block">Calm</span>
                        <span className="font-mono font-bold text-blue-700">{entry.emotionalDimensions.calm}%</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                        <span className="text-slate-500 block">Clarity</span>
                        <span className="font-mono font-bold text-indigo-700">{entry.emotionalDimensions.clarity}%</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                        <span className="text-slate-500 block">Energy</span>
                        <span className="font-mono font-bold text-amber-700">{entry.emotionalDimensions.energy}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {entry.cognitiveReframe && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800">
                  <div className="font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
                    <Brain className="h-3.5 w-3.5 text-blue-600" />
                    <span>Cognitive Reframe</span>
                  </div>
                  <p className="italic">{entry.cognitiveReframe}</p>
                </div>
              )}

              {/* Insights & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.insights && entry.insights.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5 text-blue-600" /> Insights
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {entry.insights.map((item, i) => (
                        <li key={i} className="bg-white p-2 rounded-lg border border-slate-100">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.actionItems && entry.actionItems.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-600" /> Action Items
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {entry.actionItems.map((item, i) => (
                        <li key={i} className="bg-white p-2 rounded-lg border border-slate-100">
                          ✓ {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-blue-100">
                  <Tag className="h-3 w-3 text-slate-400 mr-1" />
                  {entry.tags.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200"
                    >
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                  {entry.energyLevel && (
                    <span className="ml-auto text-[11px] font-semibold text-slate-500">
                      Energy: {entry.energyLevel}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Multi-turn Dialogue Transcript */}
          {entry.messages && entry.messages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                <span>Multi-turn Gemini Transcript</span>
              </h4>
              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                {entry.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 text-xs leading-relaxed ${
                      m.role === 'user' ? 'bg-blue-600 text-white ml-4 shadow-2xs' : 'bg-white text-slate-800 mr-4 border border-slate-200'
                    }`}
                  >
                    <div className={`font-bold text-[10px] uppercase mb-1 ${m.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                      {m.role === 'user' ? 'Journaler' : 'Gemini'}
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security & Database Verification Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 font-mono space-y-1">
            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Isolated Firestore Document Storage Path:</span>
            </div>
            <div>/users/{entry.userId}/entries/{entry.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
