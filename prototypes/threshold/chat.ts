/**
 * The window Threshold hands off to.
 *
 * Threshold itself never becomes browsable — the moment you want to *do*
 * something with a brief, the card retires and this window takes over. It opens
 * already knowing what you were looking at, which is the whole point: the
 * context cards at the top are the card you just dismissed, restated as objects
 * you can act on.
 *
 * Context cards are typed. A person resolves to a contact card, a commitment to
 * a task card. Adding a third kind means adding a branch here, not a new layout.
 */
import type { Conversation, Memory, Person, SuggestedAction } from '../../reference/hackathon-pack/src/types';
import { createVoiceInput, pushToTalk } from '../_voice';

export interface ChatContext {
  person: Person;
  action: SuggestedAction;
  source?: Conversation;
  /** Every memory that names this person, most relevant first. */
  memories: Memory[];
  /** Rendered relative day for the last exchange, e.g. "6 days ago". */
  lastSpoke?: string;
  dueLabel?: string;
}

export interface OmiChat {
  close(): void;
}

type CardKind = 'person' | 'task';

/** Matches the meter on the card, so the same voice reads as the same object. */
const WAVE_BARS = 26;

interface Prompt {
  label: string;
  question: string;
  answer(context: ChatContext): { text: string; quote?: string; cite?: string };
}

/* ---------------------------------------------------------------------- *
 * Replies
 *
 * Composed here rather than through `askAssistant`, which returns a generic
 * "a useful starting point is…" string. Every line below resolves to real
 * fixture data, so the window reads like an assistant that has the context.
 * ---------------------------------------------------------------------- */

const firstName = (person: Person): string => person.name.split(' ')[0]!;

/** The transcript line the commitment came from, preferring one that names it. */
function receiptLine(context: ChatContext): { speaker: string; text: string } | undefined {
  const segments = context.source?.segments ?? [];
  const keyword = context.action.title.split(' ').find((word) => word.length > 5)?.toLowerCase();
  const matched = keyword
    ? segments.find((segment) => segment.text.toLowerCase().includes(keyword))
    : undefined;
  return matched ?? segments[0];
}

function byKind(context: ChatContext, kind: Memory['kind']): Memory | undefined {
  return context.memories.find((memory) => memory.kind === kind);
}

const PROMPTS: Prompt[] = [
  {
    label: 'What did I promise?',
    question: `What exactly did I promise ${'{first}'}?`,
    answer: (context) => {
      const line = receiptLine(context);
      return {
        text: `You committed to this: “${context.action.title}”. It came out of one exchange, not a thread — here is the line it came from.`,
        quote: line ? `${line.speaker}: ${line.text}` : undefined,
        cite: context.source?.title,
      };
    },
  },
  {
    label: 'What matters to her?',
    question: 'What should I keep in mind about her?',
    answer: (context) => {
      const relationship = byKind(context, 'relationship');
      const preference = byKind(context, 'preference');
      const lines = [relationship?.text, preference?.text].filter(Boolean) as string[];
      return {
        text: lines.length
          ? lines.map((line) => `· ${line}`).join('\n')
          : `Nothing beyond the commitment itself has come up with ${firstName(context.person)} yet.`,
        cite: `${context.memories.length} memories`,
      };
    },
  },
  {
    label: 'Draft the follow-up',
    question: 'Draft the follow-up note.',
    answer: (context) => ({
      text: `${firstName(context.person)} — following up on what I owed you after ${(context.source?.title ?? 'our last conversation').toLowerCase()}. ${context.action.title} is coming your way${context.dueLabel ? ` ${context.dueLabel.toLowerCase()}` : ''}. Shout if the shape of it is wrong and I will redo it.`,
      cite: 'Draft · not sent',
    }),
  },
];

/* ---------------------------------------------------------------------- *
 * Context cards
 * ---------------------------------------------------------------------- */

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

function contextCard(kind: CardKind, context: ChatContext): HTMLElement {
  const card = document.createElement('div');
  card.className = `ctx ctx-${kind}`;

  if (kind === 'person') {
    const meta = [context.lastSpoke && `Last spoke ${context.lastSpoke}`, `${context.memories.length} memories`]
      .filter(Boolean)
      .join(' · ');
    card.innerHTML = `
      <span class="ctx-avatar">${initials(context.person.name)}</span>
      <div class="ctx-body">
        <p class="ctx-title">${context.person.name}</p>
        <p class="ctx-sub">${context.person.relationship}</p>
        <p class="ctx-meta">${meta}</p>
      </div>
      <span class="ctx-kind">Contact</span>
    `;
    return card;
  }

  const meta = [context.dueLabel, context.source && `from ${context.source.title}`].filter(Boolean).join(' · ');
  card.innerHTML = `
    <button class="ctx-check" type="button" aria-pressed="false" aria-label="Mark complete"></button>
    <div class="ctx-body">
      <p class="ctx-title ctx-task">${context.action.title}</p>
      <p class="ctx-meta">${meta}</p>
    </div>
    <span class="ctx-kind">Task</span>
  `;

  const check = card.querySelector<HTMLButtonElement>('.ctx-check')!;
  check.addEventListener('click', () => {
    const next = card.classList.toggle('is-complete');
    check.setAttribute('aria-pressed', String(next));
  });

  return card;
}

/* ---------------------------------------------------------------------- *
 * The window
 * ---------------------------------------------------------------------- */

