/**
 * Tasks, and the two lenses onto them.
 *
 * There is one substrate here — the task list — and everything else is a way of
 * looking at it. Goals and people are not places you go and read about; they
 * are *dimensions*. You can group tasks by either, filter to one of either, and
 * the page you land on is always the same page wearing a different header.
 *
 * That is what keeps this simple while staying rich. A CRM and a project
 * tracker usually disagree about which object is primary; here neither is. The
 * commitment is primary, and a person or a goal is a question you ask about it.
 *
 * Omi's part is the receipt: every task can show the verbatim line that
 * produced it. No other tracker can do that, and it is the reason to trust a
 * list you did not type.
 */
import type { Memory, MemoryKind } from '../../reference/hackathon-pack/src/types';
import {
  firstName,
  initials,
  relativeDays,
  type GoalView,
  type PersonView,
  type RewindClip,
  type ScreenCapture,
  type TaskView,
  type Workspace,
} from './workspace';

export interface Nav {
  /** Tasks, lensed on one person. */
  person(id: string): void;
  /** Tasks, lensed on one goal. */
  goal(id: string): void;
  tasks(): void;
  goals(): void;
  people(): void;
  /** Rewind, optionally scrolled to one clip. */
  rewind(clipId?: string): void;
  /** Conversations, optionally opened on one transcript. */
  conversation(id?: string): void;
  ask(question: string): void;
}

export interface Lens {
  goalId?: string;
  personId?: string;
}

type Grouping = 'goal' | 'person' | 'due';

/* ---------------------------------------------------------------------- *
 * Chips
 * ---------------------------------------------------------------------- */

export function personChip(view: PersonView, nav: Nav): HTMLElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'pchip';
  chip.innerHTML = `<span class="pchip-face">${initials(view.person.name)}</span>${firstName(view.person)}`;
  chip.addEventListener('click', (event) => {
    event.stopPropagation();
    nav.person(view.person.id);
  });
  return chip;
}

function goalChip(goal: GoalView, nav: Nav): HTMLElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'gchip';
  chip.textContent = goal.title;
  chip.addEventListener('click', (event) => {
    event.stopPropagation();
    nav.goal(goal.id);
  });
  return chip;
}

/* ---------------------------------------------------------------------- *
 * Screenshot evidence
 *
 * Synthetic screen captures, drawn as small mock windows. The fixture has no
 * screenshots and nothing captures a real screen, so these are wireframes plus a
 * caption and a timestamp, labelled "seen on screen". `state` places each on the
 * arc from opened to done, so a receipt shows how far along, not just its source.
 * ---------------------------------------------------------------------- */

const STATE_LABEL: Record<ScreenCapture['state'], string> = {
  opened: 'Opened',
  progress: 'In progress',
  done: 'Done',
};

const APP_SLUG: Record<string, string> = {
  Mail: 'mail',
  Slack: 'slack',
  Meet: 'meet',
  Calendar: 'cal',
  Browser: 'web',
  Figma: 'figma',
  Pages: 'doc',
  'Code review': 'code',
};

/** Initials from a name, or the part after a "To:/From:" label. */
function whoInitials(line = ''): string {
  const name = line.replace(/^(to|from|dm)\s*[:·]?\s*/i, '').replace(/\s*·.*$/, '').trim();
  return initials(name || line);
}

/** Split "Name: text" into the two halves; null when there is no speaker. */
function speakerLine(line: string): { who: string; text: string } | null {
  const match = line.match(/^([^:]{1,22}):\s*(.+)$/);
  return match ? { who: match[1]!.trim(), text: match[2]!.trim() } : null;
}

/*
 * Each capture is drawn as a small, recognisable stand-in for the app it was seen
 * in — a mail message, a Slack thread, a Meet stage — rather than a stack of
 * text lines. Still synthetic and labelled "seen on screen"; the point is that it
 * *reads* as a screenshot of that app, not a transcript of it.
 */
