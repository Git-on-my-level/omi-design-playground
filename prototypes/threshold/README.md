# threshold

**The experience:** the twenty seconds before you walk into the room. Not recall — readiness.

A card arrives on its own because a meeting is close. It says the one thing it would cost you to have forgotten, and then it leaves. You never search, never navigate, and never see two cards at once.

```bash
./scripts/serve-prototype.sh threshold
```

## Try first

1. **Wait.** The card arrives by itself, counts down, and expires at T-0 if you ignore it. Doing nothing is a supported path.
2. **Flick it sideways.** Velocity-tracked throw. It does not come back, and there is no undo.
3. **Drag it down.** The card unfolds to the transcript lines that produced the claim. Every fact can show its receipt — this is the trust move, and it's why the concept isn't presumptuous.

Keyboard: `Enter` unfolds, `Esc` throws it away.

## What it is not

Not a notification center. The moment there's a stack, a history, or an "earlier today" section, this has become a ranked queue and the idea is dead. One card, one moment, then gone.

## Design notes

Register is *the green room* — warm dark, dim, moments before you go on. Two type sizes visible at once (48px Instrument Serif for the fact, 12px Inter Tight for everything else), so the hierarchy is violent on purpose. The ember accent appears exactly once per card, on the countdown, and only inside the last minute; if two things were urgent the card would be wrong.

Full brief: [ideas/threshold.md](../../ideas/threshold.md).

## Data

`power-user` scenario. Briefs derive from open `actions` naming a person, their highest-ranked relationship `memory`, and the source `conversation` for the receipt — four people qualify. **Calendar proximity is fabricated**; the clock and countdown run on compressed fixture time (12 fixture seconds per real second). Everything else is scenario data.
