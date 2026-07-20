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

interface Context {
  app: string;
  dock: string;
  project: string;
  phase: string;
  where: string;
  next?: string;
  question: string;
  answer: string;
  thumb: string;
}

const CONTEXTS: Record<AppId, Context> = {
  browser: {
    app: 'Arc',
    dock: 'Arc',
    project: 'Atlas launch',
    phase: 'Positioning',
    where: 'You were comparing activation claims.',
    next: 'Resolve the 14-day metric before copy lock.',
    question: 'What was unresolved here?',
    answer:
      'The launch draft says activation improved in 14 days. Priya’s workshop notes use 30 days. You wanted to confirm the analytics definition before keeping the claim.',
    thumb: 'Launch draft',
  },
  slack: {
    app: 'Slack',
    dock: 'Slack',
    project: 'Atlas launch',
    phase: 'Pilot decision',
    where: 'Priya is waiting on the workshop decision.',
    next: 'Send the narrower pilot scope.',
    question: 'What do I owe Priya?',
    answer:
      'Send the smaller pilot scope and the decision trail. You said you would do it before tomorrow’s review.',
    thumb: '#atlas-launch',
  },
  notes: {
    app: 'Notes',
    dock: 'Notes',
    project: 'Unassigned',
    phase: 'Scratch',
    where: 'No workstream linked.',
    question: 'What is this note about?',
    answer:
      'It looks like an early thought about making project context portable across apps. It is not linked to a workstream yet.',
    thumb: 'Context should travel',
  },
};

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
  <span class="marker-thread" aria-hidden="true"></span>
  <div class="marker-stack">
    <button class="marker-main" type="button" aria-label="Open current workstream in Omi">
      <span class="marker-meta"></span>
      <strong class="marker-project"></strong>
      <span class="marker-where"></span>
      <span class="marker-next"></span>
    </button>
    <div class="marker-answer" hidden>
      <p class="marker-q"></p>
      <p class="marker-a"></p>
      <div class="marker-actions">
        <input class="marker-followup" aria-label="Ask a follow-up" placeholder="Ask a follow-up…" autocomplete="off">
        <button class="marker-open" type="button">Open in omi</button>
      </div>
    </div>
    <button class="marker-ptt" type="button" aria-label="Ask Omi about this screen">
      <span class="marker-orb" aria-hidden="true"></span>
      <span class="marker-key">⌘</span>
      <span class="marker-heard"></span>
    </button>
  </div>
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
      <div class="omi-mark"><span></span>omi</div>
      <nav aria-label="Workstreams">
        <button class="is-current"><span class="nav-dot"></span>Atlas launch<small>active now</small></button>
        <button><span class="nav-dot"></span>Website refresh<small>2 open loops</small></button>
        <button><span class="nav-dot"></span>Research<small>quiet</small></button>
      </nav>
      <button class="all-context"><span>⌘</span> All context</button>
    </aside>
    <article class="project-folio">
      <div class="folio-body">
        <header class="project-head">
          <p class="project-kicker">Atlas launch <span>·</span> Positioning</p>
          <h1>Make returning to complex work feel immediate.</h1>
          <p class="project-status"><span></span>In focus across Arc and Slack</p>
        </header>
        <div class="folio-grid">
          <section class="current-state">
            <h2>Where you are</h2>
            <p class="state-line">The launch narrative is nearly locked. One proof point still conflicts with the workshop definition.</p>
            <p class="state-next"><span>Next</span> Confirm whether activation is measured at 14 or 30 days.</p>
          </section>
          <aside class="goal">
            <h2>Goal</h2>
            <p>Approve positioning and pilot scope before Friday’s launch review.</p>
            <time>Fri 24 Jul</time>
          </aside>
          <section class="open-loops">
            <h2>Open loops <span>2</span></h2>
            <button><i></i><span><strong>Resolve the activation window</strong><small>Launch draft · Priya’s comment</small></span><em>Today</em></button>
            <button><i></i><span><strong data-fixture-action>Send Priya the narrower pilot scope</strong><small>Slack · #atlas-launch</small></span><em>Tomorrow</em></button>
          </section>
          <section class="decisions">
            <h2>Decisions</h2>
            <p><time>Today</time><span>Lead with continuity, not memory capture.</span></p>
            <p><time>Fri</time><span>Keep the pilot to one product team.</span></p>
            <p><time>Wed</time><span>Do not require tool migration.</span></p>
          </section>
          <section class="artifacts">
            <h2>Context <span>5</span></h2>
            <button><span class="artifact-icon">A</span><span><strong>Launch narrative</strong><small>Arc · focused now</small></span></button>
            <button><span class="artifact-icon">#</span><span><strong>atlas-launch</strong><small>Slack · 35 min ago</small></span></button>
          </section>
        </div>
      </div>
      <div class="folio-dock">
        <div class="chat-log" aria-live="polite"></div>
        <form class="omi-chat">
          <span class="chat-orb" aria-hidden="true"></span>
          <input aria-label="Ask Omi" placeholder="Ask across this workstream" autocomplete="off">
          <span class="chat-hint">hold <kbd>⌘</kbd> to talk</span>
          <button type="submit" aria-label="Send">↑</button>
        </form>
      </div>
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
const markerOrb = marker.querySelector<HTMLElement>('.marker-orb')!;
const answerPanel = marker.querySelector<HTMLElement>('.marker-answer')!;
const markerQ = marker.querySelector<HTMLElement>('.marker-q')!;
const markerA = marker.querySelector<HTMLElement>('.marker-a')!;
const markerFollowup = marker.querySelector<HTMLInputElement>('.marker-followup')!;
const markerOpen = marker.querySelector<HTMLButtonElement>('.marker-open')!;
const chatLog = omiWindow.querySelector<HTMLElement>('.chat-log')!;
const chatForm = omiWindow.querySelector<HTMLFormElement>('.omi-chat')!;
const chatInput = chatForm.querySelector<HTMLInputElement>('input')!;

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
  const markerW = marker.offsetWidth || 264;
  const inset = 16;
  // Float the overlay over the focused window's top-right, below its chrome.
  const top = Math.max(40, winRect.top - surfaceRect.top + 60);
  const left = Math.max(8, winRect.right - surfaceRect.left - markerW - inset);
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

