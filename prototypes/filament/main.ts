/**
 * filament — the whole app is 22 pixels tall.
 *
 * A menu-bar glyph that carries idle / listening / presence / thinking / holding,
 * plus one press-and-hold to mark a moment, and one sentence in a popover.
 */
import { OmiMock, omiScenarioNames, type OmiScenarioName } from '../../reference/hackathon-pack/src';
import type { OmiSnapshot, SuggestedAction } from '../../reference/hackathon-pack/src/types';
import { mountMacStage } from '../_macos-stage';
import './style.css';

const HOLD_MS = 600;

const requested = new URLSearchParams(window.location.search).get('scenario');
const scenario: OmiScenarioName =
  omiScenarioNames.find((name) => name === requested) ?? 'recording';

/** Pin near the live capture so "last heard" reads as present, not archival. */
const FIXTURE_NOW = new Date(
  scenario === 'recording' ? '2026-07-20T15:11:00.000Z' : '2026-07-20T18:16:00.000Z',
);

const omi = new OmiMock({ scenario, latencyMs: 80, processingMs: 900 });

const mount = document.querySelector<HTMLElement>('#root');
if (!mount) throw new Error('#root is missing from index.html');

const stage = mountMacStage(mount, {
  appName: 'Finder',
  menus: ['File', 'Edit', 'View', 'Go', 'Window', 'Help'],
  now: () => FIXTURE_NOW,
});

/* ---- DOM --------------------------------------------------------------- */

const item = document.createElement('button');
item.type = 'button';
item.className = 'fil-item';
item.setAttribute('aria-label', 'omi');
item.setAttribute('aria-expanded', 'false');
item.innerHTML = `
  <span class="fil-glyph" aria-hidden="true">
    <span class="fil-dot"></span>
    <span class="fil-stroke"></span>
    <span class="fil-stroke-peer"></span>
  </span>
  <svg class="fil-ring" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="9"></circle>
  </svg>
`;
stage.statusSlot.prepend(item);

const popover = document.createElement('div');
popover.className = 'fil-popover';
popover.setAttribute('role', 'dialog');
popover.setAttribute('aria-label', 'omi');
popover.innerHTML = `
  <div class="fil-popover-inner">
    <p class="fil-label">Last heard</p>
    <p class="fil-summary" data-fil-summary></p>
    <p class="fil-meta" data-fil-meta></p>
    <hr class="fil-rule" />
    <p class="fil-label">Holding</p>
    <ul class="fil-held-list" data-fil-held></ul>
    <div class="fil-mark-row" data-fil-mark hidden>
      <p class="fil-mark-text">Marked</p>
      <p class="fil-mark-time" data-fil-mark-time></p>
    </div>
  </div>
`;
stage.surface.append(popover);

const elSummary = popover.querySelector<HTMLElement>('[data-fil-summary]')!;
const elMeta = popover.querySelector<HTMLElement>('[data-fil-meta]')!;
const elHeld = popover.querySelector<HTMLElement>('[data-fil-held]')!;
const elMark = popover.querySelector<HTMLElement>('[data-fil-mark]')!;
const elMarkTime = popover.querySelector<HTMLElement>('[data-fil-mark-time]')!;

/* ---- state ------------------------------------------------------------- */

let snapshot: OmiSnapshot | null = null;
let open = false;
let markedAt: Date | null = null;
let holdTimer: number | null = null;
let holdArmed = false;
let pressStarted = 0;

function oneSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/);
  return (match?.[0] ?? trimmed).trim();
}

function hasSomeoneNew(snap: OmiSnapshot): boolean {
  if (snap.capture.status === 'capturing') {
    return snap.capture.liveTranscript.some((seg) => seg.speaker !== snap.me.name);
  }
  const others = snap.people.filter((p) => p.id !== snap.me.id);
  if (!others.length) return false;
  const freshest = Math.max(
    ...others.map((p) => +new Date(p.lastSeenAt)),
    ...snap.conversations.map((c) => +new Date(c.updatedAt)),
  );
  return others.some((p) => freshest - +new Date(p.lastSeenAt) <= 10 * 60 * 1000);
}

function openActions(snap: OmiSnapshot): SuggestedAction[] {
  return snap.actions.filter((a) => a.status === 'open').slice(0, 2);
}

