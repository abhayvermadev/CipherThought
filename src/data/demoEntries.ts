import { JournalEntry } from '../types';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const DEMO_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'demo-entry-1',
    userId: 'demo-user',
    title: 'Designing High-Leverage Systems & Architecture',
    content:
      'Reflected on balancing system scalability with developer agility. By establishing rigorous threat boundaries early and isolating client access patterns, we gain immense architectural peace of mind.',
    promptMode: 'strategic',
    messages: [
      {
        id: 'msg-d1',
        role: 'user',
        content: 'How should I structure zero-trust boundaries without killing developer velocity?',
        timestamp: now - 5 * day,
      },
      {
        id: 'msg-d2',
        role: 'assistant',
        content:
          'Enforce strict isolation at data layer primitives (such as /users/{uid} rules). Keep client code clean and focus validation on server proxies.',
        timestamp: now - 5 * day + 1000,
      },
    ],
    summary:
      'A strategic synthesis on balancing zero-trust architectural boundaries with rapid iterative speed, concluding that early data isolation provides high long-term leverage.',
    insights: [
      'Early isolation avoids complex migration friction later',
      'Clarity of boundaries creates cognitive freedom',
    ],
    actionItems: ['Codify tenant partitioning in security rules', 'Benchmark proxy latency overhead'],
    tags: ['architecture', 'strategy', 'zero-trust'],
    sentiment: 'Clear & Energized',
    sentimentScore: 84,
    primaryMood: 'Inspired',
    emotionalDimensions: {
      joy: 80,
      calm: 78,
      clarity: 92,
      energy: 82,
    },
    energyLevel: 'High',
    cognitiveReframe: 'Rigorous discipline at the foundation liberates creative experimentation at the edges.',
    isEncrypted: false,
    createdAt: now - 5 * day,
    updatedAt: now - 5 * day,
  },
  {
    id: 'demo-entry-2',
    userId: 'demo-user',
    title: 'Navigating Mid-Week Cognitive Fatigue & Stoic Grounding',
    content:
      'Felt pulled across three divergent priorities today. Notice the sensation of urgency and anxiety creeping in. Remembering Epictetus: focus only on what is within my direct sphere of control.',
    promptMode: 'reframing',
    messages: [],
    summary:
      'Mindful examination of mental overload, utilizing Stoic cognitive reframing to release external pressures and recenter focus on primary agency.',
    insights: [
      'Urgency is frequently an emotional reaction rather than an objective reality',
      'Micro-pauses reset the autonomic nervous system',
    ],
    actionItems: ['Triage inbox down to top 2 priorities', 'Take a 20-minute screen-free walk'],
    tags: ['mindfulness', 'stoicism', 'clarity'],
    sentiment: 'Reflective & Grounding',
    sentimentScore: 58,
    primaryMood: 'Reflective',
    emotionalDimensions: {
      joy: 52,
      calm: 68,
      clarity: 65,
      energy: 48,
    },
    energyLevel: 'Reflective',
    cognitiveReframe: 'You do not have to have an opinion on this, nor does it need to disturb your calm.',
    isEncrypted: false,
    createdAt: now - 4 * day,
    updatedAt: now - 4 * day,
  },
  {
    id: 'demo-entry-3',
    userId: 'demo-user',
    title: 'Socratic Inquiry on Personal Motivation',
    content:
      'Questioning why certain goals feel fulfilling while others feel like societal baggage. Gemini asked me: "If no one ever knew you accomplished this, would you still pursue it?"',
    promptMode: 'socratic',
    messages: [
      {
        id: 'msg-s1',
        role: 'user',
        content: 'Why do I keep chasing projects that exhaust me?',
        timestamp: now - 3 * day,
      },
      {
        id: 'msg-s2',
        role: 'assistant',
        content:
          'Consider whether the reward lies in the actual daily craft, or in the external social proof you anticipate receiving at the end.',
        timestamp: now - 3 * day + 1500,
      },
    ],
    summary:
      'Deep introspection distinguishing intrinsic craftsmanship from extrinsic validation, clarifying authentic creative desires.',
    insights: [
      'Intrinsic motivation is self-sustaining; external approval has rapid diminishing returns',
      'True craft needs no audience to be worthwhile',
    ],
    actionItems: ['Audit weekly commitments against intrinsic joy test'],
    tags: ['philosophy', 'motivation', 'socratic'],
    sentiment: 'Thoughtful & Contemplative',
    sentimentScore: 66,
    primaryMood: 'Contemplative',
    emotionalDimensions: {
      joy: 60,
      calm: 74,
      clarity: 82,
      energy: 60,
    },
    energyLevel: 'Steady',
    cognitiveReframe: 'When the work itself is the reward, failure is stripped of its sting.',
    isEncrypted: false,
    createdAt: now - 3 * day,
    updatedAt: now - 3 * day,
  },
  {
    id: 'demo-entry-4',
    userId: 'demo-user',
    title: 'Lateral Brainstorming: Generative Flow States',
    content:
      'Explored novel interfaces combining speech recognition, ambient sound synthesis, and real-time semantic graphs. High creative excitement.',
    promptMode: 'brainstorm',
    messages: [],
    summary:
      'Vibrant brainstorming session on multi-modal creative workflows, unlocking fresh perspectives on human-computer synergy.',
    insights: [
      'Multi-modal input reduces friction between thought and synthesis',
      'Unconventional analogies spark breakthrough UX patterns',
    ],
    actionItems: ['Sketch out wireframe prototype of visual semantic canvas'],
    tags: ['brainstorm', 'innovation', 'ux'],
    sentiment: 'Elevated & Inspired',
    sentimentScore: 92,
    primaryMood: 'Inspired',
    emotionalDimensions: {
      joy: 94,
      calm: 72,
      clarity: 88,
      energy: 95,
    },
    energyLevel: 'High',
    cognitiveReframe: 'Curiosity transforms resistance into play.',
    isEncrypted: false,
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
  },
  {
    id: 'demo-entry-5',
    userId: 'demo-user',
    title: 'Weekly Reflection & Equilibrium Synthesis',
    content:
      'Looking across the entire week: started with high technical clarity, weathered a dip in mental stamina, and closed out with strong creative momentum. Feeling balanced, purposeful, and ready.',
    promptMode: 'freeform',
    messages: [],
    summary:
      'A harmonious end-of-week reflection celebrating resilience, acknowledging natural energy rhythms, and setting an intentional tone for the days ahead.',
    insights: [
      'Energy oscillates naturally; honoring the trough accelerates the crest',
      'Consistency is built on gentle self-compassion, not rigid self-criticism',
    ],
    actionItems: ['Plan quiet Sunday morning reading block'],
    tags: ['reflection', 'wellness', 'growth'],
    sentiment: 'Grounded & Optimistic',
    sentimentScore: 86,
    primaryMood: 'Optimistic',
    emotionalDimensions: {
      joy: 85,
      calm: 90,
      clarity: 86,
      energy: 78,
    },
    energyLevel: 'Steady',
    cognitiveReframe: 'Growth is cyclical rather than linear. Every stage has its wisdom.',
    isEncrypted: false,
    createdAt: now - 1 * day,
    updatedAt: now - 1 * day,
  },
];