function mockScreen(screen: ScreenCapture): string {
  const d = screen.detail ?? [];
  const line = (i: number): string => d[i] ?? '';

  if (screen.app === 'Mail') {
    const sent = d.some((l) => /^sent$/i.test(l));
    const body = d.slice(2).filter((l) => !/^sent$/i.test(l));
    return `
      <div class="mk mk-mail">
        <div class="mk-mail-head">
          <span class="mk-ava">${whoInitials(line(0))}</span>
          <span class="mk-mail-meta"><b>${line(0)}</b><i>${line(1)}</i></span>
        </div>
        <div class="mk-mail-body">${body.map((l) => `<span>${l}</span>`).join('')}</div>
        ${sent ? '<span class="mk-mail-sent">Sent</span>' : ''}
      </div>`;
  }

  if (screen.app === 'Slack') {
    const rows = d
      .slice(1)
      .map((l) => {
        const s = speakerLine(l);
        return s
          ? `<div class="mk-msg"><span class="mk-msg-ava"></span><span><b>${s.who}</b> ${s.text}</span></div>`
          : `<div class="mk-sub">${l}</div>`;
      })
      .join('');
    return `
      <div class="mk mk-slack">
        <div class="mk-slack-rail"><i></i><i></i><i></i><i></i></div>
        <div class="mk-slack-main"><div class="mk-slack-head">${line(0)}</div>${rows}</div>
      </div>`;
  }

  if (screen.app === 'Meet') {
    // Last speaker line is the real name; "Agreed: …" earlier is a label, not a person.
    const caption = [...d.slice(1)].reverse().find((l) => speakerLine(l)) ?? line(1);
    const intro = d.find((l) => /is in the call|joined|joining/i.test(l));
    const who = intro?.replace(/\s+(is in the call|joined|joining).*$/i, '').trim()
      ?? speakerLine(caption)?.who
      ?? line(1);
    return `
      <div class="mk mk-meet">
        <div class="mk-meet-stage"><span class="mk-tile">${whoInitials(who)}</span><span class="mk-tile mk-tile-you">You</span></div>
        <div class="mk-meet-foot"><span class="mk-meet-title">${line(0)}</span><span class="mk-dot"></span><span class="mk-dot"></span></div>
        ${caption ? `<div class="mk-meet-cap">${caption}</div>` : ''}
      </div>`;
  }

  if (screen.app === 'Calendar') {
    return `
      <div class="mk mk-cal">
        <div class="mk-cal-day">${line(0)}</div>
        <div class="mk-cal-grid">${d.slice(1).map((e, i) => `<div class="mk-evt mk-evt-${i % 2}">${e}</div>`).join('')}</div>
      </div>`;
  }

  if (screen.app === 'Browser') {
    return `
      <div class="mk mk-web">
        <div class="mk-web-bar"><i></i><i></i><span class="mk-web-url">${line(0)}</span></div>
        <div class="mk-web-body">${d.slice(1).map((l) => `<span>${l}</span>`).join('')}</div>
      </div>`;
  }

  if (screen.app === 'Figma') {
    return `
      <div class="mk mk-figma">
        <div class="mk-fig-rail"><i></i><i></i><i></i></div>
        <div class="mk-fig-canvas"><span class="mk-fig-frame">${line(0)}</span>${d.slice(1).map((l) => `<span class="mk-fig-note">${l}</span>`).join('')}</div>
      </div>`;
  }

  if (screen.app === 'Code review') {
    return `<div class="mk mk-code">${d.map((l, i) => `<span class="mk-code-l mk-code-${i % 3 === 2 ? 'add' : 'ctx'}">${l}</span>`).join('')}</div>`;
  }

  // Pages and any document-like app.
  return `
    <div class="mk mk-doc">
      <div class="mk-doc-title">${line(0)}</div>
      ${d.slice(1).map((l) => `<span class="mk-doc-l">${l}</span>`).join('')}
    </div>`;
}

function shotThumb(screen: ScreenCapture): string {
  const slug = APP_SLUG[screen.app] ?? 'doc';
  return `
    <figure class="shot shot-${screen.state}">
      <div class="shot-frame shot-app-${slug}">
        <div class="shot-bar"><i></i><i></i><i></i><span>${screen.app}</span></div>
        <div class="shot-body">${mockScreen(screen)}</div>
      </div>
      <figcaption class="shot-cap">${screen.caption}</figcaption>
      <p class="shot-meta"><span class="shot-state">${STATE_LABEL[screen.state]}</span>${screen.at}</p>
    </figure>`;
}