function formatWhen(iso: string): string {
  const then = new Date(iso);
  const mins = Math.max(0, Math.round((FIXTURE_NOW.getTime() - then.getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return then.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDue(iso?: string): string {
  if (!iso) return 'open';
  const due = new Date(iso);
  const day = due.toLocaleDateString([], { weekday: 'short' });
  const time = due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${day} ${time}`;
}

function placePopover(): void {
  const rect = item.getBoundingClientRect();
  const width = 320;
  const left = Math.min(
    Math.max(12, rect.right - width + 4),
    window.innerWidth - width - 12,
  );
  popover.style.top = `${rect.bottom + 8}px`;
  popover.style.right = 'auto';
  popover.style.left = `${left}px`;
}

function setOpen(next: boolean): void {
  open = next;
  item.setAttribute('aria-expanded', next ? 'true' : 'false');
  popover.classList.toggle('is-open', next);
  if (next) placePopover();
}

function paintGlyph(snap: OmiSnapshot): void {
  const listening = snap.capture.status === 'capturing';
  const thinking = snap.capture.status === 'processing';
  const presence = hasSomeoneNew(snap);
  const holding = openActions(snap).length > 0 || markedAt !== null;

  item.classList.toggle('is-listening', listening);
  item.classList.toggle('is-thinking', thinking);
  item.classList.toggle('is-presence', presence);
  item.classList.toggle('is-holding', holding);
}

function paintPopover(snap: OmiSnapshot): void {
  const newest = [...snap.conversations].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  )[0];

  elSummary.textContent = newest
    ? oneSentence(newest.summary)
    : 'Quiet for now.';
  elMeta.textContent = newest ? formatWhen(newest.updatedAt) : '';

  const held = openActions(snap);
  elHeld.replaceChildren(
    ...held.map((action) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <p class="fil-held-title"></p>
          <p class="fil-held-due"></p>
        </div>
      `;
      li.querySelector('.fil-held-title')!.textContent = action.title;
      li.querySelector('.fil-held-due')!.textContent = formatDue(action.dueAt);
      return li;
    }),
  );

  if (markedAt) {
    elMark.hidden = false;
    elMarkTime.textContent = formatWhen(markedAt.toISOString());
  } else {
    elMark.hidden = true;
  }
}

function render(snap: OmiSnapshot): void {
  snapshot = snap;
  paintGlyph(snap);
  paintPopover(snap);
}

/* ---- gesture: click opens; 600ms hold marks ---------------------------- */

function clearHold(): void {
  if (holdTimer !== null) {
    window.clearTimeout(holdTimer);
    holdTimer = null;
  }
  holdArmed = false;
  item.classList.remove('is-holding-press');
}

item.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  item.setPointerCapture(event.pointerId);
  pressStarted = performance.now();
  holdArmed = false;
  item.classList.add('is-holding-press');
  holdTimer = window.setTimeout(() => {
    holdArmed = true;
  }, HOLD_MS);
});

item.addEventListener('pointerup', (event) => {
  if (!item.hasPointerCapture(event.pointerId) && pressStarted === 0) return;
  const elapsed = performance.now() - pressStarted;
  const completed = holdArmed || elapsed >= HOLD_MS;
  clearHold();
  pressStarted = 0;

  if (completed) {
    markedAt = new Date(FIXTURE_NOW);
    if (snapshot) {
      paintGlyph(snapshot);
      paintPopover(snapshot);
    }
    return;
  }

  setOpen(!open);
});

item.addEventListener('pointercancel', clearHold);
item.addEventListener('lostpointercapture', () => {
  // Release without click if the press was cancelled mid-hold.
  if (pressStarted && !holdArmed) clearHold();
});

document.addEventListener('pointerdown', (event) => {
  if (!open) return;
  const target = event.target as Node;
  if (item.contains(target) || popover.contains(target)) return;
  setOpen(false);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && open) setOpen(false);
});

window.addEventListener('resize', () => {
  if (open) placePopover();
});

/* ---- mock -------------------------------------------------------------- */

async function refresh(): Promise<void> {
  render(await omi.getSnapshot());
}

const unsubscribers = [
  omi.on('capture.changed', refresh),
  omi.on('conversation.updated', refresh),
  omi.on('memory.created', refresh),
  omi.on('device.changed', refresh),
  omi.on('action.changed', refresh),
];

void refresh();

import.meta.hot?.dispose(() => {
  unsubscribers.forEach((off) => off());
  clearHold();
  stage.destroy();
});
