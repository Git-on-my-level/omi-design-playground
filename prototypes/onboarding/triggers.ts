/**
 * What makes a card arrive, and why.
 *
 * Threshold's first build fired off an invented calendar on a compressed clock:
 * the card just appeared, and you had to take its word that a meeting was close.
 * The trigger is now something on screen you can see for yourself — a calendar
 * alert, or a known person's app coming forward — and the card arrives visibly
 * *because of* it. The system chrome below is deliberately solid: on this
 * desktop only the Omi card is vibrant glass, so a solid alert reads instantly
 * as the operating system's, never as Omi's.
 *
 * Both the alerts and the "app came forward" events are synthetic. The fixture
 * has no schedule and Omi is not really watching a screen here; the point is the
 * shape of the interaction, not a real capture. Labelled as such in the README.
 */
import { initials } from './workspace';

/** A screen event that causes exactly one card. Never a queue, never a log. */
export type Trigger =
  | {
      kind: 'calendar';
      /** The event as the calendar names it. */
      event: string;
      /** Location line: a room, or "Video call". */
      where: string;
      /** Fixture seconds until the event. The card's countdown descends from this. */
      leadSeconds: number;
      /** Right side of the card eyebrow. The countdown is appended after it. */
      eyebrow: string;
      /** The dim line under the fact, naming the signal. */
      why: string;
    }
  | {
      kind: 'meet' | 'slack' | 'mail' | 'cursor';
      /** Bold line in the alert: a window title, or who it is from. */
      heading: string;
      /** The one preview line under it. */
      preview: string;
      /** Full right side of the card eyebrow, e.g. "Slack · Morgan". */
      eyebrow: string;
      why: string;
    }
  | {
      kind: 'email';
      /** Sender name — the notification leads with them, avatar and all. */
      from: string;
      /** The email's subject, set bold under the sender. */
      subject: string;
      /** The one-line body preview beneath the subject. */
      preview: string;
      eyebrow: string;
      why: string;
    };

/* ---------------------------------------------------------------------- *
 * App glyphs, small and solid. Drawn rather than imported so the module
 * stays self-contained; each reads at a glance as the app it stands for.
 * ---------------------------------------------------------------------- */

function calGlyph(day: number): string {
  return `<span class="sys-glyph sys-glyph--cal" aria-hidden="true">
    <span class="sys-cal-top"></span>
    <span class="sys-cal-day">${day}</span>
  </span>`;
}

const MEET_GLYPH = `<span class="sys-glyph sys-glyph--meet" aria-hidden="true">
  <svg viewBox="0 0 24 24"><path fill="#fff" d="M4 7.5A1.5 1.5 0 0 1 5.5 6h8A1.5 1.5 0 0 1 15 7.5v9A1.5 1.5 0 0 1 13.5 18h-8A1.5 1.5 0 0 1 4 16.5Z"/><path fill="#fff" d="m16 10 4-2.5v9L16 14Z"/></svg>
</span>`;

const SLACK_GLYPH = `<span class="sys-glyph sys-glyph--slack" aria-hidden="true">
  <svg viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M8 5v9M16 10v9"/><path d="M5 16h9M10 8h9"/></g></svg>
</span>`;

const MAIL_GLYPH = `<span class="sys-glyph sys-glyph--mail" aria-hidden="true">
  <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2.5" fill="#fff"/><path d="M4.5 8 12 13l7.5-5" fill="none" stroke="#2b7fd4" stroke-width="1.6"/></svg>
</span>`;

const CURSOR_GLYPH = `<span class="sys-glyph sys-glyph--cursor" aria-hidden="true">
  <svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M6.5 4.5h4M6.5 19.5h4M8.5 4.5v15"/><path fill="#fff" d="m13.4 7.3 6.1 3.3-2.5.8 1.7 3-1.7 1-1.7-3-1.9 1.8Z"/></svg>
</span>`;

/* ---------------------------------------------------------------------- *
 * The alert. One solid card of system chrome, top right. It is not the Omi
 * card; it is the desktop's own, and it leaves as the Omi card arrives.
 * ---------------------------------------------------------------------- */

/** How the calendar phrases time-until in its own chrome. */
function untilLabel(leadSeconds: number): string {
  const mins = Math.round(leadSeconds / 60);
  if (mins <= 0) return 'now';
  return mins === 1 ? 'in 1 minute' : `in ${mins} minutes`;
}

export function buildAlert(trigger: Trigger, day: number): HTMLElement {
  const alert = document.createElement('div');
  alert.className = `sys sys--${trigger.kind} is-arriving`;

  if (trigger.kind === 'calendar') {
    alert.innerHTML = `
      ${calGlyph(day)}
      <div class="sys-body">
        <p class="sys-app">Calendar<span class="sys-now">now</span></p>
        <p class="sys-title">${trigger.event}</p>
        <p class="sys-sub">${untilLabel(trigger.leadSeconds)} · ${trigger.where}</p>
      </div>
    `;
    return alert;
  }

  // Mail leads with the sender, avatar and all — a message, not just an app ping.
  if (trigger.kind === 'email') {
    alert.innerHTML = `
      <span class="sys-ava" aria-hidden="true">${initials(trigger.from)}</span>
      <div class="sys-body">
        <p class="sys-app">Mail<span class="sys-now">now</span></p>
        <p class="sys-title">${trigger.from}<span class="sys-unread" aria-hidden="true"></span></p>
        <p class="sys-subject">${trigger.subject}</p>
        <p class="sys-sub">${trigger.preview}</p>
      </div>
    `;
    return alert;
  }

  const GLYPHS = { meet: MEET_GLYPH, slack: SLACK_GLYPH, mail: MAIL_GLYPH, cursor: CURSOR_GLYPH };
  const APPS = { meet: 'Meet', slack: 'Slack', mail: 'Mail', cursor: 'Cursor' };
  const glyph = GLYPHS[trigger.kind];
  const app = APPS[trigger.kind];

  // Meet is a pre-join window; Cursor an agent run — each ends in an action pill.
  const pill =
    trigger.kind === 'meet'
      ? '<span class="sys-join">Join</span>'
      : trigger.kind === 'cursor'
        ? '<span class="sys-review">Review</span>'
        : '';

  alert.innerHTML = `
    ${glyph}
    <div class="sys-body">
      <p class="sys-app">${app}<span class="sys-now">now</span></p>
      <p class="sys-title">${trigger.heading}</p>
      <p class="sys-sub">${trigger.preview}</p>
      ${pill}
    </div>
  `;
  return alert;
}
