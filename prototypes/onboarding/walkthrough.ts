/**
 * The walkthrough layer — omi teaches by making you use it.
 *
 * After the education and permission screens, the app does not lecture. It hands
 * you a spotlight and one instruction at a time, and only advances when you have
 * actually done the thing. A coach step either offers a Next button (for a point
 * you only need to read) or waits for you to click the highlighted element (for a
 * point you learn by doing). The scrim is visual only — pointer-events stay off
 * it — so the real UI underneath is always live and the thing you are told to
 * click is genuinely clickable.
 */

export interface CoachStep {
  /** The element to spotlight. Omitted for a centered message with no target. */
  target?: HTMLElement | null;
  title: string;
  body: string;
  /** A button that advances on click. Omit to gate on the target being used. */
  cta?: string;
  /** Where the tooltip sits relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Extra padding around the spotlight hole. */
  pad?: number;
}

export interface Coach {
  step(opts: CoachStep): Promise<void>;
  destroy(): void;
}

export function createCoach(host: HTMLElement): Coach {
  const layer = document.createElement('div');
  layer.className = 'coach-layer';
  const hole = document.createElement('div');
  hole.className = 'coach-hole';
  const tip = document.createElement('div');
  tip.className = 'coach-tip';
  tip.setAttribute('role', 'dialog');
  layer.append(hole, tip);
  host.append(layer);

  let raf = 0;

  function place(target: HTMLElement | null | undefined, placement: CoachStep['placement'], pad: number): void {
    const r = target?.getBoundingClientRect();
    // No target, or a target that has been removed from the layout (a chip that
    // just became a sent message): centre the tip and drop the spotlight.
    if (!target || !r || (r.width === 0 && r.height === 0)) {
      hole.style.opacity = '0';
      tip.dataset.place = 'center';
      tip.style.left = '50%';
      tip.style.top = '50%';
      tip.style.transform = 'translate(-50%, -50%)';
      return;
    }
    hole.style.opacity = '1';
    hole.style.left = `${r.left - pad}px`;
    hole.style.top = `${r.top - pad}px`;
    hole.style.width = `${r.width + pad * 2}px`;
    hole.style.height = `${r.height + pad * 2}px`;

    const gap = 14;
    const tr = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Pick a side that fits; fall back to whichever has the most room.
    let side = placement && placement !== 'center' ? placement : 'bottom';
    const fits = {
      bottom: r.bottom + gap + tr.height < vh,
      top: r.top - gap - tr.height > 0,
      right: r.right + gap + tr.width < vw,
      left: r.left - gap - tr.width > 0,
    };
    if (!fits[side as keyof typeof fits]) {
      side = (['bottom', 'top', 'right', 'left'] as const).find((s) => fits[s]) ?? 'bottom';
    }
    tip.dataset.place = side;
    tip.style.transform = 'none';
    let left = r.left + r.width / 2 - tr.width / 2;
    let top = r.top + r.height / 2 - tr.height / 2;
    if (side === 'bottom') {
      top = r.bottom + gap;
    } else if (side === 'top') {
      top = r.top - gap - tr.height;
    } else if (side === 'right') {
      left = r.right + gap;
    } else {
      left = r.left - gap - tr.width;
    }
    left = Math.max(12, Math.min(left, vw - tr.width - 12));
    top = Math.max(12, Math.min(top, vh - tr.height - 12));
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function step(opts: CoachStep): Promise<void> {
    const pad = opts.pad ?? 8;
    const gated = !opts.cta;
    tip.innerHTML = `
      <p class="coach-title">${opts.title}</p>
      <p class="coach-body">${opts.body}</p>
      ${opts.cta ? `<button class="coach-next" type="button">${opts.cta}</button>` : '<p class="coach-hint">Try it to continue</p>'}
    `;
    // Fade the tooltip in fresh so each step reads as a new beat.
    tip.classList.remove('is-in');
    void tip.offsetWidth;
    tip.classList.add('is-in');
    if (opts.target) opts.target.classList.add('coach-target');

    // Keep the spotlight glued to a target that may scroll or animate.
    const follow = (): void => {
      place(opts.target, opts.placement, pad);
      raf = requestAnimationFrame(follow);
    };
    cancelAnimationFrame(raf);
    follow();

    return new Promise<void>((resolve) => {
      const finish = (): void => {
        cancelAnimationFrame(raf);
        if (opts.target) opts.target.classList.remove('coach-target');
        // Fade the tip and drop the spotlight so the next beat starts clean,
        // even if the following step has to wait (e.g. for an answer to stream).
        tip.classList.remove('is-in');
        hole.style.opacity = '0';
        resolve();
      };
      if (gated && opts.target) {
        const onUse = (): void => {
          opts.target!.removeEventListener('click', onUse, true);
          // Let the underlying click's own handler run first.
          window.setTimeout(finish, 30);
        };
        opts.target.addEventListener('click', onUse, true);
      } else {
        tip.querySelector<HTMLButtonElement>('.coach-next')?.addEventListener('click', finish, { once: true });
      }
    });
  }

  return {
    step,
    destroy(): void {
      cancelAnimationFrame(raf);
      layer.remove();
    },
  };
}
