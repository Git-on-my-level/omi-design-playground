import { OmiMock, omiScenarioCatalog, omiScenarioNames, type OmiScenarioName } from '../../reference/hackathon-pack/src';
import type { Conversation, Memory, OmiSnapshot, SuggestedAction } from '../../reference/hackathon-pack/src/types';
import './style.css';

const params = new URLSearchParams(window.location.search);
const requested = params.get('scenario');
const initialScenario: OmiScenarioName =
  omiScenarioNames.find((name) => name === requested) ?? 'default';

let omi = new OmiMock({ scenario: initialScenario, latencyMs: 80, processingMs: 900 });
let selectedConversationId: string | undefined;
let peopleById = new Map<string, string>();

const $ = <T extends Element>(selector: string) => {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
};

const scenarioSelect = $<HTMLSelectElement>('#scenario');
const deviceEl = $<HTMLElement>('#device');
const captureStatus = $<HTMLElement>('#capture-status');
const captureButton = $<HTMLButtonElement>('#capture-button');
const liveTranscript = $<HTMLOListElement>('#live-transcript');
const liveEmpty = $<HTMLElement>('#live-empty');
const conversationList = $<HTMLUListElement>('#conversation-list');
const conversationDetail = $<HTMLElement>('#conversation-detail');
const threadEmpty = $<HTMLElement>('#thread-empty');
const threadCount = $<HTMLElement>('#thread-count');
const convTitle = $<HTMLElement>('#conv-title');
const convMeta = $<HTMLElement>('#conv-meta');
const convSummary = $<HTMLElement>('#conv-summary');
const convSegments = $<HTMLOListElement>('#conv-segments');
const actionList = $<HTMLUListElement>('#action-list');
const memoryList = $<HTMLUListElement>('#memory-list');
const askForm = $<HTMLFormElement>('#ask-form');
const askInput = $<HTMLInputElement>('#ask-input');
const askReply = $<HTMLOutputElement>('#ask-reply');

const when = (iso?: string) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
};

const personName = (id: string) => peopleById.get(id) ?? id;

function bindMock(): void {
  omi.on('capture.changed', () => void render());
  omi.on('conversation.updated', () => void render());
  omi.on('action.changed', () => void render());
  omi.on('device.changed', () => void render());
  omi.on('memory.created', () => void render());
}

function renderDevice(snapshot: OmiSnapshot): void {
  deviceEl.dataset.connection = snapshot.device.connection;
  deviceEl.innerHTML = `<span class="dot" aria-hidden="true"></span><span>${snapshot.device.name} · ${snapshot.device.connection} · ${snapshot.device.batteryPercent}%</span>`;
}

function renderCapture(snapshot: OmiSnapshot): void {
  const { capture } = snapshot;
  captureStatus.textContent = capture.status;
  captureButton.dataset.state = capture.status;
  captureButton.textContent =
    capture.status === 'capturing' ? 'Stop listening' : capture.status === 'processing' ? 'Processing…' : 'Start listening';
  captureButton.disabled = capture.status === 'processing';

  liveTranscript.replaceChildren(
    ...capture.liveTranscript.map((segment) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="speaker">${segment.speaker}</span><p class="text"></p>`;
      li.querySelector('.text')!.textContent = segment.text;
      return li;
    }),
  );
  liveEmpty.hidden = capture.liveTranscript.length > 0;
}

function renderConversations(conversations: Conversation[]): void {
  threadCount.textContent = `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`;
  threadEmpty.hidden = conversations.length > 0;
  conversationDetail.hidden = conversations.length === 0;

  if (!conversations.length) {
    conversationList.replaceChildren();
    return;
  }

  if (!selectedConversationId || !conversations.some((item) => item.id === selectedConversationId)) {
    selectedConversationId = conversations[0].id;
  }

  conversationList.replaceChildren(
    ...conversations.map((conversation) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = conversation.id === selectedConversationId ? 'is-selected' : '';
      button.innerHTML = `<strong></strong><span></span>`;
      button.querySelector('strong')!.textContent = conversation.title;
      button.querySelector('span')!.textContent = `${when(conversation.updatedAt)} · ${conversation.source}`;
      button.addEventListener('click', () => {
        selectedConversationId = conversation.id;
        void render();
      });
      li.append(button);
      return li;
    }),
  );

  const selected = conversations.find((item) => item.id === selectedConversationId);
  if (!selected) return;

  convTitle.textContent = selected.title;
  convMeta.textContent = `${when(selected.startedAt)} · ${selected.source} · ${selected.people.map(personName).join(', ')}`;
  convSummary.textContent = selected.summary;
  convSegments.replaceChildren(
    ...selected.segments.map((segment) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="speaker">${segment.speaker}</span><p class="text"></p>`;
      li.querySelector('.text')!.textContent = segment.text;
      return li;
    }),
  );
}

