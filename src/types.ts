export type SessionMode = 'freeform' | 'socratic' | 'strategic' | 'reframing' | 'brainstorm';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  threatFlags?: string[];
}

export interface ExtractedInsight {
  title?: string;
  text: string;
}

export interface EmotionalDimensions {
  joy: number; // 0 - 100
  calm: number; // 0 - 100
  clarity: number; // 0 - 100
  energy: number; // 0 - 100
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string; // Plain text or ciphertext if encrypted
  promptMode: SessionMode;
  messages: ChatMessage[];
  summary: string;
  insights: string[];
  actionItems: string[];
  tags: string[];
  sentiment: string;
  sentimentScore?: number; // 0 to 100 scale (0 = Distressed/Struggling, 50 = Neutral/Reflective, 100 = Peak/Optimistic)
  primaryMood?: string; // e.g., "Inspired", "Calm", "Optimistic", "Reflective", "Anxious", "Determined"
  emotionalDimensions?: EmotionalDimensions;
  energyLevel?: string;
  cognitiveReframe?: string;
  isEncrypted: boolean;
  iv?: string;
  salt?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SecurityThreatReport {
  isSafe: boolean;
  score: 'CLEAN' | 'CAUTION' | 'POTENTIAL_INJECTION';
  flags: string[];
  sanitizedText: string;
  redactedCount: number;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: number;
  action: 'AUTH_SIGNIN' | 'AUTH_SIGNOUT' | 'PROMPT_SCAN' | 'GEMINI_MULTI_TURN' | 'GEMINI_SUMMARIZE' | 'VAULT_KEY_DERIVED' | 'ENTRY_ENCRYPTED' | 'ENTRY_DELETED';
  threatScore: string;
  details: string;
}
