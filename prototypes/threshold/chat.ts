/**
 * The app Threshold hands off to.
 *
 * Threshold itself never becomes browsable — the moment you want to *do*
 * something with a brief, the card retires and this window takes over. It opens
 * already knowing who you were looking at.
 *
 * Three views, one sidebar. Chat is where you arrive, because a question is
 * what you had; Tasks and the contact pages are where that question resolves
 * into something with edges. Every cross-reference is navigable in both
 * directions: a task names a person, a person shows their tasks, a task belongs
 * to a goal, a goal lists its people.
 */
import type { Conversation, Memory } from '../../reference/hackathon-pack/src/types';
import { createVoiceInput, pushToTalk } from '../_voice';
import { renderGoals, renderPeople, renderRewind, renderTasks, screenPreview, type Nav } from './views';
import { firstName, initials, type PersonView, type ScreenCapture, type TaskView, type Workspace } from './workspace';

export interface OmiAppOptions {
  workspace: Workspace;
  /** Who the card was about. The app opens on them. */
  focusPersonId: string;
  /** A question spoken at the card, carried straight into the thread. */
  asking?: string;
  /**
   * App that caused the card — screens in chat are filtered to this context so a
   * Slack trigger never shows a Mail mock, and vice versa.
   */
  contextApp?: string;
  onClose(): void;
}

export interface OmiChat {
  close(): void;
}

/** Matches the meter on the card, so the same voice reads as the same object. */
const WAVE_BARS = 26;

/* ---------------------------------------------------------------------- *
 * Replies
 *
 * Composed here rather than through `askAssistant`, which returns a generic
 * "a useful starting point is…" string. Every line below resolves to real
 * fixture data, so the window reads like an assistant that has the context.
 * ---------------------------------------------------------------------- */

interface Answer {
  text: string;
  quote?: string;
  cite?: string;
}

interface Prompt {
  label: string;
  question(view: PersonView): string;
  answer(view: PersonView, workspace: Workspace): Answer;
}

/** The commitment the card was about: their first open task. */
function primaryTask(view: PersonView): TaskView | undefined {
  return view.tasks.find((task) => task.action.status === 'open') ?? view.tasks[0];
}

/** The transcript line the commitment came from, preferring one that names it. */
function receiptLine(source: Conversation | undefined, title: string): { speaker: string; text: string } | undefined {
  const segments = source?.segments ?? [];
  const keyword = title.split(' ').find((word) => word.length > 5)?.toLowerCase();
  const matched = keyword
    ? segments.find((segment) => segment.text.toLowerCase().includes(keyword))
    : undefined;
  return matched ?? segments[0];
}

function byKind(view: PersonView, kind: Memory['kind']): Memory | undefined {
  return view.memories.find((memory) => memory.kind === kind);
}

const PROMPTS: Prompt[] = [
  {
    label: 'What did I promise?',
    question: (view) => `What exactly did I promise ${firstName(view.person)}?`,
    answer: (view) => {
      const task = primaryTask(view);
      if (!task) {
        return { text: `Nothing is outstanding with ${firstName(view.person)} right now.` };
      }
      const line = receiptLine(task.source, task.action.title);
      return {
        text: `You committed to this: “${task.action.title}”. It came out of one exchange, not a thread — here is the line it came from.`,
        quote: line ? `${line.speaker}: ${line.text}` : undefined,
        cite: task.source?.title,
      };
    },
  },
  {
    label: 'What should I keep in mind?',
    question: () => 'What should I keep in mind about them?',
    answer: (view) => {
      const lines = [byKind(view, 'relationship')?.text, byKind(view, 'preference')?.text].filter(
        Boolean,
      ) as string[];
      return {
        text: lines.length
          ? lines.map((line) => `· ${line}`).join('\n')
          : `Nothing beyond the commitment itself has come up with ${firstName(view.person)} yet.`,
        cite: `${view.memories.length} memories`,
      };
    },
  },
  {
    label: 'How does this fit?',
    question: () => 'How does this fit into what I am working on?',
    answer: (view) => {
      const goal = view.goals[0];
      if (!goal) {
        return { text: `${firstName(view.person)} is not attached to any of your current goals.` };
      }
      return {
        text: `It sits under ${goal.title.toLowerCase()} — ${goal.intent} That goal has ${goal.open} open and ${goal.done} done, and ${goal.people.length > 1 ? `${goal.people.length} people are named in it` : `${firstName(view.person)} is the only person named in it`}.`,
        cite: goal.title,
      };
    },
  },
  {
    label: 'Draft the follow-up',
    question: () => 'Draft the follow-up note.',
    answer: (view) => {
      const task = primaryTask(view);
      return {
        text: `${firstName(view.person)} — following up on what I owed you after ${(task?.source?.title ?? 'our last conversation').toLowerCase()}. ${task ? task.action.title : 'The thing I promised'} is coming your way${task?.dueLabel ? ` ${task.dueLabel.toLowerCase()}` : ''}. Shout if the shape of it is wrong and I will redo it.`,
        cite: 'Draft · not sent',
      };
    },
  },
];