export function screenStrip(
  screens: ScreenCapture[],
  options: { onShot?: () => void; label?: string } = {},
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'screens';
  wrap.innerHTML = `
    <p class="screens-label">${options.label ?? 'Seen on screen'}</p>
    <div class="screens-row"></div>
  `;
  const row = wrap.querySelector<HTMLElement>('.screens-row')!;
  for (const screen of screens) {
    const fig = document.createElement('div');
    fig.innerHTML = shotThumb(screen);
    const shot = fig.firstElementChild as HTMLElement;
    if (options.onShot) {
      shot.classList.add('is-link');
      shot.setAttribute('role', 'button');
      shot.tabIndex = 0;
      const go = (event: Event): void => {
        event.stopPropagation();
        options.onShot!();
      };
      shot.addEventListener('click', go);
      shot.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          go(event);
        }
      });
    }
    row.append(shot);
  }
  return wrap;
}

/**
 * A tiny stand-in that rides in a task row's tail without adding height. Click
 * opens Rewind on that trail. The count hints there is more than one behind it.
 */
export function screenPreview(screens: ScreenCapture[], onOpen: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'shot-mini';
  btn.title = 'Open in Rewind';
  btn.innerHTML = `
    <span class="shot-mini-frame">
      <span class="shot-mini-bar"></span>
      <span class="shot-mini-lines"><i></i><i></i></span>
    </span>
    ${screens.length > 1 ? `<span class="shot-mini-n">${screens.length}</span>` : ''}
  `;
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    onOpen();
  });
  return btn;
}

/* ---------------------------------------------------------------------- *
 * Task row
 * ---------------------------------------------------------------------- */

interface TaskRowOptions {
  showPerson?: boolean;
  showGoal?: boolean;
}

export function taskRow(task: TaskView, workspace: Workspace, nav: Nav, options: TaskRowOptions = {}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `task${task.action.status === 'done' ? ' is-done' : ''}${task.overdue ? ' is-overdue' : ''}`;

  const meta: string[] = [];
  if (task.action.status === 'open' && task.dueLabel) meta.push(task.dueLabel);
  if (task.source) meta.push(task.source.title);

  wrap.innerHTML = `
    <div class="task-row">
      <button class="task-check" type="button" aria-label="Toggle complete"></button>
      <div class="task-body">
        <p class="task-title">${task.action.title}</p>
        <p class="task-meta">${meta.join(' · ')}</p>
      </div>
      <div class="task-tail"></div>
    </div>
    <div class="task-receipt" data-receipt></div>
  `;

  const tail = wrap.querySelector<HTMLElement>('.task-tail')!;
  // A tiny preview, not a strip: it rides in the tail without growing the row.
  if (task.screens?.length) {
    tail.append(screenPreview(task.screens, () => nav.rewind(task.action.id)));
  }
  if (options.showGoal) tail.append(goalChip(task.goal, nav));
  if (options.showPerson && task.person) {
    const view = workspace.personById.get(task.person.id);
    if (view) tail.append(personChip(view, nav));
  }

  wrap.querySelector<HTMLButtonElement>('.task-check')!.addEventListener('click', (event) => {
    event.stopPropagation();
    wrap.classList.toggle('is-done');
  });

  /* The receipt: the transcript line the claim came from. Screens live in the
     tail preview and the Rewind tab, so the row stays one drag deep. */
  const segments = task.source?.segments ?? [];
  if (segments.length > 0) {
    wrap.classList.add('has-receipt');
    const slot = wrap.querySelector<HTMLElement>('[data-receipt]')!;
    slot.innerHTML = `
      <p class="receipt-src">${task.source!.title} · ${relativeDays(task.source!.startedAt)}</p>
      ${segments
        .slice(0, 3)
        .map((s) => `<p class="receipt-l"><span>${s.speaker}:</span> ${s.text}</p>`)
        .join('')}
    `;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'receipt-link';
    link.textContent = 'View conversation';
    link.addEventListener('click', (event) => {
      event.stopPropagation();
      nav.conversation(task.source!.id);
    });
    slot.append(link);
    wrap.querySelector<HTMLElement>('.task-row')!.addEventListener('click', () => {
      const open = wrap.classList.toggle('is-open');
      slot.style.height = open ? `${slot.scrollHeight}px` : '0px';
    });
  }

  return wrap;
}

