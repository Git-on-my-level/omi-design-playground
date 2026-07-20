/**
 * Ask about a past conversation. Real assistant inference does not exist in the
 * pack, so an answer is extracted from the transcript: the segment that best
 * overlaps the question, cited back so the quote stays checkable. Falls back to
 * the conversation summary when nothing in the transcript matches.
 *
 * ponytail: keyword overlap, not retrieval. Upgrade path is a real model behind
 * the same { text, citeSegmentId } contract.
 */
import type { Conversation } from '../../reference/hackathon-pack/src/types';

export interface ConvAnswer {
  text: string;
  citeSegmentId: string | null;
}

/** Same three questions everywhere — a conversation reader's default prompts. */
export const CONV_QUESTIONS = [
  'What did we decide?',
  'What is still open?',
  'Who owns the follow-up?',
] as const;

const STOP = new Set([
  'what', 'who', 'when', 'where', 'why', 'how', 'the', 'that', 'this', 'with',
  'about', 'from', 'does', 'did', 'are', 'was', 'were', 'and', 'for', 'you',
  'your', 'our', 'still', 'open', 'have', 'has',
]);

function keywords(question: string): string[] {
  return question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function answerAboutConversation(conv: Conversation, question: string): ConvAnswer {
  const keys = keywords(question);

  let best: Conversation['segments'][number] | null = null;
  let bestScore = 0;
  for (const seg of conv.segments) {
    const t = seg.text.toLowerCase();
    const score = keys.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = seg;
    }
  }

  if (best && bestScore > 0) {
    const who = best.speaker.split(' ')[0]!;
    return { text: `${who} put it directly — “${best.text}”`, citeSegmentId: best.id };
  }

  return { text: conv.summary, citeSegmentId: null };
}

/* ---------------------------------------------------------------------- *
 * Self-check: run with `npx tsx prototypes/ledger/converse.ts`
 * ---------------------------------------------------------------------- */
const argv = (globalThis as { process?: { argv?: string[] } }).process?.argv;
if (argv?.[1]?.endsWith('converse.ts')) {
  const conv: Conversation = {
    id: 'c1',
    title: 'Sprint plan',
    startedAt: '2026-07-15T10:00:00.000Z',
    updatedAt: '2026-07-15T10:44:00.000Z',
    source: 'macos',
    summary: 'A small reviewable slice with a testable definition of done.',
    people: ['person-me', 'person-taylor'],
    segments: [
      { id: 's1', speaker: 'Taylor Reed', text: 'The dependency is a single export shape.', startedAt: '', endedAt: '' },
      { id: 's2', speaker: 'Riley Park', text: 'The test is whether someone can explain why an item is here.', startedAt: '', endedAt: '' },
    ],
  };

  let a = answerAboutConversation(conv, 'What did we say about the export dependency?');
  console.assert(a.citeSegmentId === 's1', 'matches the export segment');

  a = answerAboutConversation(conv, 'What is the test?');
  console.assert(a.citeSegmentId === 's2', 'matches the test segment');

  a = answerAboutConversation(conv, 'How was the weather?');
  console.assert(a.citeSegmentId === null && a.text === conv.summary, 'falls back to summary');

  console.log('converse self-check passed');
}
