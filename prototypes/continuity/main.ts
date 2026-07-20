/**
 * Continuity — the app switch is the new page turn. Omi keeps your place.
 *
 * Stage Manager layout: one focused app, inactive apps as left-strip thumbs,
 * dock tiles to open/switch. Marker anchors to the focused window.
 */
import { OmiMock } from '../../reference/hackathon-pack/src';
import type { OmiSnapshot } from '../../reference/hackathon-pack/src/types';
import { mountMacStage } from '../_macos-stage';
import { createVoiceInput, pushToTalk } from '../_voice';
import './style.css';

const rootEl = document.querySelector<HTMLElement>('#root');
if (!rootEl) throw new Error('#root is missing from index.html');
const root = rootEl;

const FIXTURE_NOW = new Date('2026-07-20T18:16:00.000Z');
const omi = new OmiMock({ scenario: 'power-user', latencyMs: 0 });
const stage = mountMacStage(root, {
  appName: 'Arc',
  menus: ['File', 'Edit', 'View', 'History', 'Tabs', 'Window', 'Help'],
  widgets: false,
  files: [],
  now: () => FIXTURE_NOW,
});

type AppId = 'browser' | 'slack' | 'notes';

interface Loop {
  title: string;
  meta: string;
  when: string;
}
interface Decision {
  when: string;
  text: string;
}
interface Artifact {
  icon: string;
  title: string;
  meta: string;
}

interface Context {
  app: string;
  dock: string;
  project: string;
  phase: string;
  status: string;
  where: string;
  next?: string;
  question: string;
  answer: string;
  thumb: string;
  // Folio (the fuller workstream view inside Omi)
  hero: string;
  state: string;
  stateNext: string;
  goal?: string;
  goalDate?: string;
  loops: Loop[];
  decisions: Decision[];
  artifacts: Artifact[];
  unfiled?: boolean;
}

const CONTEXTS: Record<AppId, Context> = {
  browser: {
    app: 'Arc',
    dock: 'Arc',
    project: 'Atlas launch',
    phase: 'Positioning',
    status: 'Active now',
    where: 'You were comparing activation claims.',
    next: 'Resolve the 14-day metric before copy lock.',
    question: 'What was unresolved here?',
    answer:
      'The launch draft says activation improved in 14 days. Priya’s workshop notes use 30 days. You wanted to confirm the analytics definition before keeping the claim.',
    thumb: 'Launch draft',
    hero: 'Make returning to complex work feel immediate.',
    state:
      'The launch narrative is nearly locked. One proof point still conflicts with the workshop definition.',
    stateNext: 'Confirm whether activation is measured at 14 or 30 days.',
    goal: 'Approve positioning before Friday’s launch review.',
    goalDate: 'Fri 24 Jul',
    loops: [
      { title: 'Resolve the activation window', meta: 'Launch draft · Priya’s comment', when: 'Today' },
    ],
    decisions: [
      { when: 'Today', text: 'Lead with continuity, not memory capture.' },
      { when: 'Wed', text: 'Do not require tool migration.' },
    ],
    artifacts: [
      { icon: 'A', title: 'Launch narrative', meta: 'Arc · focused now' },
      { icon: '#', title: 'atlas-launch', meta: 'Slack · 35 min ago' },
    ],
  },
  slack: {
    app: 'Slack',
    dock: 'Slack',
    project: 'Atlas pilot',
    phase: 'Pilot decision',
    status: 'Waiting on Priya',
    where: 'Priya is waiting on the workshop decision.',
    next: 'Send the narrower pilot scope.',
    question: 'What do I owe Priya?',
    answer:
      'Send the smaller pilot scope and the decision trail. You said you would do it before tomorrow’s review.',
    thumb: '#atlas-launch',
    hero: 'Ship the pilot at the size the team can support.',
    state: 'Priya wants to close the pilot shape today. You favor the smaller cohort.',
    stateNext: 'Send the narrower scope with the decision trail.',
    goal: 'Hand Priya the scope before tomorrow’s review.',
    goalDate: 'Tue 21 Jul',
    loops: [
      { title: 'Send Priya the narrower pilot scope', meta: 'Slack · #atlas-launch', when: 'Today' },
    ],
    decisions: [
      { when: 'Fri', text: 'Keep the pilot to one product team.' },
      { when: 'Mon', text: 'Measure activation at 14 days, pending analytics.' },
    ],
    artifacts: [
      { icon: '#', title: 'atlas-launch', meta: 'Slack · active thread' },
      { icon: 'A', title: 'Launch narrative', meta: 'Arc · linked' },
    ],
  },
  notes: {
    app: 'Notes',
    dock: 'Notes',
    project: 'Context should travel',
    phase: 'Loose note',
    status: 'Unfiled',
    where: 'No workstream linked.',
    question: 'What is this note about?',
    answer:
      'It looks like an early thought about making project context portable across apps. It is not linked to a workstream yet.',
    thumb: 'Context should travel',
    hero: 'Context should travel',
    state:
      'A loose thought captured in Notes. It isn’t part of a workstream yet — Omi can start one from it.',
    stateNext: '',
    loops: [],
    decisions: [],
    artifacts: [{ icon: '✎', title: 'Context should travel', meta: 'Notes · 10:42' }],
    unfiled: true,
  },
};

