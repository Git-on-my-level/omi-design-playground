/**
 * Recall — remembering shouldn't be a place you go.
 *
 * Hold right ⌘ in Mail or Messages, ask out loud, release. Ghost text at the
 * caret (Tab or Enter to insert), source card beside the window. Type your own
 * line instead and Omi learns it as a new memory — no card while typing, then
 * the learned after-card on send (Messages) or when the line finishes (Mail).
 * Keys are canned (see TYPED). Esc cancels with no trace.
 *
 * Speech-to-text does not exist in the pack; spoken questions are scripted.
 * See README.md.
 */
import { OmiMock } from '../../reference/hackathon-pack/src';
import type { OmiSnapshot } from '../../reference/hackathon-pack/src/types';
import { mountMacStage } from '../_macos-stage';
import { createVoiceInput, pushToTalk } from '../_voice';
import './style.css';

const FIXTURE_NOW = new Date('2026-07-20T18:16:00.000Z');
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type AppId = 'mail' | 'messages';

/** Scripted stand-in for speech-to-text: what is "heard" per press, in order. */
const SCRIPT: Array<{ asked: string; segmentId?: string }> = [
  { asked: 'what did priya say people actually need', segmentId: 'seg-0714-1' },
  { asked: 'what was morgan\u2019s line about the workaround', segmentId: 'seg-0714-4' },
  { asked: 'where did taylor land on the export', segmentId: 'seg-0720-5' },
  { asked: 'did anyone mention the offsite budget' }, // an honest miss
];

/**
 * Typing is canned: real keys are ignored and this fixed text is revealed one
 * character per keypress, in either app. Whatever the user "types" while a
 * recall is showing becomes the new memory Omi learns on dismiss.
 */
const TYPED: Record<AppId, string> = {
  mail: '\u201Cthe reason has to travel with the decision — not a pile of raw notes.\u201D',
  messages: 'Yes — the repeated workaround is the real signal, even when the ask sounds small.',
};

const omi = new OmiMock({ scenario: 'power-user', latencyMs: 0 });
const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('#root is missing from index.html');

const stage = mountMacStage(root, {
  appName: 'Mail',
  menus: ['File', 'Edit', 'View', 'Mailbox', 'Message', 'Window', 'Help'],
  now: () => FIXTURE_NOW,
  dock: false, // prototype owns the dock so the two usable apps read as real
});

const appNameEl = root.querySelector<HTMLElement>('.stage-app');
const menusEl = root.querySelector<HTMLElement>('.stage-menubar-left');

/* -- two apps you can actually work in ------------------------------------ */

const mail = document.createElement('section');
mail.className = 'app-window mail-window is-front';
mail.dataset.app = 'mail';
mail.innerHTML = `
  <header class="app-titlebar">
    <span class="app-lights"><i></i><i></i><i></i></span>
    <span class="app-title">Workshop follow-up</span>
  </header>
  <div class="mail-fields">
    <p><span>To:</span><em class="mail-chip">Priya Shah</em></p>
    <p><span>Cc:</span><em class="mail-chip">Avery Chen</em></p>
    <p><span>Subject:</span>Workshop follow-up — decision trail</p>
  </div>
  <div class="mail-body">
    <p>Hi Priya,</p>
    <p>Thank you for pushing us toward the smaller launch slice today — it made the decision
    trail much easier to write down.</p>
    <p>Before we lock the follow-up test, I keep coming back to the way you framed it in
    discovery: <span class="doc-caret" data-caret></span><span class="doc-ghost" data-ghost></span></p>
  </div>
`;

const messages = document.createElement('section');
messages.className = 'app-window msg-window';
messages.dataset.app = 'messages';
messages.innerHTML = `
  <header class="app-titlebar">
    <span class="app-lights"><i></i><i></i><i></i></span>
    <span class="app-title">Morgan Ellis</span>
  </header>
  <div class="msg-thread" data-thread>
    <p class="msg-bubble msg-them">Did the workaround pattern hold up when you looked at the notes?</p>
    <p class="msg-bubble msg-them">Also — the three adjacent observations from triage still feel stronger than the loud request.</p>
    <p class="msg-day">Today</p>
    <p class="msg-bubble msg-me">Looking at the notes now.</p>
  </div>
  <div class="msg-compose">
    <div class="msg-field-wrap" data-caret>
      <input class="msg-field" type="text" placeholder="iMessage" autocomplete="off" data-msg-field />
      <span class="msg-ghost" data-ghost></span>
    </div>
    <button class="msg-send" type="button" aria-label="Send" data-msg-send>↑</button>
  </div>
`;