/* ---------------------------------------------------------------------- *
 * Grouping
 * ---------------------------------------------------------------------- */

interface Group {
  key: string;
  title: string;
  note?: string;
  count: string;
  tasks: TaskView[];
  open?(): void;
}

const DUE_BUCKETS = ['Overdue', 'Due today', 'Due tomorrow', 'This week', 'Later', 'No date'];

function dueBucket(task: TaskView): string {
  if (!task.action.dueAt) return 'No date';
  if (task.overdue) return 'Overdue';
  const label = task.dueLabel ?? '';
  if (label === 'Due today') return 'Due today';
  if (label === 'Due tomorrow') return 'Due tomorrow';
  const days = Number(label.replace(/\D/g, ''));
  return days <= 7 ? 'This week' : 'Later';
}

function group(tasks: TaskView[], by: Grouping, workspace: Workspace, nav: Nav): Group[] {
  const openCount = (list: TaskView[]): string =>
    `${list.filter((t) => t.action.status === 'open').length} open`;

  if (by === 'goal') {
    return workspace.goals
      .map((goal) => ({
        key: goal.id,
        title: goal.title,
        note: goal.intent,
        count: openCount(goal.tasks.filter((t) => tasks.includes(t))),
        tasks: tasks.filter((task) => task.goal.id === goal.id),
        open: () => nav.goal(goal.id),
      }))
      .filter((g) => g.tasks.length > 0);
  }

  if (by === 'person') {
    const groups: Group[] = workspace.people
      .map((view) => ({
        key: view.person.id,
        title: view.person.name,
        note: view.person.relationship,
        count: openCount(tasks.filter((task) => task.person?.id === view.person.id)),
        tasks: tasks.filter((task) => task.person?.id === view.person.id),
        open: () => nav.person(view.person.id),
      }))
      .filter((g) => g.tasks.length > 0);

    const unassigned = tasks.filter((task) => !task.person);
    if (unassigned.length > 0) {
      groups.push({
        key: 'nobody',
        title: 'No one named',
        note: 'Commitments you made to yourself.',
        count: openCount(unassigned),
        tasks: unassigned,
      });
    }
    return groups;
  }

  return DUE_BUCKETS.map((bucket) => ({
    key: bucket,
    title: bucket,
    count: openCount(tasks.filter((task) => dueBucket(task) === bucket)),
    tasks: tasks.filter((task) => dueBucket(task) === bucket),
  })).filter((g) => g.tasks.length > 0);
}

/* ---------------------------------------------------------------------- *
 * Tasks
 * ---------------------------------------------------------------------- */