const SIDEBAR_ORDER: AppId[] = ['browser', 'slack', 'notes'];

const APP_ORDER: AppId[] = ['notes', 'browser', 'slack'];
const openApps = new Set<AppId>(APP_ORDER);

const workspace = document.createElement('main');
workspace.className = 'workspace';
workspace.innerHTML = `
  <aside class="stage-strip" aria-label="Stage Manager"></aside>
  <div class="stage-frame">
    <section class="app-window notes-window" data-app="notes" aria-label="Notes window">
      <header class="window-bar" data-drag>
        <span class="traffic">
          <button type="button" data-traffic="close" aria-label="Close"></button>
          <button type="button" data-traffic="min" aria-label="Minimize"></button>
          <button type="button" data-traffic="zoom" aria-label="Zoom"></button>
        </span>
        <strong>Notes</strong>
      </header>
      <div class="notes-body">
        <p class="notes-date">20 July 2026 at 10:42</p>
        <h2>Context should travel</h2>
        <p>The project is larger than any one window.</p>
        <p>What if the handoff between apps felt like turning a page instead of starting over?</p>
        <p class="notes-caret">The smallest useful reminder is probably&thinsp;</p>
      </div>
    </section>

    <section class="app-window browser-window is-active" data-app="browser" aria-label="Arc browser window">
      <header class="browser-chrome" data-drag>
        <span class="traffic">
          <button type="button" data-traffic="close" aria-label="Close"></button>
          <button type="button" data-traffic="min" aria-label="Minimize"></button>
          <button type="button" data-traffic="zoom" aria-label="Zoom"></button>
        </span>
        <div class="browser-tabs">
          <span>Atlas narrative</span>
          <span>Activation definitions</span>
          <span class="is-current">Launch draft</span>
        </div>
        <span class="browser-more">•••</span>
      </header>
      <div class="browser-address"><span>↶</span><span>↷</span><p>notion.so/atlas/launch-narrative</p></div>
      <div class="doc-shell">
        <aside class="doc-nav">
          <p class="doc-team">Northstar</p>
          <p>Search</p><p>Home</p><p>Inbox <b>3</b></p>
          <hr>
          <p class="is-selected">Atlas launch</p><p>Website refresh</p><p>Research</p>
        </aside>
        <article class="launch-doc">
          <p class="doc-path">Atlas / Launch narrative</p>
          <h1>A calmer way back into your work</h1>
          <p class="doc-lead">Atlas keeps the thread of a project intact as work moves between tools.</p>
          <h3>Proof point</h3>
          <p>Teams reached a useful working model within <mark>14 days</mark>, without migrating their existing tools.</p>
          <blockquote>“The value is not remembering everything. It is knowing exactly where to resume.”</blockquote>
          <div class="doc-comment"><span>PS</span><p><strong>Priya Shah</strong><br>Wasn’t the workshop cohort measured at 30 days?</p></div>
        </article>
      </div>
    </section>

    <section class="app-window slack-window" data-app="slack" aria-label="Slack window">
      <header class="window-bar slack-bar" data-drag>
        <span class="traffic">
          <button type="button" data-traffic="close" aria-label="Close"></button>
          <button type="button" data-traffic="min" aria-label="Minimize"></button>
          <button type="button" data-traffic="zoom" aria-label="Zoom"></button>
        </span>
        <strong>Northstar — Slack</strong>
      </header>
      <div class="slack-shell">
        <aside class="slack-nav">
          <p class="slack-workspace">N</p>
          <span></span><span></span><span></span><span></span>
        </aside>
        <aside class="slack-channels">
          <h3>Northstar <span>⌄</span></h3>
          <p>Threads</p><p>Mentions & reactions</p><p>Drafts & sent</p>
          <h4>Channels</h4>
          <p class="is-selected"># atlas-launch</p><p># product</p><p># research</p>
        </aside>
        <article class="slack-thread">
          <header><h2># atlas-launch</h2><p>Launch decisions and pilot notes</p></header>
          <div class="message">
            <span class="avatar avatar-a">PS</span>
            <p><strong>Priya Shah <time>11:28 AM</time></strong><br>Can we close the loop on the pilot shape today? I’d still favor the smaller cohort.</p>
          </div>
          <div class="message">
            <span class="avatar avatar-b">AM</span>
            <p><strong>Alex Morgan <time>11:41 AM</time></strong><br>Yes. I’ll send the narrower scope with the decision trail before tomorrow’s review.</p>
          </div>
          <div class="slack-composer">Message #atlas-launch <span>⌘↵</span></div>
        </article>
      </div>
    </section>
  </div>
`;
stage.surface.append(workspace);

