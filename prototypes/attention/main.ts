import { OmiMock, omiScenarioNames, type OmiScenarioName } from '../../reference/hackathon-pack/src';
import type { Conversation, Memory } from '../../reference/hackathon-pack/src/types';
import { rankAttention, type AttentionItem } from './rank';
import './style.css';

/** Fixture clock aligned to the synthetic power-user day. */
const FIXTURE_NOW = new Date('2026-07-20T16:40:00.000Z');

const params = new URLSearchParams(window.location.search);
const initialScenario: OmiScenarioName =
  omiScenarioNames.find((name) => name === params.get('scenario')) ?? 'power-user';

const omi = new OmiMock({ scenario: initialScenario, latencyMs: 60, now: () => FIXTURE_NOW });
let conversations: Conversation[] = [];
let memories: Memory[] = [];
let primary: AttentionItem | null = null;
let queue: AttentionItem[] = [];
const skippedIds = new Set<string>();

const $ = <T extends Element>(selector: string) => {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
};

const clockEl = $<HTMLElement>('#clock');
const deviceEl = $<HTMLElement>('#device');
const stage = $<HTMLElement>('#stage');
const eyebrow = $<HTMLElement>('#eyebrow');
const primaryTitle = $<HTMLElement>('#primary-title');
const primaryMeta = $<HTMLElement>('#primary-meta');
const primaryReason = $<HTMLElement>('#primary-reason');
const primaryActions = $<HTMLElement>('#primary-actions');
const doneButton = $<HTMLButtonElement>('#done-button');
const nextButton = $<HTMLButtonElement>('#next-button');
const context = $<HTMLElement>('#context');
const contextSummary = $<HTMLElement>('#context-summary');
const contextMemories = $<HTMLUListElement>('#context-memories');
const queueList = $<HTMLOListElement>('#queue-list');
const queueCount = $<HTMLElement>('#queue-count');
const queueEmpty = $<HTMLElement>('#queue-empty');

const fmtDue = (iso?: string) => {
  if (!iso) return 'No due time';
  const due = new Date(iso);
  const sameDay = due.toDateString() === FIXTURE_NOW.toDateString();
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(due);
  if (sameDay) return `Due today · ${time}`;
  if (due.getTime() < FIXTURE_NOW.getTime()) return `Overdue · ${time}`;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(due);
};

const urgencyLabel = (item: AttentionItem) => {
  if (item.kind === 'device') return 'Needs your attention';
  if (item.kind === 'capture') return 'Happening now';
  if (item.urgency === 'now') return 'Needs your attention';
  if (item.urgency === 'soon') return 'Up next';
  return 'Waiting on you';
};

function visibleItems(all: AttentionItem[]): AttentionItem[] {
  return all.filter((item) => !skippedIds.has(item.id));
}

function renderPrimary(item: AttentionItem | null): void {
  stage.classList.remove('is-updating');
  void stage.offsetWidth;
  stage.classList.add('is-updating');

  if (!item) {
    stage.dataset.urgency = '';
    eyebrow.textContent = 'You are clear';
    primaryTitle.textContent = 'Nothing needs you right now';
    primaryMeta.textContent = '';
    primaryReason.textContent = 'omi will surface the next follow-up when something is due.';
    primaryActions.hidden = true;
    context.hidden = true;
    return;
  }

  stage.dataset.urgency = item.urgency;
  eyebrow.textContent = urgencyLabel(item);
  primaryTitle.textContent = item.title;
  primaryMeta.textContent = item.kind === 'action' ? fmtDue(item.dueAt) : '';
  primaryReason.textContent = item.reason;

  const canComplete = item.kind === 'action' && Boolean(item.actionId);
  doneButton.hidden = !canComplete;
  doneButton.textContent = 'Mark done';
  nextButton.hidden = queue.length === 0;
  nextButton.textContent = 'Skip to next';
  primaryActions.hidden = doneButton.hidden && nextButton.hidden;

  const conversation = item.conversationId
    ? conversations.find((entry) => entry.id === item.conversationId)
    : undefined;
  const related = (item.memoryIds ?? [])
    .map((id) => memories.find((memory) => memory.id === id))
    .filter((memory): memory is Memory => Boolean(memory));

  if (conversation || related.length) {
    context.hidden = false;
    contextSummary.textContent = conversation?.summary ?? '';
    contextSummary.hidden = !conversation;
    contextMemories.replaceChildren(
      ...related.map((memory) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="kind"></span><p class="text"></p>`;
        li.querySelector('.kind')!.textContent = memory.kind;
        li.querySelector('.text')!.textContent = memory.text;
        return li;
      }),
    );
  } else {
    context.hidden = true;
  }
}

function renderQueue(items: AttentionItem[]): void {
  queueCount.textContent = items.length ? `${items.length}` : '';
  queueEmpty.hidden = items.length > 0;
  queueList.replaceChildren(
    ...items.map((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="idx"></span><p class="title"></p><p class="due"></p>`;
      li.querySelector('.idx')!.textContent = String(index + 2);
      li.querySelector('.title')!.textContent = item.title;
      const due = li.querySelector('.due') as HTMLElement;
      due.textContent = item.kind === 'action' ? fmtDue(item.dueAt) : item.reason;
      due.dataset.urgency = item.urgency;
      return li;
    }),
  );
}

async function refresh(): Promise<void> {
  const [snapshot, nextConversations, nextMemories, actions] = await Promise.all([
    omi.getSnapshot(),
    omi.listConversations(),
    omi.listMemories(),
    omi.listActions(),
  ]);

  conversations = nextConversations;
  memories = nextMemories;

  clockEl.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(FIXTURE_NOW);

  const processingNote =
    snapshot.capture.status === 'processing' ? ' · capture processing' : '';
  deviceEl.dataset.connection = snapshot.device.connection;
  deviceEl.replaceChildren();
  const dot = document.createElement('span');
  dot.className = 'device-dot';
  dot.setAttribute('aria-hidden', 'true');
  deviceEl.append(
    dot,
    `${snapshot.device.name} · ${snapshot.device.connection} · ${snapshot.device.batteryPercent}%${processingNote}`,
  );

  const ranked = rankAttention({
    snapshot,
    conversations,
    memories,
    actions,
    now: FIXTURE_NOW,
  });

  const items = visibleItems([...(ranked.primary ? [ranked.primary] : []), ...ranked.queue]);
  primary = items[0] ?? null;
  queue = items.slice(1);
  renderPrimary(primary);
  renderQueue(queue);
}

doneButton.addEventListener('click', async () => {
  if (!primary?.actionId) return;
  doneButton.disabled = true;
  await omi.toggleAction(primary.actionId);
  doneButton.disabled = false;
  await refresh();
});

nextButton.addEventListener('click', async () => {
  if (primary) skippedIds.add(primary.id);
  await refresh();
});

void refresh();
