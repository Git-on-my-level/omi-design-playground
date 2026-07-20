/**
 * onboarding — the first five minutes with omi.
 *
 * A fork of threshold that keeps its bet (the just-in-time card, the people
 * intelligence, the green-room language) and throws everything else away to
 * answer one question: how does a brand-new person learn to trust this?
 *
 * The shape: a few unhurried education screens, the two permissions omi actually
 * needs, a device pairing, and then — instead of a manual — the app teaches
 * itself. A real brief arrives on the desktop, the app opens from it, and a
 * walkthrough makes you use the thing you just read about: ask a question, see
 * its receipt, follow it into the list. You learn omi by doing omi.
 *
 * Fabrication, as in threshold: the fixture has no schedule and Omi is not
 * watching a real screen; the brief, its alert, and the captured day are
 * synthetic. The permission prompts are simulated too. See the README.
 */
import { OmiMock } from '../../reference/hackathon-pack/src';
import { mountMacStage } from '../_macos-stage';
import { openOmiApp } from './chat';
import { buildAlert, type Trigger } from './triggers';
import { runOnboarding, type OnboardingResult } from './onboarding';
import { createCoach } from './walkthrough';
import { buildWorkspace, FIXTURE_NOW, firstName, type Workspace } from './workspace';
import './style.css';

const mount = document.querySelector<HTMLElement>('#root');
if (!mount) throw new Error('#root is missing from index.html');

const omi = new OmiMock({ scenario: 'power-user', latencyMs: 80 });

/** The card that teaches the JIT moment is Priya's calendar sync. */
const FOCUS_ID = 'person-priya';
const CALENDAR_TRIGGER: Trigger = {
  kind: 'calendar',
  event: 'Sync with Priya Shah',
  where: 'Video call',
  leadSeconds: 4 * 60,
  eyebrow: 'Calendar',
  why: 'Because your sync with Priya is in 4 minutes.',
};

/** The stack geometry, matching threshold: the card rests under the alert. */
const STACK_GAP = 22;

