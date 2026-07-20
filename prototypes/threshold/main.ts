/**
 * threshold — the twenty seconds before you walk into the room.
 *
 * Not recall. Readiness. A card arrives because a meeting is close, says the one
 * thing it would cost you to have forgotten, and leaves. Nothing is browsable:
 * no list, no history, no back button, and never two cards at once.
 *
 * Try first: wait for the card to arrive, then flick it sideways. Then wait for
 * the next one and drag it *down* to see the transcript line that produced it.
 */
import { OmiMock, omiScenarioNames, type OmiScenarioName } from '../../reference/hackathon-pack/src';
import type { Conversation, Memory, OmiSnapshot, Person, SuggestedAction } from '../../reference/hackathon-pack/src/types';
import { mountMacStage } from '../_macos-stage';
import './style.css';

/* ---------------------------------------------------------------------- *
 * Fixture clock. The scenario is a fixed synthetic day, so "now" is fixed.
 * ---------------------------------------------------------------------- */

const FIXTURE_NOW = new Date('2026-07-20T18:16:00.000Z');

/** Fixture seconds elapsed per real second. Four fixture minutes ≈ 20s of demo. */
const TIME_COMPRESSION = 12;
/** How far out a meeting is when the card arrives. */
const LEAD_SECONDS = 4 * 60;
/** Quiet beat between one card leaving and the next arriving. */
const LULL_MS = 2200;

const requested = new URLSearchParams(window.location.search).get('scenario');
const scenario: OmiScenarioName =
  omiScenarioNames.find((name) => name === requested) ?? 'power-user';

const omi = new OmiMock({ scenario, latencyMs: 80 });

const mount = document.querySelector<HTMLElement>('#root');
if (!mount) throw new Error('#root is missing from index.html');

/** Fixture time, advanced by the same compression the countdown runs on. */
let elapsedSeconds = 0;
const fixtureClock = (): Date => new Date(FIXTURE_NOW.getTime() + elapsedSeconds * 1000);

const stage = mountMacStage(mount, {
  appName: 'omi',
  menus: ['File', 'Edit', 'View', 'Capture', 'Window', 'Help'],
  now: fixtureClock,
  // The card owns the top-right corner, so icons move out of its way.
  filesArea: 'bottom-left',
});

/** The card floats over the desktop, top right, below the menu bar. */
const root = document.createElement('div');
root.className = 'stage';
root.setAttribute('aria-live', 'polite');
stage.surface.append(root);

/* ---------------------------------------------------------------------- *
 * Deriving a brief
 *
 * A brief is one person, one commitment, and the receipt behind it. Anything
 * that does not fit that shape is not a brief and does not get shown.
 * ---------------------------------------------------------------------- */

interface SupportLine {
  label: string;
  value: string;
}

interface Brief {
  person: Person;
  /** The single thing, set large. Always an open commitment to this person. */
  fact: string;
  support: SupportLine[];
  receiptTitle: string;
  receipt: Array<{ speaker: string; text: string }>;
}

const firstName = (person: Person): string => person.name.split(' ')[0]!;

function daysBetween(from: string, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / 86_400_000));
}

function relativeDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/** The commitment this card exists to surface. */
function openCommitment(person: Person, snapshot: OmiSnapshot): SuggestedAction | undefined {
  const name = firstName(person);
  return snapshot.actions.find(
    (action) => action.status === 'open' && action.title.includes(name) && action.conversationId,
  );
}

/**
 * One supporting memory: what this person actually cares about. Relationship
 * memories beat everything else here — they are the thing you forget under
 * pressure, and the thing that changes how you open your mouth.
 */
function contextMemory(person: Person, snapshot: OmiSnapshot): Memory | undefined {
  const mine = snapshot.memories.filter((memory) => memory.people.includes(person.id));
  const kindWeight = (memory: Memory): number => (memory.kind === 'relationship' ? 1 : 0);
  return [...mine].sort(
    (a, b) => kindWeight(b) - kindWeight(a) || (b.relevance ?? 0) - (a.relevance ?? 0),
  )[0];
}

