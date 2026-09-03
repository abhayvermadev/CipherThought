import { JournalEntry, EmotionalDimensions } from '../types';

/**
 * Intelligent score derivation for entries that don't have an explicit numeric score saved yet.
 */
export function deriveSentimentScore(entry: JournalEntry): number {
  if (typeof entry.sentimentScore === 'number' && !isNaN(entry.sentimentScore)) {
    return Math.max(0, Math.min(100, Math.round(entry.sentimentScore)));
  }

  // Derive score from qualitative sentiment, energyLevel, and text heuristics
  let baseScore = 65; // Balanced reflective baseline

  const textToScan = `${entry.sentiment || ''} ${entry.energyLevel || ''} ${entry.title || ''} ${entry.summary || ''}`.toLowerCase();

  const highPositiveKeywords = ['energized', 'inspired', 'breakthrough', 'grateful', 'euphoric', 'thriving', 'triumphant', 'delighted', 'excited'];
  const moderatePositiveKeywords = ['optimistic', 'calm', 'clear', 'grounded', 'deliberate', 'steady', 'resilient', 'focused', 'peaceful', 'productive'];
  const negativeKeywords = ['anxious', 'frustrated', 'stressed', 'overwhelmed', 'exhausted', 'uncertain', 'heavy', 'doubt', 'conflicted', 'sad', 'fatigued'];
  const highDistressKeywords = ['panic', 'hopeless', 'crisis', 'paralyzed', 'despair', 'burned out', 'angry'];

  let positiveHits = 0;
  let negativeHits = 0;

  highPositiveKeywords.forEach((k) => {
    if (textToScan.includes(k)) positiveHits += 2;
  });
  moderatePositiveKeywords.forEach((k) => {
    if (textToScan.includes(k)) positiveHits += 1;
  });
  negativeKeywords.forEach((k) => {
    if (textToScan.includes(k)) negativeHits += 1.5;
  });
  highDistressKeywords.forEach((k) => {
    if (textToScan.includes(k)) negativeHits += 3;
  });

  if (entry.energyLevel === 'High') baseScore += 8;
  if (entry.energyLevel === 'Reflective') baseScore += 3;

  baseScore += positiveHits * 6 - negativeHits * 8;

  return Math.max(15, Math.min(98, Math.round(baseScore)));
}

export function getPrimaryMood(entry: JournalEntry): string {
  if (entry.primaryMood && entry.primaryMood.trim()) {
    return entry.primaryMood.trim();
  }
  if (entry.sentiment) {
    const cleaned = entry.sentiment.replace(/^(e\.g\.,?|and|with)\s*/i, '').trim();
    const parts = cleaned.split(/[,/&•|-]/);
    if (parts[0] && parts[0].trim().length > 0) {
      return parts[0].trim();
    }
  }
  const score = deriveSentimentScore(entry);
  if (score >= 80) return 'Inspired';
  if (score >= 68) return 'Optimistic';
  if (score >= 55) return 'Reflective';
  if (score >= 40) return 'Contemplative';
  return 'Challenged';
}

export function getEmotionalDimensions(entry: JournalEntry): EmotionalDimensions {
  if (
    entry.emotionalDimensions &&
    typeof entry.emotionalDimensions.joy === 'number' &&
    typeof entry.emotionalDimensions.calm === 'number'
  ) {
    return entry.emotionalDimensions;
  }

  const score = deriveSentimentScore(entry);
  const isHighEnergy = entry.energyLevel === 'High' || entry.promptMode === 'brainstorm';
  const isStoic = entry.promptMode === 'reframing' || entry.promptMode === 'strategic';

  return {
    joy: Math.max(10, Math.min(100, Math.round(score * 0.95))),
    calm: Math.max(15, Math.min(100, Math.round(isStoic ? score * 0.85 + 15 : score * 0.8))),
    clarity: Math.max(20, Math.min(100, Math.round(score * 0.9 + 5))),
    energy: Math.max(15, Math.min(100, Math.round(isHighEnergy ? 80 : 60))),
  };
}

export interface MoodVisualMetadata {
  label: string;
  category: 'positive' | 'neutral' | 'challenging';
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  ringColor: string;
  dotColor: string;
  chartColor: string;
}

