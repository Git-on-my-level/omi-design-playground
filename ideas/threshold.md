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

## Why the card arrives

The card earns its content — every fact can show its receipt. It must also earn its
*timing*. So the trigger is not an invisible clock; it is something visible on screen that
just happened, and the card arrives *because of* it:

- A **calendar alert** slides in — native system chrome, solid, unmistakably the OS and not
  Omi — for a meeting that is close. A beat later the card arrives, its countdown descending
  from the alert's time.
- Or a **known person's context comes to the foreground**: a Meet pre-join, a Slack DM, a
  mail reply. When it is someone Omi knows, the card arrives; when it is not, nothing does.

The card names the source in its eyebrow (`Calendar · in 4 min`, `Slack · Morgan`) and carries
one dim **"why now"** line naming the signal — *"Because your sync with Priya is in 4 minutes."*
This is the timing counterpart to the receipt: the receipt is "why believe this", the why-now
line is "why now". The triggers are always the *cause* of a single card, never a browsable log of
what Omi saw. The moment there is a list of triggers, this has become a notification center.

## The demo

A short sequence of screen events, each tied to one brief. The system alert slides in, and a beat
later the Omi card arrives *beneath* it — the cause and the response visible together. When the
alert dismisses, the card rises into the slot it would have had alone. This is not two cards: the
alert is the desktop's own chrome, and only ever one Omi card is on screen. Interactions, in order
of how much they ask of you:

1. **Read it.** It self-dismisses when the meeting starts.
2. **Push it away** — a flick sends it off-screen with real momentum; it does not come back.
3. **Pull it deeper** — drag down and the card *unfolds* one level: the source conversation that produced the claim. This is the trust move. Every fact must be able to show its receipt.
4. **Speak to it** — hold right ⌘ and the card starts listening. The meter grows out of the footer it already had, the words land in the card, and releasing carries the question into the window. Threshold is a surface you have four minutes for; typing is the wrong instrument.
5. **Leave** — `Open in Omi` retires the card and opens the chat window that already knows who you were looking at.

If a reviewer touches nothing and still understands the product, the design worked.

## The handoff

Threshold must never become browsable, but it cannot be a dead end either — the answer to "so what do I do about this?" has to exist somewhere. So it exists somewhere *else*.

`Open in Omi` is a **one-way door**. The card does not minimise, background, or wait; it retires, and the window inherits its context as typed cards at the top: the person as a **contact card**, the commitment as a **task card**. Those cards are the card you just dismissed, restated as objects you can act on.

This is what keeps the concept honest. Threshold stays one card and one moment precisely *because* it has somewhere to hand off to.

The app behind the door has one substrate and two lenses. **Tasks are the only objects; goals and people are dimensions you view them through.** You can group by either, filter to either, and the page never changes — only its header does.

That is the correction that made it simple. The first build gave people their own expanded page: open items, goals, memories, conversation history, four stacked sections. It was a CRM record sitting next to a task tracker, and the two disagreed about which object was primary. Making a person a *lens* answers it — the commitment is primary, and a person is a question you ask about it. Memory survives as a compact context block in the lens header, which is the right size for it: it is what you need to know before you act on the list below, not a page to browse.

Goals are derived from the conversations their commitments came out of, which is the only structure the fixture can honestly support. And every task can unfold its receipt — the verbatim line that produced it, with a **View conversation** link into the full transcript on its own **Conversations** page: *why believe this*. Tasks Omi also watched carry a tiny **screen-capture preview** in the row's tail that does not grow the row; click it and it opens the **Rewind** tab on that trail, tracking a task from *opened* through *in progress* to *done* — *how far along*. Rewind draws each capture as the app it was seen in — a mail message, a Slack thread, a Meet stage — so it reads as a screenshot, not a transcript. Those two ingresses are a deliberate pair, and both live behind the handoff door where browsing is the point; the card and the row stay a single glance. That pairing — why believe this, and how far along — is the part no other tracker can copy.

