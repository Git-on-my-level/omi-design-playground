import { OmiMock, omiScenarioNames, type OmiScenarioName } from '../../reference/hackathon-pack/src';
import type { Conversation } from '../../reference/hackathon-pack/src/types';
import { createVoiceInput, pushToTalk } from '../_voice';
import { CONV_QUESTIONS, answerAboutConversation, type ConvAnswer } from './converse';
import {
  GOALS,
  FIXTURE_NOW,
  accountSubtotal,
  assertLedgerInvariants,
  balanceOf,
  buildEntries,
  entriesFor,
  listRewindFrames,
  type AccountKey,
  type LedgerEntry,
  type RewindFrame,
  type Shot,
} from './entries';
import { HEARD_LINES, SUGGESTIONS, parseUtterance, type Utterance } from './counter';
import './style.css';

const DEFAULT_SCENARIO: OmiScenarioName = 'power-user';

const requested = new URLSearchParams(window.location.search).get('scenario');
const scenario: OmiScenarioName =
  omiScenarioNames.find((name) => name === requested) ?? DEFAULT_SCENARIO;

const omi = new OmiMock({ scenario, latencyMs: 40, processingMs: 900 });

const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('#root is missing from index.html');

const settledLocal = new Map<string, boolean>();
let selected: AccountKey | null = null;
let expandedId: string | null = null;
let entries: LedgerEntry[] = [];
let conversations: Conversation[] = [];
const peopleNames = new Map<string, string>();
let view: 'book' | 'rewind' | 'conversations' = 'book';
let openFrameId: string | null = null;

// Conversation page
let openConvId: string | null = null;
let openSegId: string | null = null;
let convThread: Array<{ q: string; a: ConvAnswer; streaming?: boolean }> = [];

type Draft = Extract<Utterance, { kind: 'post' }> & { raw: string; shot?: Shot | null };
let counterText = '';
let draft: Draft | null = null;
let omiLine: string | null = null;
let omiThinking = false;
let omiTimer: number | undefined;
let streamTimer: number | undefined;
let listening = false;
let postedSeq = 0;

// Canned typing: the counter ignores the actual keys pressed and reveals a
// scripted line one character at a time, so a live demo types cleanly no
// matter what keys are hit. ponytail: demo affordance, not a real editor.
let cannedIndex = 0;
let cannedPos = 0;

function isSettled(entry: LedgerEntry): boolean {
  return settledLocal.has(entry.id) ? settledLocal.get(entry.id)! : entry.settled;
}

function currentEntries(): LedgerEntry[] {
  const list = entries.map((e) => ({ ...e, settled: isSettled(e) }));
  list.sort((a, b) => b.ageDays - a.ageDays || a.date.getTime() - b.date.getTime());
  return list;
}

function agePhrase(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function isSelected(key: AccountKey): boolean {
  return selected?.kind === key.kind && selected.id === key.id;
}

function personName(id: string | null): string | null {
  if (!id) return null;
  return entries.find((e) => e.personId === id)?.personName ?? null;
}

function goalName(id: string | null): string | null {
  if (!id) return null;
  return GOALS.find((g) => g.id === id)?.name ?? null;
}

/* ---------------------------------------------------------------------- *
 * Rail
 * ---------------------------------------------------------------------- */

interface RailAccount {
  key: AccountKey;
  name: string;
  owe: number;
  owed: number;
  openCount: number;
}

function railAccounts(all: LedgerEntry[], kind: AccountKey['kind']): RailAccount[] {
  const seen = new Map<string, RailAccount>();
  for (const e of all) {
    const id = kind === 'person' ? e.personId : e.goalId;
    const name = kind === 'person' ? e.personName : e.goalName;
    if (!id || !name) continue;
    let acc = seen.get(id);
    if (!acc) {
      acc = { key: { kind, id }, name, owe: 0, owed: 0, openCount: 0 };
      seen.set(id, acc);
    }
    if (!e.settled) {
      acc.openCount += 1;
      if (e.side === 'debit') acc.owe += 1;
      else acc.owed += 1;
    }
  }
  const list = [...seen.values()];
  if (kind === 'goal') {
    // keep the authored goal order
    list.sort((a, b) => GOALS.findIndex((g) => g.id === a.key.id) - GOALS.findIndex((g) => g.id === b.key.id));
  } else {
    list.sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name));
  }
  return list;
}

function accountLine(acc: RailAccount): string {
  const parts: string[] = [];
  if (acc.owe) parts.push(`you owe ${acc.owe}`);
  if (acc.owed) parts.push(`owed ${acc.owed}`);
  if (!parts.length) parts.push('settled');
  return parts.join(' · ');
}

function railRow(acc: RailAccount): string {
  return `
    <li>
      <button
        type="button"
        class="account${view === 'book' && isSelected(acc.key) ? ' is-selected' : ''}"
        data-action="select"
        data-kind="${acc.key.kind}"
        data-id="${acc.key.id}"
      >
        <span class="account-name">${acc.name}</span>
        <span class="account-line${acc.openCount ? '' : ' is-clear'}">${accountLine(acc)}</span>
      </button>
    </li>`;
}

