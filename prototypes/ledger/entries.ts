/**
 * Map Omi fixtures into ledger entries.
 * Debit/credit side is not in the SDK — derived + a few fabricated credits.
 */
import type {
  Conversation,
  OmiSnapshot,
  Person,
  SuggestedAction,
  TranscriptSegment,
} from '../../reference/hackathon-pack/src/types';

export type Side = 'debit' | 'credit';

export interface LedgerEntry {
  id: string;
  date: Date;
  dateLabel: string;
  personId: string;
  personName: string;
  commitment: string;
  ageDays: number;
  side: Side;
  settled: boolean;
  receipt: string | null;
}

export const FIXTURE_NOW = new Date('2026-07-20T18:16:00.000Z');

/** Open actions that name someone you owe — the ledger's debit spine. */
const DEBIT_BY_ACTION: Record<string, { personId: string; commitment: string }> = {
  'action-001': { personId: 'person-priya', commitment: 'Send the workshop decision trail' },
  'action-002': { personId: 'person-taylor', commitment: 'Confirm the narrow export pilot' },
  'action-006': { personId: 'person-morgan', commitment: 'Ask about the repeated workaround pattern' },
  'action-014': { personId: 'person-quinn', commitment: 'Invite to the next practice-sharing call' },
  'action-005': { personId: 'person-avery', commitment: 'Share the smallest useful slice outline' },
  'action-016': { personId: 'person-avery', commitment: 'Write what the pilot does not solve' },
  'action-007': { personId: 'person-taylor', commitment: 'Review evidence links before roadmap' },
  'action-011': { personId: 'person-avery', commitment: 'Try a thread-first prototype with map reveal' },
  'action-009': { personId: 'person-robin', commitment: 'Keep an arrival buffer in the itinerary' },
};

/**
 * Fabricated credits — promises others made to you, grounded in real segments.
 * Side is not in SuggestedAction; these are synthetic entries with real receipts.
 */
const FABRICATED_CREDITS: Array<{
  id: string;
  personId: string;
  commitment: string;
  conversationId: string;
  segmentId: string;
  date: string;
  settled: boolean;
}> = [
  {
    id: 'credit-casey-filter',
    personId: 'person-casey',
    commitment: 'Take the filter replacement when the part arrives',
    conversationId: 'conv-0718-home-admin',
    segmentId: 'seg-0718-6',
    date: '2026-07-18T12:47:00.000Z',
    settled: false,
  },
  {
    id: 'credit-taylor-export',
    personId: 'person-taylor',
    commitment: 'Instrument the review path before a bigger surface',
    conversationId: 'conv-0716-roadmap-workshop',
    segmentId: 'seg-0716-2',
    date: '2026-07-16T10:02:00.000Z',
    settled: false,
  },
  {
    id: 'credit-avery-edges',
    personId: 'person-avery',
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

function personById(people: Person[], id: string): Person | undefined {
  return people.find((p) => p.id === id);
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
function pickReceipt(conv: Conversation | undefined, commitment: string): string | null {
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
  return quote(scored[0]!.seg);
}

function segmentById(conv: Conversation | undefined, id: string): TranscriptSegment | undefined {
  return conv?.segments.find((s) => s.id === id);
}

function quote(seg: TranscriptSegment): string {
  return `${seg.speaker}: “${seg.text}”`;
}

function fromAction(
  action: SuggestedAction,
  meta: { personId: string; commitment: string },
  snapshot: OmiSnapshot,
): LedgerEntry | null {
  const person = personById(snapshot.people, meta.personId);
  if (!person) return null;
  const conv = convById(snapshot.conversations, action.conversationId);
  const date = conv ? new Date(conv.startedAt) : action.dueAt ? new Date(action.dueAt) : FIXTURE_NOW;
  return {
    id: action.id,
    date,
    dateLabel: formatDate(date),
    personId: person.id,
    personName: person.name.split(' ')[0]!,
    commitment: meta.commitment,
    ageDays: ageDays(date),
    side: 'debit',
    settled: action.status === 'done',
    receipt: pickReceipt(conv, meta.commitment),
  };
}

export function buildEntries(snapshot: OmiSnapshot): LedgerEntry[] {
  const byId = new Map(snapshot.actions.map((a) => [a.id, a]));
  const entries: LedgerEntry[] = [];

  for (const [actionId, meta] of Object.entries(DEBIT_BY_ACTION)) {
    const action = byId.get(actionId);
    if (!action) continue;
    const entry = fromAction(action, meta, snapshot);
    if (entry) entries.push(entry);
  }

  for (const credit of FABRICATED_CREDITS) {
    const person = personById(snapshot.people, credit.personId);
    if (!person) continue;
    const conv = convById(snapshot.conversations, credit.conversationId);
    const seg = segmentById(conv, credit.segmentId);
    const date = new Date(credit.date);
    entries.push({
      id: credit.id,
      date,
      dateLabel: formatDate(date),
      personId: person.id,
      personName: person.name.split(' ')[0]!,
      commitment: credit.commitment,
      ageDays: ageDays(date),
      side: 'credit',
      settled: credit.settled,
      receipt: seg ? quote(seg) : pickReceipt(conv, credit.commitment),
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

export function accountSubtotal(
  entries: LedgerEntry[],
  personId: string,
): { owe: number; owed: number; oldest: number | null } {
  const mine = entries.filter((e) => e.personId === personId);
  const open = mine.filter((e) => !e.settled);
  const owe = open.filter((e) => e.side === 'debit').length;
  const owed = open.filter((e) => e.side === 'credit').length;
  const oldest = open.length ? Math.max(...open.map((e) => e.ageDays)) : null;
  return { owe, owed, oldest };
}

/** ponytail: fails if debit/credit mapping or age math regresses */
export function assertLedgerInvariants(entries: LedgerEntry[]): void {
  const open = entries.filter((e) => !e.settled);
  const { owe, owed } = balanceOf(entries);
  console.assert(owe + owed === open.length, 'balance counts must cover every open entry');
  console.assert(
    entries.every((e) => e.ageDays >= 0),
    'age cannot be negative against the fixture clock',
  );
  console.assert(
    open.some((e) => e.side === 'credit') && open.some((e) => e.side === 'debit'),
    'ledger must show both sides of the book',
  );
  const ages = open.map((e) => e.ageDays);
  console.assert(
    ages.every((d, i) => i === 0 || ages[i - 1]! >= d),
    'open entries must sort oldest-first',
  );
}