export function getMoodVisualAttributes(score: number): MoodVisualMetadata {
  if (score >= 75) {
    return {
      label: 'Positive & Energized',
      category: 'positive',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      ringColor: 'ring-emerald-500/20',
      dotColor: 'bg-emerald-500',
      chartColor: '#10B981', // emerald-500
    };
  }
  if (score >= 60) {
    return {
      label: 'Grounded & Constructive',
      category: 'positive',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      borderColor: 'border-blue-200',
      ringColor: 'ring-blue-500/20',
      dotColor: 'bg-blue-500',
      chartColor: '#2563EB', // blue-600
    };
  }
  if (score >= 45) {
    return {
      label: 'Reflective Equilibrium',
      category: 'neutral',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      borderColor: 'border-amber-200',
      ringColor: 'ring-amber-500/20',
      dotColor: 'bg-amber-500',
      chartColor: '#F59E0B', // amber-500
    };
  }
  return {
    label: 'Challenging / Processing',
    category: 'challenging',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    ringColor: 'ring-rose-500/20',
    dotColor: 'bg-rose-500',
    chartColor: '#E11D48', // rose-600
  };
}

export interface TimelineDataPoint {
  id: string;
  date: string;
  fullDate: string;
  timestamp: number;
  sentimentScore: number;
  movingAverage: number;
  title: string;
  primaryMood: string;
  promptMode: string;
}

export function buildTimelineData(entries: JournalEntry[], timeFilter: '7d' | '30d' | 'all' = 'all'): TimelineDataPoint[] {
  if (!entries || entries.length === 0) return [];

  const now = Date.now();
  const filterCutoff =
    timeFilter === '7d'
      ? now - 7 * 24 * 60 * 60 * 1000
      : timeFilter === '30d'
      ? now - 30 * 24 * 60 * 60 * 1000
      : 0;

  const validEntries = entries
    .filter((e) => (e.createdAt || 0) >= filterCutoff)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const points: TimelineDataPoint[] = [];
  const scores: number[] = [];

  validEntries.forEach((entry, idx) => {
    const score = deriveSentimentScore(entry);
    scores.push(score);

    // Calculate 3-period moving average
    const windowStart = Math.max(0, idx - 2);
    const windowSlice = scores.slice(windowStart, idx + 1);
    const movingAvg = Math.round(windowSlice.reduce((sum, val) => sum + val, 0) / windowSlice.length);

    const d = new Date(entry.createdAt || now);
    const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const fullDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    points.push({
      id: entry.id,
      date: formattedDate,
      fullDate,
      timestamp: entry.createdAt || now,
      sentimentScore: score,
      movingAverage: movingAvg,
      title: entry.title || 'Untitled Session',
      primaryMood: getPrimaryMood(entry),
      promptMode: entry.promptMode || 'freeform',
    });
  });

  return points;
}

export interface MoodCategoryCount {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export function buildCategoryDistribution(entries: JournalEntry[]): MoodCategoryCount[] {
  if (!entries || entries.length === 0) return [];

  let positive = 0;
  let neutral = 0;
  let challenging = 0;

  entries.forEach((e) => {
    const score = deriveSentimentScore(e);
    if (score >= 60) positive++;
    else if (score >= 45) neutral++;
    else challenging++;
  });

