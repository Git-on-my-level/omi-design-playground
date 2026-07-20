/**
 * Ask about what Omi saw on screen. Same shape as `converse.ts`, but the corpus
 * is the Rewind capture stream, not a transcript: the frame whose app, sender,
 * commitment, or captured text best overlaps the question is cited back so the
 * screenshot stays checkable. Falls back to a count when nothing matches.
 *
 * ponytail: keyword overlap, not retrieval. Upgrade path is a real model behind
 * the same { text, citeFrameId } contract.
 */
import type { RewindFrame } from './entries';

export interface RewindAnswer {
  text: string;
  citeFrameId: string | null;
}

/** Default prompts for the Rewind ask bar, tuned to the fixture captures. */
export const REWIND_QUESTIONS = [
  'What did Taylor send?',
  'Anything about the pricing deck?',
  "What's on Thursday?",
] as const;

const STOP = new Set([
  'what', 'who', 'when', 'where', 'why', 'how', 'the', 'that', 'this', 'with',
  'about', 'from', 'does', 'did', 'are', 'was', 'were', 'and', 'for', 'you',
  'your', 'our', 'still', 'open', 'have', 'has', 'send', 'sent', 'anything',
  'there', 'any', 'get', 'got',
]);

function keywords(question: string): string[] {
  return question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function haystack(frame: RewindFrame): string {
  return [
    frame.shot.app,
    frame.shot.context,
    frame.shot.lines.join(' '),
    frame.commitment ?? '',
    frame.personName ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

export function answerAboutRewind(frames: RewindFrame[], question: string): RewindAnswer {
  const keys = keywords(question);

  let best: RewindFrame | null = null;
  let bestScore = 0;
  for (const frame of frames) {
    const hay = haystack(frame);
    const score = keys.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = frame;
    }
  }

  if (best && bestScore > 0) {
    const line = best.shot.lines[0] ?? best.shot.context;
    const tail = best.commitment ? ` Now on the book as “${best.commitment}”.` : '';
    return { text: `On ${best.shot.app} — “${line}”.${tail}`, citeFrameId: best.id };
  }

  const tasks = frames.filter((f) => f.entryId).length;
  return {
    text: `Nothing on screen matches that. Omi has ${frames.length} captures from your screen; ${tasks} became to-dos.`,
    citeFrameId: null,
  };
}

/* ---------------------------------------------------------------------- *
 * Self-check: run with `npx tsx prototypes/ledger/rewind.ts`
 * ---------------------------------------------------------------------- */
const argv = (globalThis as { process?: { argv?: string[] } }).process?.argv;
if (argv?.[1]?.endsWith('rewind.ts')) {
  const frame = (over: Partial<RewindFrame>): RewindFrame => ({
    id: 'f',
    entryId: null,
    commitment: null,
    personName: null,
    date: new Date('2026-07-20T00:00:00.000Z'),
    dateLabel: 'Jul 20',
    shot: { app: 'Notes', context: 'x', lines: ['x'], at: '' },
    ...over,
  });

  const frames: RewindFrame[] = [
    frame({
      id: 'mail-taylor',
      personName: 'Taylor',
      commitment: 'Send the revised export scope before the sync',
      shot: { app: 'Mail', context: 'Taylor Reed · Re: pilot scope', lines: ['Can you send the revised export scope by Thursday?'], at: '3:12 PM' },
    }),
    frame({
      id: 'cal',
      shot: { app: 'Calendar', context: 'Pilot sync · Thursday 2:00 PM', lines: ['Pricing deck review'], at: '11:05 AM' },
    }),
  ];

  let a = answerAboutRewind(frames, 'What did Taylor send?');
  console.assert(a.citeFrameId === 'mail-taylor', 'matches the Taylor mail');
  console.assert(a.text.includes('on the book'), 'surfaces the derived to-do');

  a = answerAboutRewind(frames, 'Anything about the pricing deck?');
  console.assert(a.citeFrameId === 'cal', 'matches the calendar frame');

  a = answerAboutRewind(frames, 'How was the weather?');
  console.assert(a.citeFrameId === null && a.text.includes('captures'), 'falls back to a count');

  console.log('rewind self-check passed');
}