function renderActions(actions: SuggestedAction[]): void {
  const ordered = [...actions].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  actionList.replaceChildren(
    ...ordered.map((action) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = action.status === 'done' ? 'is-done' : '';
      button.innerHTML = `<span class="mark" aria-hidden="true"></span><span><strong></strong><span></span></span>`;
      button.querySelector('strong')!.textContent = action.title;
      button.querySelector('span span')!.textContent = action.dueAt ? `Due ${when(action.dueAt)}` : 'No due date';
      button.addEventListener('click', async () => {
        await omi.toggleAction(action.id);
        await render();
      });
      li.append(button);
      return li;
    }),
  );
}

function renderMemories(memories: Memory[]): void {
  memoryList.replaceChildren(
    ...memories.slice(0, 5).map((memory) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="kind"></span><p class="text"></p>`;
      li.querySelector('.kind')!.textContent = memory.kind;
      li.querySelector('.text')!.textContent = memory.text;
      return li;
    }),
  );
}

async function render(): Promise<void> {
  const [snapshot, conversations, memories, actions] = await Promise.all([
    omi.getSnapshot(),
    omi.listConversations(),
    omi.listMemories(),
    omi.listActions(),
  ]);

  peopleById = new Map(snapshot.people.map((person) => [person.id, person.name]));
  renderDevice(snapshot);
  renderCapture(snapshot);
  renderConversations(conversations);
  renderActions(actions);
  renderMemories(memories);
}

scenarioSelect.replaceChildren(
  ...omiScenarioCatalog.map((scenario) => {
    const option = document.createElement('option');
    option.value = scenario.id;
    option.textContent = scenario.label;
    return option;
  }),
);
scenarioSelect.value = initialScenario;

scenarioSelect.addEventListener('change', () => {
  const scenario = scenarioSelect.value as OmiScenarioName;
  const url = new URL(window.location.href);
  url.searchParams.set('scenario', scenario);
  window.history.replaceState({}, '', url);
  omi = new OmiMock({ scenario, latencyMs: 80, processingMs: 900 });
  selectedConversationId = undefined;
  askReply.textContent = '';
  bindMock();
  void render();
});

captureButton.addEventListener('click', async () => {
  const snapshot = await omi.getSnapshot();
  if (snapshot.capture.status === 'capturing') {
    const conversation = await omi.stopCapture();
    selectedConversationId = conversation.id;
  } else if (snapshot.capture.status === 'idle') {
    await omi.startCapture('macos');
    const me = snapshot.me.name;
    await omi.appendLiveTranscript(me, 'Keep the review small enough to finish today.');
    await omi.appendLiveTranscript('Sam Rivera', 'Lead with the decision, then one open question.');
    await omi.appendLiveTranscript(me, 'And leave the rest as notes instead of new work.');
  }
  await render();
});

askForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  askReply.textContent = 'Thinking…';
  const reply = await omi.askAssistant(askInput.value.trim() || 'What should I revisit?');
  askReply.textContent = reply.text;
});

bindMock();
void render();