function frameHtml(frame: RewindFrame): string {
  const open = openFrameId === frame.id;
  const conv = frame.entryId ? entries.find((e) => e.id === frame.entryId)?.conversationId ?? null : null;
  return `
    <li class="frame${open ? ' is-open' : ''}${frame.entryId ? ' is-task' : ' is-ambient'}" data-frame="${frame.id}">
      <div class="frame-time" aria-hidden="true">
        <span class="frame-node"></span>
        <span class="frame-at">${frame.shot.at}</span>
      </div>
      <button type="button" class="frame-hit" data-action="view-frame" data-id="${frame.id}" aria-expanded="${open}">
        ${shotCard(frame.shot)}
        <span class="frame-note">
          ${
            frame.entryId
              ? `<span class="frame-badge">Added to the book</span><span class="frame-commit">${frame.commitment}${frame.personName ? ` · ${frame.personName}` : ''}</span>`
              : `<span class="frame-commit is-ambient">Seen on screen — nothing to track</span>`
          }
        </span>
      </button>
      ${
        open && frame.entryId
          ? `<div class="frame-actions">
              <button type="button" class="link-btn" data-action="open-entry" data-id="${frame.entryId}">Open in the book →</button>
              ${conv ? `<button type="button" class="link-btn" data-action="open-conv" data-conv="${conv}" data-seg="">View conversation →</button>` : ''}
            </div>`
          : ''
      }
    </li>`;
}

function rewindFrames(all: LedgerEntry[]): RewindFrame[] {
  const frames = listRewindFrames(all);
  if (draft?.shot) {
    frames.unshift({
      id: 'incoming-draft',
      entryId: null,
      commitment: draft.commitment,
      personName: personName(draft.personId),
      date: FIXTURE_NOW,
      dateLabel: 'Jul 20',
      shot: draft.shot,
    });
  }
  return frames;
}