/* ---------------------------------------------------------------------- *
 * The window
 * ---------------------------------------------------------------------- */

/** Screens that belong to the window that caused this handoff. Same window → same set. */
function contextualScreens(screens: ScreenCapture[] | undefined, contextApp?: string): ScreenCapture[] {
  if (!screens?.length) return [];
  if (!contextApp) return screens;
  const matched = screens.filter((screen) => screen.app === contextApp);
  return matched.length > 0 ? matched : screens;
}

export function openOmiApp(host: HTMLElement, options: OmiAppOptions): OmiChat {
  const { workspace, onClose, contextApp } = options;
  let focus = workspace.personById.get(options.focusPersonId) ?? workspace.people[0]!;

  const win = document.createElement('section');
  win.className = 'omi-window is-opening';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'omi');

  win.innerHTML = `
    <header class="win-bar" data-drag>
      <span class="lights"><i class="l-close"></i><i class="l-min"></i><i class="l-max"></i></span>
      <span class="win-title" data-wintitle></span>
    </header>
    <div class="win-main">
      <nav class="side">
        <button class="side-item" type="button" data-nav="chat">Chat</button>
        <button class="side-item" type="button" data-nav="tasks">Tasks</button>
        <button class="side-item" type="button" data-nav="goals">Goals</button>
        <button class="side-item" type="button" data-nav="people">People</button>
        <button class="side-item" type="button" data-nav="rewind">Rewind</button>
      </nav>
      <div class="win-view" data-view></div>
    </div>
  `;

  const titleEl = win.querySelector<HTMLElement>('[data-wintitle]')!;
  const viewHost = win.querySelector<HTMLElement>('[data-view]')!;

  /* -- chat view ------------------------------------------------------- */

  let thread: HTMLElement | undefined;
  /** The scroller wrapping the context rail and the thread. */
  let scroller: HTMLElement | undefined;
  let chips: HTMLElement | undefined;
  let input: HTMLInputElement | undefined;
  let bars: HTMLElement[] = [];
  const asked = new Set<string>();

  function scrollToEnd(): void {
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }

  function addUser(text: string): void {
    if (!thread) return;
    const bubble = document.createElement('p');
    bubble.className = 'msg msg-user';
    bubble.textContent = text;
    thread.append(bubble);
    scrollToEnd();
  }

  function addOmi(body: Answer, thinking = true): void {
    if (!thread) return;
    const block = document.createElement('div');
    block.className = 'msg msg-omi';
    if (thinking) block.classList.add('is-thinking');
    block.innerHTML = `<span class="dots"><i></i><i></i><i></i></span>`;
    thread.append(block);
    scrollToEnd();

    const settle = (): void => {
      block.classList.remove('is-thinking');
      const paragraphs = body.text
        .split('\n')
        .map((line) => `<p class="msg-line">${line}</p>`)
        .join('');
      block.innerHTML = `
        ${paragraphs}
        ${body.quote ? `<blockquote class="msg-quote">${body.quote}</blockquote>` : ''}
        ${body.cite ? `<p class="msg-cite">${body.cite}</p>` : ''}
      `;
      scrollToEnd();
    };

    if (thinking) window.setTimeout(settle, 620);
    else settle();
  }

  function paintChips(): void {
    if (!chips) return;
    chips.replaceChildren();
    for (const prompt of PROMPTS) {
      if (asked.has(prompt.label)) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = prompt.label;
      chip.addEventListener('click', () => ask(prompt));
      chips.append(chip);
    }
  }

  function ask(prompt: Prompt): void {
    asked.add(prompt.label);
    paintChips();
    addUser(prompt.question(focus));
    addOmi(prompt.answer(focus, workspace));
  }

  function submitComposer(): void {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUser(text);
    const match =
      PROMPTS.find((prompt) =>
        prompt.label
          .toLowerCase()
          .split(' ')
          .some((word) => word.length > 3 && text.toLowerCase().includes(word)),
      ) ?? PROMPTS[0]!;
    asked.add(match.label);
    paintChips();
    addOmi(match.answer(focus, workspace));
  }

  function buildChat(): HTMLElement {
    const view = document.createElement('div');
    view.className = 'view view-chat';
    view.innerHTML = `
      <div class="chat-scroll" data-scroll>
        <div class="ctx-rail" data-rail></div>
        <div class="thread" data-thread></div>
      </div>
      <footer class="win-foot">
        <div class="chips" data-chips></div>
        <form class="composer" data-composer>
          <input class="composer-input" type="text" autocomplete="off"
                 placeholder="Ask about ${firstName(focus.person)}…" data-input />
          <span class="composer-wave" data-wave aria-hidden="true">${'<i></i>'.repeat(WAVE_BARS)}</span>
          <kbd class="composer-key">⌘</kbd>
          <button class="composer-send" type="submit" aria-label="Send">↵</button>
        </form>
      </footer>
    `;

    scroller = view.querySelector<HTMLElement>('[data-scroll]')!;
    thread = view.querySelector<HTMLElement>('[data-thread]')!;
    chips = view.querySelector<HTMLElement>('[data-chips]')!;
    input = view.querySelector<HTMLInputElement>('[data-input]')!;
    bars = [...view.querySelectorAll<HTMLElement>('[data-wave] i')];

    const rail = view.querySelector<HTMLElement>('[data-rail]')!;
    rail.append(contextCard('person', focus));
    const task = primaryTask(focus);
    if (task) rail.append(contextCard('task', focus, task));

    const form = view.querySelector<HTMLFormElement>('[data-composer]')!;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitComposer();
    });
    // Explicit Enter — some hosts swallow the implicit form submit on a lone input.
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.isComposing) return;
      event.preventDefault();
      submitComposer();
    });

    paintChips();
    return view;
  }

  /* -- context cards --------------------------------------------------- */

  function contextCard(kind: 'person' | 'task', view: PersonView, task?: TaskView): HTMLElement {
    const card = document.createElement('div');
    card.className = `ctx ctx-${kind}`;

    if (kind === 'person') {
      const meta = [view.lastSpoke && `Last spoke ${view.lastSpoke}`, `${view.memories.length} memories`]
        .filter(Boolean)
        .join(' · ');
      card.innerHTML = `
        <span class="ctx-avatar">${initials(view.person.name)}</span>
        <div class="ctx-body">
          <p class="ctx-title">${view.person.name}</p>
          <p class="ctx-sub">${view.person.relationship}</p>
          <p class="ctx-meta">${meta}</p>
        </div>
        <span class="ctx-kind">Contact</span>
      `;
      card.classList.add('is-linked');
      card.addEventListener('click', () => go({ view: 'tasks', personId: view.person.id }));
      return card;
    }

    const meta = [task!.dueLabel, task!.source && `from ${task!.source.title}`].filter(Boolean).join(' · ');
    card.innerHTML = `
      <button class="ctx-check" type="button" aria-pressed="false" aria-label="Mark complete"></button>
      <div class="ctx-body">
        <p class="ctx-title ctx-task">${task!.action.title}</p>
        <p class="ctx-meta">${meta}</p>
      </div>
      <span class="ctx-kind">Task</span>
    `;

    const shots = contextualScreens(task!.screens, contextApp);
    if (shots.length) {
      card.querySelector<HTMLElement>('.ctx-body')!.append(screenPreview(shots));
    }

    const check = card.querySelector<HTMLButtonElement>('.ctx-check')!;
    check.addEventListener('click', (event) => {
      event.stopPropagation();
      const next = card.classList.toggle('is-complete');
      check.setAttribute('aria-pressed', String(next));
    });
    card.classList.add('is-linked');
    card.addEventListener('click', () => go({ view: 'tasks', goalId: task!.goal.id }));

    return card;
  }

  /* -- navigation ------------------------------------------------------ */

  type Route =
    | { view: 'chat' }
    | { view: 'tasks'; goalId?: string; personId?: string }
    | { view: 'goals' }
    | { view: 'people' }
    | { view: 'rewind' };

  let route: Route = { view: 'chat' };

  const nav: Nav = {
    person: (id) => go({ view: 'tasks', personId: id }),
    goal: (id) => go({ view: 'tasks', goalId: id }),
    tasks: () => go({ view: 'tasks' }),
    goals: () => go({ view: 'goals' }),
    people: () => go({ view: 'people' }),
    ask: (question) => {
      go({ view: 'chat' });
      addUser(question);
      addOmi(PROMPTS[1]!.answer(focus, workspace));
    },
  };

  function go(next: Route): void {
    route = next;
    // Looking at a person anywhere makes them the one chat is about.
    if (next.view === 'tasks' && next.personId) {
      const view = workspace.personById.get(next.personId);
      if (view) focus = view;
    }

    for (const item of win.querySelectorAll<HTMLElement>('.side-item')) {
      item.classList.toggle('is-on', item.dataset.nav === next.view);
    }

    if (next.view !== 'chat') {
      thread = scroller = chips = input = undefined;
      bars = [];
    }

    if (next.view === 'chat') {
      titleEl.textContent = focus.person.name;
      viewHost.replaceChildren(buildChat());
      scrollToEnd();
    } else if (next.view === 'tasks') {
      const person = next.personId ? workspace.personById.get(next.personId) : undefined;
      const goal = next.goalId ? workspace.goals.find((g) => g.id === next.goalId) : undefined;
      titleEl.textContent = person?.person.name ?? goal?.title ?? 'Tasks';
      viewHost.replaceChildren(renderTasks(workspace, nav, { goalId: next.goalId, personId: next.personId }));
    } else if (next.view === 'goals') {
      titleEl.textContent = 'Goals';
      viewHost.replaceChildren(renderGoals(workspace, nav));
    } else if (next.view === 'rewind') {
      titleEl.textContent = 'Rewind';
      viewHost.replaceChildren(renderRewind(workspace, nav));
    } else {
      titleEl.textContent = 'People';
      viewHost.replaceChildren(renderPeople(workspace, nav));
    }
    viewHost.scrollTop = 0;
  }

  for (const item of win.querySelectorAll<HTMLElement>('[data-nav]')) {
    item.addEventListener('click', () => {
      const target = item.dataset.nav;
      if (target === 'tasks') go({ view: 'tasks' });
      else if (target === 'goals') go({ view: 'goals' });
      else if (target === 'people') go({ view: 'people' });
      else if (target === 'rewind') go({ view: 'rewind' });
      else go({ view: 'chat' });
    });
  }

  /* -- push to talk ---------------------------------------------------- *
   *
   * The same hold that filled the card fills the composer here. Holding right
   * ⌘ from any view jumps to chat and starts listening — the question you have
   * out loud is always a chat question, whatever you happen to be looking at.
   * -------------------------------------------------------------------- */

  const DICTATION = 'Draft the follow-up and remind me what they care about';
  const dictated = DICTATION.split(' ');
  let spoken = 0;
  let history = new Array<number>(WAVE_BARS).fill(0);
  let reveal: number | undefined;

  const voice = createVoiceInput({
    onLevel: ({ level }) => {
      history = [...history.slice(1), level];
      for (const [i, bar] of bars.entries()) {
        const taper = 0.72 + 0.28 * Math.min(1, i / 5);
        bar.style.transform = `scaleY(${0.06 + history[i]! * taper * 0.94})`;
      }
    },
    onSpeechStart: () => win.classList.add('is-hearing'),
    onSpeechEnd: () => win.classList.remove('is-hearing'),
  });

  const unbindPtt = pushToTalk({
    onPress: () => {
      if (closed) return;
      if (route.view !== 'chat') go({ view: 'chat' });
      spoken = 0;
      if (input) input.value = '';
      win.classList.add('is-listening');
      void voice.start();
      reveal = window.setInterval(() => {
        if (spoken >= dictated.length || !input) return;
        spoken += 1;
        input.value = dictated.slice(0, spoken).join(' ');
      }, 170);
    },
    onRelease: () => {
      if (reveal !== undefined) window.clearInterval(reveal);
      reveal = undefined;
      voice.stop();
      win.classList.remove('is-listening', 'is-hearing');
      if (spoken < 2 || !input) {
        if (input) input.value = '';
        return;
      }
      input.value = DICTATION;
      const form = win.querySelector<HTMLFormElement>('[data-composer]');
      window.setTimeout(() => form?.requestSubmit(), 300);
    },
  });

  /* -- window behaviour ------------------------------------------------ */

  let closed = false;
  function close(): void {
    if (closed) return;
    closed = true;
    unbindPtt();
    voice.destroy();
    win.classList.add('is-closing');
    window.setTimeout(() => {
      win.remove();
      onClose();
    }, 220);
  }

  win.querySelector<HTMLElement>('.l-close')!.addEventListener('click', close);
  win.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  /* Dragged by the title bar, like any other window on this desktop. */
  const bar = win.querySelector<HTMLElement>('[data-drag]')!;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  bar.addEventListener('pointerdown', (event: PointerEvent) => {
    if ((event.target as HTMLElement).closest('.lights')) return;
    dragging = true;
    const box = win.getBoundingClientRect();
    offsetX = event.clientX - box.left;
    offsetY = event.clientY - box.top;
    win.style.transition = 'none';
    bar.setPointerCapture(event.pointerId);
  });

  bar.addEventListener('pointermove', (event: PointerEvent) => {
    if (!dragging) return;
    win.style.left = `${event.clientX - offsetX}px`;
    win.style.top = `${Math.max(28, event.clientY - offsetY)}px`;
    win.style.transform = 'none';
  });

  bar.addEventListener('pointerup', (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    bar.releasePointerCapture(event.pointerId);
    win.style.transition = '';
  });

  host.append(win);
  win.addEventListener('animationend', () => win.classList.remove('is-opening'), { once: true });

  go({ view: 'chat' });
  /*
   * The opener orients; it does not pre-empt. If a question arrived with you
   * from the card, the receipt belongs in the answer to that question, not
   * here — printing it twice makes the assistant look like it is repeating
   * itself before you have said anything.
   */
  const task = primaryTask(focus);
  const line = task ? receiptLine(task.source, task.action.title) : undefined;
  addOmi(
    options.asking
      ? {
          text: `One thing is still open with ${firstName(focus.person)}${focus.lastSpoke ? `, and has been since you spoke ${focus.lastSpoke}` : ''}.`,
        }
      : {
          text: `You are about to talk to ${firstName(focus.person)}, and there is one thing outstanding${task?.dueLabel ? ` — ${task.dueLabel.toLowerCase()}` : ''}.`,
          quote: line ? `${line.speaker}: ${line.text}` : undefined,
          cite: task?.source?.title,
        },
    false,
  );

  window.setTimeout(() => input?.focus({ preventScroll: true }), 260);

  if (options.asking) {
    // It was already asked out loud, so it is no longer on offer.
    asked.add(PROMPTS[0]!.label);
    paintChips();
    window.setTimeout(() => {
      addUser(options.asking!);
      addOmi(PROMPTS[0]!.answer(focus, workspace));
    }, 420);
  }

  return { close };
}
