/**
 * Tasks and contact views.
 *
 * The whole reason these are one file: a task row and a person chip look and
 * behave identically wherever they appear, because they are literally the same
 * function. Tasks tie to people, people tie to goals, goals tie back to tasks,
 * and every one of those edges is clickable. If a row rendered differently on
 * the contact page than on the tasks page, the tie would stop reading as a tie.
 */
import type { Memory, MemoryKind } from '../../reference/hackathon-pack/src/types';
import { firstName, initials, relativeDays, type GoalView, type PersonView, type TaskView, type Workspace } from './workspace';

/** Where a click can send you. The shell owns the actual navigation. */
export interface Nav {
  person(id: string): void;
  tasks(goalId?: string): void;
  ask(question: string): void;
}

/* ---------------------------------------------------------------------- *
 * Shared pieces
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

export interface TaskRowOptions {
  /** Contact pages already say who it is; the tasks page does not. */
  showPerson?: boolean;
  /** The tasks page groups by goal, so repeating it there is noise. */
  showGoal?: boolean;
}

export function taskRow(task: TaskView, workspace: Workspace, nav: Nav, options: TaskRowOptions = {}): HTMLElement {
  const row = document.createElement('div');
  row.className = `task${task.action.status === 'done' ? ' is-done' : ''}`;

  const meta: string[] = [];
  if (task.action.status === 'open' && task.dueLabel) meta.push(task.dueLabel);
  if (task.source) meta.push(task.source.title);

  row.innerHTML = `
    <button class="task-check" type="button" aria-label="Toggle complete"></button>
    <div class="task-body">
      <p class="task-title">${task.action.title}</p>
      <p class="task-meta">${meta.join(' · ')}</p>
    </div>
    <div class="task-tail"></div>
  `;

  const tail = row.querySelector<HTMLElement>('.task-tail')!;
  if (options.showGoal) {
    const goal = document.createElement('button');
    goal.type = 'button';
    goal.className = 'gchip';
    goal.textContent = task.goal.title;
    goal.addEventListener('click', () => nav.tasks(task.goal.id));
    tail.append(goal);
  }
  if (options.showPerson && task.person) {
    const view = workspace.personById.get(task.person.id);
    if (view) tail.append(personChip(view, nav));
  }
  if (task.overdue) row.classList.add('is-overdue');

  const check = row.querySelector<HTMLButtonElement>('.task-check')!;
  check.addEventListener('click', () => row.classList.toggle('is-done'));

  return row;
}

/* ---------------------------------------------------------------------- *
 * Tasks
 * ---------------------------------------------------------------------- */

export function renderTasks(workspace: Workspace, nav: Nav, focusGoalId?: string): HTMLElement {
  const view = document.createElement('div');
  view.className = 'view view-tasks';

  const openTotal = workspace.tasks.filter((task) => task.action.status === 'open').length;

  view.innerHTML = `
    <header class="view-head">
      <div>
        <h1 class="view-title">Tasks</h1>
        <p class="view-sub">${openTotal} open across ${workspace.goals.length} goals</p>
      </div>
      <div class="seg" role="tablist">
        <button class="seg-item is-on" type="button" data-filter="open">Open</button>
        <button class="seg-item" type="button" data-filter="all">All</button>
      </div>
    </header>
    <div class="goals" data-goals></div>
  `;

  const list = view.querySelector<HTMLElement>('[data-goals]')!;
  let filter: 'open' | 'all' = 'open';

  function paint(): void {
    list.replaceChildren();
    const goals = focusGoalId ? workspace.goals.filter((goal) => goal.id === focusGoalId) : workspace.goals;

    for (const goal of goals) {
      const tasks = goal.tasks.filter((task) => filter === 'all' || task.action.status === 'open');
      if (tasks.length === 0) continue;

      const block = document.createElement('section');
      block.className = 'goal';
      block.innerHTML = `
        <header class="goal-head">
          <div class="goal-heading">
            <h2 class="goal-title">${goal.title}</h2>
            <p class="goal-intent">${goal.intent}</p>
          </div>
          <span class="goal-count">${goal.open} open</span>
        </header>
        <div class="goal-bar" aria-hidden="true">
          <span style="width:${Math.round((goal.done / goal.tasks.length) * 100)}%"></span>
        </div>
        <div class="goal-tasks" data-tasks></div>
      `;

      const taskSlot = block.querySelector<HTMLElement>('[data-tasks]')!;
      for (const task of tasks) taskSlot.append(taskRow(task, workspace, nav, { showPerson: true }));

      list.append(block);
    }
  }

  for (const button of view.querySelectorAll<HTMLButtonElement>('[data-filter]')) {
    button.addEventListener('click', () => {
      filter = button.dataset.filter === 'all' ? 'all' : 'open';
      for (const other of view.querySelectorAll('.seg-item')) other.classList.toggle('is-on', other === button);
      paint();
    });
  }

  paint();
  return view;
}