const strip = workspace.querySelector<HTMLElement>('.stage-strip')!;

const marker = document.createElement('aside');
marker.className = 'continuity-marker';
marker.setAttribute('aria-live', 'polite');
marker.innerHTML = `
  <button class="marker-main" type="button" aria-label="Open current workstream in Omi">
    <span class="marker-meta"></span>
    <strong class="marker-project"></strong>
    <span class="marker-where"></span>
    <span class="marker-next"></span>
  </button>
  <div class="marker-answer" hidden>
    <p class="marker-q"></p>
    <p class="marker-a"></p>
    <button class="marker-open" type="button">Open in omi<span aria-hidden="true">↗</span></button>
  </div>
  <button class="marker-ptt" type="button" aria-label="Hold Command to ask Omi about this screen">
    <span class="marker-cue"><kbd>⌘</kbd><span class="cue-label">Hold to ask</span></span>
    <span class="marker-heard"></span>
  </button>
`;
stage.surface.append(marker);

const omiWindow = document.createElement('section');
omiWindow.className = 'omi-window';
omiWindow.setAttribute('role', 'dialog');
omiWindow.setAttribute('aria-label', 'Omi project view');
omiWindow.innerHTML = `
  <header class="omi-titlebar" data-drag>
    <span class="traffic">
      <button type="button" data-traffic="close" aria-label="Close"></button>
      <button type="button" data-traffic="min" aria-label="Minimize"></button>
      <button type="button" data-traffic="zoom" aria-label="Zoom"></button>
    </span>
    <strong>omi</strong>
  </header>
  <div class="omi-shell">
    <aside class="omi-sidebar">
      <div class="omi-mark">omi</div>
      <p class="omi-nav-label">Workstreams</p>
      <nav class="omi-nav" aria-label="Workstreams"></nav>
      <button class="all-context">All context</button>
    </aside>
    <article class="project-folio">
      <div class="folio-body"></div>
      <section class="ask-thread" aria-label="Conversation with Omi" hidden>
        <header class="ask-thread-head">
          <span class="ask-thread-title">omi</span>
          <button type="button" class="ask-clear">Clear</button>
        </header>
        <div class="ask-log" aria-live="polite"></div>
      </section>
      <form class="ask-composer">
        <input aria-label="Ask Omi" placeholder="Ask across this workstream" autocomplete="off">
        <span class="ask-hint">hold <kbd>⌘</kbd> to talk</span>
        <button type="submit" class="ask-send" aria-label="Send">↑</button>
      </form>
    </article>
  </div>
`;
workspace.querySelector('.stage-frame')!.append(omiWindow);

const windows = [...workspace.querySelectorAll<HTMLElement>('[data-app]')];
const stageApp = root.querySelector<HTMLElement>('.stage-app');
const stageMenus = root.querySelector('.stage-menubar-left');
const MENUS: Record<AppId, string[]> = {
  browser: ['File', 'Edit', 'View', 'History', 'Tabs', 'Window', 'Help'],
  slack: ['File', 'Edit', 'View', 'Go', 'Window', 'Help'],
  notes: ['File', 'Edit', 'Format', 'View', 'Window', 'Help'],
};
const markerProject = marker.querySelector<HTMLElement>('.marker-project')!;
const markerMeta = marker.querySelector<HTMLElement>('.marker-meta')!;
const markerWhere = marker.querySelector<HTMLElement>('.marker-where')!;
const markerNext = marker.querySelector<HTMLElement>('.marker-next')!;
const markerHeard = marker.querySelector<HTMLElement>('.marker-heard')!;
const markerPtt = marker.querySelector<HTMLElement>('.marker-ptt')!;
const answerPanel = marker.querySelector<HTMLElement>('.marker-answer')!;
const markerQ = marker.querySelector<HTMLElement>('.marker-q')!;
const markerA = marker.querySelector<HTMLElement>('.marker-a')!;
const markerOpen = marker.querySelector<HTMLButtonElement>('.marker-open')!;
const folioBody = omiWindow.querySelector<HTMLElement>('.folio-body')!;
const omiNav = omiWindow.querySelector<HTMLElement>('.omi-nav')!;
const askThread = omiWindow.querySelector<HTMLElement>('.ask-thread')!;
const askLog = omiWindow.querySelector<HTMLElement>('.ask-log')!;
const askComposer = omiWindow.querySelector<HTMLFormElement>('.ask-composer')!;
const chatInput = askComposer.querySelector<HTMLInputElement>('input')!;
const askClear = omiWindow.querySelector<HTMLButtonElement>('.ask-clear')!;