  const total = entries.length;
  return [
    {
      name: 'Positive / Uplifting',
      count: positive,
      percentage: Math.round((positive / total) * 100),
      color: '#10B981', // emerald-500
    },
    {
      name: 'Equilibrium / Reflective',
      count: neutral,
      percentage: Math.round((neutral / total) * 100),
      color: '#F59E0B', // amber-500
    },
    {
      name: 'Challenging / Processing',
      count: challenging,
      percentage: Math.round((challenging / total) * 100),
      color: '#E11D48', // rose-500
    },
  ];
}

export interface DimensionAverage {
  dimension: string;
  score: number;
  fullMark: number;
}

export function buildRadarDimensions(entries: JournalEntry[]): DimensionAverage[] {
  if (!entries || entries.length === 0) {
    return [
      { dimension: 'Joy & Warmth', score: 0, fullMark: 100 },
      { dimension: 'Calm & Equanimity', score: 0, fullMark: 100 },
      { dimension: 'Clarity of Thought', score: 0, fullMark: 100 },
      { dimension: 'Vital Energy', score: 0, fullMark: 100 },
      { dimension: 'Resilience', score: 0, fullMark: 100 },
    ];
  }

  let totalJoy = 0;
  let totalCalm = 0;
  let totalClarity = 0;
  let totalEnergy = 0;
  let totalResilience = 0;

  entries.forEach((e) => {
    const dims = getEmotionalDimensions(e);
    const score = deriveSentimentScore(e);
    totalJoy += dims.joy;
    totalCalm += dims.calm;
    totalClarity += dims.clarity;
    totalEnergy += dims.energy;
    // Resilience: derived from cognitive reframe or handling challenges
    const resilience = e.cognitiveReframe ? Math.min(100, score + 15) : Math.max(50, score * 0.9);
    totalResilience += resilience;
  });

  const count = entries.length;
  return [
    { dimension: 'Joy & Warmth', score: Math.round(totalJoy / count), fullMark: 100 },
    { dimension: 'Calm & Equanimity', score: Math.round(totalCalm / count), fullMark: 100 },
    { dimension: 'Clarity of Thought', score: Math.round(totalClarity / count), fullMark: 100 },
    { dimension: 'Vital Energy', score: Math.round(totalEnergy / count), fullMark: 100 },
    { dimension: 'Cognitive Resilience', score: Math.round(totalResilience / count), fullMark: 100 },
  ];
}

export interface ModeScoreData {
  modeName: string;
  modeKey: string;
  averageScore: number;
  count: number;
}

export function buildModeCorrelations(entries: JournalEntry[]): ModeScoreData[] {
  const modeLabels: Record<string, string> = {
    freeform: 'Empathetic',
    socratic: 'Socratic',
    strategic: 'Strategic',
    reframing: 'Stoic / CBT',
    brainstorm: 'Ideation',
  };

  const buckets: Record<string, { total: number; count: number }> = {
    freeform: { total: 0, count: 0 },
    socratic: { total: 0, count: 0 },
    strategic: { total: 0, count: 0 },
    reframing: { total: 0, count: 0 },
    brainstorm: { total: 0, count: 0 },
  };

  entries.forEach((e) => {
    const m = e.promptMode || 'freeform';
    const score = deriveSentimentScore(e);
    if (!buckets[m]) {
      buckets[m] = { total: 0, count: 0 };
    }
    buckets[m].total += score;
    buckets[m].count += 1;
  });

  return Object.entries(buckets).map(([key, data]) => ({
    modeKey: key,
    modeName: modeLabels[key] || key,
    averageScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
    count: data.count,
  }));
}

export interface MoodAggregateStats {
  averageScore: number;
  dominantMood: string;
  totalEntries: number;
  positiveRate: number;
  trend: 'improving' | 'steady' | 'declining';
  trendDiff: number;
  highestEntry: JournalEntry | null;
  lowestEntry: JournalEntry | null;
}

export function calculateAggregateStats(entries: JournalEntry[]): MoodAggregateStats {
  if (!entries || entries.length === 0) {
    return {
      averageScore: 0,
      dominantMood: 'No data',
      totalEntries: 0,
      positiveRate: 0,
      trend: 'steady',
      trendDiff: 0,
      highestEntry: null,
      lowestEntry: null,
    };
  }

  let totalScore = 0;
  let positiveCount = 0;
  const moodCounts: Record<string, number> = {};
  let highestEntry: JournalEntry | null = null;
  let lowestEntry: JournalEntry | null = null;
  let maxScore = -1;
  let minScore = 999;

  entries.forEach((e) => {
    const score = deriveSentimentScore(e);
    totalScore += score;
    if (score >= 60) positiveCount++;

    const mood = getPrimaryMood(e);
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;

    if (score > maxScore) {
      maxScore = score;
      highestEntry = e;
    }
    if (score < minScore) {
      minScore = score;
      lowestEntry = e;
    }
  });

  const avg = Math.round(totalScore / entries.length);

  // Dominant mood
  let dominantMood = 'Reflective';
  let dominantCount = 0;
  Object.entries(moodCounts).forEach(([m, c]) => {
    if (c > dominantCount) {
      dominantMood = m;
      dominantCount = c;
    }
  });

  // Calculate trend comparing most recent 3 entries with previous entries
  const sorted = [...entries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  let trend: 'improving' | 'steady' | 'declining' = 'steady';
  let trendDiff = 0;

  if (sorted.length >= 4) {
    const recent = sorted.slice(0, Math.min(3, Math.floor(sorted.length / 2)));
    const previous = sorted.slice(recent.length);
    const recentAvg = recent.reduce((sum, e) => sum + deriveSentimentScore(e), 0) / recent.length;
    const prevAvg = previous.reduce((sum, e) => sum + deriveSentimentScore(e), 0) / previous.length;
    trendDiff = Math.round(recentAvg - prevAvg);

    if (trendDiff >= 4) trend = 'improving';
    else if (trendDiff <= -4) trend = 'declining';
  }

  return {
    averageScore: avg,
    dominantMood,
    totalEntries: entries.length,
    positiveRate: Math.round((positiveCount / entries.length) * 100),
    trend,
    trendDiff,
    highestEntry,
    lowestEntry,
  };
}
