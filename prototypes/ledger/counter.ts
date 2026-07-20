/**
 * The counter — where you tell Omi. Parses an utterance into either
 * a posting (a new line for the book) or an inquiry (re-cut the book and
 * answer in one line).
 *
 * ponytail: keyword matching, not NLU. Recognizes "I owe <account> ...",
 * "<account> owes me ...", and question forms naming an account. Upgrade path
 * is a real model behind the same Utterance contract.
 */
import type { AccountKey, Goal, Side } from './entries';

export interface CounterPerson {
  id: string;
  name: string;
}

export type Utterance =
  | { kind: 'post'; commitment: string; personId: string | null; goalId: string | null; side: Side }
  | { kind: 'inquiry'; key: AccountKey | null }
  | { kind: 'unknown' };

/**
 * What push-to-talk "hears". Transcription does not exist in the pack, so a
 * held key yields the next of these, deterministically.
 */
export const HEARD_LINES = [
  'I owe Priya the pricing follow-up',
  'Where do I stand with Taylor?',
  'I owe the pilot a rollout checklist',
  'Morgan owes me the interview notes',
] as const;

/**
 * Canned lines Omi offers under the counter — the typed twin of push-to-talk.
 * Both grammars (posting and inquiry) are represented so the input teaches
 * itself. Filtered by what is typed; grounded in real accounts.
 */
export const SUGGESTIONS = [
  'What do I owe?',
  'Where do I stand with Taylor?',
  'I owe Priya the pricing follow-up',
  "What's owed to the pilot?",
  'Morgan owes me the interview notes',
  'I owe the trip a packing list',
] as const;

function matchPerson(text: string, people: CounterPerson[]): CounterPerson | undefined {
  const lower = text.toLowerCase();
  return people.find((p) => lower.includes(p.name.split(' ')[0]!.toLowerCase()));
}

function matchGoal(text: string, goals: Goal[]): Goal | undefined {
  const lower = text.toLowerCase();
  return goals.find((g) =>
    g.name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .some((w) => lower.includes(w)),
  );
}

function tidy(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ').replace(/[.?!]+$/, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function parseUtterance(
  raw: string,
  people: CounterPerson[],
  goals: Goal[],
): Utterance {
  const text = raw.trim();
  if (!text) return { kind: 'unknown' };
  const lower = text.toLowerCase();

  const person = matchPerson(text, people);
  const goal = matchGoal(text, goals);

  const isQuestion =
    /\?$/.test(text) || /^(what|where|how|who|show|do i)\b/.test(lower);

  if (isQuestion) {
    if (person) return { kind: 'inquiry', key: { kind: 'person', id: person.id } };
    if (goal) return { kind: 'inquiry', key: { kind: 'goal', id: goal.id } };
    return { kind: 'inquiry', key: null };
  }

  // "<name> owes me ..." — a credit posting.
  const credit = lower.match(/^(\S+)\s+owes\s+me\s+(.+)$/);
  if (credit && person && lower.startsWith(person.name.split(' ')[0]!.toLowerCase())) {
    return {
      kind: 'post',
      commitment: tidy(credit[2]!),
      personId: person.id,
      goalId: goal?.id ?? null,
      side: 'credit',
    };
  }

  // "I owe <account> ..." — a debit posting.
  const debit = lower.match(/^i\s+owe\s+(.+)$/);
  if (debit && (person || goal)) {
    let rest = debit[1]!;
    if (person) {
      rest = rest.replace(new RegExp(`^${person.name.split(' ')[0]!.toLowerCase()}\\s+`, 'i'), '');
    } else if (goal) {
      // strip "the pilot" style account references from the front
      rest = rest.replace(/^the\s+\S+\s+/, '');
    }
    return {
      kind: 'post',
      commitment: tidy(rest),
      personId: person?.id ?? null,
      goalId: goal?.id ?? null,
      side: 'debit',
    };
  }

  // A bare statement naming an account still posts as a debit.
  if (person || goal) {
    return {
      kind: 'post',
      commitment: tidy(text),
      personId: person?.id ?? null,
      goalId: goal?.id ?? null,
      side: 'debit',
    };
  }

  return { kind: 'unknown' };
}

/* ---------------------------------------------------------------------- *
 * Self-check: run with `npx tsx prototypes/ledger/counter.ts`
 * ---------------------------------------------------------------------- */
const argv = (globalThis as { process?: { argv?: string[] } }).process?.argv;
if (argv?.[1]?.endsWith('counter.ts')) {
  const people = [
    { id: 'p-taylor', name: 'Taylor Reed' },
    { id: 'p-priya', name: 'Priya Shah' },
    { id: 'p-morgan', name: 'Morgan Ellis' },
  ];
  const goals = [
    { id: 'g-pilot', name: 'Ship the narrow pilot' },
    { id: 'g-trip', name: 'Calm-arrival trip' },
  ];
  const parse = (t: string) => parseUtterance(t, people, goals);

  let u = parse('I owe Priya the pricing follow-up');
  console.assert(u.kind === 'post' && u.side === 'debit' && u.personId === 'p-priya', 'debit to person');
  console.assert(u.kind === 'post' && u.commitment === 'The pricing follow-up', 'strips the name');

  u = parse('Where do I stand with Taylor?');
  console.assert(u.kind === 'inquiry' && u.key?.kind === 'person' && u.key.id === 'p-taylor', 'person inquiry');

  u = parse('I owe the pilot a rollout checklist');
  console.assert(u.kind === 'post' && u.goalId === 'g-pilot' && u.personId === null, 'debit to goal');

  u = parse('Morgan owes me the interview notes');
  console.assert(u.kind === 'post' && u.side === 'credit' && u.personId === 'p-morgan', 'credit posting');

  u = parse("What's owed to the trip?");
  console.assert(u.kind === 'inquiry' && u.key?.kind === 'goal' && u.key.id === 'g-trip', 'goal inquiry');

  u = parse('What do I owe?');
  console.assert(u.kind === 'inquiry' && u.key === null, 'bare inquiry hits everything');

  u = parse('buy milk');
  console.assert(u.kind === 'unknown', 'no account, no posting');

  console.log('counter self-check passed');
}