let omiView: AppId = 'browser';

let active: AppId = 'browser';
const offsets = new Map<AppId, { x: number; y: number }>();
let zoomed = false;

function windowEl(id: AppId): HTMLElement {
  return workspace.querySelector<HTMLElement>(`[data-app="${id}"]`)!;
}

function placeMarker(): void {
  if (omiWindow.classList.contains('is-open') || !openApps.has(active)) {
    marker.style.visibility = 'hidden';
    return;
  }
  const win = windowEl(active);
  const surfaceRect = stage.surface.getBoundingClientRect();
  const winRect = win.getBoundingClientRect();
  // The answered state widens to 300px (style.css); offsetWidth mid-transition
  // still reports the old width, which let the panel hang past the screen edge.
  const markerW = marker.classList.contains('is-answered') ? 300 : marker.offsetWidth || 264;
  const inset = 16;
  // Float the overlay over the focused window's top-right, below its chrome.
  const top = Math.max(40, winRect.top - surfaceRect.top + 60);
  const left = Math.min(
    surfaceRect.width - markerW - 8, // never overflow the surface, whatever the window rect says
    Math.max(8, winRect.right - surfaceRect.left - markerW - inset),
  );
  marker.style.visibility = 'visible';
  marker.style.top = `${Math.round(top)}px`;
  marker.style.left = `${Math.round(left)}px`;
  marker.style.right = 'auto';
}

/** Re-anchor after layout/transform transitions settle. */
function schedulePlaceMarker(): void {
  requestAnimationFrame(() => {
    placeMarker();
    requestAnimationFrame(placeMarker);
  });
  window.setTimeout(placeMarker, 240);
}

function setMenuApp(name: string, menus?: string[]): void {
  if (stageApp) stageApp.textContent = name;
  if (!stageMenus || !menus) return;
  stageMenus.querySelectorAll(':scope > span:not(.stage-apple):not(.stage-app)').forEach((el, index) => {
    if (menus[index]) el.textContent = menus[index]!;
    (el as HTMLElement).hidden = !menus[index];
  });
}

/* Miniature, recognizable renders per app — not generic placeholder bars. */
const THUMB_BODY: Record<AppId, string> = {
  notes: `
    <span class="tb-title tb-serif">Context should travel</span>
    <span class="tb-line" style="width:88%"></span>
    <span class="tb-line" style="width:72%"></span>
    <span class="tb-line" style="width:80%"></span>`,
  browser: `
    <span class="tb-title">A calmer way back in</span>
    <span class="tb-line" style="width:92%"></span>
    <span class="tb-line" style="width:66%"></span>
    <span class="tb-chip">14 days</span>`,
  slack: `
    <span class="tb-title"># atlas-launch</span>
    <span class="tb-msg"><i></i><span class="tb-line" style="width:74%"></span></span>
    <span class="tb-msg"><i></i><span class="tb-line" style="width:58%"></span></span>`,
};

function renderStrip(): void {
  const others = APP_ORDER.filter((id) => openApps.has(id) && id !== active);
  strip.innerHTML = others
    .map((id) => {
      const ctx = CONTEXTS[id];
      return `<button class="stage-thumb stage-thumb-${id}" type="button" data-stage="${id}" aria-label="Focus ${ctx.app}">
        <span class="stage-thumb-chrome"><i></i><i></i><i></i><em>${ctx.app}</em></span>
        <span class="stage-thumb-body">${THUMB_BODY[id]}</span>
      </button>`;
    })
    .join('');
}

