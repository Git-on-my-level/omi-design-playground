# threshold

**The experience:** the twenty seconds before you walk into the room. Not recall — readiness.

A card arrives on its own because a meeting is close. It says the one thing it would cost you to have forgotten, and then it leaves. You never search, never navigate, and never see two cards at once.

```bash
make threshold
```

## Try first

1. **Wait.** The card arrives by itself, counts down, and expires at T-0 if you ignore it. Doing nothing is a supported path.
2. **Flick it sideways.** Velocity-tracked throw. It does not come back, and there is no undo.
3. **Drag it down.** The card unfolds to the transcript lines that produced the claim. Every fact can show its receipt — this is the trust move, and it's why the concept isn't presumptuous.
4. **Hold right ⌘ and talk.** The card starts listening: the footer becomes a live meter and your words land in the card. Release and the question carries into the chat window. The countdown pauses while you hold — you are engaging, so the meeting waits.
5. **Click `Open in Omi`.** The card retires and hands its context to a chat window. Right ⌘ works in there too, on the composer.

Keyboard: `Enter` unfolds, `⌘Enter` opens the window, `Esc` throws the card away.

## What it is not

Not a notification center. The moment there's a stack, a history, or an "earlier today" section, this has become a ranked queue and the idea is dead. One card, one moment, then gone.

The window is what keeps that possible. `Open in Omi` is a one-way door: the card retires rather than backgrounding, and the window inherits its context as typed cards — the person as a **contact card**, the commitment as a **task card**. Threshold can stay one card precisely because it has somewhere to hand off to.

## Design notes

Register is *the green room* — warm dark, dim, moments before you go on. Two type sizes visible at once (48px Instrument Serif for the fact, 12px Inter Tight for everything else), so the hierarchy is violent on purpose. The ember accent appears exactly once per card; listening takes priority over the countdown when both would want it.

The card is real glass — the wallpaper is legible through it, and the backdrop is darkened before the tint lands rather than the tint being thickened. The window it opens is deliberately **not** glass: on this desktop, windows are solid and only things floating above your work are vibrant.

Full brief: [ideas/threshold.md](../../ideas/threshold.md).

## Data, and what is fabricated

`power-user` scenario. Briefs derive from open `actions` naming a person, their highest-ranked relationship `memory`, and the source `conversation` for the receipt — **four people qualify**, not ten.

Fabricated, in order of how much it matters:

- **The calendar.** There is no meeting and no schedule in the fixture. Proximity is invented, and the clock runs on compressed fixture time (12 fixture seconds per real second).
- **The transcription.** `_voice` detects that you are speaking; it does not know what you said. The utterance is a fixed string revealed at a speaking cadence, and the meter is driven by real level data. If the microphone permission is denied — or you are in headless Chrome — the level comes from a synthetic envelope and nothing on screen changes.
- **The assistant's replies.** Composed locally from fixture joins. The pack's `askAssistant` returns a generic "a useful starting point is…" string, which reads as broken in a presentable surface, so it is not used. Free text in the composer lands on the nearest canned prompt.
- **Slippage language.** Actions carry exactly one `dueAt`, so anything implying a commitment moved repeatedly would be invented. Nothing here claims that.

None of the above is stated in the UI, by design — see the root `AGENTS.md`.
