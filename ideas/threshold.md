# Threshold

> The twenty seconds before you walk into the room.

## Thesis

Every other Omi surface answers *"what happened?"* Threshold answers **"what am I about to walk into?"** It is the only concept here that fires *before* the conversation, and the only one the user never opens — it opens itself, then leaves.

You are four minutes from a call with Priya. A panel arrives. It tells you the one thing you promised her, the thread you left open, and the fact it would cost you to have forgotten. You read it in six seconds. It goes away. You never searched for anything.

This is not recall. It is **readiness**.

## Orthogonal on

- **Time** — prospective, not retrospective.
- **Initiative** — the app speaks first; the user never navigates.
- **Surface** — one card. No nav, no list, no back button, nothing to browse.

## The demo

Time-compress the calendar so a meeting is always 60 seconds out. The panel slides in over whatever is on screen. Three interactions, total:

1. **Read it.** It self-dismisses when the meeting starts.
2. **Push it away** — a flick sends it off-screen with real momentum; it does not come back.
3. **Pull it deeper** — drag down and the card *unfolds* one level: the source conversation that produced the claim. This is the trust move. Every fact must be able to show its receipt.

If a reviewer touches nothing and still understands the product, the design worked.

## Design language

**Mood:** the green room. Dim, warm, moments before you go on. Focused and slightly adrenal. Not a dashboard, not a notification — a *cue card handed to you in the wings*.

**Palette** — warm dark, single ember accent.

| Token | Value | Use |
|---|---|---|
| `--void` | `#12100E` | behind everything, warm-shifted black |
| `--card` | `#1C1916` | the panel, barely lifted |
| `--ink` | `#F5EFE6` | primary type, warm white |
| `--ink-dim` | `#8A8079` | labels, metadata |
| `--ember` | `#E8743B` | exactly one thing per card |
| `--edge` | `rgba(245,239,230,0.08)` | hairlines only |

Discipline: **the ember appears once**. If two things are urgent, the card is wrong.

**Type** — display serif against a tight grotesque.

- Display: **Instrument Serif**, 44–56px, `line-height: 1.05`, `letter-spacing: -0.02em`. The single fact.
- Body/meta: **Inter Tight**, 13px, `letter-spacing: 0.01em`, uppercase only for the eyebrow (person + time-until).
- Never more than **two type sizes visible at once**. The hierarchy is violent on purpose — one thing is 4× everything else.

**Space** — the card is `380px` wide, padding `32px`, and at least 40% of it is empty. Emptiness is the product claim: *we filtered for you.*

**Motion** — physical, weighted, never bouncy-cute.

- Enter: `cubic-bezier(0.16, 1, 0.3, 1)`, 420ms, from `translateY(-12px) scale(0.97)` + blur `8px → 0`. It settles like something set down on a table.
- Dismiss: velocity-tracked, momentum-carried. It should feel *thrown*.
- Unfold: 280ms height + opacity, contents stagger 40ms apart.
- Never pulse, never breathe. Threshold is not alive; it is punctual.

**Material** — 24px radius, `backdrop-filter: blur(40px) saturate(1.4)`, one soft ember-tinted shadow beneath. It sits *above* the desktop, not in a window.

## Rules

- No scrollbar. Ever. If it does not fit, it was not important enough.
- No more than three facts. Three is already a compromise; two is better.
- No buttons with labels. Gestures and self-dismissal only.
- The person's name is the largest thing after the fact itself.

## SDK hooks

`OmiMock` → `memories` filtered by `people`, `conversations` for the last exchange with that person, `actions` with `dueAt` for open commitments. Calendar proximity is **fabricated** — label it synthetic in the note.

## Failure mode to avoid

Becoming a notification center. The moment there is a stack, a history, or an "earlier today" section, Threshold has died and become `attention`. One card, one moment, then gone.