function setActive(id: AppId): void {
  // App focus closes omi so dock/strip switches stay one coherent surface.
  if (omiWindow.classList.contains('is-open')) {
    omiWindow.classList.remove('is-open');
    marker.classList.remove('is-app-open');
  }
  if (!openApps.has(id)) openApps.add(id);
  active = id;
  zoomed = false;
  dismissAnswer();
  const context = CONTEXTS[id];

  windows.forEach((el) => {
    const appId = el.dataset.app as AppId;
    const isActive = appId === id;
    el.classList.toggle('is-active', isActive);
    el.classList.toggle('is-staged', openApps.has(appId) && !isActive);
    el.classList.toggle('is-closed', !openApps.has(appId));
    el.classList.toggle('is-zoomed', false);
    const offset = offsets.get(appId) ?? { x: 0, y: 0 };
    el.style.setProperty('--dx', `${offset.x}px`);
    el.style.setProperty('--dy', `${offset.y}px`);
  });

  setMenuApp(context.app, MENUS[id]);
  marker.classList.add('is-changing');
  marker.classList.toggle('is-minimal', !context.next);
  markerMeta.textContent = `${context.phase} · ${context.app}`;
  markerProject.textContent = context.project;
  markerWhere.textContent = context.where;
  markerNext.textContent = context.next ?? '';
  renderStrip();
  syncDock();
  schedulePlaceMarker();
  window.setTimeout(() => marker.classList.remove('is-changing'), 200);
}

function closeApp(id: AppId): void {
  openApps.delete(id);
  offsets.delete(id);
  if (active === id) {
    const next = APP_ORDER.find((app) => openApps.has(app));
    if (next) setActive(next);
    else {
      windows.forEach((el) => {
        el.classList.remove('is-active', 'is-staged', 'is-zoomed');
        el.classList.add('is-closed');
      });
      setMenuApp('Finder');
      renderStrip();
      syncDock();
      placeMarker();
    }
  } else {
    renderStrip();
    syncDock();
  }
}

function buildSidebar(): void {
  omiNav.innerHTML = SIDEBAR_ORDER.map((id) => {
    const c = CONTEXTS[id];
    return `<button type="button" class="ws${id === omiView ? ' is-current' : ''}" data-ws="${id}">
      <span class="ws-name">${c.project}</span>
      <span class="ws-status">${c.status}</span>
    </button>`;
  }).join('');
}

/** Paint the folio for one workstream. Unfiled notes get a teaching empty state. */
function renderFolio(id: AppId): void {
  omiView = id;
  const c = CONTEXTS[id];
  omiNav.querySelectorAll<HTMLButtonElement>('[data-ws]').forEach((b) => {
    b.classList.toggle('is-current', b.dataset.ws === id);
  });

  const head = `
    <header class="folio-head">
      <p class="folio-kicker">${c.project} · ${c.phase}</p>
      <h1>${c.hero}</h1>
      <p class="folio-status">${c.status}</p>
    </header>`;

  if (c.unfiled) {
    folioBody.innerHTML = `${head}
      <section class="folio-empty">
        <p>${c.state}</p>
        <div class="folio-empty-actions">
          <button type="button" class="folio-primary">Start a workstream</button>
          <button type="button" class="folio-ghost">Link to Atlas launch</button>
        </div>
      </section>`;
    return;
  }

  const loops = c.loops
    .map(
      (l) => `<button type="button" class="loop">
        <span class="loop-check" aria-hidden="true"></span>
        <span class="loop-copy"><strong${id === 'slack' ? ' data-fixture-action' : ''}>${l.title}</strong><small>${l.meta}</small></span>
        <em>${l.when}</em>
      </button>`,
    )
    .join('');
  const decisions = c.decisions
    .map((d) => `<li><time>${d.when}</time><span>${d.text}</span></li>`)
    .join('');
  const artifacts = c.artifacts
    .map(
      (a) => `<button type="button" class="artifact">
        <span class="artifact-icon">${a.icon}</span>
        <span class="artifact-copy"><strong>${a.title}</strong><small>${a.meta}</small></span>
      </button>`,
    )
    .join('');

  folioBody.innerHTML = `${head}
    <div class="folio-lede">
      <section class="folio-section folio-now">
        <h2>Where you are</h2>
        <p class="now-line">${c.state}</p>
        ${c.stateNext ? `<p class="now-next"><span>Next</span>${c.stateNext}</p>` : ''}
      </section>
      ${
        c.goal
          ? `<aside class="folio-goal">
        <h2>Goal</h2>
        <p>${c.goal}</p>
        <time>${c.goalDate ?? ''}</time>
      </aside>`
          : ''
      }
    </div>
    <section class="folio-section">
      <h2>Open loops</h2>
      <div class="loops">${loops || '<p class="folio-none">Nothing open.</p>'}</div>
    </section>
    <section class="folio-section">
      <h2>Decisions</h2>
      <ul class="decisions">${decisions}</ul>
    </section>
    <section class="folio-section">
      <h2>Linked context</h2>
      <div class="artifacts">${artifacts}</div>
    </section>`;
}

function clearThread(): void {
  stopStream();
  askLog.innerHTML = '';
  askThread.hidden = true;
}

