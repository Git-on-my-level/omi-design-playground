/**
 * The onboarding flow, up to the moment the app takes over.
 *
 * Three beats: teach what omi is (a few unhurried education screens), ask for the
 * two permissions it actually needs, and connect a device — or choose to run on
 * this Mac's mic instead. Then it steps aside and lets the app do the rest of the
 * teaching, by making you use it.
 *
 * The permission prompts are simulated: this is a design surface, not a real
 * install, and a real `getUserMedia` call hangs headless Chrome anyway. Clicking
 * "Allow" plays the granted state and moves on. Said plainly in the README.
 */

export interface OnboardingResult {
  name: string;
  /** False when the user chose to run on the Mac's mic instead of a device. */
  usingDevice: boolean;
}

type Scene =
  | { kind: 'hero' }
  | { kind: 'teach'; glyph: Glyph; eyebrow: string; title: string; body: string }
  | { kind: 'permission'; glyph: Glyph; eyebrow: string; title: string; body: string; allow: string; granted: string }
  | { kind: 'device' }
  | { kind: 'name' };

type Glyph = 'wave' | 'bell' | 'people' | 'spark' | 'device';

const SCENES: Scene[] = [
  { kind: 'hero' },
  {
    kind: 'teach',
    glyph: 'wave',
    eyebrow: 'What omi does',
    title: 'It listens to your day.',
    body: 'Your conversations become memories, decisions, and the things you said you would do — without you taking a single note.',
  },
  {
    kind: 'teach',
    glyph: 'spark',
    eyebrow: 'What omi does',
    title: 'It reaches you right before it matters.',
    body: 'No feed to check. omi surfaces the one thing you need in the seconds before you walk into the room, then gets out of the way.',
  },
  {
    kind: 'teach',
    glyph: 'people',
    eyebrow: 'What omi does',
    title: 'It remembers people, so you do not have to.',
    body: 'What they care about, when you last spoke, what you still owe them — ready the moment their name comes up.',
  },
  {
    kind: 'permission',
    glyph: 'wave',
    eyebrow: 'Permission · 1 of 2',
    title: 'Let omi hear your conversations.',
    body: 'The microphone is how omi captures the day it later hands back to you. Audio is processed for memories and never leaves your account.',
    allow: 'Allow microphone',
    granted: 'Microphone on',
  },
  {
    kind: 'permission',
    glyph: 'bell',
    eyebrow: 'Permission · 2 of 2',
    title: 'Let omi reach you at the right moment.',
    body: 'Notifications are how a brief arrives seconds before a call or a handoff. omi stays quiet otherwise — one card, one moment, never a stream.',
    allow: 'Allow notifications',
    granted: 'Notifications on',
  },
  { kind: 'device' },
  { kind: 'name' },
];

/* ---- small drawn glyphs, no external assets --------------------------- */