That density is exactly what the card must never become. The card is one fact; the app is the whole graph. Keeping them in one prototype is deliberate — it is the argument that an interruption earns its place by being *narrower* than the thing it can open, not by being a smaller copy of it.

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

- Display: **Instrument Serif**, 25px, `line-height: 1.16`. The single fact.
- Body/meta: **Inter Tight**, 10–11px, uppercase only for the eyebrow (person + time-until).
- Never more than **two type sizes visible at once**. The hierarchy is violent on purpose — one thing is roughly 2.5× everything else, and it is the only serif on the card.

**Space** — the card is `306px` wide with `18px/20px` padding, and the resting state is the eyebrow, the fact, one dim "why now" line bound to the fact as a caption, and a slim footer. The why-now line stays at eyebrow size and colour so it reads as a caption to the fact, not a second fact — it is the one addition the trigger model earns. Everything else — what she cares about, when you last spoke, the receipt — lives behind the fold.

This is the correction that mattered most. The first build gave the fact 48px and put the supporting detail on the face of the card, which produced a 380×420 poster parked on your desktop. A surface that interrupts you has to earn its footprint, and a brief you read in six seconds does not need the area of a dialog. Compactness *is* the deference. The fact drops to 25px and still dominates, because everything around it is 10–11px.

**Motion** — physical, weighted, never bouncy-cute.

- Enter: `cubic-bezier(0.16, 1, 0.3, 1)`, 420ms, from `translateY(-12px) scale(0.97)` + blur `8px → 0`. It settles like something set down on a table.
- Dismiss: velocity-tracked, momentum-carried. It should feel *thrown*.
- Unfold: 280ms height + opacity, contents stagger 40ms apart.
- Never pulse, never breathe. Threshold is not alive; it is punctual.

**Material** — 18px radius, one soft ember-tinted shadow beneath. It sits *above* the desktop, not in a window.

The card is **real glass**: you can see the wallpaper move under it. That means the tint must stay thin (~0.3–0.42 alpha) and the backdrop must be *darkened before* the tint lands — `blur(26px) saturate(135%) brightness(0.6)`. Skipping the brightness step and thickening the tint instead produces something that merely looks like a dark card, which is the failure the translucency exists to avoid. The fact carries a soft text-shadow because the surface behind it is live.

The window it hands off to is **not** glass. Windows on this desktop are solid; only things floating above the work are vibrant. That contrast is doing real work — it is how you know the card was never a window.

## Rules

- No scrollbar. Ever. If it does not fit, it was not important enough.
- No more than three facts. Three is already a compromise; two is better.
- **Exactly one button, and it leads out.** This started as "no buttons with labels," which was
  wrong: a surface that can only be dismissed makes you re-find everything it just told you. The
  rule that survives is stricter and more useful — the only labelled control on the card is the
  one that ends the card. Nothing on it may lead deeper into itself.
- The person's name is the largest thing after the fact itself.
- Listening owns the ember while it is happening. If the countdown is also urgent, the countdown
  yields — two ember things is still the failure state.

## SDK hooks

`OmiMock` → `memories` filtered by `people`, `conversations` for the last exchange with that person, `actions` with `dueAt` for open commitments. The **triggers** are fabricated: the fixture has no schedule and no screen feed, so the calendar alerts, the app-foreground events, and their times and previews are written by hand. `Conversation.source` already carries `'macos' | 'ios' | 'device'`, so screen-origin context is honest where it is used, but the events that fire the cards are synthetic — label them so. The **screen captures** on tasks are likewise synthetic: mock windows drawn from HTML, never real screenshots, labelled "seen on screen".

## Failure mode to avoid

Becoming a notification center. The moment there is a stack of *cards*, a history, or an "earlier today" section *on the card surface*, Threshold has died and become `attention`. The card is always one, and always the present moment. Browsing — the Rewind tab, the task list, the screen captures — is allowed only behind the handoff door, never in the interruption itself. One card, one moment, then gone.
