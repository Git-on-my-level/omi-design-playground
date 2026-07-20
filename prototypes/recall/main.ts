/**
 * Recall — remembering shouldn't be a place you go.
 *
 * Hold right ⌘ in Mail or Messages, ask out loud, release. Ghost text at the
 * caret (Tab or Enter to insert), source card beside the window. Type instead
 * in the app — Omi notes the correction as a new memory. Esc dismisses.
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

/** Typed corrections are canned — keys only trigger the beat, they don't spell. */
const CORRECTIONS: Record<AppId, string> = {
  mail: 'the decision and the reason have to travel together — not a dump of notes.',
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
  <p class="recall-actions"><kbd>⇥</kbd> / <kbd>↵</kbd> insert<span class="recall-esc">type to correct · <kbd>esc</kbd></span></p>
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
  if (state !== 'idle') dismiss();

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

type State = 'idle' | 'listening' | 'thinking' | 'answered' | 'missed' | 'noted';

let state: State = 'idle';
let scriptIndex = 0;
let heardWords = 0;
let pressedAt = 0;
let pendingInsert = '';
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

function dismiss(): void {
  clearTimers();
  clearGhost();
  pendingInsert = '';
  noteEl.textContent = '';
  if (activeApp === 'messages' && !msgField.value) msgField.placeholder = 'iMessage';
  setState('idle');
}

/** Text shaped for the active app — quoted prose in Mail, plain in Messages. */
function formatInsert(line: string): string {
  if (activeApp === 'messages') return line;
  return `\u201C${line.charAt(0).toLowerCase()}${line.slice(1)}\u201D`;
}

function writeIntoMail(text: string, asCorrection = false): void {
  const inserted = document.createElement('span');
  inserted.className = asCorrection ? 'doc-inserted is-correction' : 'doc-inserted';
  inserted.textContent = text;
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

const voice = createVoiceInput({
  onLevel: ({ level }) => dotEl.style.setProperty('--level', level.toFixed(3)),
});

function beginListening(): void {
  clearTimers();
  clearGhost();
  pendingInsert = '';
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
    after(14000, dismiss);
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

/** Type-over path: canned line lands in the app; card notes the learn. */
function correct(): void {
  if (state !== 'answered') return;
  clearTimers();
  const raw = CORRECTIONS[activeApp];
  const text = formatInsert(raw);
  pendingInsert = '';
  clearGhost();

  if (activeApp === 'messages') sendMessage(raw);
  else writeIntoMail(text, true);

  quoteEl.textContent = `\u201C${raw}\u201D`;
  receiptEl.textContent = 'Learned from you · just now';
  noteEl.textContent = 'Noted — saved as a new memory.';
  place();
  setState('noted');
  after(2800, dismiss);
}

msgSend.addEventListener('click', () => {
  if (state === 'answered') {
    accept();
    return;
  }
  const text = msgField.value.trim();
  if (text) sendMessage(text);
});

msgField.addEventListener('keydown', (event) => {
  if (state === 'answered') {
    if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault();
      accept();
      return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      correct();
    }
    return;
  }
  if (event.key === 'Enter' && msgField.value.trim()) {
    event.preventDefault();
    sendMessage(msgField.value.trim());
  }
});

const unbind = pushToTalk({
  onPress: beginListening,
  onRelease: endListening,
});

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && state !== 'idle' && state !== 'listening') {
    event.preventDefault();
    dismiss();
    return;
  }

  if (state !== 'answered') return;
  if (document.activeElement === msgField) return; // Messages handler owns it

  if (event.key === 'Tab' || event.key === 'Enter') {
    event.preventDefault();
    accept();
    return;
  }
  if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    correct();
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
