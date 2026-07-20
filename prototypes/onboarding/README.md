# onboarding

**The first five minutes with omi — and the bet that you learn it by using it, not by reading about it.**

A fork of [`threshold`](../threshold/). It keeps threshold's bet (the just-in-time
card, the people intelligence, the green-room language) and throws the rest away
to answer one question: how does a brand-new person come to *trust* an assistant
that acts on their behalf?

## The shape

1. **Learn.** A few unhurried, one-idea-per-screen education beats: omi listens to
   your day, it reaches you right before it matters, it remembers the people so
   you don't have to.
2. **Set up.** The two permissions omi actually needs — microphone and
   notifications — each with a plain-spoken reason, then a device pairing that
   also offers a phone/Mac-mic path for people without a pendant.
3. **Use it.** Instead of a manual, the app teaches itself. A real brief arrives
   on the desktop; the app opens *from* it; and a walkthrough makes you do the
   thing you just read about — **ask a question, see its receipt, follow it into
   the list.** You learn omi by doing omi.

The walkthrough is a spotlight, not a lecture. Each coach mark either offers a
button (for a point you only need to read) or waits for you to actually use the
highlighted, live element (for a point you learn by doing). The scrim is visual
only, so the UI underneath is genuinely interactive the whole time.

## Why this is a separate bet

Omi's real onboarding (a marketing video, sign-in, consent, name, language,
acquisition source, permissions, a phone-mic speech profile, a knowledge-graph
build) ends by dropping you into a near-empty app — there are **no coach marks or
walkthrough overlays** in the product today. This prototype's whole wager is the
opposite: front-load almost nothing, and teach the product's actual value
(capture → understand → remember → retrieve → act) *inside* the app, by having
you use it once, guided, with a real brief as the hook.

## Run it

```bash
make onboarding          # serve
make shot-onboarding     # screenshot the first (education) screen
```

The education, permission, and device screens advance on click; the walkthrough
advances as you use each highlighted element. Because it is click-driven, a plain
screenshot only captures the opening screen — reach later states by interacting,
or (for a specific frame) temporarily drive it on a timer as `AGENTS.md` describes.

## Data, and what is fabricated

Everything outside the mock SDK contract is synthetic — this is a design surface,
not a real install.

- **The permission prompts are simulated.** Clicking "Allow" plays an asking →
  granted state and moves on; no real `getUserMedia` is requested (a bare one
  hangs headless Chrome, and this is a mockup regardless). The device "pairs" on
  a timer.
- **The captured day is fabricated.** The app the walkthrough tours is built from
  the pack's `power-user` scenario — framed here as "the day omi already kept for
  you," so there is something real to point at while teaching. A true first-run
  would be emptier; that trade is deliberate, so the teaching has substance.
- **The brief and its alert are staged.** omi is not watching a real calendar;
  the "Sync with Priya" alert and the card beneath it are scripted to demonstrate
  the just-in-time moment. As in threshold, the OS alert is the desktop's own
  chrome and the omi card is vibrant glass — cause and response, side by side.
- **The name defaults to "Riley"** and threads through the walkthrough copy.
- **Transcription does not exist.** Any quoted line is written, not heard.

## Structure

- `onboarding.ts` — the education / permission / device / name screens (a stepper).
- `walkthrough.ts` — the coach-mark spotlight layer used to teach in-app.
- `main.ts` — orchestration: run onboarding, then stage the brief and the guided
  walkthrough through the app.
- `chat.ts`, `views.ts`, `workspace.ts`, `triggers.ts` — the omi app and its data,
  carried over from threshold (with an added custom-opener hook so omi can greet
  the new user in its own voice).