/** A real conversation surface, distinct from the workstream brief. */
function ask(question: string): void {
  askThread.hidden = false;
  const you = document.createElement('div');
  you.className = 'bubble bubble-you';
  you.textContent = question;
  const reply = document.createElement('div');
  reply.className = 'bubble bubble-omi';
  reply.innerHTML = '<span class="bubble-who">omi</span><span class="bubble-text"></span>';
  askLog.append(you, reply);
  askLog.scrollTop = askLog.scrollHeight;
  thinkThenStream(reply.querySelector<HTMLElement>('.bubble-text')!, CONTEXTS[omiView].answer);
  window.setTimeout(() => {
    askLog.scrollTop = askLog.scrollHeight;
  }, 500);
}

function openOmi(asking?: string): void {
  dismissAnswer();
  renderFolio(active);
  chatInput.placeholder = `Ask across ${CONTEXTS[active].project}`;
  omiWindow.classList.add('is-open');
  marker.classList.add('is-app-open');
  setMenuApp('omi', ['File', 'Edit', 'View', 'Window', 'Help']);
  placeMarker();
  syncDock();
  if (asking) ask(asking);
  else {
    clearThread();
    window.setTimeout(() => chatInput.focus(), 240);
  }
}

function closeOmi(): void {
  if (!omiWindow.classList.contains('is-open')) return;
  omiWindow.classList.remove('is-open');
  marker.classList.remove('is-app-open');
  clearThread();
  if (openApps.has(active)) setMenuApp(CONTEXTS[active].app, MENUS[active]);
  placeMarker();
  syncDock();
}

let streamTimer: number | undefined;

function stopStream(): void {
  if (streamTimer !== undefined) window.clearTimeout(streamTimer);
  streamTimer = undefined;
}

/** Thinking beat, then word-by-word reveal — the cadence of an agent, not a dump. */
function thinkThenStream(el: HTMLElement, text: string): void {
  stopStream();
  el.innerHTML = '<span class="think-skel" aria-hidden="true"></span>';
  streamTimer = window.setTimeout(() => {
    el.textContent = '';
    const words = text.split(/(\s+)/).filter(Boolean);
    let i = 0;
    const tick = (): void => {
      if (i >= words.length) {
        streamTimer = undefined;
        return;
      }
      el.textContent = (el.textContent ?? '') + words[i];
      i += 1;
      streamTimer = window.setTimeout(tick, 30);
    };
    tick();
  }, 460);
}

/** Answer lands in the overlay; Omi only opens if the user dives deeper. */
function showAnswer(question: string, answer: string): void {
  markerQ.textContent = question;
  answerPanel.hidden = false;
  marker.classList.remove('is-minimal', 'is-listening');
  marker.classList.add('is-answered');
  thinkThenStream(markerA, answer);
  schedulePlaceMarker();
}

function dismissAnswer(): void {
  if (answerPanel.hidden) return;
  stopStream();
  answerPanel.hidden = true;
  marker.classList.remove('is-answered');
}

strip.addEventListener('click', (event) => {
  const thumb = (event.target as HTMLElement).closest<HTMLElement>('[data-stage]');
  if (!thumb?.dataset.stage) return;
  event.stopPropagation();
  closeOmi();
  setActive(thumb.dataset.stage as AppId);
});

for (const el of windows) {
  el.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('[data-traffic]')) return;
    const id = el.dataset.app as AppId;
    if (id !== active || omiWindow.classList.contains('is-open')) setActive(id);
  });

  el.querySelectorAll<HTMLButtonElement>('[data-traffic]').forEach((btn) => {
    btn.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const id = el.dataset.app as AppId;
      const action = btn.dataset.traffic;
      if (action === 'close') closeApp(id);
      else if (action === 'min') {
        const next = APP_ORDER.find((app) => openApps.has(app) && app !== id);
        if (next) setActive(next);
      } else if (action === 'zoom') {
        if (id !== active) setActive(id);
        zoomed = !zoomed;
        el.classList.toggle('is-zoomed', zoomed);
        schedulePlaceMarker();
      }
    });
  });
}

