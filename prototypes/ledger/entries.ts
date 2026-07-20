/**
 * Map Omi fixtures into ledger entries.
 * An entry posts to a person, a goal, or both. Debit/credit side and goals
 * are not in the SDK — derived from fixture clusters + a few fabricated credits.
 */
import type {
  Conversation,
  OmiSnapshot,
  Person,
  SuggestedAction,
  TranscriptSegment,
} from '../../reference/hackathon-pack/src/types';

export type Side = 'debit' | 'credit';

export interface Goal {
  id: string;
  name: string;
}

/** A frame Omi caught on screen — the visual twin of a transcript receipt. */
export interface Shot {
  app: string;
  context: string;
  lines: string[];
  at: string;
}

export interface LedgerEntry {
  id: string;
  date: Date;
  dateLabel: string;
  personId: string | null;
  personName: string | null;
  goalId: string | null;
  goalName: string | null;
  commitment: string;
  ageDays: number;
  side: Side;
  settled: boolean;
  receipt: string | null;
  shot: Shot | null;
  conversationId: string | null;
  receiptSegmentId: string | null;
}

export const FIXTURE_NOW = new Date('2026-07-20T18:16:00.000Z');

export const GOALS: Goal[] = [
  { id: 'goal-pilot', name: 'Ship the narrow pilot' },
  { id: 'goal-roadmap', name: 'Evidence-first roadmap' },
  { id: 'goal-trip', name: 'Calm-arrival trip' },
  { id: 'goal-home', name: 'Home upkeep' },
];

interface ActionMeta {
  personId?: string;
  goalId?: string;
  commitment: string;
}

/** Actions posted to the book — each names a counterparty, a goal, or both. */
const ACTION_META: Record<string, ActionMeta> = {
  'action-001': { personId: 'person-priya', goalId: 'goal-pilot', commitment: 'Send the workshop decision trail' },
  'action-002': { personId: 'person-taylor', goalId: 'goal-pilot', commitment: 'Confirm the narrow export pilot' },
  'action-016': { personId: 'person-avery', goalId: 'goal-pilot', commitment: 'Write what the pilot does not solve' },
  'action-011': { personId: 'person-avery', goalId: 'goal-pilot', commitment: 'Try a thread-first prototype with map reveal' },
  'action-005': { personId: 'person-avery', goalId: 'goal-pilot', commitment: 'Share the smallest useful slice outline' },
  'action-006': { personId: 'person-morgan', goalId: 'goal-roadmap', commitment: 'Ask about the repeated workaround pattern' },
  'action-007': { personId: 'person-taylor', goalId: 'goal-roadmap', commitment: 'Review evidence links before roadmap' },
  'action-003': { goalId: 'goal-roadmap', commitment: 'Add the unresolved workshop question to the agenda' },
  'action-009': { personId: 'person-robin', goalId: 'goal-trip', commitment: 'Keep an arrival buffer in the itinerary' },
  'action-019': { goalId: 'goal-trip', commitment: 'Check battery and sync before leaving' },
  'action-010': { goalId: 'goal-trip', commitment: 'Pack the small recorder' },
  'action-012': { goalId: 'goal-home', commitment: 'Replace the home filter when the part arrives' },
  'action-013': { goalId: 'goal-home', commitment: 'Keep the maintenance list to three items' },
  'action-014': { personId: 'person-quinn', commitment: 'Invite to the next practice-sharing call' },
};

/**
 * Fabricated credits — promises others made to you, grounded in real segments.
 * Side is not in SuggestedAction; these are synthetic entries with real receipts.
 */