stage.surface.append(mail, messages);
const msgField = messages.querySelector<HTMLInputElement>('[data-msg-field]')!;
const msgGhost = messages.querySelector<HTMLElement>('[data-ghost]')!;
const msgThread = messages.querySelector<HTMLElement>('[data-thread]')!;
const msgSend = messages.querySelector<HTMLButtonElement>('[data-msg-send]')!;

/* -- dock: only the two apps that work in this demo ----------------------- */

const dock = document.createElement('nav');
dock.className = 'recall-dock';
dock.setAttribute('aria-label', 'Applications');
dock.innerHTML = `
  <button class="recall-dock-tile is-on" type="button" data-dock="mail" title="Mail">
    <span class="recall-dock-icon recall-dock-mail" aria-hidden="true"></span>
    <span class="recall-dock-label">Mail</span>
  </button>
  <button class="recall-dock-tile" type="button" data-dock="messages" title="Messages">
    <span class="recall-dock-icon recall-dock-messages" aria-hidden="true"></span>
    <span class="recall-dock-label">Messages</span>
  </button>
`;
stage.surface.append(dock);

/* -- recall surfaces ------------------------------------------------------ */

const chip = document.createElement('div');
chip.className = 'recall-chip';
chip.innerHTML = `<span class="recall-dot"></span><span class="recall-heard"></span>`;
stage.surface.append(chip);

const card = document.createElement('aside');
card.className = 'recall-card';
card.innerHTML = `
  <p class="recall-quote"></p>
  <p class="recall-receipt"></p>
  <p class="recall-note" data-note></p>
  <p class="recall-actions"><kbd>⇥</kbd> insert<span class="recall-alt">or just type</span><span class="recall-esc"><kbd>esc</kbd></span></p>
`;
stage.surface.append(card);

const heardEl = chip.querySelector<HTMLElement>('.recall-heard')!;
const dotEl = chip.querySelector<HTMLElement>('.recall-dot')!;
const quoteEl = card.querySelector<HTMLElement>('.recall-quote')!;
const receiptEl = card.querySelector<HTMLElement>('.recall-receipt')!;
const noteEl = card.querySelector<HTMLElement>('[data-note]')!;

let activeApp: AppId = 'mail';
let caretEl = mail.querySelector<HTMLElement>('[data-caret]')!;
let ghostEl = mail.querySelector<HTMLElement>('[data-ghost]')!;
let liveSpan: HTMLElement | null = null; // Mail's in-progress typed text, sits at the caret
let frontWindow: HTMLElement = mail;

function place(): void {
  const surfaceRect = stage.surface.getBoundingClientRect();
  const anchor =
    activeApp === 'messages' ? msgField.getBoundingClientRect() : caretEl.getBoundingClientRect();
  const winRect = frontWindow.getBoundingClientRect();
  chip.style.left = `${anchor.left - surfaceRect.left}px`;
  chip.style.top = `${anchor.bottom - surfaceRect.top + 10}px`;
  const right = winRect.right - surfaceRect.left + 18;
  const leftFlip = winRect.left - surfaceRect.left - 322;
  const useLeft = right + 304 > surfaceRect.width - 12;
  card.classList.toggle('is-left', useLeft);
  card.style.left = `${useLeft ? Math.max(12, leftFlip) : right}px`;
  card.style.top = `${anchor.top - surfaceRect.top - 8}px`;
}

function setFront(app: AppId): void {
  if (state !== 'idle') reset(); // switching apps abandons the recall, no trace

  activeApp = app;
  frontWindow = app === 'mail' ? mail : messages;
  mail.classList.toggle('is-front', app === 'mail');
  messages.classList.toggle('is-front', app === 'messages');
  for (const tile of dock.querySelectorAll<HTMLElement>('[data-dock]')) {
    tile.classList.toggle('is-on', tile.dataset.dock === app);
  }

  caretEl = frontWindow.querySelector<HTMLElement>('[data-caret]')!;
  ghostEl = frontWindow.querySelector<HTMLElement>('[data-ghost]')!;

  if (appNameEl) appNameEl.textContent = app === 'mail' ? 'Mail' : 'Messages';
  if (menusEl) {
    const titles =
      app === 'mail'
        ? ['File', 'Edit', 'View', 'Mailbox', 'Message', 'Window', 'Help']
        : ['File', 'Edit', 'View', 'Conversation', 'Format', 'Window', 'Help'];
    const keep = [...menusEl.querySelectorAll(':scope > span')].slice(0, 2);
    menusEl.replaceChildren(
      ...keep,
      ...titles.map((t) => {
        const span = document.createElement('span');
        span.textContent = t;
        return span;
      }),
    );
  }
  place();
  if (app === 'messages') msgField.focus({ preventScroll: true });
}