function bindDrag(host: HTMLElement, onMove: (dx: number, dy: number) => void): void {
  const bar = host.querySelector<HTMLElement>('[data-drag]');
  if (!bar) return;
  bar.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('[data-traffic]')) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const base = { x: Number.parseFloat(host.style.getPropertyValue('--dx') || '0'), y: Number.parseFloat(host.style.getPropertyValue('--dy') || '0') };
    host.classList.add('is-dragging');
    const move = (ev: PointerEvent) => {
      onMove(base.x + ev.clientX - startX, base.y + ev.clientY - startY);
    };
    const up = () => {
      host.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

for (const el of windows) {
  bindDrag(el, (x, y) => {
    const id = el.dataset.app as AppId;
    const clamped = {
      x: Math.max(-80, Math.min(120, x)),
      y: Math.max(-40, Math.min(80, y)),
    };
    offsets.set(id, clamped);
    el.style.setProperty('--dx', `${clamped.x}px`);
    el.style.setProperty('--dy', `${clamped.y}px`);
    if (id === active) placeMarker();
  });
}

bindDrag(omiWindow, (x, y) => {
  omiWindow.style.setProperty('--dx', `${Math.max(-40, Math.min(40, x))}px`);
  omiWindow.style.setProperty('--dy', `${Math.max(-30, Math.min(40, y))}px`);
});

for (const action of ['close', 'min'] as const) {
  const btn = omiWindow.querySelector<HTMLButtonElement>(`[data-traffic="${action}"]`)!;
  btn.addEventListener('pointerdown', (event) => event.stopPropagation());
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeOmi();
  });
}

// Reminder card → dive into the full workstream.
marker.querySelector<HTMLButtonElement>('.marker-main')!.addEventListener('click', () => openOmi());
// A tap on the ask capsule answers in place (no full app); hold ⌘ does the same via voice.
marker.querySelector<HTMLButtonElement>('.marker-ptt')!.addEventListener('click', () => {
  if (marker.classList.contains('is-listening')) return;
  const ctx = CONTEXTS[active];
  showAnswer(ctx.question, ctx.answer);
});
// The overlay answers by voice only; typing a follow-up means opening the full app.
markerOpen.addEventListener('click', () => openOmi(markerQ.textContent || undefined));

askComposer.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  ask(question);
  chatInput.value = '';
});

omiNav.addEventListener('click', (event) => {
  const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-ws]');
  if (!btn?.dataset.ws) return;
  const id = btn.dataset.ws as AppId;
  if (id === omiView) return;
  clearThread();
  renderFolio(id);
  chatInput.placeholder = `Ask across ${CONTEXTS[id].project}`;
});

askClear.addEventListener('click', () => {
  clearThread();
  chatInput.focus();
});