export function renderTasks(workspace: Workspace, nav: Nav, lens: Lens = {}): HTMLElement {
  const page = document.createElement('div');
  page.className = 'view';

  const goal = lens.goalId ? workspace.goals.find((g) => g.id === lens.goalId) : undefined;
  const person = lens.personId ? workspace.personById.get(lens.personId) : undefined;

  const scoped = workspace.tasks.filter((task) => {
    if (goal && task.goal.id !== goal.id) return false;
    if (person && task.person?.id !== person.person.id) return false;
    return true;
  });

  /*
   * Looking through one dimension, you group by the other — a goal asks "who
   * owes what", a person asks "toward what". Unlensed, goals are the frame.
   */
  let grouping: Grouping = goal ? 'person' : person ? 'goal' : 'goal';
  let filter: 'open' | 'all' = 'open';

  page.append(lensHeader(goal, person, workspace, nav));

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `
    <div class="ctl">
      <span class="ctl-label">Group by</span>
      <div class="seg">
        <button class="seg-item" type="button" data-group="goal">Goal</button>
        <button class="seg-item" type="button" data-group="person">Person</button>
        <button class="seg-item" type="button" data-group="due">Due</button>
      </div>
    </div>
    <div class="seg">
      <button class="seg-item is-on" type="button" data-filter="open">Open</button>
      <button class="seg-item" type="button" data-filter="all">All</button>
    </div>
  `;
  page.append(controls);

  const list = document.createElement('div');
  list.className = 'groups';
  page.append(list);

  function paint(): void {
    for (const button of controls.querySelectorAll<HTMLElement>('[data-group]')) {
      button.classList.toggle('is-on', button.dataset.group === grouping);
    }

    const visible = scoped.filter((task) => filter === 'all' || task.action.status === 'open');
    list.replaceChildren();

    if (visible.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = filter === 'open' ? 'Nothing open here.' : 'Nothing here yet.';
      list.append(empty);
      return;
    }

    for (const block of group(visible, grouping, workspace, nav)) {
      const section = document.createElement('section');
      section.className = 'grp';
      section.innerHTML = `
        <header class="grp-head">
          <div class="grp-heading">
            <h2 class="grp-title"></h2>
            ${block.note ? `<p class="grp-note">${block.note}</p>` : ''}
          </div>
          <span class="grp-count">${block.count}</span>
        </header>
        <div class="grp-tasks"></div>
      `;

      const heading = section.querySelector<HTMLElement>('.grp-title')!;
      if (block.open) {
        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'grp-link';
        link.textContent = block.title;
        link.addEventListener('click', block.open);
        heading.append(link);
      } else {
        heading.textContent = block.title;
      }

      const slot = section.querySelector<HTMLElement>('.grp-tasks')!;
      for (const task of block.tasks) {
        slot.append(
          taskRow(task, workspace, nav, {
            showPerson: grouping !== 'person' && !person,
            showGoal: grouping !== 'goal' && !goal,
          }),
        );
      }

      list.append(section);
    }
  }

  for (const button of controls.querySelectorAll<HTMLButtonElement>('[data-group]')) {
    button.addEventListener('click', () => {
      grouping = (button.dataset.group as Grouping) ?? 'goal';
      paint();
    });
  }
  for (const button of controls.querySelectorAll<HTMLButtonElement>('[data-filter]')) {
    button.addEventListener('click', () => {
      filter = button.dataset.filter === 'all' ? 'all' : 'open';
      for (const other of controls.querySelectorAll('[data-filter]')) {
        other.classList.toggle('is-on', other === button);
      }
      paint();
    });
  }

  paint();
  return page;
}

/* ---------------------------------------------------------------------- *
 * The header is the lens
 *
 * Same page, three headers. Unlensed it is a title; through a goal it carries
 * the intent and progress; through a person it carries the relationship and
 * what you know — which is the only place Omi's memory belongs, since it is
 * context for the commitments below it rather than a page of its own.
 * ---------------------------------------------------------------------- */

const KIND_LABEL: Record<MemoryKind, string> = {
  relationship: 'How you work together',
  preference: 'Preferences that came up',
  commitment: 'Commitments made',
  fact: 'Facts established',
  insight: 'Insights',
};