for (const tile of dock.querySelectorAll<HTMLElement>('[data-dock]')) {
  tile.addEventListener('click', () => setFront(tile.dataset.dock as AppId));
}
mail.addEventListener('mousedown', () => setFront('mail'));
messages.addEventListener('mousedown', () => {
  setFront('messages');
});

/* -- resolving an answer from the SDK ------------------------------------- */

interface Answer {
  line: string;
  receipt: string;
}

function resolveAnswer(snapshot: OmiSnapshot, segmentId: string): Answer | undefined {
  for (const conversation of snapshot.conversations) {
    const segment = conversation.segments.find((s) => s.id === segmentId);
    if (!segment) continue;
    const at = new Date(segment.startedAt);
    const topic = conversation.title.split(':')[0]!;
    return {
      line: segment.text,
      receipt: `${segment.speaker} — ${topic} — ${MONTHS[at.getUTCMonth()]}\u00A0${at.getUTCDate()}`,
    };
  }
  return undefined;
}

let snapshot: OmiSnapshot | undefined;
void omi.getSnapshot().then((s) => {
  snapshot = s;
  for (const entry of SCRIPT) {
    if (entry.segmentId && !resolveAnswer(s, entry.segmentId)) {
      throw new Error(`recall script references missing segment ${entry.segmentId}`);
    }
  }
});

/* -- choreography ---------------------------------------------------------- */

type State = 'idle' | 'listening' | 'thinking' | 'answered' | 'typing' | 'missed' | 'noted';

const ANSWER_HOLD_MS = 14000; // ignored answer dissolves
const TYPING_HOLD_MS = 18000; // fallback while the user is typing
const LEARN_HOLD_MS = 7000; // learned card lingers before it clears
const TYPE_STEP = 4; // canned chars revealed (or deleted) per keystroke

let state: State = 'idle';
let scriptIndex = 0;
let heardWords = 0;
let pressedAt = 0;
let pendingInsert = '';
let typedBuffer = ''; // canned text revealed so far; the memory Omi learns on dismiss
const timers = new Set<number>();

function after(ms: number, fn: () => void): void {
  const id = window.setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
}

function clearTimers(): void {
  for (const id of timers) window.clearTimeout(id);
  timers.clear();
}

function setState(next: State): void {
  state = next;
  chip.dataset.state = next;
  card.dataset.state = next;
}

function clearGhost(): void {
  if (activeApp === 'messages') msgGhost.textContent = '';
  else ghostEl.textContent = '';
}

function showGhost(text: string): void {
  if (activeApp === 'messages') {
    msgField.value = '';
    msgField.placeholder = '';
    msgGhost.textContent = text;
  } else {
    ghostEl.textContent = text;
  }
}

/** A leading space so a fresh insertion doesn't butt against prior text. */
function leadingSpace(): string {
  const prev = caretEl.previousSibling?.textContent ?? '';
  return prev && !/\s$/.test(prev) ? ' ' : '';
}

/** Hard clear — zero trace. Drops uncommitted typing; keeps committed text. */
function reset(): void {
  clearTimers();
  clearGhost();
  pendingInsert = '';
  typedBuffer = '';
  if (liveSpan) {
    liveSpan.remove();
    liveSpan = null;
  }
  noteEl.textContent = '';
  msgField.value = '';
  msgField.placeholder = 'iMessage';
  setState('idle');
}

/** Conclude a typed line: the words become a learned memory (the after-card). */
function dismiss(): void {
  if (state === 'typing' && typedBuffer.trim()) {
    learnFromTyped();
    return;
  }
  reset();
}

/** Text shaped for the active app — quoted prose in Mail, plain in Messages. */
function formatInsert(line: string): string {
  if (activeApp === 'messages') return line;
  return `\u201C${line.charAt(0).toLowerCase()}${line.slice(1)}\u201D`;
}