function buildBrief(person: Person, snapshot: OmiSnapshot): Brief | undefined {
  const commitment = openCommitment(person, snapshot);
  if (!commitment) return undefined;

  const source: Conversation | undefined = snapshot.conversations.find(
    (conversation) => conversation.id === commitment.conversationId,
  );
  const context = contextMemory(person, snapshot);

  const support: SupportLine[] = [];
  if (context) {
    support.push({ label: 'Cares about', value: context.text });
  }
  if (source) {
    support.push({
      label: 'Last spoke',
      value: `${relativeDays(daysBetween(source.startedAt, FIXTURE_NOW))} · ${source.title}`,
    });
  }

  return {
    person,
    fact: commitment.title,
    // Three facts is already a compromise. Two is better.
    support: support.slice(0, 2),
    receiptTitle: source ? source.title : 'Source conversation',
    receipt: (source?.segments ?? []).slice(0, 3).map((segment) => ({
      speaker: segment.speaker,
      text: segment.text,
    })),
  };
}

/** Fabricated calendar: whoever you owe something to, in the order you owe it. */
function upcoming(snapshot: OmiSnapshot): Brief[] {
  return snapshot.people
    .filter((person) => person.id !== snapshot.me.id)
    .map((person) => buildBrief(person, snapshot))
    .filter((brief): brief is Brief => brief !== undefined);
}

/* ---------------------------------------------------------------------- *
 * Rendering
 * ---------------------------------------------------------------------- */

function countdownLabel(secondsOut: number): string {
  if (secondsOut <= 0) return 'now';
  if (secondsOut < 60) return `in ${secondsOut}s`;
  return `in ${Math.ceil(secondsOut / 60)} min`;
}

function buildCard(brief: Brief): HTMLElement {
  const card = document.createElement('article');
  card.className = 'card is-entering';
  card.tabIndex = 0;

  const support = brief.support
    .map(
      (line) =>
        `<li><span class="label">${line.label}</span><span class="value">${line.value}</span></li>`,
    )
    .join('');

  const receipt = brief.receipt
    .map(
      (line) =>
        `<p class="receipt-line"><span class="speaker">${line.speaker}:</span> ${line.text}</p>`,
    )
    .join('');

  card.innerHTML = `
    <p class="eyebrow">
      <span class="who">${brief.person.name}</span>
      <span class="when" data-when>in 4 min</span>
    </p>
    <h1 class="fact">${brief.fact}</h1>
    ${support ? `<ul class="support">${support}</ul>` : ''}
    <div class="receipt" data-receipt>
      <div class="receipt-inner" data-receipt-inner>
        <p class="receipt-source">${brief.receiptTitle}</p>
        ${receipt}
      </div>
    </div>
    <span class="grip" aria-hidden="true"></span>
  `;

  return card;
}

/* ---------------------------------------------------------------------- *
 * One card's life: arrive, count down, be dismissed or expire.
 * ---------------------------------------------------------------------- */

let sequence: Brief[] = [];
let index = 0;
let ticker: number | undefined;