function lensHeader(
  goal: GoalView | undefined,
  person: PersonView | undefined,
  workspace: Workspace,
  nav: Nav,
): HTMLElement {
  const head = document.createElement('header');
  head.className = 'lens';

  if (goal) {
    head.classList.add('lens-goal');
    head.innerHTML = `
      <button class="lens-back" type="button">Tasks</button>
      <h1 class="lens-title">${goal.title}</h1>
      <p class="lens-sub">${goal.intent}</p>
      <div class="lens-bar"><i style="width:${Math.round((goal.done / goal.tasks.length) * 100)}%"></i></div>
      <p class="lens-stats">${goal.open} open · ${goal.done} done</p>
      <div class="lens-chips"></div>
    `;
    const chips = head.querySelector<HTMLElement>('.lens-chips')!;
    for (const p of goal.people) {
      const view = workspace.personById.get(p.id);
      if (view) chips.append(personChip(view, nav));
    }
    if (goal.people.length === 0) chips.remove();
    head.querySelector<HTMLElement>('.lens-back')!.addEventListener('click', () => nav.tasks());
    return head;
  }

  if (person) {
    head.classList.add('lens-person');
    const openCount = person.tasks.filter((t) => t.action.status === 'open').length;
    head.innerHTML = `
      <button class="lens-back" type="button">Tasks</button>
      <div class="lens-id">
        <span class="lens-face">${initials(person.person.name)}</span>
        <div class="lens-idtext">
          <h1 class="lens-title">${person.person.name}</h1>
          <p class="lens-sub">${person.person.relationship}${person.lastSpoke ? ` · last spoke ${person.lastSpoke}` : ''}</p>
        </div>
        <button class="lens-ask" type="button">Ask about ${firstName(person.person)}</button>
      </div>
      <p class="lens-stats">${openCount} open · ${person.memories.length} memories · ${person.conversations.length} conversations</p>
      <div class="know" data-know></div>
    `;

    /* What you know: context for the list, not a page. Two lines, then more. */
    const know = head.querySelector<HTMLElement>('[data-know]')!;
    const ordered: MemoryKind[] = ['relationship', 'preference', 'insight', 'commitment', 'fact'];
    const sorted = [...person.memories].sort(
      (a, b) => ordered.indexOf(a.kind) - ordered.indexOf(b.kind),
    );
    const render = (memory: Memory): string =>
      `<p class="know-line"><span>${KIND_LABEL[memory.kind]}</span>${memory.text}</p>`;

    know.innerHTML = sorted.slice(0, 2).map(render).join('');
    if (sorted.length > 2) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'know-more';
      more.textContent = `${sorted.length - 2} more`;
      more.addEventListener('click', () => {
        know.innerHTML = sorted.map(render).join('');
      });
      know.append(more);
    }

    head.querySelector<HTMLElement>('.lens-back')!.addEventListener('click', () => nav.tasks());
    head.querySelector<HTMLElement>('.lens-ask')!.addEventListener('click', () => {
      nav.ask(`What should I know before I talk to ${firstName(person.person)}?`);
    });
    return head;
  }

  const open = workspace.tasks.filter((task) => task.action.status === 'open').length;
  head.innerHTML = `
    <h1 class="lens-title">Tasks</h1>
    <p class="lens-sub">${open} open across ${workspace.goals.length} goals and ${workspace.people.filter((p) => p.tasks.length > 0).length} people</p>
  `;
  return head;
}

/* ---------------------------------------------------------------------- *
 * Goals
 * ---------------------------------------------------------------------- */

export function renderGoals(workspace: Workspace, nav: Nav): HTMLElement {
  const page = document.createElement('div');
  page.className = 'view';
  page.innerHTML = `
    <header class="lens">
      <h1 class="lens-title">Goals</h1>
      <p class="lens-sub">Derived from the conversations your commitments came out of.</p>
    </header>
    <div class="cards" data-cards></div>
  `;

  const cards = page.querySelector<HTMLElement>('[data-cards]')!;
  for (const goal of workspace.goals) {
    const next = goal.tasks.find((task) => task.action.status === 'open');
    const card = document.createElement('article');
    card.className = 'card-row';
    card.innerHTML = `
      <div class="card-main">
        <h2 class="card-title">${goal.title}</h2>
        <p class="card-note">${goal.intent}</p>
        ${next ? `<p class="card-next"><span>Next</span>${next.action.title}${next.dueLabel ? ` · ${next.dueLabel.toLowerCase()}` : ''}</p>` : ''}
        <div class="card-chips"></div>
      </div>
      <div class="card-side">
        <p class="card-count">${goal.open}</p>
        <p class="card-count-label">open</p>
        <div class="lens-bar"><i style="width:${Math.round((goal.done / goal.tasks.length) * 100)}%"></i></div>
        <p class="card-done">${goal.done} of ${goal.tasks.length} done</p>
      </div>
    `;
    const chips = card.querySelector<HTMLElement>('.card-chips')!;
    for (const p of goal.people) {
      const view = workspace.personById.get(p.id);
      if (view) chips.append(personChip(view, nav));
    }
    if (goal.people.length === 0) chips.remove();

    card.addEventListener('click', () => nav.goal(goal.id));
    cards.append(card);
  }

  return page;
}