const FABRICATED_CREDITS: Array<{
  id: string;
  personId: string;
  goalId?: string;
  commitment: string;
  conversationId: string;
  segmentId: string;
  date: string;
  settled: boolean;
}> = [
  {
    id: 'credit-casey-filter',
    personId: 'person-casey',
    goalId: 'goal-home',
    commitment: 'Take the filter replacement when the part arrives',
    conversationId: 'conv-0718-home-admin',
    segmentId: 'seg-0718-6',
    date: '2026-07-18T12:47:00.000Z',
    settled: false,
  },
  {
    id: 'credit-taylor-export',
    personId: 'person-taylor',
    goalId: 'goal-pilot',
    commitment: 'Instrument the review path before a bigger surface',
    conversationId: 'conv-0716-roadmap-workshop',
    segmentId: 'seg-0716-2',
    date: '2026-07-16T10:02:00.000Z',
    settled: false,
  },
  {
    id: 'credit-avery-edges',
    personId: 'person-avery',
    goalId: 'goal-pilot',
    commitment: 'Show unresolved edges instead of a complete graph',
    conversationId: 'conv-0718-design-studio',
    segmentId: 'seg-0718-4',
    date: '2026-07-18T10:09:00.000Z',
    settled: false,
  },
  {
    id: 'credit-drew-source',
    personId: 'person-drew',
    commitment: 'Keep the source close enough to disagree with',
    conversationId: 'conv-0717-quiet-reading',
    segmentId: 'seg-0717-5',
    date: '2026-07-17T19:59:00.000Z',
    settled: true,
  },
];

/**
 * Screen captures — obligations Omi caught on screen, never said aloud.
 * The SDK has no screen frames; these are fabricated, and the receipt is the
 * captured region (a Shot) rather than a transcript quote.
 */
const SCREEN_CAPTURES: Array<{
  id: string;
  personId?: string;
  goalId?: string;
  commitment: string;
  side: Side;
  date: string;
  settled: boolean;
  shot: Shot;
}> = [
  {
    id: 'screen-priya-deck',
    personId: 'person-priya',
    goalId: 'goal-pilot',
    commitment: 'Send the pricing deck before the Thursday sync',
    side: 'debit',
    date: '2026-07-19T14:47:00.000Z',
    settled: false,
    shot: {
      app: 'Slack',
      context: '#pilot-launch · Priya Shah',
      lines: ['Can you drop the pricing deck in here before Thursday’s sync? Want to read it first.'],
      at: '2:47 PM',
    },
  },
  {
    id: 'screen-morgan-notes',
    personId: 'person-morgan',
    goalId: 'goal-roadmap',
    commitment: 'Share the interview notes from the workaround study',
    side: 'credit',
    date: '2026-07-19T09:12:00.000Z',
    settled: false,
    shot: {
      app: 'Slack',
      context: 'DM · Morgan Ellis',
      lines: ['I’ll get you the interview notes from the workaround study by Monday.'],
      at: '9:12 AM',
    },
  },
];

/** Ambient captures for Rewind — seen on screen, not posted as obligations. */
const REWIND_AMBIENT: Array<{ id: string; date: string; shot: Shot }> = [
  {
    id: 'rewind-calendar',
    date: '2026-07-20T11:05:00.000Z',
    shot: {
      app: 'Calendar',
      context: 'Pilot sync · Thursday 2:00 PM',
      lines: ['Pricing deck review', 'Attendees: Priya Shah, Taylor Reed, Riley Park'],
      at: '11:05 AM',
    },
  },
  {
    id: 'rewind-notes',
    date: '2026-07-20T10:22:00.000Z',
    shot: {
      app: 'Notes',
      context: 'Interview themes',
      lines: ['Repeated workaround pattern — three teams, same edge case.', 'Ask Morgan what they tried first.'],
      at: '10:22 AM',
    },
  },
  {
    id: 'rewind-mail',
    date: '2026-07-19T16:40:00.000Z',
    shot: {
      app: 'Mail',
      context: 'Casey Okonkwo · Re: filter handoff',
      lines: ['Filter lands Friday. I’ll ping you when the PR is up.'],
      at: '4:40 PM',
    },
  },
];