/* ---------------------------------------------------------------------- *
 * Contact
 * ---------------------------------------------------------------------- */

/*
 * `memory.people` means "involved in this", not "this is about them" — a
 * preference of Riley's recorded in a conversation with Morgan carries both
 * ids. Labelling that group "Preferences" on Morgan's page silently asserts it
 * is Morgan's. These labels state the relationship the data actually supports.
 */
const KIND_LABEL: Record<MemoryKind, string> = {
  relationship: 'How you work together',
  preference: 'Preferences that came up',
  commitment: 'Commitments made',
  fact: 'Facts established',
  insight: 'Insights',
};

const KIND_ORDER: MemoryKind[] = ['relationship', 'preference', 'commitment', 'insight', 'fact'];

export function renderContact(view: PersonView, workspace: Workspace, nav: Nav): HTMLElement {
  const page = document.createElement('div');
  page.className = 'view view-contact';

  const open = view.tasks.filter((task) => task.action.status === 'open');
  const stats = [
    `${open.length} open`,
    `${view.memories.length} memories`,
    `${view.conversations.length} conversations`,
  ].join(' · ');

  page.innerHTML = `
    <header class="contact-head">
      <span class="contact-face">${initials(view.person.name)}</span>
      <div class="contact-id">
        <h1 class="contact-name">${view.person.name}</h1>
        <p class="contact-rel">${view.person.relationship}</p>
        <p class="contact-stats">${view.lastSpoke ? `Last spoke ${view.lastSpoke} · ` : ''}${stats}</p>
      </div>
      <button class="contact-ask" type="button" data-ask>Ask about ${firstName(view.person)}</button>
    </header>
    <div class="contact-body" data-body></div>
  `;

  page.querySelector<HTMLButtonElement>('[data-ask]')!.addEventListener('click', () => {
    nav.ask(`What should I know before I talk to ${firstName(view.person)}?`);
  });

  const body = page.querySelector<HTMLElement>('[data-body]')!;

  function section(title: string, note?: string): HTMLElement {
    const element = document.createElement('section');
    element.className = 'csec';
    element.innerHTML = `<h2 class="csec-title">${title}</h2>${note ? `<p class="csec-note">${note}</p>` : ''}`;
    body.append(element);
    return element;
  }

  /* -- what you owe them ---------------------------------------------- */

  if (view.tasks.length > 0) {
    const block = section('Open with them');
    for (const task of view.tasks) block.append(taskRow(task, workspace, nav, { showGoal: true }));
  }

  /* -- the goals they touch ------------------------------------------- */

  if (view.goals.length > 0) {
    const block = section(
      'Where they fit',
      'Goals this person has commitments under.',
    );
    for (const goal of view.goals) block.append(goalCard(goal, nav));
  }

  /* -- what you know ---------------------------------------------------- */

  if (view.memories.length > 0) {
    const block = section('What you know', 'From conversations that included them.');
    const grouped = new Map<MemoryKind, Memory[]>();
    for (const memory of view.memories) {
      grouped.set(memory.kind, [...(grouped.get(memory.kind) ?? []), memory]);
    }
    for (const kind of KIND_ORDER) {
      const memories = grouped.get(kind);
      if (!memories) continue;
      const group = document.createElement('div');
      group.className = 'mgroup';
      group.innerHTML = `<p class="mgroup-label">${KIND_LABEL[kind]}</p>`;
      for (const memory of memories) {
        const line = document.createElement('p');
        line.className = 'mline';
        line.textContent = memory.text;
        group.append(line);
      }
      block.append(group);
    }
  }

  /* -- history --------------------------------------------------------- */

  if (view.conversations.length > 0) {
    const block = section('Together');
    for (const conversation of view.conversations.slice(0, 5)) {
      const row = document.createElement('div');
      row.className = 'conv';
      row.innerHTML = `
        <p class="conv-title">${conversation.title}</p>
        <p class="conv-meta">${relativeDays(conversation.startedAt)} · ${conversation.segments.length} exchanges</p>
        <p class="conv-sum">${conversation.summary}</p>
      `;
      block.append(row);
    }
  }

  return page;
}

function goalCard(goal: GoalView, nav: Nav): HTMLElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'gcard';
  card.innerHTML = `
    <span class="gcard-title">${goal.title}</span>
    <span class="gcard-meta">${goal.open} open · ${goal.done} done</span>
    <span class="gcard-bar"><i style="width:${Math.round((goal.done / goal.tasks.length) * 100)}%"></i></span>
  `;
  card.addEventListener('click', () => nav.tasks(goal.id));
  return card;
}