/* ---------------------------------------------------------------------- *
 * People
 * ---------------------------------------------------------------------- */

export function renderPeople(workspace: Workspace, nav: Nav): HTMLElement {
  const page = document.createElement('div');
  page.className = 'view';
  const owed = workspace.people.filter((view) =>
    view.tasks.some((task) => task.action.status === 'open'),
  ).length;

  page.innerHTML = `
    <header class="lens">
      <h1 class="lens-title">People</h1>
      <p class="lens-sub">${owed} of ${workspace.people.length} have something open with you.</p>
    </header>
    <div class="rows" data-rows></div>
  `;

  const rows = page.querySelector<HTMLElement>('[data-rows]')!;
  for (const view of workspace.people) {
    const open = view.tasks.filter((task) => task.action.status === 'open').length;
    const relationship = view.memories.find((memory) => memory.kind === 'relationship');

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'prow';
    row.innerHTML = `
      <span class="prow-face">${initials(view.person.name)}</span>
      <span class="prow-main">
        <span class="prow-name">${view.person.name}</span>
        <span class="prow-rel">${view.person.relationship}${view.lastSpoke ? ` · last spoke ${view.lastSpoke}` : ''}</span>
        ${relationship ? `<span class="prow-know">${relationship.text}</span>` : ''}
      </span>
      <span class="prow-tail">${open > 0 ? `<span class="prow-badge">${open} open</span>` : '<span class="prow-clear">clear</span>'}</span>
    `;
    row.addEventListener('click', () => nav.person(view.person.id));
    rows.append(row);
  }

  return page;
}

/* ---------------------------------------------------------------------- *
 * Rewind
 *
 * Every screen trail — tied to a task or floating outside one — in one
 * searchable place. Synthetic; the captures are drawn, not real screenshots.
 * ---------------------------------------------------------------------- */