function openOmi(asking?: string): void {
  dismissAnswer();
  omiWindow.classList.add('is-open');
  marker.classList.add('is-app-open');
  setMenuApp('omi', ['File', 'Edit', 'View', 'Window', 'Help']);
  placeMarker();
  syncDock();
  if (asking) addExchange(asking, CONTEXTS[active].answer);
  window.setTimeout(() => chatInput.focus(), 240);
}

function closeOmi(): void {
  if (!omiWindow.classList.contains('is-open')) return;
  omiWindow.classList.remove('is-open');
  marker.classList.remove('is-app-open');
  if (openApps.has(active)) setMenuApp(CONTEXTS[active].app, MENUS[active]);
  placeMarker();
  syncDock();
}

function addExchange(question: string, answer: string): void {
  chatLog.innerHTML = `
    <p class="chat-question">${question}</p>
    <p class="chat-answer"><span></span>${answer}</p>
  `;
}

/** Answer lands in the overlay; Omi only opens if the user dives deeper. */
function showAnswer(question: string, answer: string): void {
  markerQ.textContent = question;
  markerA.textContent = answer;
  answerPanel.hidden = false;
  marker.classList.remove('is-minimal', 'is-listening');
  marker.classList.add('is-answered');
  schedulePlaceMarker();
}

function dismissAnswer(): void {
  if (answerPanel.hidden) return;
  answerPanel.hidden = true;
  marker.classList.remove('is-answered');
  markerFollowup.value = '';
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
// Ingress + follow-up both escalate the in-place answer into the full app.
markerOpen.addEventListener('click', () => openOmi(markerQ.textContent || undefined));
markerFollowup.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const followup = markerFollowup.value.trim();
  openOmi(followup || markerQ.textContent || undefined);
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  addExchange(question, CONTEXTS[active].answer);
  chatInput.value = '';
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
  onLevel: ({ level }) => markerOrb.style.setProperty('--level', level.toFixed(3)),
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
  const target = omiWindow.querySelector<HTMLElement>('[data-fixture-action]');
  if (priyaAction && target) target.textContent = priyaAction.title;
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
setActive('browser');
selfCheck();
void omi.getSnapshot().then(hydrateFixture);

import.meta.hot?.dispose(() => {
  if (wordTimer !== undefined) window.clearInterval(wordTimer);
  unbindPtt();
  voice.destroy();
  stage.destroy();
});