export interface RewindFrame {
  id: string;
  entryId: string | null;
  commitment: string | null;
  personName: string | null;
  date: Date;
  dateLabel: string;
  shot: Shot;
}

/** Every screen capture, newest first — Rewind scrubs backward through time. */
export function listRewindFrames(entries: LedgerEntry[]): RewindFrame[] {
  const fromEntries = entries
    .filter((e) => e.shot)
    .map((e) => ({
      id: e.id,
      entryId: e.id,
      commitment: e.commitment,
      personName: e.personName,
      date: e.date,
      dateLabel: e.dateLabel,
      shot: e.shot!,
    }));
  const ambient = REWIND_AMBIENT.map((f) => {
    const date = new Date(f.date);
    return {
      id: f.id,
      entryId: null,
      commitment: null,
      personName: null,
      date,
      dateLabel: formatDate(date),
      shot: f.shot,
    };
  });
  return [...fromEntries, ...ambient].sort((a, b) => b.date.getTime() - a.date.getTime());
}

function personById(people: Person[], id?: string): Person | undefined {
  return id ? people.find((p) => p.id === id) : undefined;
}

function goalById(id?: string): Goal | undefined {
  return id ? GOALS.find((g) => g.id === id) : undefined;
}

function convById(conversations: Conversation[], id?: string): Conversation | undefined {
  return id ? conversations.find((c) => c.id === id) : undefined;
}

