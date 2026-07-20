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
import { createVoiceInput, pushToTalk } from '../_voice';
import { openOmiApp, type OmiChat } from './chat';
import { buildAlert, type Trigger } from './triggers';
import { buildWorkspace, FIXTURE_NOW, firstName, relativeDays, type Workspace } from './workspace';
import './style.css';

/* ---------------------------------------------------------------------- *
 * Fixture clock. The scenario is a fixed synthetic day, so "now" is fixed.
 * ---------------------------------------------------------------------- */

/** Fixture seconds elapsed per real second. Four fixture minutes ≈ 20s of demo. */
const TIME_COMPRESSION = 12;
/** How far out a meeting is when a calendar alert fires. */
const LEAD_SECONDS = 4 * 60;
/**
 * How long an app-triggered card dwells before the moment passes and it expires.
 * There is no real clock behind a Slack DM, so it borrows the calendar's lead.
 */
const DWELL_SECONDS = LEAD_SECONDS;
/** The alert sits alone before the card slides in under it. */
const ALERT_HOLD_MS = 1100;
/** How long the alert and the card share the corner before the alert dismisses. */
const BOTH_VISIBLE_MS = 2400;
/** Gap between the alert's bottom edge and the card that sits under it. */
const STACK_GAP = 12;
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
  // The most recent conversation with them, which is not necessarily the one
  // the commitment came from. The contact page means the same thing by it.
  const latest = snapshot.conversations
    .filter((conversation) => conversation.people.includes(person.id))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (latest) {
    support.push({ label: 'Last spoke', value: relativeDays(latest.startedAt) });
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

/* ---------------------------------------------------------------------- *
 * Triggers
 *
 * A card no longer just appears on a compressed clock — it arrives because of
 * something visible on screen. Each person's card is caused by one screen event,
 * fabricated here: a calendar alert, a Meet pre-join, a Slack DM, a mail reply.
 * All four are synthetic; the fixture has no schedule and Omi is not watching a
 * real screen. See the README.
 * ---------------------------------------------------------------------- */

/** One card, and the on-screen event that causes it to arrive. */
interface ScreenEvent {
  brief: Brief;
  trigger: Trigger;
}

const TRIGGERS: Record<string, Trigger> = {
  'person-priya': {
    kind: 'calendar',
    event: 'Sync with Priya Shah',
    where: 'Video call',
    leadSeconds: LEAD_SECONDS,
    eyebrow: 'Calendar',
    why: 'Because your sync with Priya is in 4 minutes.',
  },
  'person-taylor': {
    kind: 'meet',
    heading: 'Export pilot review',
    preview: 'Taylor Reed is in the call',
    eyebrow: 'Meet · joining now',
    why: 'Because the export pilot review just started.',
  },
  'person-morgan': {
    kind: 'slack',
    heading: 'Morgan Ellis',
    preview: 'Did the workaround pattern hold up?',
    eyebrow: 'Slack · Morgan',
    why: 'Because Morgan just messaged you.',
  },
  'person-quinn': {
    kind: 'mail',
    heading: 'Quinn Ellis',
    preview: 'Re: the next practice-sharing call',
    eyebrow: 'Mail · Quinn',
    why: 'Because Quinn replied about the practice-sharing call.',
  },
};

/** The order cards arrive in. Priya leads: a calendar sync is the clearest case. */
const TRIGGER_ORDER = ['person-priya', 'person-taylor', 'person-morgan', 'person-quinn'];

/** Each on-screen event, paired with the card it will cause. */
function screenEvents(snapshot: OmiSnapshot): ScreenEvent[] {
  const events: ScreenEvent[] = [];
  for (const id of TRIGGER_ORDER) {
    const person = snapshot.people.find((p) => p.id === id);
    const trigger = TRIGGERS[id];
    if (!person || !trigger) continue;
    const brief = buildBrief(person, snapshot);
    if (brief) events.push({ brief, trigger });
  }
  return events;
}

/* ---------------------------------------------------------------------- *
 * Rendering
 * ---------------------------------------------------------------------- */

/** Bars in the push-to-talk meter. Enough to read as audio, few enough to stay quiet. */
const WAVE_BARS = 26;

function countdownLabel(secondsOut: number): string {
  if (secondsOut <= 0) return 'now';
  if (secondsOut < 60) return `in ${secondsOut}s`;
  return `in ${Math.ceil(secondsOut / 60)} min`;
}

function buildCard(brief: Brief, trigger: Trigger): HTMLElement {
  const card = document.createElement('article');
  card.className = 'card is-entering';
  card.tabIndex = 0;

  /*
   * The eyebrow now names the source. A calendar event has a real time, so its
   * countdown lives in `data-when` and keeps ticking; the app triggers have no
   * clock, so their source label is the whole of it.
   */
  const whenHtml =
    trigger.kind === 'calendar'
      ? `<span class="when"><span class="src">${trigger.eyebrow}</span> · <span class="when-count" data-when>in 4 min</span></span>`
      : `<span class="when when-static">${trigger.eyebrow}</span>`;

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
      ${whenHtml}
    </p>
    <h1 class="fact">${brief.fact}</h1>
    <p class="why-now">${trigger.why}</p>
    <div class="fold" data-fold>
      <div class="fold-inner" data-fold-inner>
        ${support ? `<ul class="support">${support}</ul>` : ''}
        <p class="receipt-source">${brief.receiptTitle}</p>
        ${receipt}
      </div>
    </div>
    <p class="utterance" data-utterance></p>
    <div class="foot">
      <div class="ptt" data-ptt>
        <span class="mic" aria-hidden="true"></span>
        <kbd class="keycap">⌘</kbd>
        <span class="wave" data-wave aria-hidden="true">${'<i></i>'.repeat(WAVE_BARS)}</span>
      </div>
      <button class="cta" type="button" data-open>Open in Omi</button>
    </div>
    <span class="grip" aria-hidden="true"></span>
  `;

  return card;
}

/* ---------------------------------------------------------------------- *
 * One card's life: arrive, count down, be dismissed or expire.
 * ---------------------------------------------------------------------- */

let sequence: ScreenEvent[] = [];
/** Goals, people, and tasks, resolved once. The app window reads from this. */
let workspace: Workspace;
let index = 0;
let ticker: number | undefined;
/** The system chrome currently on screen, if any. Never more than one. */
let currentAlert: HTMLElement | undefined;
/** Timers for the current event, cleared when the next event starts. */
let alertTimers: number[] = [];

function clearAlertTimers(): void {
  for (const id of alertTimers) window.clearTimeout(id);
  alertTimers = [];
}

/** The alert slides off; the card rises into its place only after the alert is gone. */
function dismissAlert(): void {
  if (!currentAlert) return;
  const leaving = currentAlert;
  currentAlert = undefined;
  leaving.classList.add('is-leaving');
  window.setTimeout(() => {
    leaving.remove();
    // Rise only once the alert has left — and only if nothing new took the corner.
    if (!currentAlert) root.style.top = '';
  }, 420);
}

/**
 * One screen event: the system alert arrives, and a beat later the card slides in
 * *under* it, so the cause and the response are visible together. The alert is
 * the desktop's own chrome; the card is Omi's. Their contrast — solid versus
 * glass — is how you know the card was never a window. When the alert dismisses,
 * the card bumps up into the resting slot it would have had on its own.
 */
function present(event: ScreenEvent): void {
  clearAlertTimers();
  dismissAlert();

  const alert = buildAlert(event.trigger, FIXTURE_NOW.getDate());
  currentAlert = alert;
  stage.surface.append(alert);
  // Drop the card slot to just below the alert, once its height is measurable.
  window.requestAnimationFrame(() => {
    if (currentAlert === alert) root.style.top = `${46 + alert.offsetHeight + STACK_GAP}px`;
  });

  alertTimers.push(
    window.setTimeout(() => showCard(event.brief, event.trigger), ALERT_HOLD_MS),
  );
  alertTimers.push(window.setTimeout(dismissAlert, ALERT_HOLD_MS + BOTH_VISIBLE_MS));
}

function showCard(brief: Brief, trigger: Trigger): void {
  const card = buildCard(brief, trigger);
  root!.replaceChildren(card);
  card.focus({ preventScroll: true });

  const whenEl = card.querySelector<HTMLElement>('[data-when]');
  const foldEl = card.querySelector<HTMLElement>('[data-fold]')!;
  const foldInner = card.querySelector<HTMLElement>('[data-fold-inner]')!;
  const utteranceEl = card.querySelector<HTMLElement>('[data-utterance]')!;
  const bars = [...card.querySelectorAll<HTMLElement>('[data-wave] i')];

  let secondsOut = trigger.kind === 'calendar' ? trigger.leadSeconds : DWELL_SECONDS;
  let unfolded = false;
  let done = false;
  /** Held open by the chat window or an active hold. The meeting waits. */
  let paused = false;

  card.addEventListener('animationend', () => card.classList.remove('is-entering'), { once: true });

  /* -- countdown ------------------------------------------------------- */

  function stopTicker(): void {
    if (ticker !== undefined) window.clearInterval(ticker);
    ticker = undefined;
  }

  ticker = window.setInterval(() => {
    if (paused) return;
    secondsOut -= TIME_COMPRESSION / 4;
    // Only a calendar event has a real time to count down; app cards dwell,
    // then let the moment pass quietly at zero.
    if (whenEl) {
      whenEl.textContent = countdownLabel(Math.max(0, Math.round(secondsOut)));
      whenEl.classList.toggle('is-imminent', secondsOut <= 60);
    }
    if (secondsOut <= 0) expire();
  }, 250);

  /* -- push to talk ---------------------------------------------------- *
   *
   * Hold right ⌘ and the card starts listening. It is the only object on
   * screen, so it does not need a target: the meter grows out of the footer
   * it already had, and the words land in the card rather than in a HUD.
   * Release hands the question to the chat window.
   * -------------------------------------------------------------------- */

  const question = `What did I promise ${firstName(brief.person)}?`;
  const words = question.split(' ');
  let spoken = 0;
  let history = new Array<number>(WAVE_BARS).fill(0);
  let reveal: number | undefined;

  function paintWave(level: number): void {
    history = [...history.slice(1), level];
    for (const [i, bar] of bars.entries()) {
      // Taper only the leading edge, so the meter reads as sound arriving
      // rather than as a symmetric graph sitting there.
      const taper = 0.72 + 0.28 * Math.min(1, i / 5);
      bar.style.transform = `scaleY(${0.06 + history[i]! * taper * 0.94})`;
    }
  }

  const voice = createVoiceInput({
    onLevel: ({ level }) => paintWave(level),
    onSpeechStart: () => card.classList.add('is-hearing'),
    onSpeechEnd: () => card.classList.remove('is-hearing'),
  });

  function beginHold(): void {
    if (done || chat) return;
    paused = true;
    spoken = 0;
    utteranceEl.textContent = '';
    card.classList.add('is-listening');
    void voice.start();
    // Words land at a speaking cadence rather than all at once on release.
    reveal = window.setInterval(() => {
      if (spoken >= words.length) return;
      spoken += 1;
      utteranceEl.textContent = words.slice(0, spoken).join(' ');
    }, 190);
  }

  function endHold(): void {
    if (reveal !== undefined) window.clearInterval(reveal);
    reveal = undefined;
    voice.stop();
    card.classList.remove('is-listening', 'is-hearing');
    paused = false;

    // A tap of the key is not an utterance; it leaves no trace.
    if (spoken < 2) {
      utteranceEl.textContent = '';
      return;
    }
    utteranceEl.textContent = question;
    window.setTimeout(() => handOff(question), 340);
  }

  const unbindPtt = pushToTalk({ onPress: beginHold, onRelease: endHold });

  /* -- handoff to the chat window -------------------------------------- */

  let chat: OmiChat | undefined;

  function handOff(asking?: string): void {
    if (done || chat) return;
    paused = true;
    card.classList.add('is-handing-off');
    chat = openOmiApp(stage.surface, {
      workspace,
      focusPersonId: brief.person.id,
      asking,
      // Calendar sync → Mail draft; the other triggers name their own app.
      contextApp:
        trigger.kind === 'calendar' ? 'Mail' : trigger.kind === 'meet' ? 'Meet' : trigger.kind === 'slack' ? 'Slack' : 'Mail',
      onClose: () => {
        chat = undefined;
        // The moment is over either way. Threshold does not resume a card.
        advance(0);
      },
    });
  }

  card.querySelector<HTMLButtonElement>('[data-open]')!.addEventListener('click', (event) => {
    event.stopPropagation();
    handOff();
  });

  /* -- unfold ---------------------------------------------------------- */

  function setUnfolded(nextState: boolean): void {
    if (nextState === unfolded) return;
    unfolded = nextState;
    card.classList.toggle('is-unfolded', unfolded);
    foldEl.style.height = unfolded ? `${foldInner.offsetHeight}px` : '0px';
  }

  /* -- endings --------------------------------------------------------- */

  function advance(delay: number): void {
    if (done) return;
    done = true;
    stopTicker();
    unbindPtt();
    voice.destroy();
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
    // The button is a target, not a handle.
    if ((event.target as HTMLElement).closest('.cta')) return;
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
    if (event.key === 'Enter' && event.metaKey) {
      event.preventDefault();
      handOff();
    } else if (event.key === 'Enter' || event.key === ' ') {
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
  workspace = buildWorkspace(snapshot);
  sequence = screenEvents(snapshot);

  if (sequence.length === 0) return;

  window.setInterval(() => {
    elapsedSeconds += TIME_COMPRESSION / 4;
  }, 250);

  window.setTimeout(() => present(sequence[0]!), 700);
}

void start();

import.meta.hot?.dispose(() => stage.destroy());