/** Calendar-day distance from the fixture clock, so grouping reads Today / Yesterday. */
function dayLabel(d: Date): string {
  const startOf = (x: Date) => Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  const days = Math.round((startOf(FIXTURE_NOW) - startOf(d)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function rewindHtml(all: LedgerEntry[]): string {
  const frames = rewindFrames(all);
  const tasks = frames.filter((f) => f.entryId).length;
  const groups: Array<{ label: string; frames: RewindFrame[] }> = [];
  for (const f of frames) {
    const label = dayLabel(f.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.frames.push(f);
    else groups.push({ label, frames: [f] });
  }
  return `
    <main class="pane rewind-pane">
      <header class="pane-head">
        <h2 class="pane-title">Rewind</h2>
        <p class="pane-summary">${frames.length} captures · ${tasks} became to-dos</p>
      </header>
      <div class="timeline">
        ${groups
          .map(
            (g) => `
          <section class="tl-day">
            <h3 class="tl-day-label">${g.label}</h3>
            <ol class="frame-list">${g.frames.map(frameHtml).join('')}</ol>
          </section>`,
          )
          .join('')}
      </div>
    </main>`;
}

const ICON_REWIND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 6 5 12l6 6"/><path d="M20 6l-6 6 6 6"/></svg>`;
const ICON_CONV = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>`;

function sidebarHtml(all: LedgerEntry[]): string {
  const bal = balanceOf(all);
  const frames = rewindFrames(all);
  return `
    <nav class="rail" aria-label="Omi">
      <header class="rail-head">
        <h1 class="wordmark">Omi</h1>
        <p class="keeper">Riley Park</p>
      </header>
      <div class="rail-scroll">
        <div class="sources" role="group" aria-label="Memory">
          <button
            type="button"
            class="source${view === 'rewind' ? ' is-active' : ''}"
            data-action="open-rewind"
          >
            <span class="source-icon">${ICON_REWIND}</span>
            <span class="source-body">
              <span class="source-name">Rewind</span>
              <span class="source-count">${frames.length} captures</span>
            </span>
          </button>
          <button
            type="button"
            class="source${view === 'conversations' ? ' is-active' : ''}"
            data-action="open-conversations"
          >
            <span class="source-icon">${ICON_CONV}</span>
            <span class="source-body">
              <span class="source-name">Conversations</span>
              <span class="source-count">${conversations.length} recorded</span>
            </span>
          </button>
        </div>
        <h2 class="rail-label">The book</h2>
        <ul class="account-list">
          <li>
            <button
              type="button"
              class="account account-all${view === 'book' && selected === null ? ' is-selected' : ''}"
              data-action="select"
              data-kind=""
              data-id=""
            >
              <span class="account-name">Everything open</span>
              <span class="account-line">you owe ${bal.owe} · owed ${bal.owed}</span>
            </button>
          </li>
        </ul>
        <h2 class="rail-label">Goals</h2>
        <ul class="account-list">
          ${railAccounts(all, 'goal').map(railRow).join('')}
        </ul>
        <h2 class="rail-label">People</h2>
        <ul class="account-list">
          ${railAccounts(all, 'person').map(railRow).join('')}
        </ul>
      </div>
      <footer class="rail-foot">
        <p class="watching"><span class="watch-dot" aria-hidden="true"></span>Watching screen</p>
        <p class="rail-date">20 July 2026</p>
      </footer>
    </nav>`;
}

/* ---------------------------------------------------------------------- *
 * Entries pane
 * ---------------------------------------------------------------------- */

function shotAppKey(app: string): string {
  return app.toLowerCase().replace(/\s+/g, '-');
}

function shotInitial(context: string): string {
  const name = context.split(/[·•|]/).pop()?.trim() ?? context;
  return (name.split(/\s+/)[0]?.[0] ?? '?').toUpperCase();
}

/** Mock app window — reads as a screenshot, not a text card. */
function shotStage(shot: Shot): string {
  const app = shotAppKey(shot.app);
  const body = shot.lines.map((l) => `<p>${l}</p>`).join('');
  if (app === 'slack') {
    return `
      <div class="shot-stage shot-slack">
        <aside class="shot-side" aria-hidden="true">
          <i></i><i></i><i class="on"></i><i></i>
        </aside>
        <div class="shot-panel">
          <p class="shot-channel">${shot.context}</p>
          <div class="shot-bubble">
            <span class="shot-avatar" aria-hidden="true">${shotInitial(shot.context)}</span>
            <div class="shot-msg">
              <p class="shot-who">${shot.context.split('·').pop()?.trim() ?? shot.context}<time>${shot.at}</time></p>
              ${body}
            </div>
          </div>
        </div>
      </div>`;
  }
  if (app === 'mail') {
    return `
      <div class="shot-stage shot-mail">
        <p class="shot-mail-meta"><span>From</span> ${shot.context}</p>
        <p class="shot-mail-meta"><span>Subject</span> ${shot.context.includes('Re:') ? shot.context.split('·').pop()?.trim() : 'Follow-up'}</p>
        <div class="shot-mail-body">${body}</div>
        <p class="shot-mail-at">${shot.at}</p>
      </div>`;
  }
  if (app === 'calendar') {
    return `
      <div class="shot-stage shot-cal">
        <div class="shot-cal-card">
          <p class="shot-cal-when">${shot.at}</p>
          <p class="shot-cal-title">${shot.context}</p>
          ${body}
        </div>
      </div>`;
  }
  return `
    <div class="shot-stage shot-notes">
      <p class="shot-notes-title">${shot.context}</p>
      <div class="shot-notes-body">${body}</div>
      <p class="shot-notes-at">${shot.at}</p>
    </div>`;
}

function shotCard(shot: Shot, opts?: { frameId?: string }): string {
  const interactive = Boolean(opts?.frameId);
  const cls = `shot shot-${shotAppKey(shot.app)}${interactive ? ' is-link' : ''}`;
  const open = interactive
    ? ` type="button" data-action="open-rewind-frame" data-id="${opts!.frameId}" aria-label="View in Rewind"`
    : '';
  const tag = interactive ? 'button' : 'figure';
  return `
    <${tag} class="${cls}"${open}>
      <div class="shot-chrome" aria-hidden="true">
        <span class="shot-dots"><i></i><i></i><i></i></span>
        <span class="shot-chrome-app">${shot.app}</span>
        <span class="shot-chrome-at">${shot.at}</span>
      </div>
      ${shotStage(shot)}
    </${tag}>`;
}

function tagButtons(entry: LedgerEntry): string {
  const tags: string[] = [];
  if (entry.shot) {
    tags.push(`<span class="tag tag-screen">${entry.shot.app}</span>`);
  }
  if (entry.personName && selected?.id !== entry.personId) {
    tags.push(
      `<button type="button" class="tag" data-action="select" data-kind="person" data-id="${entry.personId}">${entry.personName}</button>`,
    );
  }
  if (entry.goalName && selected?.id !== entry.goalId) {
    tags.push(
      `<button type="button" class="tag tag-goal" data-action="select" data-kind="goal" data-id="${entry.goalId}">${entry.goalName}</button>`,
    );
  }
  return tags.join('');
}

function sideLabel(entry: LedgerEntry): string {
  if (entry.side === 'credit') return 'owes you';
  return entry.personId ? 'you owe' : 'owed to goal';
}

function entryHtml(entry: LedgerEntry): string {
  const expanded = expandedId === entry.id;
  return `
    <li class="entry${entry.settled ? ' is-settled' : ''}${expanded ? ' is-expanded' : ''}" data-id="${entry.id}">
      <div class="entry-row" data-action="expand" data-id="${entry.id}" role="button" tabindex="0"
        aria-expanded="${expanded}">
        <button
          type="button"
          class="tick${entry.settled ? ' is-done' : ''}"
          data-action="settle"
          data-id="${entry.id}"
          aria-label="${entry.settled ? 'Reopen' : 'Done'}"
          aria-pressed="${entry.settled}"
        ></button>
        <span class="entry-main">
          <span class="entry-text">${entry.commitment}</span>
          <span class="entry-tags">${tagButtons(entry)}</span>
        </span>
        <span class="entry-side side-${entry.side}">${sideLabel(entry)}</span>
        <span class="entry-when">${entry.dateLabel} · ${agePhrase(entry.ageDays)}</span>
      </div>
      ${
        expanded
          ? `<div class="entry-detail">
              ${entry.shot ? shotCard(entry.shot, { frameId: entry.id }) : ''}
              ${entry.receipt ? `<blockquote class="receipt"><p>${entry.receipt}</p></blockquote>` : ''}
              <div class="detail-actions">
                <button type="button" class="settle-btn" data-action="settle" data-id="${entry.id}">
                  ${entry.settled ? 'Reopen' : 'Done'}
                </button>
                ${
                  entry.conversationId
                    ? `<button type="button" class="link-btn" data-action="open-conv" data-conv="${entry.conversationId}" data-seg="${entry.receiptSegmentId ?? ''}">View conversation →</button>`
                    : ''
                }
                ${
                  entry.shot
                    ? `<button type="button" class="link-btn" data-action="open-rewind-frame" data-id="${entry.id}">View in Rewind →</button>`
                    : ''
                }
              </div>
            </div>`
          : ''
      }
    </li>`;
}

function paneHtml(all: LedgerEntry[]): string {
  const shown = selected ? entriesFor(all, selected) : all;
  const open = shown.filter((e) => !e.settled);
  const settled = shown.filter((e) => e.settled);

  let title = 'Everything open';
  let summary: string;
  if (selected) {
    const sample = shown[0];
    title =
      (selected.kind === 'person' ? sample?.personName : sample?.goalName) ??
      GOALS.find((g) => g.id === selected!.id)?.name ??
      '';
    const sub = accountSubtotal(all, selected);
    const bits: string[] = [];
    if (selected.kind === 'person') {
      if (sub.owe) bits.push(`you owe ${title} ${sub.owe}`);
      if (sub.owed) bits.push(`${title} owes you ${sub.owed}`);
    } else {
      if (sub.owe) bits.push(`${sub.owe} owed to this goal`);
      if (sub.owed) bits.push(`${sub.owed} promised by others`);
    }
    if (!bits.length) bits.push('nothing outstanding');
    if (sub.oldest != null) bits.push(`oldest ${agePhrase(sub.oldest)}`);
    summary = bits.join(' · ');
  } else {
    const bal = balanceOf(all);
    summary = `you owe ${bal.owe} · you are owed ${bal.owed}`;
  }

  return `
    <section class="pane" aria-label="${title}">
      <header class="pane-head">
        <h2>${title}</h2>
        <p class="pane-summary">${summary}</p>
      </header>
      ${
        open.length
          ? `<ol class="entry-list" aria-label="Open entries">${open.map(entryHtml).join('')}</ol>`
          : `<p class="empty-note">Nothing outstanding.</p>`
      }
      ${
        settled.length
          ? `<h3 class="settled-label">Settled</h3>
             <ol class="entry-list is-settled-list">${settled.map(entryHtml).join('')}</ol>`
          : ''
      }
    </section>`;
}

/* ---------------------------------------------------------------------- *
 * The counter
 * ---------------------------------------------------------------------- */

function draftHtml(d: Draft): string {
  const person = personName(d.personId);
  const goal = goalName(d.goalId);
  return `
    <div class="slip${d.shot ? ' slip-screen' : ''}" role="status">
      ${d.shot ? `<p class="slip-source">Omi caught this on screen</p>${shotCard(d.shot, { frameId: 'incoming-draft' })}` : ''}
      <p class="slip-text">${d.commitment}</p>
      <p class="slip-meta">
        <span class="side side-${d.side}">${d.side === 'debit' ? (person ? 'you owe' : 'owed to goal') : 'owes you'}</span>
        ${person ? `<span class="tag">${person}</span>` : ''}
        ${goal ? `<span class="tag tag-goal">${goal}</span>` : ''}
      </p>
      <p class="slip-actions">
        <button type="button" class="settle-btn" data-action="post">Add to list</button>
        <button type="button" class="discard-btn" data-action="discard">Discard</button>
      </p>
    </div>`;
}

function suggestionsHtml(): string {
  const items = SUGGESTIONS.map(
    (s) => `<li><button type="button" class="suggestion" data-action="suggest" data-text="${s.replace(/"/g, '&quot;')}">${s}</button></li>`,
  ).join('');
  return `<ul class="suggestions" role="listbox" aria-label="Suggestions">${items}</ul>`;
}

