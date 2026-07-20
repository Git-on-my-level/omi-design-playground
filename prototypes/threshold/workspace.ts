/**
 * The shape behind the app views.
 *
 * The fixture gives us people, conversations, memories, and a flat list of 20
 * actions. It does *not* give us goals — so goals are derived here, from the
 * conversations the actions came out of. That is the honest join available: a
 * commitment made in the workshop debrief and one made in the roadmap workshop
 * really are about the same thing, and grouping by their source conversation
 * recovers that without inventing a relationship the data cannot support.
 *
 * The alternative — hardcoding action IDs to goal IDs — would look identical on
 * screen and be a lie about where the structure came from.
 */
import type { Conversation, Memory, OmiSnapshot, Person, SuggestedAction } from '../../reference/hackathon-pack/src/types';

export const FIXTURE_NOW = new Date('2026-07-20T18:16:00.000Z');

interface GoalDefinition {
  id: string;
  title: string;
  /** Why this cluster is one thing. Shown under the title. */
  intent: string;
  conversations: string[];
  /** Actions with no conversation of their own that still belong here. */
  orphans?: string[];
}

const GOAL_DEFINITIONS: GoalDefinition[] = [
  {
    id: 'goal-pilot',
    title: 'Ship the narrow export pilot',
    intent: 'One deliberately small slice, and a written record of what it does not solve.',
    conversations: [
      'conv-0720-workshop-debrief',
      'conv-0720-morning-focus',
      'conv-0716-roadmap-workshop',
      'conv-0714-client-discovery',
    ],
  },
  {
    id: 'goal-research',
    title: 'Make the research trail legible',
    intent: 'Every claim should be traceable to the conversation that produced it.',
    conversations: [
      'conv-0714-research-triage',
      'conv-0718-design-studio',
      'conv-0715-sprint-plan',
      'conv-0716-ops-handoff',
    ],
  },
  {
    id: 'goal-trip',
    title: 'Leave for the trip without loose ends',
    intent: 'Packing, buffers, and the things that only matter the morning you go.',
    conversations: ['conv-0717-travel-plan'],
    orphans: ['action-019'],
  },
  {
    id: 'goal-practice',
    title: 'Keep the working practice honest',
    intent: 'The habits that decide whether any of the above actually happens.',
    conversations: [
      'conv-0719-retro',
      'conv-0715-lunch-walk',
      'conv-0713-weekly-review',
      'conv-0720-evening-review',
      'conv-0717-quiet-reading',
    ],
  },
  {
    id: 'goal-life',
    title: 'Keep life outside work from piling up',
    intent: 'The short list that stays short.',
    conversations: ['conv-0719-community-call', 'conv-0718-home-admin'],
  },
];

/**
 * A screen Omi says it saw while a task was moving. Fabricated: the fixture has
 * no screenshots and nothing here captures a real screen. These are rendered as
 * mock-window thumbnails and labelled "seen on screen", never presented as real
 * images. `state` places the screen on the arc from first opened to done.
 */
export interface ScreenCapture {
  /** App the screen was seen in. Drives the mock chrome and its glyph. */
  app: string;
  /** The one line of what was on screen. */
  caption: string;
  /** When it was on screen, already formatted for display. */
  at: string;
  state: 'opened' | 'progress' | 'done';
}

/*
 * Fabricated screen trails, keyed by action id. The SDK has no screenshots, so
 * every entry here is written, not observed — the app renders them as mock
 * windows labelled "seen on screen". Only a handful of actions carry one; the
 * rest fall back to their transcript receipt alone.
 */
const SCREEN_CAPTURES: Record<string, ScreenCapture[]> = {
  'action-001': [
    { app: 'Pages', caption: 'Started the decision trail doc', at: '2:12 PM', state: 'opened' },
    { app: 'Drive', caption: 'Shared the workshop export folder', at: '3:41 PM', state: 'progress' },
    { app: 'Mail', caption: 'Draft to Priya, not sent', at: '5:06 PM', state: 'done' },
  ],
  'action-002': [
    { app: 'Meet', caption: 'Export pilot review with Taylor', at: '4:27 PM', state: 'opened' },
    { app: 'Code review', caption: 'Export shape pull request', at: '5:02 PM', state: 'progress' },
  ],
  'action-005': [
    { app: 'Pages', caption: 'Smallest useful slice outline', at: '10:20 AM', state: 'opened' },
    { app: 'Mail', caption: 'Sent the outline to Avery', at: '11:58 AM', state: 'done' },
  ],
  'action-006': [
    { app: 'Slack', caption: 'Morgan on the workaround pattern', at: '4:48 PM', state: 'opened' },
  ],
  'action-011': [
    { app: 'Figma', caption: 'Thread-first prototype frame', at: '1:33 PM', state: 'opened' },
    { app: 'Figma', caption: 'Progressive map reveal', at: '2:15 PM', state: 'progress' },
  ],
};