function ageDays(from: Date): number {
  const ms = FIXTURE_NOW.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Prefer a non-Riley segment that mentions the commitment, else any non-Riley, else first. */
function pickReceiptSegment(conv: Conversation | undefined, commitment: string): TranscriptSegment | null {
  if (!conv?.segments.length) return null;
  const lower = commitment.toLowerCase();
  const keywords = lower
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 4);

  const scored = conv.segments.map((seg) => {
    const t = seg.text.toLowerCase();
    let score = keywords.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0);
    if (seg.speaker !== 'Riley Park') score += 2;
    return { seg, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]!.seg;
}

function segmentById(conv: Conversation | undefined, id: string): TranscriptSegment | undefined {
  return conv?.segments.find((s) => s.id === id);
}

function quote(seg: TranscriptSegment): string {
  return `${seg.speaker}: “${seg.text}”`;
}

function fromAction(
  action: SuggestedAction,
  meta: ActionMeta,
  snapshot: OmiSnapshot,
): LedgerEntry | null {
  const person = personById(snapshot.people, meta.personId);
  const goal = goalById(meta.goalId);
  if (!person && !goal) return null;
  const conv = convById(snapshot.conversations, action.conversationId);
  const date = conv ? new Date(conv.startedAt) : action.dueAt ? new Date(action.dueAt) : FIXTURE_NOW;
  const seg = pickReceiptSegment(conv, meta.commitment);
  return {
    id: action.id,
    date,
    dateLabel: formatDate(date),
    personId: person?.id ?? null,
    personName: person ? person.name.split(' ')[0]! : null,
    goalId: goal?.id ?? null,
    goalName: goal?.name ?? null,
    commitment: meta.commitment,
    ageDays: ageDays(date),
    side: 'debit',
    settled: action.status === 'done',
    receipt: seg ? quote(seg) : null,
    shot: null,
    conversationId: conv?.id ?? null,
    receiptSegmentId: seg?.id ?? null,
  };
}

export function buildEntries(snapshot: OmiSnapshot): LedgerEntry[] {
  const byId = new Map(snapshot.actions.map((a) => [a.id, a]));
  const entries: LedgerEntry[] = [];

  for (const [actionId, meta] of Object.entries(ACTION_META)) {
    const action = byId.get(actionId);
    if (!action) continue;
    const entry = fromAction(action, meta, snapshot);
    if (entry) entries.push(entry);
  }

  for (const credit of FABRICATED_CREDITS) {
    const person = personById(snapshot.people, credit.personId);
    if (!person) continue;
    const goal = goalById(credit.goalId);
    const conv = convById(snapshot.conversations, credit.conversationId);
    const seg = segmentById(conv, credit.segmentId) ?? pickReceiptSegment(conv, credit.commitment);
    const date = new Date(credit.date);
    entries.push({
      id: credit.id,
      date,
      dateLabel: formatDate(date),
      personId: person.id,
      personName: person.name.split(' ')[0]!,
      goalId: goal?.id ?? null,
      goalName: goal?.name ?? null,
      commitment: credit.commitment,
      ageDays: ageDays(date),
      side: 'credit',
      settled: credit.settled,
      receipt: seg ? quote(seg) : null,
      shot: null,
      conversationId: conv?.id ?? null,
      receiptSegmentId: seg?.id ?? null,
    });
  }

  for (const cap of SCREEN_CAPTURES) {
    const person = personById(snapshot.people, cap.personId);
    const goal = goalById(cap.goalId);
    if (!person && !goal) continue;
    const date = new Date(cap.date);
    entries.push({
      id: cap.id,
      date,
      dateLabel: formatDate(date),
      personId: person?.id ?? null,
      personName: person ? person.name.split(' ')[0]! : null,
      goalId: goal?.id ?? null,
      goalName: goal?.name ?? null,
      commitment: cap.commitment,
      ageDays: ageDays(date),
      side: cap.side,
      settled: cap.settled,
      receipt: null,
      shot: cap.shot,
      conversationId: null,
      receiptSegmentId: null,
    });
  }

  entries.sort((a, b) => {
    if (a.settled !== b.settled) return a.settled ? 1 : -1;
    return b.ageDays - a.ageDays || a.date.getTime() - b.date.getTime();
  });

  return entries;
}

export function balanceOf(entries: LedgerEntry[]): { owe: number; owed: number } {
  let owe = 0;
  let owed = 0;
  for (const e of entries) {
    if (e.settled) continue;
    if (e.side === 'debit') owe += 1;
    else owed += 1;
  }
  return { owe, owed };
}

export type AccountKey = { kind: 'person' | 'goal'; id: string };

export function entriesFor(entries: LedgerEntry[], key: AccountKey): LedgerEntry[] {
  return entries.filter((e) => (key.kind === 'person' ? e.personId === key.id : e.goalId === key.id));
}

export function accountSubtotal(
  entries: LedgerEntry[],
  key: AccountKey,
): { owe: number; owed: number; oldest: number | null } {
  const open = entriesFor(entries, key).filter((e) => !e.settled);
  const owe = open.filter((e) => e.side === 'debit').length;
  const owed = open.filter((e) => e.side === 'credit').length;
  const oldest = open.length ? Math.max(...open.map((e) => e.ageDays)) : null;
  return { owe, owed, oldest };
}

/** ponytail: fails if debit/credit mapping, goal posting, or age math regresses */
export function assertLedgerInvariants(entries: LedgerEntry[]): void {
  const open = entries.filter((e) => !e.settled);
  const { owe, owed } = balanceOf(entries);
  console.assert(owe + owed === open.length, 'balance counts must cover every open entry');
  console.assert(
    entries.every((e) => e.personId !== null || e.goalId !== null),
    'every entry must post to a person or a goal',
  );
  console.assert(
    entries.every((e) => e.ageDays >= 0),
    'age cannot be negative against the fixture clock',
  );
  console.assert(
    open.some((e) => e.side === 'credit') && open.some((e) => e.side === 'debit'),
    'ledger must show both sides of the book',
  );
  console.assert(
    open.some((e) => e.goalId && !e.personId),
    'ledger must include goal-only entries',
  );
  console.assert(
    open.some((e) => e.shot !== null),
    'ledger must include a screen-captured entry',
  );
  const ages = open.map((e) => e.ageDays);
  console.assert(
    ages.every((d, i) => i === 0 || ages[i - 1]! >= d),
    'open entries must sort oldest-first',
  );
}