function counterHtml(): string {
  const reply =
    omiThinking && !draft
      ? `<p class="omi-reply is-thinking" role="status"><span class="omi-dots" aria-hidden="true"><i></i><i></i><i></i></span></p>`
      : omiLine && !draft
        ? `<p class="omi-reply" role="status">${omiLine}</p>`
        : '';
  return `
    <footer class="counter${listening ? ' is-listening' : ''}">
      ${draft ? draftHtml(draft) : ''}
      ${reply}
      ${draft || omiThinking || omiLine ? '' : suggestionsHtml()}
      <form class="counter-form" data-action="counter">
        <input
          class="counter-input"
          type="text"
          value="${counterText.replace(/"/g, '&quot;')}"
          placeholder="Tell Omi what you owe, or ask where you stand"
          aria-label="Tell Omi what you owe, or ask where you stand"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="counter-hint">hold right ⌘ to speak</span>
      </form>
      <div class="counter-ink" aria-hidden="true"><span class="counter-ink-fill"></span></div>
    </footer>`;
}

function stopStream(): void {
  if (streamTimer !== undefined) {
    window.clearTimeout(streamTimer);
    streamTimer = undefined;
  }
}

function setOmiLine(text: string | null): void {
  stopStream();
  omiThinking = false;
  omiLine = text;
  if (omiTimer) window.clearTimeout(omiTimer);
  if (text) {
    omiTimer = window.setTimeout(() => {
      omiLine = null;
      render();
    }, 6000);
  }
}