function writeIntoMail(text: string, asCorrection = false): void {
  const inserted = document.createElement('span');
  inserted.className = asCorrection ? 'doc-inserted is-correction' : 'doc-inserted';
  inserted.textContent = leadingSpace() + text;
  caretEl.before(inserted);
}

function sendMessage(text: string): void {
  const bubble = document.createElement('p');
  bubble.className = 'msg-bubble msg-me is-fresh';
  bubble.textContent = text;
  msgThread.append(bubble);
  msgField.value = '';
  msgField.placeholder = 'iMessage';
  msgGhost.textContent = '';
  bubble.scrollIntoView({ block: 'nearest' });
}

/** Show the canned text so far in whichever surface is active. */
function renderTyped(): void {
  if (activeApp === 'messages') {
    msgField.value = typedBuffer;
    if (typedBuffer) msgField.placeholder = '';
  } else if (liveSpan) {
    liveSpan.textContent = liveSpan.dataset.lead! + typedBuffer;
  }
}

/** Enter the typing posture. No card shows while typing — only the after-card. */
function beginTyping(): void {
  clearTimers();
  clearGhost();
  typedBuffer = '';
  if (activeApp === 'mail') {
    liveSpan = document.createElement('span');
    liveSpan.className = 'doc-typed';
    liveSpan.dataset.lead = leadingSpace();
    caretEl.before(liveSpan); // renders at the caret, after any accepted text
  }
  quoteEl.textContent = '';
  receiptEl.textContent = '';
  noteEl.textContent = '';
  setState('typing');
  scheduleLearn();
}

/**
 * (Re)arm the auto-learn timer. Mail has no "send" gesture, so once the line is
 * finished it concludes on its own into the same rich learned card Messages
 * reaches on send; otherwise a long fallback keeps it alive while typing.
 */
function scheduleLearn(): void {
  clearTimers();
  const done = typedBuffer.length >= TYPED[activeApp].length;
  after(activeApp === 'mail' && done ? 1000 : TYPING_HOLD_MS, dismiss);
}

/** A keypress reveals the next few canned characters — the real key is ignored. */
function typeChar(): void {
  // A keystroke from any settled state starts a fresh line (interrupting an
  // answer or a lingering learned card); mid-line it just reveals more.
  if (state === 'answered' || state === 'idle' || state === 'noted') beginTyping();
  else if (state !== 'typing') return;

  const full = TYPED[activeApp];
  if (typedBuffer.length < full.length) {
    typedBuffer = full.slice(0, Math.min(full.length, typedBuffer.length + TYPE_STEP));
    renderTyped();
  }
  scheduleLearn();
  place();
}

function backspace(): void {
  if (activeApp === 'messages') {
    if (state === 'typing' && typedBuffer) {
      typedBuffer = typedBuffer.slice(0, -TYPE_STEP);
      renderTyped();
      scheduleLearn();
    }
    return;
  }

  // Mail: while typing, shorten the live line; otherwise delete committed text.
  if (state === 'typing' && typedBuffer) {
    typedBuffer = typedBuffer.slice(0, -TYPE_STEP);
    renderTyped();
    scheduleLearn();
    place();
    return;
  }
  let prev = caretEl.previousElementSibling as HTMLElement | null;
  while (prev && !prev.textContent) {
    const before = prev.previousElementSibling as HTMLElement | null;
    prev.remove();
    prev = before;
  }
  if (prev && (prev.classList.contains('doc-inserted') || prev.classList.contains('doc-typed'))) {
    prev.textContent = prev.textContent!.slice(0, -TYPE_STEP);
    if (!prev.textContent) prev.remove();
    place();
  }
}