function present(brief: Brief): void {
  const card = buildCard(brief);
  root!.replaceChildren(card);
  card.focus({ preventScroll: true });

  const whenEl = card.querySelector<HTMLElement>('[data-when]')!;
  const receiptEl = card.querySelector<HTMLElement>('[data-receipt]')!;
  const receiptInner = card.querySelector<HTMLElement>('[data-receipt-inner]')!;

  let secondsOut = LEAD_SECONDS;
  let unfolded = false;
  let done = false;

  card.addEventListener('animationend', () => card.classList.remove('is-entering'), { once: true });

  /* -- countdown ------------------------------------------------------- */

  function stopTicker(): void {
    if (ticker !== undefined) window.clearInterval(ticker);
    ticker = undefined;
  }

  ticker = window.setInterval(() => {
    secondsOut -= TIME_COMPRESSION / 4;
    whenEl.textContent = countdownLabel(Math.max(0, Math.round(secondsOut)));
    whenEl.classList.toggle('is-imminent', secondsOut <= 60);
    if (secondsOut <= 0) expire();
  }, 250);

  /* -- unfold ---------------------------------------------------------- */

  function setUnfolded(nextState: boolean): void {
    if (nextState === unfolded) return;
    unfolded = nextState;
    card.classList.toggle('is-unfolded', unfolded);
    receiptEl.style.height = unfolded ? `${receiptInner.offsetHeight}px` : '0px';
  }

  /* -- endings --------------------------------------------------------- */

  function advance(delay: number): void {
    if (done) return;
    done = true;
    stopTicker();
    window.setTimeout(next, delay);
  }

  /** The card was thrown. It does not come back. */
  function throwAway(offsetX: number, velocityX: number): void {
    const distance = offsetX + velocityX * 320;
    card.classList.add('is-thrown');
    card.style.transform = `translate(${distance}px, ${Math.abs(offsetX) * 0.06}px) rotate(${distance * 0.018}deg)`;
    advance(520);
  }

  /** T-0 arrived and nobody touched it. It leaves on its own. */
  function expire(): void {
    if (done) return;
    card.classList.add('is-spent');
    card.style.transform = '';
    advance(460);
  }

  /* -- gesture --------------------------------------------------------- */

  let startX = 0;
  let startY = 0;
  let startedAt = 0;
  let lastX = 0;
  let lastT = 0;
  let velocityX = 0;
  let axis: 'none' | 'x' | 'y' = 'none';
  let dragging = false;

  card.addEventListener('pointerdown', (event: PointerEvent) => {
    if (done) return;
    dragging = true;
    axis = 'none';
    startX = lastX = event.clientX;
    startY = event.clientY;
    startedAt = lastT = event.timeStamp;
    velocityX = 0;
    card.setPointerCapture(event.pointerId);
    card.style.transition = 'none';
  });

  card.addEventListener('pointermove', (event: PointerEvent) => {
    if (!dragging || done) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (axis === 'none' && Math.hypot(dx, dy) > 8) {
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    const dt = event.timeStamp - lastT;
    if (dt > 0) {
      velocityX = (event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastT = event.timeStamp;
    }

    if (axis === 'x') {
      card.style.transform = `translate(${dx}px, 0) rotate(${dx * 0.018}deg)`;
      card.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 520));
    } else if (axis === 'y') {
      // Resistance: the card resents being pulled, then gives.
      card.style.transform = `translate(0, ${dy * 0.28}px)`;
    }
  });

  card.addEventListener('pointerup', (event: PointerEvent) => {
    if (!dragging || done) return;
    dragging = false;
    card.releasePointerCapture(event.pointerId);
    card.style.transition = '';

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (axis === 'x' && (Math.abs(dx) > 120 || Math.abs(velocityX) > 0.6)) {
      throwAway(dx, velocityX);
      return;
    }

    // Anything that was not a throw springs back to rest.
    card.style.transform = '';
    card.style.opacity = '';

    if (axis === 'y' && dy > 60) setUnfolded(true);
    else if (axis === 'y' && dy < -60) setUnfolded(false);
    else if (axis === 'none' && event.timeStamp - startedAt < 400) setUnfolded(!unfolded);
  });

  /* -- keyboard equivalents (no visible chrome earns its place) --------- */

  card.addEventListener('keydown', (event: KeyboardEvent) => {
    if (done) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setUnfolded(!unfolded);
    } else if (event.key === 'Escape' || event.key === 'ArrowRight') {
      event.preventDefault();
      throwAway(420, 0.8);
    }
  });
}

/** Between cards there is nothing at all. Absence is the resting state. */
function next(): void {
  root.replaceChildren();
  index = (index + 1) % sequence.length;
  window.setTimeout(() => present(sequence[index]!), LULL_MS);
}

/* ---------------------------------------------------------------------- */

async function start(): Promise<void> {
  const snapshot = await omi.getSnapshot();
  sequence = upcoming(snapshot);

  if (sequence.length === 0) return;

  window.setInterval(() => {
    elapsedSeconds += TIME_COMPRESSION / 4;
  }, 250);

  window.setTimeout(() => present(sequence[0]!), 700);
}

void start();

import.meta.hot?.dispose(() => stage.destroy());