/** Think, then stream words — demo pacing, not a model. */
function streamOmiReply(text: string): void {
  stopStream();
  if (omiTimer) window.clearTimeout(omiTimer);
  omiThinking = true;
  omiLine = null;
  render();

  streamTimer = window.setTimeout(() => {
    omiThinking = false;
    const words = text.split(/(\s+)/).filter(Boolean);
    let i = 0;
    const tick = () => {
      i += 1;
      omiLine = words.slice(0, i).join('');
      const el = root!.querySelector<HTMLElement>('.omi-reply');
      if (el && !el.classList.contains('is-thinking')) el.textContent = omiLine;
      else render();
      if (i >= words.length) {
        streamTimer = undefined;
        omiTimer = window.setTimeout(() => {
          omiLine = null;
          render();
        }, 6000);
        return;
      }
      streamTimer = window.setTimeout(tick, 36);
    };
    render();
    tick();
  }, 720);
}

function answerInquiry(key: AccountKey | null): string {
  const all = currentEntries();
  if (!key) {
    const bal = balanceOf(all);
    const oldest = all.filter((e) => !e.settled).map((e) => e.ageDays);
    const oldestBit = oldest.length ? ` Oldest open line, ${agePhrase(Math.max(...oldest))}.` : '';
    return `You owe ${bal.owe}, you are owed ${bal.owed}.${oldestBit}`;
  }
  const sub = accountSubtotal(all, key);
  const name =
    key.kind === 'person'
      ? personName(key.id) ?? 'this account'
      : goalName(key.id) ?? 'this goal';
  const bits: string[] = [];
  if (key.kind === 'person') {
    if (sub.owe) bits.push(`you owe ${name} ${sub.owe}`);
    if (sub.owed) bits.push(`${name} owes you ${sub.owed}`);
  } else {
    if (sub.owe) bits.push(`${sub.owe} owed to ${name}`);
    if (sub.owed) bits.push(`${sub.owed} promised by others`);
  }
  if (!bits.length) return `Nothing outstanding with ${name}.`;
  const oldestBit = sub.oldest != null ? `; oldest ${agePhrase(sub.oldest)}` : '';
  const line = bits.join(', ') + oldestBit + '.';
  return line.charAt(0).toUpperCase() + line.slice(1);
}

function counterPeople(): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const e of entries) {
    if (e.personId && e.personName) seen.set(e.personId, e.personName);
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
}

function submitUtterance(raw: string): void {
  const parsed = parseUtterance(raw, counterPeople(), GOALS);
  counterText = '';

  if (parsed.kind === 'post') {
    draft = { ...parsed, raw };
    setOmiLine(null);
    render();
  } else if (parsed.kind === 'inquiry') {
    draft = null;
    selected = parsed.key;
    view = 'book';
    expandedId = null;
    streamOmiReply(answerInquiry(parsed.key));
  } else {
    draft = null;
    streamOmiReply('Name an account — a person or a goal — and Omi can add it.');
  }
}

function postDraft(): void {
  if (!draft) return;
  const d = draft;
  const id = `posted-${++postedSeq}`;
  entries.push({
    id,
    date: FIXTURE_NOW,
    dateLabel: 'Jul 20',
    personId: d.personId,
    personName: personName(d.personId),
    goalId: d.goalId,
    goalName: goalName(d.goalId),
    commitment: d.commitment,
    ageDays: 0,
    side: d.side,
    settled: false,
    receipt: d.shot ? null : `Riley Park: “${d.raw.trim()}”`,
    shot: d.shot ?? null,
    conversationId: null,
    receiptSegmentId: null,
  });
  settledLocal.set(id, false);
  const account = personName(d.personId) ?? goalName(d.goalId) ?? 'the book';
  draft = null;
  streamOmiReply(`Added to ${account}.`);
}

/* ---------------------------------------------------------------------- *
 * Conversations page
 * ---------------------------------------------------------------------- */

function convById(id: string | null): Conversation | undefined {
  return id ? conversations.find((c) => c.id === id) : undefined;
}