export interface TaskView {
  action: SuggestedAction;
  goal: GoalView;
  /** Present when the action title names someone. Roughly a quarter of them do. */
  person?: Person;
  source?: Conversation;
  dueLabel?: string;
  overdue: boolean;
  /** Fabricated screen-capture trail, when one is defined for this action. */
  screens?: ScreenCapture[];
}

export interface GoalView {
  id: string;
  title: string;
  intent: string;
  tasks: TaskView[];
  open: number;
  done: number;
  /** Everyone named by a task under this goal. */
  people: Person[];
}

export interface PersonView {
  person: Person;
  memories: Memory[];
  tasks: TaskView[];
  conversations: Conversation[];
  goals: GoalView[];
  lastSpoke?: string;
}

export interface Workspace {
  me: Person;
  goals: GoalView[];
  tasks: TaskView[];
  people: PersonView[];
  personById: Map<string, PersonView>;
  taskById: Map<string, TaskView>;
}

/* ---------------------------------------------------------------------- */

export function relativeDays(from: string, to: Date = FIXTURE_NOW): string {
  const days = Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/** Actions carry exactly one `dueAt`, so this is the only time language there is. */
export function dueLabel(dueAt: string | undefined, now: Date = FIXTURE_NOW): string | undefined {
  if (!dueAt) return undefined;
  const days = Math.round((new Date(dueAt).getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export const firstName = (person: Person): string => person.name.split(' ')[0]!;

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

/* ---------------------------------------------------------------------- */

export function buildWorkspace(snapshot: OmiSnapshot): Workspace {
  const others = snapshot.people.filter((person) => person.id !== snapshot.me.id);
  const conversationById = new Map(snapshot.conversations.map((c) => [c.id, c]));

  /*
   * Name matching is first-name only, which is fragile in general and correct
   * across this fixture. Longest name first so a substring never wins over a
   * longer match.
   */
  const byFirstName = [...others].sort((a, b) => firstName(b).length - firstName(a).length);
  const personInTitle = (title: string): Person | undefined =>
    byFirstName.find((person) => title.includes(firstName(person)));

  const goals: GoalView[] = [];
  const tasks: TaskView[] = [];
  const taskById = new Map<string, TaskView>();
  const claimed = new Set<string>();

  for (const definition of GOAL_DEFINITIONS) {
    const goal: GoalView = {
      id: definition.id,
      title: definition.title,
      intent: definition.intent,
      tasks: [],
      open: 0,
      done: 0,
      people: [],
    };

    const belongs = (action: SuggestedAction): boolean =>
      (action.conversationId !== undefined && definition.conversations.includes(action.conversationId)) ||
      (definition.orphans?.includes(action.id) ?? false);

    for (const action of snapshot.actions) {
      if (claimed.has(action.id) || !belongs(action)) continue;
      claimed.add(action.id);

      const task: TaskView = {
        action,
        goal,
        person: personInTitle(action.title),
        source: action.conversationId ? conversationById.get(action.conversationId) : undefined,
        dueLabel: dueLabel(action.dueAt),
        overdue: action.status === 'open' && action.dueAt !== undefined && new Date(action.dueAt) < FIXTURE_NOW,
        screens: SCREEN_CAPTURES[action.id],
      };

      goal.tasks.push(task);
      tasks.push(task);
      taskById.set(action.id, task);
      if (action.status === 'open') goal.open += 1;
      else goal.done += 1;
      if (task.person && !goal.people.some((p) => p.id === task.person!.id)) goal.people.push(task.person);
    }

    // Open work first, then whatever is closest to due.
    goal.tasks.sort((a, b) => {
      if ((a.action.status === 'open') !== (b.action.status === 'open')) {
        return a.action.status === 'open' ? -1 : 1;
      }
      return (a.action.dueAt ?? '9999').localeCompare(b.action.dueAt ?? '9999');
    });

    if (goal.tasks.length > 0) goals.push(goal);
  }

  goals.sort((a, b) => b.open - a.open);

  /* -- people --------------------------------------------------------- */

  const people: PersonView[] = others.map((person) => {
    const personTasks = tasks.filter((task) => task.person?.id === person.id);
    const conversations = snapshot.conversations
      .filter((conversation) => conversation.people.includes(person.id))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    const goalIds = new Set(personTasks.map((task) => task.goal.id));
    return {
      person,
      memories: snapshot.memories
        .filter((memory) => memory.people.includes(person.id))
        .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0)),
      tasks: personTasks,
      conversations,
      goals: goals.filter((goal) => goalIds.has(goal.id)),
      lastSpoke: conversations[0] ? relativeDays(conversations[0].startedAt) : undefined,
    };
  });

  // People you owe something to first, then by how recently you spoke.
  people.sort((a, b) => {
    const aOpen = a.tasks.filter((t) => t.action.status === 'open').length;
    const bOpen = b.tasks.filter((t) => t.action.status === 'open').length;
    return bOpen - aOpen || b.person.lastSeenAt.localeCompare(a.person.lastSeenAt);
  });

  return {
    me: snapshot.me,
    goals,
    tasks,
    people,
    personById: new Map(people.map((view) => [view.person.id, view])),
    taskById,
  };
}
