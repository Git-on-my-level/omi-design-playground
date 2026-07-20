import { OmiMock, omiScenarioNames } from '../../src';
import './style.css';

const requestedScenario = new URLSearchParams(window.location.search).get('scenario');
const scenario = omiScenarioNames.find((name) => name === requestedScenario) ?? 'default';
const omi = new OmiMock({ scenario });
let platform: 'macos' | 'ios' = 'macos';

const query = <T extends Element>(selector: string) => {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
};

const title = query<HTMLElement>('#title');
const scenarioState = query<HTMLElement>('#scenario-state');
const deviceState = query<HTMLElement>('#device-state');
const conversationTitle = query<HTMLElement>('#conversation-title');
const conversationSummary = query<HTMLElement>('#conversation-summary');
const memoryKind = query<HTMLElement>('#memory-kind');
const memoryText = query<HTMLElement>('#memory-text');
const captureState = query<HTMLElement>('#capture-state');
const captureDetail = query<HTMLElement>('#capture-detail');
const captureButton = query<HTMLButtonElement>('#capture-button');
const promptButton = query<HTMLButtonElement>('#prompt-button');
const response = query<HTMLElement>('#response');

async function render(): Promise<void> {
  const [snapshot, conversations, memories] = await Promise.all([
    omi.getSnapshot(),
    omi.listConversations(),
    omi.listMemories(),
  ]);
  const conversation = conversations[0];
  const memory = memories[0];
  title.textContent = platform === 'macos' ? 'A starting desktop data surface' : 'A starting mobile data surface';
  scenarioState.textContent = `Synthetic scenario: ${scenario}`;
  deviceState.textContent = `${snapshot.device.connection} · ${snapshot.device.batteryPercent}%`;
  conversationTitle.textContent = conversation?.title ?? 'No conversation yet';
  conversationSummary.textContent = conversation?.summary ?? 'Start a capture to create one.';
  memoryKind.textContent = memory?.kind ?? 'No memory yet';
  memoryText.textContent = memory?.text ?? 'This space is yours to reinvent.';
  captureState.textContent = snapshot.capture.status;
  captureDetail.textContent = snapshot.capture.liveTranscript.length
    ? `${snapshot.capture.liveTranscript.length} live segment(s) in the local capture.`
    : 'The buttons below mutate only in-memory mock state.';
  captureButton.textContent = snapshot.capture.status === 'capturing' ? 'Stop mock capture' : 'Start a mock capture';
}

captureButton.addEventListener('click', async () => {
  const snapshot = await omi.getSnapshot();
  if (snapshot.capture.status === 'capturing') {
    await omi.stopCapture();
  } else {
    await omi.startCapture(platform);
    await omi.appendLiveTranscript('Alex Morgan', 'A UI prototype can turn this moment into almost anything.');
  }
  await render();
});

promptButton.addEventListener('click', async () => {
  const reply = await omi.askAssistant('What should I revisit?');
  response.textContent = reply.text;
});

document.querySelectorAll<HTMLButtonElement>('[data-platform]').forEach((button) => {
  button.addEventListener('click', async () => {
    platform = button.dataset.platform === 'ios' ? 'ios' : 'macos';
    document.querySelectorAll('[data-platform]').forEach((item) => item.classList.toggle('is-selected', item === button));
    await render();
  });
});

omi.on('device.changed', render);
omi.on('capture.changed', render);
void render();