/** The learn beat: the full line commits in place and becomes the new memory. */
function learnFromTyped(): void {
  clearTimers();
  clearGhost();
  const full = TYPED[activeApp]; // send the complete line even if typing was cut short
  typedBuffer = '';

  if (activeApp === 'messages') {
    sendMessage(full);
  } else if (liveSpan) {
    liveSpan.textContent = liveSpan.dataset.lead! + full;
    liveSpan.className = 'doc-inserted is-correction'; // promote live text to committed
    liveSpan = null;
  } else {
    writeIntoMail(full, true);
  }

  const clean = full.replace(/^[\u201C"'\s]+|[\u201D"'.\s]+$/g, '');
  quoteEl.textContent = `\u201C${clean}.\u201D`;
  receiptEl.textContent = 'Learned from you \u00B7 just now';
  noteEl.textContent = 'Noted — saved as a new memory.';
  place();
  setState('noted');
  after(LEARN_HOLD_MS, reset);
}

const voice = createVoiceInput({
  onLevel: ({ level }) => dotEl.style.setProperty('--level', level.toFixed(3)),
});

function beginListening(): void {
  clearTimers();
  clearGhost();
  pendingInsert = '';
  typedBuffer = '';
  if (liveSpan) {
    liveSpan.remove();
    liveSpan = null;
  }
  msgField.value = '';
  noteEl.textContent = '';
  pressedAt = performance.now();
  heardWords = 0;
  heardEl.textContent = '';
  quoteEl.textContent = '';
  receiptEl.textContent = '';
  place();
  setState('listening');
  void voice.start();

  const words = SCRIPT[scriptIndex]!.asked.split(' ');
  const reveal = (): void => {
    if (state !== 'listening' || heardWords >= words.length) return;
    heardWords += 1;
    heardEl.textContent = words.slice(0, heardWords).join(' ');
    after(230 + Math.random() * 120, reveal);
  };
  after(350, reveal);
}

function endListening(): void {
  voice.stop();
  if (state !== 'listening') return;

  if (performance.now() - pressedAt < 500 || heardWords < 2) {
    dismiss();
    return;
  }

  const entry = SCRIPT[scriptIndex]!;
  scriptIndex = (scriptIndex + 1) % SCRIPT.length;
  heardEl.textContent = entry.asked + '?';
  setState('thinking');

  const answer = entry.segmentId && snapshot ? resolveAnswer(snapshot, entry.segmentId) : undefined;
  after(answer ? 850 : 400, () => {
    if (!answer) {
      heardEl.textContent = 'Nothing about that.';
      setState('missed');
      after(1800, dismiss);
      return;
    }
    pendingInsert = formatInsert(answer.line);
    showGhost(pendingInsert);
    quoteEl.textContent = `\u201C${answer.line}\u201D`;
    receiptEl.textContent = answer.receipt;
    noteEl.textContent = '';
    place();
    setState('answered');
    after(ANSWER_HOLD_MS, reset);
  });
}

function accept(): void {
  if (state !== 'answered' || !pendingInsert) return;
  clearTimers();
  const text = pendingInsert;
  pendingInsert = '';
  clearGhost(); // must clear before/with write — leftover ghost was the insert bug
  if (activeApp === 'messages') {
    msgField.value = text;
    msgField.placeholder = 'iMessage';
  } else {
    writeIntoMail(text);
  }
  place();
  setState('idle');
}

const isPrintable = (event: KeyboardEvent): boolean =>
  event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;

msgSend.addEventListener('click', () => {
  if (state === 'answered') accept();
  else if (state === 'typing' && typedBuffer.trim()) dismiss(); // learn + send
  else if (msgField.value.trim()) sendMessage(msgField.value.trim());
});

msgField.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' && state === 'answered') {
    event.preventDefault();
    accept();
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    if (state === 'answered') accept();
    else if (state === 'typing' && typedBuffer.trim()) dismiss();
    else if (msgField.value.trim()) sendMessage(msgField.value.trim());
    return;
  }
  if (event.key === 'Backspace') {
    if (state === 'typing') {
      event.preventDefault();
      backspace();
    }
    return; // otherwise let the input delete its own value natively
  }
  if (isPrintable(event)) {
    event.preventDefault();
    typeChar();
  }
});

const unbind = pushToTalk({
  onPress: beginListening,
  onRelease: endListening,
});

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && state !== 'idle' && state !== 'listening') {
    event.preventDefault();
    reset(); // Esc always cancels — zero trace
    return;
  }

  if (document.activeElement === msgField) return; // Messages handler owns it

  if (event.key === 'Tab' && state === 'answered') {
    event.preventDefault();
    accept();
    return;
  }
  if (event.key === 'Enter' && state === 'answered') {
    event.preventDefault();
    accept();
    return;
  }
  if (event.key === 'Backspace') {
    event.preventDefault();
    backspace();
    return;
  }
  // Canned typing works in Mail whether or not a recall is showing.
  if (
    isPrintable(event) &&
    (state === 'idle' || state === 'answered' || state === 'typing' || state === 'noted')
  ) {
    event.preventDefault();
    typeChar();
  }
}

window.addEventListener('keydown', onKeydown);
window.addEventListener('resize', place);
setFront('mail');

import.meta.hot?.dispose(() => {
  clearTimers();
  unbind();
  voice.destroy();
  stage.destroy();
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', place);
});
