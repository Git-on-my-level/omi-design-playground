# Onboarding

> You don't read the manual. You use the thing once, guided, and trust it.

## Thesis

Most onboarding front-loads: a video, a survey, a permissions gauntlet, a
knowledge-graph build — and then drops you into an empty app to fend for
yourself. For an assistant that acts *on your behalf*, that order is backwards.
Trust in omi is not earned by promises before you use it; it is earned the first
time it is right about you, with a receipt.

So this concept spends the opening minute lightly — three unhurried education
beats and the two permissions omi truly needs — and then hands the teaching to
the app itself. A real just-in-time brief arrives, the app opens from it, and a
walkthrough makes you *do* the core loop once: ask a question, see the exact line
the answer came from, follow it into the list it built. You learn omi by doing
omi.

This is a fork of [Threshold](./threshold.md): same green-room language, same JIT
card, same people intelligence — repointed from "prove the idea" to "welcome a
stranger."

## Orthogonal on

- **Moment** — the first session, not the hundredth.
- **Teaching model** — learn-by-doing inside the product, not slides in front of it.
- **What earns trust** — a receipt on your own data, not a value-prop screen.

## The shape

1. **Learn (three beats).** omi listens to your day · it reaches you right before
   it matters · it remembers the people so you don't have to. One idea per screen,
   one ember, serif headline — the card's language at full-bleed.
2. **Set up.** Microphone and notifications, each with a plain reason ("the mic is
   how omi captures the day it hands back to you"; "notifications are how a brief
   arrives seconds before a call"). Then a device pairing that also offers a
   phone/Mac-mic path — no pendant required.
3. **Use it (the walkthrough).** A "Sync with Priya" alert lands on the desktop;
   the omi card arrives beneath it; a coach mark says *this is omi — it comes to
   you.* You open it. Inside, guided: it already knows who's coming; ask what you
   promised; every answer shows its receipt; it all becomes the list. Then it
   steps back and lets you use it for real.

## The one rule for the walkthrough

The coach mark is a spotlight, never a cage. The scrim only darkens; the
highlighted element stays live, and the important steps **do not advance until you
actually use it** — click the brief, ask the question, open the list. Reading is
allowed a button; understanding-by-doing is not. The app teaches by making you
succeed at the real thing once.

## Design language

Inherited from Threshold, unchanged: the green room (warm dark, one ember accent),
two type sizes (Instrument Serif for the one line that matters, Inter Tight for
everything else), real glass for the omi card against the desktop's solid system
chrome. Nothing on screen explains itself in caption text — the README and this
brief hold everything that is fabricated.

## What's fabricated

The permission grants are simulated, the paired device and the captured day are
synthetic (the app is seeded from the `power-user` scenario as "the day omi
already kept"), and the brief is staged. Transcription does not exist; quoted
lines are written. All of this is stated plainly in the prototype README, never
in the UI.