/* Dock: wire demo apps; glyphs are CSS/SVG shapes, not letter placeholders. */
const DOCK_APPS: Array<{ title: string; id?: AppId | 'omi'; glyph: string }> = [
  { title: 'Finder', glyph: '<span class="dock-glyph dock-glyph-quiet" aria-hidden="true">F</span>' },
  { title: 'Mail', glyph: '<span class="dock-glyph dock-glyph-quiet" aria-hidden="true">M</span>' },
  {
    title: 'Calendar',
    glyph: '<span class="dock-glyph dock-glyph-cal" aria-hidden="true">31</span>',
  },
  {
    title: 'Notes',
    id: 'notes',
    glyph:
      '<svg class="dock-glyph dock-glyph-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="3" width="15" height="18" rx="2.4" fill="#fffdf5" stroke="#e0b84a" stroke-width="0.6"/><path d="M8 9h8M8 12.5h8M8 16h6" stroke="#9a7410" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
  {
    title: 'Arc',
    id: 'browser',
    glyph:
      '<svg class="dock-glyph dock-glyph-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.2" fill="none" stroke="#f4f1ea" stroke-width="2.1"/><path d="M6.8 14.2c1.7-5.4 8.7-5.4 10.4 0" fill="none" stroke="#f4f1ea" stroke-width="2.1" stroke-linecap="round"/></svg>',
  },
  {
    title: 'Slack',
    id: 'slack',
    glyph:
      '<svg class="dock-glyph dock-glyph-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="9.2" y="2.8" width="2.8" height="7.2" rx="1.4" fill="#fff"/><rect x="14" y="9.2" width="7.2" height="2.8" rx="1.4" fill="#fff"/><rect x="12" y="14" width="2.8" height="7.2" rx="1.4" fill="#fff"/><rect x="2.8" y="12" width="7.2" height="2.8" rx="1.4" fill="#fff"/><rect x="9.2" y="9.2" width="2.8" height="2.8" rx="0.7" fill="#fff"/></svg>',
  },
  {
    title: 'omi',
    id: 'omi',
    glyph:
      '<span class="dock-glyph dock-glyph-omi" aria-hidden="true"><i></i><em>o</em></span>',
  },
];

const DOCK_FILLS: Record<string, string> = {
  Finder: 'linear-gradient(160deg,#4fa8e8,#1f6fc4)',
  Mail: 'linear-gradient(160deg,#6cc6f7,#2b7fd4)',
  Calendar: 'linear-gradient(180deg,#e85b4c 0 30%,#ffffff 30% 100%)',
  Notes: 'linear-gradient(160deg,#ffe27a,#f0b922)',
  Arc: 'linear-gradient(160deg,#2a2e38,#0e1014)',
  Slack: 'linear-gradient(160deg,#4a154b,#611f69)',
  omi: 'linear-gradient(160deg,#f0b060,#d98a2a)',
};

function syncDock(): void {
  const omiOpen = omiWindow.classList.contains('is-open');
  const tiles = root.querySelectorAll<HTMLElement>('.stage-dock-tile');
  tiles.forEach((tile, index) => {
    const spec = DOCK_APPS[index];
    if (!spec) return;
    if (spec.id) tile.dataset.dock = spec.id;
    else tile.removeAttribute('data-dock');
    tile.title = spec.title;
    tile.setAttribute('aria-label', spec.title);
    tile.classList.toggle('is-quiet', !spec.id);
    tile.classList.toggle('is-live', Boolean(spec.id));
    tile.style.background = DOCK_FILLS[spec.title] ?? tile.style.background;
    tile.classList.toggle('is-running', Boolean(spec.id && spec.id !== 'omi' && openApps.has(spec.id)));
    tile.classList.toggle('is-focused', spec.id === active && !omiOpen && openApps.has(active));
    tile.classList.toggle('is-omi-open', spec.id === 'omi' && omiOpen);
    if (!tile.querySelector('.dock-glyph')) tile.insertAdjacentHTML('beforeend', spec.glyph);
  });
}

root.querySelector('.stage-dock')?.addEventListener('click', (event) => {
  const tile = (event.target as HTMLElement).closest<HTMLElement>('.stage-dock-tile');
  if (!tile) return;
  const id = tile.dataset.dock;
  if (!id) return;
  event.stopPropagation();
  if (id === 'omi') {
    if (omiWindow.classList.contains('is-open')) closeOmi();
    else openOmi();
    return;
  }
  setActive(id as AppId);
});

const voice = createVoiceInput({
  onLevel: ({ level }) => markerPtt.style.setProperty('--level', level.toFixed(3)),
});
let listeningSince = 0;
let wordTimer: number | undefined;
let spoken = 0;

function beginListening(): void {
  if (omiWindow.classList.contains('is-open')) return;
  listeningSince = performance.now();
  spoken = 0;
  markerHeard.textContent = '';
  marker.classList.add('is-listening');
  placeMarker();
  void voice.start();
  const words = CONTEXTS[active].question.split(' ');
  wordTimer = window.setInterval(() => {
    spoken = Math.min(words.length, spoken + 1);
    markerHeard.textContent = words.slice(0, spoken).join(' ');
  }, 190);
}

function endListening(): void {
  if (wordTimer !== undefined) window.clearInterval(wordTimer);
  wordTimer = undefined;
  voice.stop();
  if (performance.now() - listeningSince < 420 || spoken < 2) {
    marker.classList.remove('is-listening');
    markerHeard.textContent = '';
    placeMarker();
    return;
  }
  const question = CONTEXTS[active].question;
  markerHeard.textContent = question;
  window.setTimeout(() => {
    markerHeard.textContent = '';
    showAnswer(question, CONTEXTS[active].answer);
  }, 320);
}

const unbindPtt = pushToTalk({ onPress: beginListening, onRelease: endListening });

function hydrateFixture(snapshot: OmiSnapshot): void {
  const priyaAction = snapshot.actions.find(
    (action) => action.status === 'open' && action.title.toLowerCase().includes('priya'),
  );
  if (priyaAction && CONTEXTS.slack.loops[0]) {
    CONTEXTS.slack.loops[0].title = priyaAction.title;
    if (omiWindow.classList.contains('is-open') && omiView === 'slack') renderFolio('slack');
  }
}

function selfCheck(): void {
  if (APP_ORDER.some((id) => !CONTEXTS[id]) || APP_ORDER.length !== windows.length) {
    throw new Error('Continuity contexts and demo windows must stay in sync');
  }
  const tiles = root.querySelectorAll('.stage-dock-tile');
  if (tiles.length < DOCK_APPS.length) {
    throw new Error('Continuity dock wiring expects stage dock tiles');
  }
}

window.addEventListener('resize', placeMarker);
// Re-anchor once the answered-state width transition settles, so the wider
// panel never hangs past the screen edge.
marker.addEventListener('transitionend', placeMarker);
buildSidebar();
renderFolio('browser');
setActive('browser');
selfCheck();
void omi.getSnapshot().then(hydrateFixture);

import.meta.hot?.dispose(() => {
  if (wordTimer !== undefined) window.clearInterval(wordTimer);
  stopStream();
  unbindPtt();
  voice.destroy();
  stage.destroy();
});