export function openOmiChat(
  host: HTMLElement,
  context: ChatContext,
  onClose: () => void,
  /** A question spoken at the card, carried straight into the thread. */
  asking?: string,
): OmiChat {
  const win = document.createElement('section');
  win.className = 'omi-window is-opening';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', `omi — ${context.person.name}`);

  win.innerHTML = `
    <header class="win-bar" data-drag>
      <span class="lights"><i class="l-close"></i><i class="l-min"></i><i class="l-max"></i></span>
      <span class="win-title">${context.person.name}</span>
    </header>
    <div class="win-body">
      <div class="ctx-rail" data-rail></div>
      <div class="thread" data-thread></div>
    </div>
    <footer class="win-foot">
      <div class="chips" data-chips></div>
      <form class="composer" data-composer>
        <input
          class="composer-input"
          type="text"
          autocomplete="off"
          placeholder="Ask about ${firstName(context.person)}…"
          data-input
        />
        <span class="composer-wave" data-wave aria-hidden="true">${'<i></i>'.repeat(WAVE_BARS)}</span>
        <kbd class="composer-key">⌘</kbd>
        <button class="composer-send" type="submit" aria-label="Send">↵</button>
      </form>
    </footer>
  `;

  const rail = win.querySelector<HTMLElement>('[data-rail]')!;
  const thread = win.querySelector<HTMLElement>('[data-thread]')!;
  const chips = win.querySelector<HTMLElement>('[data-chips]')!;
  const form = win.querySelector<HTMLFormElement>('[data-composer]')!;
  const input = win.querySelector<HTMLInputElement>('[data-input]')!;

  rail.append(contextCard('person', context), contextCard('task', context));

  /* -- thread ---------------------------------------------------------- */

  function scrollToEnd(): void {
    thread.scrollTop = thread.scrollHeight;
  }

  function addUser(text: string): void {
    const bubble = document.createElement('p');
    bubble.className = 'msg msg-user';
    bubble.textContent = text;
    thread.append(bubble);
    scrollToEnd();
  }

  function addOmi(body: { text: string; quote?: string; cite?: string }, thinking = true): void {
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

  /*
   * The opener orients; it does not pre-empt. If a question arrived with you
   * from the card, the receipt belongs in the answer to that question, not
   * here — printing it twice makes the assistant look like it is repeating
   * itself before you have said anything.
   */
  const line = receiptLine(context);
  addOmi(
    asking
      ? {
          text: `One thing is still open with ${firstName(context.person)}${context.lastSpoke ? `, and has been since you spoke ${context.lastSpoke}` : ''}.`,
        }
      : {
          text: `You are about to talk to ${firstName(context.person)}, and there is one thing outstanding${context.dueLabel ? ` — ${context.dueLabel.toLowerCase()}` : ''}.`,
          quote: line ? `${line.speaker}: ${line.text}` : undefined,
          cite: context.source?.title,
        },
    false,
  );

  /* -- prompts --------------------------------------------------------- */

  function ask(prompt: Prompt): void {
    addUser(prompt.question.replace('{first}', firstName(context.person)));
    addOmi(prompt.answer(context));
  }

  const chipFor = new Map<Prompt, HTMLElement>();

  for (const prompt of PROMPTS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = prompt.label;
    chip.addEventListener('click', () => {
      chip.remove();
      ask(prompt);
    });
    chips.append(chip);
    chipFor.set(prompt, chip);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUser(text);
    // Free text lands on the closest canned prompt; the fixture has no LLM.
    const match =
      PROMPTS.find((prompt) =>
        prompt.label
          .toLowerCase()
          .split(' ')
          .some((word) => word.length > 3 && text.toLowerCase().includes(word)),
      ) ?? PROMPTS[0]!;
    addOmi(match.answer(context));
  });

  /* -- push to talk ---------------------------------------------------- *
   *
   * The same hold that filled the card fills the composer here. Holding right
   * ⌘ turns the input into a meter and types into it; releasing sends.
   * -------------------------------------------------------------------- */

  const bars = [...win.querySelectorAll<HTMLElement>('[data-wave] i')];
  const DICTATION = 'Draft the follow-up and remind me what she cares about';
  const dictated = DICTATION.split(' ');
  let spoken = 0;
  let history = new Array<number>(WAVE_BARS).fill(0);
  let reveal: number | undefined;

  const voice = createVoiceInput({
    onLevel: ({ level }) => {
      history = [...history.slice(1), level];
      for (const [i, bar] of bars.entries()) {
        const taper = Math.sin((i / (WAVE_BARS - 1)) * Math.PI) * 0.45 + 0.55;
        bar.style.transform = `scaleY(${0.08 + history[i]! * taper * 0.92})`;
      }
    },
    onSpeechStart: () => win.classList.add('is-hearing'),
    onSpeechEnd: () => win.classList.remove('is-hearing'),
  });

  const unbindPtt = pushToTalk({
    onPress: () => {
      if (closed) return;
      spoken = 0;
      input.value = '';
      win.classList.add('is-listening');
      void voice.start();
      reveal = window.setInterval(() => {
        if (spoken >= dictated.length) return;
        spoken += 1;
        input.value = dictated.slice(0, spoken).join(' ');
      }, 170);
    },
    onRelease: () => {
      if (reveal !== undefined) window.clearInterval(reveal);
      reveal = undefined;
      voice.stop();
      win.classList.remove('is-listening', 'is-hearing');
      if (spoken < 2) {
        input.value = '';
        return;
      }
      input.value = DICTATION;
      window.setTimeout(() => form.requestSubmit(), 300);
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
  window.setTimeout(() => input.focus({ preventScroll: true }), 260);

  // Carried in from the card: the question was already asked out loud.
  if (asking) {
    // It was already asked out loud, so it is no longer on offer.
    chipFor.get(PROMPTS[0]!)?.remove();
    window.setTimeout(() => {
      addUser(asking);
      addOmi(PROMPTS[0]!.answer(context));
    }, 420);
  }

  return { close };
}