function waitFor<T extends HTMLElement>(root: ParentNode, selector: string): Promise<T> {
  return new Promise((resolve) => {
    const found = root.querySelector<T>(selector);
    if (found) return resolve(found);
    const observer = new MutationObserver(() => {
      const el = root.querySelector<T>(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  });
}

const delay = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms));

/* ---------------------------------------------------------------------- *
 * The just-in-time card, stripped to what onboarding needs: it arrives,
 * it names the moment, and it opens the app. No gestures, no countdown — the
 * walkthrough does the teaching that those interactions otherwise would.
 * ---------------------------------------------------------------------- */

function buildCard(who: string, fact: string, why: string): HTMLElement {
  const card = document.createElement('article');
  card.className = 'card is-entering';
  card.style.cursor = 'default';
  card.innerHTML = `
    <p class="eyebrow">
      <span class="who">${who}</span>
      <span class="when when-static">Calendar · in 4 min</span>
    </p>
    <h1 class="fact">${fact}</h1>
    <p class="why-now">${why}</p>
    <div class="foot" style="justify-content: flex-end">
      <button class="cta" type="button" data-open>Open in omi</button>
    </div>
    <span class="grip" aria-hidden="true"></span>
  `;
  return card;
}

async function main(): Promise<void> {
  const [snapshot, result] = await Promise.all([omi.getSnapshot(), runOnboarding(mount!)]);
  const workspace = buildWorkspace(snapshot);
  await teach(workspace, result);
}

async function teach(workspace: Workspace, result: OnboardingResult): Promise<void> {
  const stage = mountMacStage(mount!, {
    appName: 'omi',
    menus: ['File', 'Edit', 'View', 'Capture', 'Window', 'Help'],
    now: () => FIXTURE_NOW,
    filesArea: 'bottom-left',
  });

  const coach = createCoach(document.body);
  const person = workspace.personById.get(FOCUS_ID)!;
  const task = person.tasks.find((t) => t.action.status === 'open') ?? person.tasks[0]!;

  /* -- the JIT moment on the desktop --------------------------------- */

  const root = document.createElement('div');
  root.className = 'stage';
  stage.surface.append(root);

  const alert = buildAlert(CALENDAR_TRIGGER, FIXTURE_NOW.getDate());
  stage.surface.append(alert);
  // Let the alert's entrance settle before measuring, so the card rests under
  // its final resting position rather than a mid-animation one.
  await delay(420);
  // Place directly under the settled alert. No transition: the card has not
  // appeared yet, so there is nothing to animate, and a `top` transition would
  // stall under the screenshot harness's virtual clock anyway.
  root.style.transition = 'none';
  root.style.top = `${Math.round(alert.getBoundingClientRect().bottom) + STACK_GAP}px`;

  await delay(700);
  const card = buildCard(person.person.name, task.action.title, CALENDAR_TRIGGER.why);
  root.append(card);
  card.addEventListener('animationend', () => card.classList.remove('is-entering'), { once: true });

  await delay(400);
  // Spotlight the Open button itself — one click both dismisses the coach and
  // opens the app. Gating on the whole card, then waiting for Open again, ate
  // the first click and left the handoff hanging.
  const openBtn = card.querySelector<HTMLButtonElement>('[data-open]')!;
  await coach.step({
    target: openBtn,
    placement: 'left',
    title: `This is omi, ${result.name}.`,
    body: 'No feed, no app to open. A brief arrives on its own, seconds before it matters — then it leaves. Open this one.',
  });

  card.classList.add('is-handing-off');
  alert.classList.add('is-leaving');
  await delay(220);
  root.remove();
  alert.remove();

  /* -- the app teaches itself ---------------------------------------- */

  const chat = openOmiApp(stage.surface, {
    workspace,
    focusPersonId: FOCUS_ID,
    contextApp: 'Mail',
    opener: `Welcome in, ${result.name}. While you talked today I kept the thread — every promise, decision, and open loop. You are about to talk to ${firstName(person.person)}; ask me anything before you do.`,
    onClose: () => coach.destroy(),
  });
  void chat;

  const win = await waitFor<HTMLElement>(stage.surface, '.omi-window');
  await delay(700);

  const personCard = await waitFor<HTMLElement>(win, '.ctx-person');
  await coach.step({
    target: personCard,
    placement: 'right',
    title: 'It knows who is coming.',
    body: `omi opened already holding ${firstName(person.person)}: what they care about, when you last spoke, and the one thing still open between you.`,
    cta: 'Got it',
  });

  // Make them ask. The first suggestion is the whole point of chat onboarding.
  const chip = [...win.querySelectorAll<HTMLElement>('.chip')].find(
    (c) => /promise/i.test(c.textContent ?? ''),
  );
  if (!chip) throw new Error('expected "What did I promise?" chip for the walkthrough');
  await coach.step({
    target: chip,
    placement: 'top',
    title: 'You had a question.',
    body: 'That is what omi is for. Tap it — or hold ⌘ and just say it out loud.',
  });

  // The answer streams in and lands with its receipt.
  const cite = await waitFor<HTMLElement>(win, '.msg-cite-link');
  await delay(400);
  await coach.step({
    target: cite,
    placement: 'top',
    title: 'Every answer shows its receipt.',
    body: 'The exact line it came from, one tap away. omi never asks you to take its word — that is why you can trust a list you did not type.',
    cta: 'Makes sense',
  });

  // Send them into the substrate.
  const tasksNav = await waitFor<HTMLElement>(win, '[data-nav="tasks"]');
  await coach.step({
    target: tasksNav,
    placement: 'right',
    title: 'It all becomes this.',
    body: 'Everything omi hears turns into tasks like these — grouped by goal or by the people behind them. Open it.',
  });

  await waitFor<HTMLElement>(win, '.view .groups, .view .grp');
  await delay(500);
  await coach.step({
    title: `That is omi, ${result.name}.`,
    body: 'It captures the day, remembers the people, and reaches you the moment it counts. The rest you will pick up by using it.',
    cta: 'Start using omi',
  });

  coach.destroy();
  showToast(`You are all set, ${result.name}.`);
}

function showToast(text: string): void {
  const toast = document.createElement('div');
  toast.className = 'onb-toast';
  toast.textContent = text;
  document.body.append(toast);
  window.requestAnimationFrame(() => toast.classList.add('is-in'));
  window.setTimeout(() => {
    toast.classList.remove('is-in');
    window.setTimeout(() => toast.remove(), 400);
  }, 3200);
}

void main();