function clipMatches(clip: RewindClip, query: string): boolean {
  if (!query) return true;
  const hay = [
    clip.title,
    clip.meta,
    ...clip.screens.flatMap((screen) => [screen.app, screen.caption, ...(screen.detail ?? [])]),
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

export function renderRewind(
  workspace: Workspace,
  nav: Nav,
  options: { focusClipId?: string } = {},
): HTMLElement {
  const page = document.createElement('div');
  page.className = 'view';

  const all = workspace.rewinds;
  const totalShots = all.reduce((n, clip) => n + clip.screens.length, 0);
  const loose = all.filter((clip) => !clip.taskId).length;

  page.innerHTML = `
    <header class="lens">
      <h1 class="lens-title">Rewind</h1>
      <p class="lens-sub">${totalShots} screens · ${all.length - loose} tasks · ${loose} outside tasks</p>
      <form class="rw-search" data-search>
        <input class="rw-search-input" type="search" placeholder="Search screens, apps, people…" data-q autocomplete="off" />
      </form>
    </header>
    <div class="rewind" data-rewind></div>
  `;

  const host = page.querySelector<HTMLElement>('[data-rewind]')!;
  const input = page.querySelector<HTMLInputElement>('[data-q]')!;
  const form = page.querySelector<HTMLFormElement>('[data-search]')!;
  form.addEventListener('submit', (event) => event.preventDefault());

  function paint(query: string): void {
    host.replaceChildren();
    const clips = all.filter((clip) => clipMatches(clip, query));
    if (clips.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = query ? 'Nothing matches.' : 'Nothing on screen yet.';
      host.append(empty);
      return;
    }

    for (const clip of clips) {
      const section = document.createElement('section');
      section.className = 'rw';
      section.dataset.clip = clip.id;
      if (clip.id === options.focusClipId) section.classList.add('is-focus');
      section.innerHTML = `
        <header class="rw-head">
          <button class="rw-title" type="button"></button>
          <span class="rw-meta">${clip.meta}${clip.taskId ? '' : ' · outside tasks'}</span>
        </header>
      `;
      const title = section.querySelector<HTMLButtonElement>('.rw-title')!;
      title.textContent = clip.title;
      title.addEventListener('click', () => {
        if (clip.taskId) {
          const task = workspace.taskById.get(clip.taskId);
          if (task) nav.goal(task.goal.id);
        }
      });
      section.append(screenStrip(clip.screens));
      host.append(section);
    }

    if (options.focusClipId) {
      const focused = host.querySelector<HTMLElement>(`[data-clip="${options.focusClipId}"]`);
      focused?.scrollIntoView({ block: 'nearest' });
    }
  }

  input.addEventListener('input', () => paint(input.value.trim()));
  paint('');
  // Land in the search box unless we were sent here for a specific clip.
  if (!options.focusClipId) {
    window.setTimeout(() => input.focus({ preventScroll: true }), 80);
  }
  return page;
}

/* ---------------------------------------------------------------------- *
 * Conversations
 *
 * The source material behind every receipt, as its own page. A receipt shows
 * one line; this is where you read the whole exchange it came from. Real fixture
 * transcripts — the one thing here that is not fabricated.
 * ---------------------------------------------------------------------- */

const SOURCE_LABEL: Record<string, string> = {
  macos: 'Mac',
  ios: 'iPhone',
  device: 'Omi device',
};

export function renderConversations(
  workspace: Workspace,
  nav: Nav,
  options: { focusId?: string } = {},
): HTMLElement {
  const page = document.createElement('div');
  page.className = 'view';

  const all = workspace.conversations;
  page.innerHTML = `
    <header class="lens">
      <h1 class="lens-title">Conversations</h1>
      <p class="lens-sub">${all.length} recorded · the transcripts your commitments came out of</p>
    </header>
    <div class="convos" data-convos></div>
  `;

  const host = page.querySelector<HTMLElement>('[data-convos]')!;
  for (const convo of all) {
    const people = convo.people
      .map((id) => workspace.personById.get(id))
      .filter((view): view is PersonView => Boolean(view));
    const tail = [SOURCE_LABEL[convo.source] ?? convo.source, relativeDays(convo.startedAt)].join(' · ');

    const row = document.createElement('section');
    row.className = 'convo';
    row.dataset.convo = convo.id;
    row.innerHTML = `
      <button class="convo-head" type="button">
        <span class="convo-main">
          <span class="convo-title">${convo.title}</span>
          <span class="convo-meta" data-meta></span>
          <span class="convo-sum">${convo.summary}</span>
        </span>
        <span class="convo-count">${convo.segments.length} lines</span>
      </button>
      <div class="convo-body" data-body></div>
    `;

    /* People names are links into their lens; the rest of the meta is plain. */
    const metaEl = row.querySelector<HTMLElement>('[data-meta]')!;
    people.forEach((view, i) => {
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'convo-person';
      link.textContent = firstName(view.person);
      link.addEventListener('click', (event) => {
        event.stopPropagation();
        nav.person(view.person.id);
      });
      if (i > 0) metaEl.append(document.createTextNode(', '));
      metaEl.append(link);
    });
    metaEl.append(document.createTextNode(`${people.length ? ' · ' : ''}${tail}`));

    const body = row.querySelector<HTMLElement>('[data-body]')!;
    body.innerHTML = convo.segments
      .map((s) => `<p class="convo-l"><span>${s.speaker}</span>${s.text}</p>`)
      .join('');

    const open = (): void => {
      const isOpen = row.classList.toggle('is-open');
      body.style.height = isOpen ? `${body.scrollHeight}px` : '0px';
    };
    row.querySelector<HTMLButtonElement>('.convo-head')!.addEventListener('click', open);

    if (convo.id === options.focusId) {
      row.classList.add('is-focus', 'is-open');
      window.setTimeout(() => {
        body.style.height = `${body.scrollHeight}px`;
        row.scrollIntoView({ block: 'start' });
      }, 40);
    }

    host.append(row);
  }

  return page;
}