const GLYPHS: Record<Glyph, string> = {
  wave: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M10 24h2M17 16v16M24 9v30M31 16v16M38 24h0M38 21v6"/></svg>`,
  bell: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8a10 10 0 0 0-10 10c0 9-3 12-4 14h28c-1-2-4-5-4-14A10 10 0 0 0 24 8Z"/><path d="M20 38a4 4 0 0 0 8 0"/></svg>`,
  people: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="6"/><path d="M8 38c0-6 4.5-10 10-10s10 4 10 10"/><circle cx="33" cy="20" r="5"/><path d="M31 29c5 0 9 4 9 9"/></svg>`,
  spark: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 7v9M24 32v9M7 24h9M32 24h9M13 13l6 6M29 29l6 6M35 13l-6 6M19 29l-6 6"/></svg>`,
  device: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="3.4" fill="currentColor" stroke="none"/><path d="M24 6v4M24 38v4M6 24h4M38 24h4"/></svg>`,
};

export function runOnboarding(mount: HTMLElement): Promise<OnboardingResult> {
  const root = document.createElement('div');
  root.className = 'onb';
  root.innerHTML = `
    <div class="onb-bg" aria-hidden="true"></div>
    <div class="onb-stage" data-stage></div>
    <div class="onb-foot">
      <div class="onb-dots" data-dots></div>
    </div>
  `;
  mount.append(root);

  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const dots = root.querySelector<HTMLElement>('[data-dots]')!;

  let index = 0;
  const result: OnboardingResult = { name: 'Riley', usingDevice: true };

  dots.innerHTML = SCENES.map(() => '<i></i>').join('');
  const dotEls = [...dots.querySelectorAll<HTMLElement>('i')];

  function paintDots(): void {
    dotEls.forEach((d, i) => {
      d.classList.toggle('is-on', i === index);
      d.classList.toggle('is-past', i < index);
    });
  }

  return new Promise<OnboardingResult>((resolve) => {
    function finish(): void {
      root.classList.add('is-leaving');
      window.setTimeout(() => {
        root.remove();
        resolve(result);
      }, 520);
    }

    function advance(): void {
      if (index >= SCENES.length - 1) {
        finish();
        return;
      }
      index += 1;
      show();
    }

    function show(): void {
      const scene = SCENES[index]!;
      const prev = stage.firstElementChild as HTMLElement | null;
      const el = renderScene(scene, { result, advance });
      el.classList.add('is-entering');
      if (prev) {
        prev.classList.add('is-exiting');
        window.setTimeout(() => prev.remove(), 420);
      }
      stage.append(el);
      window.requestAnimationFrame(() => el.classList.remove('is-entering'));
      paintDots();
    }

    show();
  });
}

interface SceneCtx {
  result: OnboardingResult;
  advance(): void;
}

function renderScene(scene: Scene, ctx: SceneCtx): HTMLElement {
  const el = document.createElement('section');
  el.className = `onb-scene onb-${scene.kind}`;

  if (scene.kind === 'hero') {
    el.innerHTML = `
      <div class="onb-hero-mark">omi</div>
      <h1 class="onb-hero-line">The AI that remembers your day,<br>so you can be present for it.</h1>
      <button class="onb-cta" type="button" data-next>Get started</button>
      <p class="onb-hero-sub">Takes about a minute</p>
    `;
    el.querySelector<HTMLButtonElement>('[data-next]')!.addEventListener('click', ctx.advance);
    return el;
  }

  if (scene.kind === 'teach') {
    el.innerHTML = `
      <span class="onb-glyph">${GLYPHS[scene.glyph]}</span>
      <p class="onb-eyebrow">${scene.eyebrow}</p>
      <h1 class="onb-title">${scene.title}</h1>
      <p class="onb-body">${scene.body}</p>
      <button class="onb-cta" type="button" data-next>Continue</button>
    `;
    el.querySelector<HTMLButtonElement>('[data-next]')!.addEventListener('click', ctx.advance);
    return el;
  }

  if (scene.kind === 'permission') {
    el.innerHTML = `
      <span class="onb-glyph onb-glyph-perm">${GLYPHS[scene.glyph]}</span>
      <p class="onb-eyebrow">${scene.eyebrow}</p>
      <h1 class="onb-title">${scene.title}</h1>
      <p class="onb-body">${scene.body}</p>
      <button class="onb-cta" type="button" data-allow>${scene.allow}</button>
    `;
    const btn = el.querySelector<HTMLButtonElement>('[data-allow]')!;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-granted')) return;
      // Simulated grant: a beat of "asking", then the granted state, then move on.
      btn.classList.add('is-asking');
      btn.disabled = true;
      window.setTimeout(() => {
        btn.classList.remove('is-asking');
        btn.classList.add('is-granted');
        btn.innerHTML = `<span class="onb-check" aria-hidden="true"></span>${scene.granted}`;
        window.setTimeout(ctx.advance, 620);
      }, 720);
    });
    return el;
  }

  if (scene.kind === 'device') {
    el.innerHTML = `
      <span class="onb-glyph onb-glyph-perm">${GLYPHS.device}</span>
      <p class="onb-eyebrow">Your device</p>
      <h1 class="onb-title">Connect your Omi.</h1>
      <p class="onb-body">The pendant captures the conversations your phone and Mac miss. Bring it close to pair.</p>
      <div class="onb-scan" data-scan>
        <span class="onb-scan-ring"></span>
        <span class="onb-scan-ring"></span>
        <span class="onb-scan-label">Searching…</span>
      </div>
      <button class="onb-ghost" type="button" data-nodevice>I will use this Mac's mic for now</button>
    `;
    const scan = el.querySelector<HTMLElement>('[data-scan]')!;
    const label = el.querySelector<HTMLElement>('.onb-scan-label')!;
    // Pairing timers keep firing after the user picks "use this Mac" — without
    // a latch they would advance past the name scene on their own.
    let left = false;
    const leave = (usingDevice: boolean): void => {
      if (left) return;
      left = true;
      ctx.result.usingDevice = usingDevice;
      ctx.advance();
    };
    window.setTimeout(() => {
      if (left) return;
      scan.classList.add('is-found');
      label.textContent = 'Omi found';
    }, 1500);
    window.setTimeout(() => {
      if (left) return;
      scan.classList.add('is-paired');
      label.textContent = 'Paired · 64%';
      window.setTimeout(() => leave(true), 900);
    }, 2600);
    el.querySelector<HTMLButtonElement>('[data-nodevice]')!.addEventListener('click', () => leave(false));
    return el;
  }

  // name
  el.innerHTML = `
    <p class="onb-eyebrow">One last thing</p>
    <h1 class="onb-title">What should omi call you?</h1>
    <form class="onb-nameform" data-form>
      <input class="onb-nameinput" type="text" value="Riley" autocomplete="off" spellcheck="false" aria-label="Your name" />
      <button class="onb-cta" type="submit">Enter omi</button>
    </form>
  `;
  const form = el.querySelector<HTMLFormElement>('[data-form]')!;
  const input = el.querySelector<HTMLInputElement>('.onb-nameinput')!;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (name) ctx.result.name = name.split(' ')[0]!;
    ctx.advance();
  });
  window.setTimeout(() => input.focus({ preventScroll: true }), 400);
  return el;
}
