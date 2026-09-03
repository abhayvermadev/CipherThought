import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Brain,
  Zap,
  ShieldCheck,
  Calendar,
  Filter,
  ArrowUpRight,
  Activity,
  Plus,
  RefreshCw,
  Heart,
  Compass,
} from 'lucide-react';
import { JournalEntry } from '../types';
import {
  buildTimelineData,
  buildCategoryDistribution,
  buildRadarDimensions,
  buildModeCorrelations,
  calculateAggregateStats,
  deriveSentimentScore,
  getMoodVisualAttributes,
  getPrimaryMood,
  TimelineDataPoint,
} from '../utils/moodAnalyzer';

interface MoodDashboardProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewSession: () => void;
  onRefreshEntries?: () => void;
}

export function MoodDashboard({
  entries,
  onSelectEntry,
  onNewSession,
  onRefreshEntries,
}: MoodDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');
  const [activeChartType, setActiveChartType] = useState<'area' | 'bar'>('area');
  const [isSyncing, setIsSyncing] = useState(false);

  // Compute analytics
  const timelineData = useMemo(() => buildTimelineData(entries, timeRange), [entries, timeRange]);
  const categoryDistribution = useMemo(() => buildCategoryDistribution(entries), [entries]);
  const radarData = useMemo(() => buildRadarDimensions(entries), [entries]);
  const modeCorrelations = useMemo(() => buildModeCorrelations(entries), [entries]);
  const stats = useMemo(() => calculateAggregateStats(entries), [entries]);

  const scoreVisuals = getMoodVisualAttributes(stats.averageScore);

  // Custom sleek tooltip for the timeline chart
  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TimelineDataPoint = payload[0].payload;
      const moodVisual = getMoodVisualAttributes(data.sentimentScore);
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-xs text-xs space-y-1.5 max-w-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
            <span className="font-semibold text-slate-900 truncate">{data.title}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${moodVisual.badgeBg} ${moodVisual.badgeText}`}
            >
              {data.sentimentScore}/100
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>{data.fullDate}</span>
            <span className="capitalize text-slate-700 font-medium">Mode: {data.promptMode}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className={`h-2 w-2 rounded-full ${moodVisual.dotColor}`} />
            <span className="font-medium text-slate-800">Primary Mood: {data.primaryMood}</span>
          </div>
          <p className="text-[10px] text-slate-400 italic">Click chart point or entry below to view reflection</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Range Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
              AI Mood & Sentiment Analytics
            </h2>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wide">
              Gemini Psychometrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time aggregate sentiment, emotional dimensions, and cognitive trajectories extracted by Gemini 3.8 Flash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              id="mood-time-7d-btn"
              onClick={() => setTimeRange('7d')}
              className={`rounded-lg px-3 py-1.5 transition ${
                timeRange === '7d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              id="mood-time-30d-btn"
              onClick={() => setTimeRange('30d')}
              className={`rounded-lg px-3 py-1.5 transition ${
                timeRange === '30d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              id="mood-time-all-btn"
              onClick={() => setTimeRange('all')}
              className={`rounded-lg px-3 py-1.5 transition ${
                timeRange === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            id="mood-new-entry-btn"
            onClick={onNewSession}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Entry</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards (Top Stats Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Mean Sentiment Score */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Sentiment</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Smile className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.averageScore > 0 ? stats.averageScore : '—'}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${scoreVisuals.badgeBg} ${scoreVisuals.badgeText}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${scoreVisuals.dotColor}`} />
              {scoreVisuals.label}
            </span>
          </div>
        </div>

        {/* Card 2: Dominant Mood State */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Dominant Mood</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900 truncate block">
              {stats.dominantMood}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {stats.totalEntries > 0
              ? `${stats.positiveRate}% of sessions in positive equilibrium`
              : 'No entries recorded'}
          </p>
        </div>

        {/* Card 3: Longitudinal Trajectory */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Trajectory Trend</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {stats.trend === 'improving' ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-lg">
                <TrendingUp className="h-5 w-5" />
                <span>Improving (+{stats.trendDiff} pts)</span>
              </div>
            ) : stats.trend === 'declining' ? (
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-lg">
                <TrendingDown className="h-5 w-5" />
                <span>Processing ({stats.trendDiff} pts)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-lg">
                <Minus className="h-5 w-5 text-slate-400" />
                <span>Balanced Equilibrium</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Compared to earlier journaling baseline</p>
        </div>

        {/* Card 4: Total Analyzed Entries */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sessions Analyzed</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.totalEntries}
            </span>
            <span className="text-xs text-slate-400 font-medium">Reflections</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Isolated zero-knowledge namespace</p>
        </div>
      </div>

      {/* Main Longitudinal Sentiment Chart (Col 12) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Longitudinal Mood & Sentiment Waveform
              </h3>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                0 - 100 Scale
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizes emotional valence across your timeline. Dashed threshold at 50 marks neutral baseline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span>Session Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 bg-emerald-500" />
                <span>Moving Avg</span>
              </div>
            </div>
          </div>
        </div>

        {timelineData.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <Activity className="h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No Sentiment Data In This Time Range</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Write and save a reflection in the Studio, or select "All Time" to view your historical analytics.
            </p>
            <button
              onClick={onNewSession}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Create First Reflection
            </button>
          </div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const point = e.activePayload[0].payload;
                    const matched = entries.find((item) => item.id === point.id);
                    if (matched) onSelectEntry(matched);
                  }
                }}
              >
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTimelineTooltip />} />
                <ReferenceLine
                  y={50}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Equilibrium (50)',
                    fill: '#94A3B8',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sentimentScore"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#moodGradient)"
                  activeDot={{ r: 6, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="2 2"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Dual Insights Grid: Radar Dimensions & Mood Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Emotional & Cognitive Radar Dimensions (Col 6) */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span>Emotional Dimensions Balance</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Gemini Psychometrics</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multivariate breakdown of Joy, Equanimity, Mental Clarity, Vital Energy, and Resilience.
            </p>
          </div>

          <div className="h-72 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Radar
                  name="Psychometrics"
                  dataKey="score"
                  stroke="#2563EB"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {radarData.map((d) => (
              <div key={d.dimension} className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                <span className="text-slate-500 block truncate">{d.dimension}</span>
                <span className="font-bold text-slate-900 text-xs">{d.score}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cognitive Framing Correlation & Distribution (Col 6) */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <span>Sentiment by Cognitive Framing Mode</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Session Mode Impact</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compares the average emotional uplift achieved across different Gemini coaching styles.
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modeCorrelations}
                margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="modeName"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} / 100 (${item.payload.count} sessions)`,
                    'Avg Sentiment',
                  ]}
                />
                <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                  {modeCorrelations.map((entry, index) => {
                    const color =
                      entry.averageScore >= 70
                        ? '#10B981'
                        : entry.averageScore >= 55
                        ? '#2563EB'
                        : entry.averageScore >= 40
                        ? '#F59E0B'
                        : '#E11D48';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Pills */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
            {categoryDistribution.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-600 font-medium">
                  {cat.name}: <strong className="text-slate-900">{cat.count}</strong> ({cat.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights & Landmark Reflections */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Landmark Reflections & Sentiment Anchors
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Highest Peak Session */}
          {stats.highestEntry ? (
            <div
              onClick={() => onSelectEntry(stats.highestEntry!)}
              className="cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 transition hover:bg-emerald-50/70 hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Peak Positive Reflection
                </span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {deriveSentimentScore(stats.highestEntry)}/100
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate">
                {stats.highestEntry.title || 'Peak Reflection'}
              </h4>
              <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                {stats.highestEntry.summary || stats.highestEntry.content || 'No text summary'}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                <span>Mood: {getPrimaryMood(stats.highestEntry)}</span>
                <span className="flex items-center gap-1">
                  View Entry <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 text-center">
              No peak reflection yet.
            </div>
          )}

          {/* Lowest / Working-Through Session */}
          {stats.lowestEntry ? (
            <div
              onClick={() => onSelectEntry(stats.lowestEntry!)}
              className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/40 p-4 transition hover:bg-amber-50/70 hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                  <Brain className="h-3.5 w-3.5 text-amber-600" />
                  Processing & Reframe Anchor
                </span>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {deriveSentimentScore(stats.lowestEntry)}/100
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate">
                {stats.lowestEntry.title || 'Reflective Challenge'}
              </h4>
              <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                {stats.lowestEntry.cognitiveReframe ||
                  stats.lowestEntry.summary ||
                  stats.lowestEntry.content ||
                  'No text summary'}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-amber-700 font-medium">
                <span>Mood: {getPrimaryMood(stats.lowestEntry)}</span>
                <span className="flex items-center gap-1">
                  View Entry <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 text-center">
              No processing anchor yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
