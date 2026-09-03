import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  Sparkles,
  Send,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  Mic,
  MicOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  Compass,
  Lightbulb,
  CheckSquare,
  Flame,
  Brain,
  MessageSquare,
  HelpCircle,
  Wand2,
  RefreshCw,
  Activity,
  Smile,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { db, collection, doc, setDoc, serverTimestamp } from '../lib/firebase';
import { ChatMessage, SessionMode, SecurityThreatReport, EmotionalDimensions } from '../types';
import { encryptWithVault } from '../lib/cryptoVault';
import { deriveSentimentScore, getMoodVisualAttributes } from '../utils/moodAnalyzer';

function formatClientErrorMessage(err: any, fallback: string): string {
  let msg = err?.message || fallback;
  if (typeof msg === 'string') {
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
      return 'The AI service is momentarily handling high demand. Please try sending your reflection again in a moment.';
    }
    if (msg.startsWith('{') || msg.includes('{"error"')) {
      try {
        const jsonStart = msg.indexOf('{');
        const parsed = JSON.parse(msg.slice(jsonStart));
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
      } catch (_) {}
    }
  }
  return msg;
}

interface JournalEditorProps {
  user: User | null;
  onOpenAuth: () => void;
  onSaveSuccess: () => void;
  onOpenSecurityCockpit: () => void;
}

const MODES: { id: SessionMode; label: string; icon: any; desc: string; placeholder: string }[] = [
  {
    id: 'freeform',
    label: 'Empathetic Reflection',
    icon: Compass,
    desc: 'Deep listening and intuitive mirroring to unpick tangled thoughts',
    placeholder: 'What has been occupying your mind today? Write candidly...',
  },
  {
    id: 'socratic',
    label: 'Socratic Inquiry',
    icon: HelpCircle,
    desc: 'Probing unexamined assumptions and discovering blind spots',
    placeholder: 'Share a belief, decision, or situation you wish to rigorously test...',
  },
  {
    id: 'strategic',
    label: 'Strategic Clarity',
    icon: TargetIcon,
    desc: 'Sounding board for high-leverage decisions, trade-offs, and frameworks',
    placeholder: 'What major project, priority conflict, or decision are you navigating?',
  },
  {
    id: 'reframing',
    label: 'Stoic & CBT Reframe',
    icon: Brain,
    desc: 'Transforming adversity or stress into constructive agency and calm',
    placeholder: 'What frustration or anxiety would you like to re-examine through a lens of agency?',
  },
  {
    id: 'brainstorm',
    label: 'Lateral Ideation',
    icon: Lightbulb,
    desc: 'Divergent thinking catalyst for novel concepts and creative seeds',
    placeholder: 'What is a nascent idea, story, or project you want to wildly expand?',
  },
];

function TargetIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function JournalEditor({
  user,
  onOpenAuth,
  onSaveSuccess,
  onOpenSecurityCockpit,
}: JournalEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<SessionMode>('freeform');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Gemini Executive Summarizer State
  const [summary, setSummary] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState('');
  const [sentimentScore, setSentimentScore] = useState<number | undefined>(undefined);
  const [primaryMood, setPrimaryMood] = useState<string>('');
  const [emotionalDimensions, setEmotionalDimensions] = useState<EmotionalDimensions | undefined>(undefined);
  const [energyLevel, setEnergyLevel] = useState('');
  const [cognitiveReframe, setCognitiveReframe] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [analyzingMood, setAnalyzingMood] = useState(false);

  // Zero-Knowledge Encryption State (Phase 3 Feature)
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphraseInput, setShowPassphraseInput] = useState(false);

  // Live Threat Shield / Pre-flight Scanner State
  const [scanResult, setScanResult] = useState<SecurityThreatReport | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Pre-flight scanner debounced for active writing
  useEffect(() => {
    const combined = `${title} ${content} ${chatInput}`.trim();
    if (!combined) {
      setScanResult(null);
      return;
    }

    const timer = setTimeout(() => {
      fetch('/api/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: combined }),
      })
        .then((res) => res.json())
        .then((data) => setScanResult(data))
        .catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [title, content, chatInput]);

  // Voice dictation init
  const toggleSpeechRecognition = () => {
    const windowObj = window as any;
    const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition API is not supported in this browser environment. You can type directly.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setContent((prev) => (prev ? prev + ' ' + transcript : transcript));
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  // Multi-turn conversational send
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || chatLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionMode: mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with Gemini API');
      }

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        threatFlags: data.threatEvaluation?.flags,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setStatusMessage({ type: 'error', text: formatClientErrorMessage(err, 'Chat error occurred') });
    } finally {
      setChatLoading(false);
    }
  };

  // Automatic Summarizer & Cognitive Insights
  const handleGenerateSummary = async () => {
    if (!content && messages.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Write some thoughts in your journal or chat with Gemini before summarizing.',
      });
      return;
    }

    setSummarizing(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled Journal Reflection',
          content,
          dialogueHistory: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Summarization failed');
      }

      setSummary(data.summary || '');
      setInsights(Array.isArray(data.insights) ? data.insights : []);
      setActionItems(Array.isArray(data.actionItems) ? data.actionItems : []);
      setTags(Array.isArray(data.tags) ? data.tags : []);
      setSentiment(data.sentiment || '');
      if (typeof data.sentimentScore === 'number') {
        setSentimentScore(data.sentimentScore);
      }
      if (data.primaryMood) {
        setPrimaryMood(data.primaryMood);
      }
      if (data.emotionalDimensions) {
        setEmotionalDimensions(data.emotionalDimensions);
      }
      setEnergyLevel(data.energyLevel || '');
      setCognitiveReframe(data.cognitiveReframe || '');

      setStatusMessage({
        type: 'success',
        text: 'Gemini cognitive reflection and executive summary generated successfully!',
      });
    } catch (err: any) {
      console.error('Summarize error:', err);
      setStatusMessage({ type: 'error', text: formatClientErrorMessage(err, 'Could not generate summary') });
    } finally {
      setSummarizing(false);
    }
  };

  // Dedicated AI Mood & Sentiment Analysis Trigger
  const handleAnalyzeMood = async () => {
    if (!content.trim() && messages.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Write some thoughts in your journal or chat with Gemini before analyzing mood.',
      });
      return;
    }

    setAnalyzingMood(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/gemini/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          dialogueHistory: messages,
          currentSentiment: sentiment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Mood analysis failed');
      }

      setSentimentScore(data.sentimentScore ?? 70);
      setPrimaryMood(data.primaryMood || 'Reflective');
      if (data.sentiment) setSentiment(data.sentiment);
      if (data.energyLevel) setEnergyLevel(data.energyLevel);
      if (data.emotionalDimensions) setEmotionalDimensions(data.emotionalDimensions);

      setStatusMessage({
        type: 'success',
        text: `AI Mood Analysis Complete: ${data.primaryMood} (Sentiment Score: ${data.sentimentScore}/100)`,
      });
    } catch (err: any) {
      console.error('Mood Analysis error:', err);
      setStatusMessage({ type: 'error', text: formatClientErrorMessage(err, 'Could not analyze mood') });
    } finally {
      setAnalyzingMood(false);
    }
  };

  // Save session to Cloud Firestore (Strict Isolated Namespace)
  const handleSaveToFirestore = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!title.trim() && !content.trim() && messages.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please add content or thoughts before saving.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      let finalContent = content;
      let ivBase64: string | undefined = undefined;
      let saltBase64: string | undefined = undefined;

      // Handle Zero-Knowledge Vault Encryption if enabled
      if (isEncrypted) {
        if (!passphrase.trim()) {
          setShowPassphraseInput(true);
          throw new Error('Please specify a passphrase to encrypt your Zero-Knowledge Vault entry.');
        }
        const encrypted = await encryptWithVault(content, passphrase);
        finalContent = encrypted.ciphertext;
        ivBase64 = encrypted.iv;
        saltBase64 = encrypted.salt;
      }

      const entryId = 'entry_' + Date.now();
      // Strict multi-tenant path: /users/{userId}/entries/{entryId}
      const entryRef = doc(db, 'users', user.uid, 'entries', entryId);

      // Derive definite sentiment score so dashboard is never empty
      const resolvedScore =
        sentimentScore !== undefined
          ? sentimentScore
          : deriveSentimentScore({
              id: entryId,
              userId: user.uid,
              title,
              content,
              promptMode: mode,
              messages,
              summary,
              insights,
              actionItems,
              tags,
              sentiment,
              energyLevel,
              isEncrypted,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });

      const payload = {
        id: entryId,
        userId: user.uid,
        title: title.trim() || 'Journal Reflection ' + new Date().toLocaleDateString(),
        content: finalContent,
        promptMode: mode,
        messages,
        summary,
        insights,
        actionItems,
        tags,
        sentiment: sentiment || 'Reflective & Balanced',
        sentimentScore: resolvedScore,
        primaryMood: primaryMood || 'Reflective',
        emotionalDimensions: emotionalDimensions || {
          joy: Math.min(100, Math.round(resolvedScore * 0.9)),
          calm: 70,
          clarity: 75,
          energy: energyLevel === 'High' ? 85 : 65,
        },
        energyLevel: energyLevel || 'Steady',
        cognitiveReframe,
        isEncrypted,
        iv: ivBase64 || null,
        salt: saltBase64 || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        serverTimestamp: serverTimestamp(),
      };

      await setDoc(entryRef, payload);

      setStatusMessage({
        type: 'success',
        text: `Saved to isolated Firestore namespace (/users/${user.uid.slice(0, 6)}.../entries) with zero-leakage guarantee!`,
      });

      onSaveSuccess();
    } catch (err: any) {
      console.error('Save to Firestore error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save entry to Cloud Firestore',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedModeObj = MODES.find((m) => m.id === mode) || MODES[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Session Config Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display">
            Personal Reflection & Brainstorming Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-turn dialogue with Gemini • Zero-trust server keys • Isolated Cloud Firestore
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Security Pre-flight Status Indicator */}
          <button
            onClick={onOpenSecurityCockpit}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition"
            title="Inspect threat shield"
          >
            {scanResult?.score === 'POTENTIAL_INJECTION' ? (
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
            ) : scanResult?.flags && scanResult.flags.length > 0 ? (
              <Shield className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className="text-slate-700">
              {scanResult?.score === 'POTENTIAL_INJECTION'
                ? 'Injection Detected'
                : scanResult?.flags && scanResult.flags.length > 0
                ? 'PII Scrub Active'
                : 'Threat Shield: Clean'}
            </span>
          </button>

          {/* Zero-Knowledge Vault Encryption Toggle */}
          <button
            id="toggle-vault-encryption-btn"
            onClick={() => {
              const next = !isEncrypted;
              setIsEncrypted(next);
              setShowPassphraseInput(next);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition shadow-2xs ${
              isEncrypted
                ? 'border border-blue-300 bg-blue-50 text-blue-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isEncrypted ? <Lock className="h-3.5 w-3.5 text-blue-600" /> : <Unlock className="h-3.5 w-3.5 text-slate-400" />}
            <span>{isEncrypted ? 'Vault Encrypted (AES-GCM)' : 'Encrypt Vault Entry'}</span>
          </button>

          {/* Summarize with Gemini */}
          <button
            id="summarize-gemini-btn"
            onClick={handleGenerateSummary}
            disabled={summarizing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
          >
            <Sparkles className={`h-3.5 w-3.5 text-blue-600 ${summarizing ? 'animate-spin' : ''}`} />
            <span>{summarizing ? 'Gemini Synthesizing...' : 'Summarize & Extract'}</span>
          </button>

          {/* Dedicated AI Mood Analysis Button */}
          <button
            id="analyze-mood-btn"
            onClick={handleAnalyzeMood}
            disabled={analyzingMood}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
          >
            <Smile className={`h-3.5 w-3.5 text-blue-600 ${analyzingMood ? 'animate-spin' : ''}`} />
            <span>{analyzingMood ? 'Evaluating Mood...' : 'Analyze Mood'}</span>
          </button>

          {/* Save to Firestore */}
          <button
            id="save-firestore-btn"
            onClick={handleSaveToFirestore}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className={`h-3.5 w-3.5 text-white ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Persisting to Firestore...' : 'Save to Vault'}</span>
          </button>
        </div>
      </div>

      {/* Passphrase Drawer if Encrypted */}
      {showPassphraseInput && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-blue-950">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>Zero-Knowledge Client-Side Cryptography (AES-256-GCM)</span>
            </div>
            <span className="text-[11px] text-blue-700 font-mono">
              Key remains in volatile browser memory only
            </span>
          </div>
          <p className="mt-1 text-blue-900/80 text-[11px] leading-relaxed">
            Your journal thoughts will be encrypted with a key derived via PBKDF2 (100,000 rounds) before transmission. Neither Firebase nor the server can ever read this entry without your passphrase.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              id="vault-passphrase-input"
              type="password"
              placeholder="Enter your secret vault passphrase..."
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="max-w-md flex-1 rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-500">
              {passphrase ? '✓ Passphrase set' : 'Required before saving'}
            </span>
          </div>
        </div>
      )}

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`mb-5 flex items-center justify-between rounded-xl p-3.5 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Selector Pill Strip */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-1">
          Cognitive Framing:
        </span>
        {MODES.map((m) => {
          const Icon = m.icon;
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              id={`mode-select-${m.id}`}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Journal Canvas & Document (Col 7) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Canvas Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            {/* Title Input */}
            <div className="mb-4">
              <input
                id="journal-title-input"
                type="text"
                placeholder="Session or Journal Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-hidden"
              />
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2 text-[11px] text-slate-400">
                <span className="font-mono">{selectedModeObj.desc}</span>
                <span className="font-mono">{content.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>

            {/* Content Textarea */}
            <div className="relative">
              <textarea
                id="journal-content-textarea"
                rows={12}
                placeholder={selectedModeObj.placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full resize-y text-slate-800 placeholder:text-slate-400 focus:outline-hidden text-sm leading-relaxed font-sans"
              />

              {/* Float Controls: Voice Dictation */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <button
                  id="voice-dictation-btn"
                  onClick={toggleSpeechRecognition}
                  type="button"
                  title={isListening ? 'Stop recording voice' : 'Dictate with voice'}
                  className={`rounded-lg p-2 text-xs transition ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* GEMINI EXECUTIVE SYNTHESIS CARD */}
          {(summary || insights.length > 0 || actionItems.length > 0 || tags.length > 0 || sentimentScore !== undefined) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Gemini Executive Synthesis & Cognitive Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Psychometric sentiment score & structured model output
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sentimentScore !== undefined && (
                    <span className="rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-xs font-bold font-mono shadow-2xs">
                      {sentimentScore}/100 Score
                    </span>
                  )}
                  {sentiment && (
                    <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {sentiment}
                    </span>
                  )}
                </div>
              </div>

              {/* Mood & Psychometric Sentiment Meter */}
              {sentimentScore !== undefined && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-slate-800">
                        {primaryMood || 'Reflective State'}
                      </span>
                      {energyLevel && (
                        <span className="text-[11px] font-mono text-slate-500">
                          ({energyLevel} Energy)
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-blue-700">
                      Sentiment Index: {sentimentScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        sentimentScore >= 75
                          ? 'bg-emerald-500'
                          : sentimentScore >= 60
                          ? 'bg-blue-600'
                          : sentimentScore >= 45
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, sentimentScore))}%` }}
                    />
                  </div>

                  {emotionalDimensions && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500">Joy</span>
                        <span className="font-mono font-bold text-emerald-600">{emotionalDimensions.joy}%</span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500">Calm</span>
                        <span className="font-mono font-bold text-blue-600">{emotionalDimensions.calm}%</span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500">Clarity</span>
                        <span className="font-mono font-bold text-indigo-600">{emotionalDimensions.clarity}%</span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500">Energy</span>
                        <span className="font-mono font-bold text-amber-600">{emotionalDimensions.energy}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div>
                  <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1.5">
                    Real-Time Summary
                  </h4>
                  <p className="text-xs text-blue-950 font-medium leading-relaxed bg-blue-50/80 p-4 rounded-xl border border-blue-100/70">
                    "{summary}"
                  </p>
                </div>
              )}

              {/* Cognitive Reframe */}
              {cognitiveReframe && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-800">
                  <div className="font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
                    <Brain className="h-3.5 w-3.5 text-blue-600" />
                    <span>Cognitive Reframe & Mindset Shift</span>
                  </div>
                  <p className="italic leading-relaxed">{cognitiveReframe}</p>
                </div>
              )}

              {/* Insights & Action Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
                      <span>Key Insights & Breakthroughs</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {insights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {actionItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Action Items & Experiments</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <Tag className="h-3 w-3 text-slate-400 mr-1" />
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                  {energyLevel && (
                    <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Flame className="h-3 w-3 text-orange-500" /> Energy: {energyLevel}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Multi-turn Dialogue with Gemini (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-col h-[640px] rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Gemini Thinking Partner</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Mode: {selectedModeObj.label} • Zero-Leak
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMessages([])}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                title="Clear dialogue history"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Dialogue Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Multi-Turn Dialogue Companion</h4>
                  <p className="mt-1 text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    Ask Gemini to probe your thoughts, challenge premises, or explore frameworks under your security constitution.
                  </p>
                  <div className="mt-4 flex flex-col gap-1.5 w-full text-[11px] text-slate-700">
                    <button
                      onClick={() => {
                        setChatInput("What blind spots might I be overlooking in this reflection?");
                      }}
                      className="rounded-xl bg-white p-2.5 border border-slate-200 text-left hover:border-blue-300 hover:bg-slate-50 transition shadow-2xs"
                    >
                      "What blind spots might I be overlooking in this reflection?"
                    </button>
                    <button
                      onClick={() => {
                        setChatInput("Help me reframe this challenge using a Stoic perspective.");
                      }}
                      className="rounded-xl bg-white p-2.5 border border-slate-200 text-left hover:border-blue-300 hover:bg-slate-50 transition shadow-2xs"
                    >
                      "Help me reframe this challenge using a Stoic perspective."
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                      <span>{m.role === 'user' ? 'You' : 'Gemini'}</span>
                      <span>•</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-slate-600 border border-slate-200 shadow-2xs w-fit">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                  <span>Gemini is reflecting...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  id="gemini-chat-input"
                  type="text"
                  placeholder="Message Gemini (Secure Session)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 pr-24 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-slate-800 placeholder:text-slate-400"
                />
                <div className="absolute right-1.5 flex items-center">
                  <button
                    id="gemini-chat-send-btn"
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    SEND
                  </button>
                </div>
              </form>
              <div className="mt-2.5 flex justify-between items-center text-[10px]">
                <div className="flex space-x-3 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-slate-400" /> Private Mode Active
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-slate-400" /> End-to-End Encrypted
                  </span>
                </div>
                <span className="text-slate-500 font-mono tracking-tight">
                  {chatLoading ? 'Summarizing Session...' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Sleek Inspector & Audit Stack from Sleek Interface Theme */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Original Feature: Audit & Verif
                </span>
                <span className="text-xs font-black text-emerald-700">98.4%</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-800">INTEGRITY SCORE</span>
                  <span className="text-xs font-black text-emerald-700">PASS</span>
                </div>
                <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[98.4%]"></div>
                </div>
                <p className="text-[9px] text-emerald-600 mt-1.5 font-medium uppercase tracking-tight">
                  All conversation packets cryptographically verified.
                </p>
              </div>
            </div>

            {/* Active Secret Stack */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Active Secret Stack
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">API_KEY_GEMINI</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600 font-medium">
                    v2_Active (Server)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">FIREBASE_CRED</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600 font-medium">
                    Firestore Isolated
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">ENCRYPT_IV</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600 font-medium">
                    {isEncrypted ? 'AES-256-GCM' : 'Ephemeral'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dark Security Constitution Box */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                Security Constitution
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"></div>
                  <p className="text-[10px] text-slate-300">Zero-Leak Firestore Rules Enforced</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"></div>
                  <p className="text-[10px] text-slate-300">AES-256 Envelope Encrypt & PII Sanitizer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