function convPeopleLabel(conv: Conversation): string {
  const names = conv.people
    .map((pid) => peopleNames.get(pid))
    .filter((n): n is string => Boolean(n) && n !== 'Riley Park')
    .map((n) => n.split(' ')[0]!);
  if (!names.length) return 'Solo note';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

function convDateLabel(conv: Conversation): string {
  const d = new Date(conv.startedAt);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()} · ${time}`;
}

function segTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

function turnHtml(seg: Conversation['segments'][number]): string {
  const isReceipt = seg.id === openSegId;
  const last = convThread[convThread.length - 1];
  const isCited = Boolean(last && !last.streaming && last.a.citeSegmentId === seg.id);
  const mine = seg.speaker === 'Riley Park';
  return `
    <li class="turn${mine ? ' turn-mine' : ''}${isReceipt ? ' is-receipt' : ''}${isCited ? ' is-cited' : ''}" data-seg="${seg.id}">
      <p class="turn-head"><span class="turn-speaker">${mine ? 'You' : seg.speaker}</span><span class="turn-time">${segTime(seg.startedAt)}</span></p>
      <p class="turn-text">${seg.text}</p>
    </li>`;
}

function threadHtml(): string {
  if (!convThread.length) {
    return `
      <div class="ask-suggest">
        ${CONV_QUESTIONS.map((q) => `<button type="button" class="ask-chip" data-action="ask-q" data-q="${q.replace(/"/g, '&quot;')}">${q}</button>`).join('')}
      </div>`;
  }
  return `
    <ol class="ask-thread">
      ${convThread
        .map(
          (t) => `
        <li class="ask-turn">
          <p class="ask-q">${t.q}</p>
          <p class="ask-a${t.streaming && !t.a.text ? ' is-thinking' : ''}">${
            t.streaming && !t.a.text
              ? `<span class="omi-dots" aria-hidden="true"><i></i><i></i><i></i></span>`
              : t.a.text
          }</p>
        </li>`,
        )
        .join('')}
    </ol>`;
}

function trackedCount(convId: string): number {
  return entries.filter((e) => e.conversationId === convId).length;
}

function convListHtml(): string {
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
  return `
    <main class="pane conv-pane">
      <header class="pane-head">
        <h2 class="pane-title">Conversations</h2>
        <p class="pane-summary">${sorted.length} recorded</p>
      </header>
      <ol class="conv-list">
        ${sorted
          .map((c) => {
            const tracked = trackedCount(c.id);
            return `
          <li>
            <button type="button" class="conv-row" data-action="open-conv" data-conv="${c.id}" data-seg="">
              <span class="conv-row-head">
                <span class="conv-row-title">${c.title}</span>
                ${tracked ? `<span class="conv-tracked">${tracked} on the book</span>` : ''}
              </span>
              <span class="conv-row-meta">${convDateLabel(c)} · ${convPeopleLabel(c)}</span>
              <span class="conv-row-sum">${c.summary}</span>
            </button>
          </li>`;
          })
          .join('')}
      </ol>
    </main>`;
}

function convDetailHtml(conv: Conversation): string {
  return `
    <main class="pane conv-pane conv-detail">
      <header class="pane-head conv-detail-head">
        <button type="button" class="link-btn conv-back" data-action="close-reader">← All conversations</button>
        <h2 class="pane-title">${conv.title}</h2>
        <p class="pane-summary">${convDateLabel(conv)} · ${convPeopleLabel(conv)}</p>
      </header>
      <div class="conv-detail-body">
        <section class="reader-block">
          <h3 class="reader-label">Summary</h3>
          <p class="reader-summary">${conv.summary}</p>
        </section>
        <section class="reader-block">
          <h3 class="reader-label">Transcript</h3>
          <ol class="turns">${conv.segments.map(turnHtml).join('')}</ol>
        </section>
        <section class="reader-block reader-asked">
          <h3 class="reader-label">Ask</h3>
          ${threadHtml()}
        </section>
      </div>
      <footer class="reader-ask">
        <form class="ask-form" data-action="ask-conv">
          <input
            class="ask-input"
            type="text"
            placeholder="Ask about this conversation"
            aria-label="Ask about this conversation"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit" class="ask-send" aria-label="Ask">Ask</button>
        </form>
      </footer>
    </main>`;
}

function conversationsHtml(): string {
  const conv = convById(openConvId);
  return conv ? convDetailHtml(conv) : convListHtml();
}

function openConversation(convId: string, segId: string | null): void {
  view = 'conversations';
  openConvId = convId;
  openSegId = segId;
  convThread = [];
  selected = null;
  expandedId = null;
  openFrameId = null;
  render();
  const target = root!.querySelector<HTMLElement>('.turn.is-receipt');
  target?.scrollIntoView({ block: 'center' });
}

function askConversation(question: string): void {
  const conv = convById(openConvId);
  if (!conv) return;
  const q = question.trim();
  if (!q) return;
  stopStream();
  const answer = answerAboutConversation(conv, q);
  convThread.push({ q, a: { text: '', citeSegmentId: answer.citeSegmentId }, streaming: true });
  openSegId = null;
  render();

  streamTimer = window.setTimeout(() => {
    const words = answer.text.split(/(\s+)/).filter(Boolean);
    let i = 0;
    const tick = () => {
      i += 1;
      const partial = words.slice(0, i).join('');
      const last = convThread[convThread.length - 1];
      if (last) last.a = { text: partial, citeSegmentId: answer.citeSegmentId };
      const el = root!.querySelector<HTMLElement>('.ask-thread .ask-turn:last-child .ask-a');
      if (el) {
        el.classList.remove('is-thinking');
        el.textContent = partial;
      } else render();
      if (i >= words.length) {
        if (last) last.streaming = false;
        streamTimer = undefined;
        render();
        root!.querySelector<HTMLElement>('.turn.is-cited')?.scrollIntoView({ block: 'center' });
        return;
      }
      streamTimer = window.setTimeout(tick, 36);
    };
    tick();
  }, 680);
}

/* ---------------------------------------------------------------------- *
 * Voice — level in, ink out
 * ---------------------------------------------------------------------- */

const voice = createVoiceInput({
  onLevel: ({ level }) => {
    const fill = root.querySelector<HTMLElement>('.counter-ink-fill');
    if (fill) fill.style.transform = `scaleX(${Math.max(0.02, level)})`;
  },
});

let heardIndex = 0;
let pendingHeard: string | null = null;
let transcribeTimer: number | undefined;

/**
 * Transcription does not exist in the pack, so while the key is held Omi
 * "types out" the scripted line word by word into the counter — the demo
 * reads as live dictation. Time-based interval, deterministic under fast-forward.
 */
function streamTranscript(heard: string): void {
  const words = heard.split(' ');
  let i = 0;
  const write = () => {
    i += 1;
    const el = root!.querySelector<HTMLInputElement>('.counter-input');
    if (el) el.value = words.slice(0, i).join(' ');
    if (i >= words.length && transcribeTimer) {
      window.clearInterval(transcribeTimer);
      transcribeTimer = undefined;
    }
  };
  write();
  transcribeTimer = window.setInterval(write, 220);
}

const unbindPtt = pushToTalk({
  onPress: () => {
    listening = true;
    counterText = '';
    const heard = HEARD_LINES[heardIndex % HEARD_LINES.length]!;
    heardIndex += 1;
    pendingHeard = heard;
    render();
    streamTranscript(heard);
    void voice.start();
  },
  onRelease: () => {
    voice.stop();
    listening = false;
    if (transcribeTimer) {
      window.clearInterval(transcribeTimer);
      transcribeTimer = undefined;
    }
    const heard = pendingHeard ?? HEARD_LINES[0]!;
    pendingHeard = null;
    submitUtterance(heard);
  },
});

/* ---------------------------------------------------------------------- *
 * Render + events
 * ---------------------------------------------------------------------- */

function mainPane(all: LedgerEntry[]): string {
  if (view === 'rewind') return rewindHtml(all);
  if (view === 'conversations') return conversationsHtml();
  return paneHtml(all);
}

function render(): void {
  const all = currentEntries();
  root!.innerHTML = `
    <div class="grain" aria-hidden="true"></div>
    <div class="app">
      ${sidebarHtml(all)}
      <div class="main-col">
        ${mainPane(all)}
        ${counterHtml()}
      </div>
    </div>`;
}

async function settle(id: string): Promise<void> {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  const next = !isSettled(entry);
  settledLocal.set(id, next);

  const row = root!.querySelector<HTMLElement>(`.entry[data-id="${id}"]`);
  if (row && next) {
    row.classList.add('is-settling');
    await new Promise((r) => setTimeout(r, 320));
  }
  expandedId = null;
  render();
}

function handleAction(t: HTMLElement): void {
  const select = t.closest<HTMLElement>('[data-action="select"]');
  if (select) {
    const kind = select.dataset.kind as AccountKey['kind'] | '';
    const id = select.dataset.id || '';
    const next: AccountKey | null = kind && id ? { kind, id } : null;
    selected = next && selected && view === 'book' && isSelected(next) ? null : next;
    view = 'book';
    openFrameId = null;
    openConvId = null;
    openSegId = null;
    convThread = [];
    expandedId = null;
    render();
    return;
  }

  if (t.closest('[data-action="open-rewind"]')) {
    view = 'rewind';
    selected = null;
    expandedId = null;
    openFrameId = null;
    openConvId = null;
    render();
    return;
  }

  if (t.closest('[data-action="open-conversations"]')) {
    view = 'conversations';
    selected = null;
    expandedId = null;
    openFrameId = null;
    openConvId = null;
    openSegId = null;
    convThread = [];
    render();
    return;
  }

  const openRewindFrame = t.closest<HTMLElement>('[data-action="open-rewind-frame"]');
  if (openRewindFrame) {
    view = 'rewind';
    openFrameId = openRewindFrame.dataset.id!;
    selected = null;
    expandedId = null;
    openConvId = null;
    render();
    root!.querySelector<HTMLElement>(`.frame.is-open`)?.scrollIntoView({ block: 'nearest' });
    return;
  }

  const viewFrame = t.closest<HTMLElement>('[data-action="view-frame"]');
  if (viewFrame) {
    const id = viewFrame.dataset.id!;
    openFrameId = openFrameId === id ? null : id;
    render();
    return;
  }

  const openEntry = t.closest<HTMLElement>('[data-action="open-entry"]');
  if (openEntry) {
    view = 'book';
    selected = null;
    expandedId = openEntry.dataset.id!;
    openFrameId = null;
    openConvId = null;
    render();
    root!.querySelector<HTMLElement>(`.entry[data-id="${expandedId}"]`)?.scrollIntoView({ block: 'center' });
    return;
  }

  const openConv = t.closest<HTMLElement>('[data-action="open-conv"]');
  if (openConv) {
    openConversation(openConv.dataset.conv!, openConv.dataset.seg || null);
    return;
  }

  if (t.closest('[data-action="close-reader"]')) {
    openConvId = null;
    openSegId = null;
    convThread = [];
    view = 'conversations';
    render();
    return;
  }

  const askQ = t.closest<HTMLElement>('[data-action="ask-q"]');
  if (askQ) {
    askConversation(askQ.dataset.q ?? '');
    return;
  }

  const suggest = t.closest<HTMLElement>('[data-action="suggest"]');
  if (suggest) {
    submitUtterance(suggest.dataset.text ?? '');
    return;
  }

  if (t.closest('[data-action="post"]')) {
    postDraft();
    return;
  }

  if (t.closest('[data-action="discard"]')) {
    draft = null;
    render();
    return;
  }

  const settleBtn = t.closest<HTMLElement>('[data-action="settle"]');
  if (settleBtn) {
    void settle(settleBtn.dataset.id!);
    return;
  }

  const expand = t.closest<HTMLElement>('[data-action="expand"]');
  if (expand) {
    const id = expand.dataset.id!;
    expandedId = expandedId === id ? null : id;
    render();
  }
}

root!.addEventListener('click', (event) => handleAction(event.target as HTMLElement));

// Keys that should pass through the canned typer untouched (focus/navigation).
const PASSTHROUGH_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
]);

function handleCannedKey(event: KeyboardEvent, input: HTMLInputElement): void {
  if (PASSTHROUGH_KEYS.has(event.key)) return;
  event.preventDefault();

  const line = SUGGESTIONS[cannedIndex % SUGGESTIONS.length]!;

  if (event.key === 'Enter') {
    cannedIndex += 1;
    cannedPos = 0;
    submitUtterance(line);
    return;
  }

  cannedPos =
    event.key === 'Backspace'
      ? Math.max(0, cannedPos - 1)
      : Math.min(line.length, cannedPos + 1);

  const value = line.slice(0, cannedPos);
  input.value = value;
  input.setSelectionRange(value.length, value.length);
  applyCounterValue(value);
}

root!.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  const input = target.closest<HTMLInputElement>('.counter-input');
  if (input) {
    handleCannedKey(event, input);
    return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (target.closest('button, input, a, textarea')) return;
  const row = target.closest<HTMLElement>('[data-action="expand"]');
  if (!row) return;
  event.preventDefault();
  handleAction(row);
});

/** Set the counter value and re-filter suggestions in place — a full render would drop focus. */
function applyCounterValue(value: string): void {
  counterText = value;
  const box = root!.querySelector<HTMLElement>('.suggestions');
  if (!box) return;
  const q = value.trim().toLowerCase();
  let visible = 0;
  box.querySelectorAll<HTMLElement>('.suggestion').forEach((el) => {
    const match = !q || (el.dataset.text ?? '').toLowerCase().includes(q);
    (el.parentElement as HTMLElement).hidden = !match;
    if (match) visible += 1;
  });
  box.hidden = visible === 0;
}

root!.addEventListener('input', (event) => {
  const input = (event.target as HTMLElement).closest<HTMLInputElement>('.counter-input');
  if (input) applyCounterValue(input.value);
});

root!.addEventListener('submit', (event) => {
  const askForm = (event.target as HTMLElement).closest<HTMLFormElement>('[data-action="ask-conv"]');
  if (askForm) {
    event.preventDefault();
    const input = askForm.querySelector<HTMLInputElement>('.ask-input');
    askConversation(input?.value ?? '');
    return;
  }
  const form = (event.target as HTMLElement).closest<HTMLFormElement>('[data-action="counter"]');
  if (!form) return;
  event.preventDefault();
  const raw = counterText.trim();
  if (raw) submitUtterance(raw);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (openConvId) {
    openConvId = null;
    openSegId = null;
    convThread = [];
    view = 'conversations';
    render();
    return;
  }
  if (openFrameId) {
    openFrameId = null;
    render();
  }
});

/**
 * The passive loop: Omi is watching, and after a beat it catches a fresh
 * obligation on screen and drops a draft at the counter to confirm.
 */
let incomingTimer: number | undefined;
function scheduleIncomingCapture(): void {
  incomingTimer = window.setTimeout(() => {
    if (draft) return;
    draft = {
      kind: 'post',
      commitment: 'Send the revised export scope before the sync',
      personId: 'person-taylor',
      goalId: 'goal-pilot',
      side: 'debit',
      raw: 'Send the revised export scope before the sync',
      shot: {
        app: 'Mail',
        context: 'Taylor Reed · Re: pilot scope',
        lines: ['Can you send the revised export scope by Thursday? Want it locked before the sync.'],
        at: '3:12 PM',
      },
    };
    setOmiLine(null);
    render();
  }, 4200);
}

async function refresh(): Promise<void> {
  await document.fonts.ready.catch(() => undefined);
  const snapshot = await omi.getSnapshot();
  entries = buildEntries(snapshot);
  conversations = snapshot.conversations;
  for (const p of snapshot.people) peopleNames.set(p.id, p.name);
  assertLedgerInvariants(entries);
  render();
  scheduleIncomingCapture();
}

void refresh();

import.meta.hot?.dispose(() => {
  voice.destroy();
  unbindPtt();
  stopStream();
  if (omiTimer) window.clearTimeout(omiTimer);
  if (incomingTimer) window.clearTimeout(incomingTimer);
  if (transcribeTimer) window.clearInterval(transcribeTimer);
});
