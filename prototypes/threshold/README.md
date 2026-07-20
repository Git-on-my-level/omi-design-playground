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
5. **Click `Open in Omi`.** The card retires and hands its context to the app. Right ⌘ works in there too, from any view — it jumps to Chat and starts dictating.
6. **Follow the links.** In the app, every cross-reference is navigable in both directions: the task card opens its goal, the contact card opens the person, a person chip on a task opens that contact, a goal card on a contact opens that goal filtered.

Keyboard: `Enter` unfolds, `⌘Enter` opens the app, `Esc` throws the card away.

## The app

Three views behind one sidebar.

**Chat** is where you arrive, because a question is what you had. It opens with the person and the commitment as context cards, both of which are links.

**Tasks** groups all 20 actions under five goals, each with its intent, a completion bar, and rows that name the person involved and the conversation the commitment came from.

**Contact** is a person: what is open with them, which goals they sit under, what you know about them grouped by memory kind, and the conversations you have had.

The ties are the point. A task belongs to a goal and may name a person; a person shows their tasks and their goals; a goal lists its tasks. A task row renders from the same function everywhere it appears, so the tie reads as a tie rather than as two similar lists.

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
- **Goals.** The SDK has no goals. The five here are derived from the conversations their actions came out of — commitments made in the workshop debrief and the roadmap workshop really are about the same thing, and grouping by source conversation recovers that. Hardcoding action IDs to goal IDs would look identical on screen and be a lie about where the structure came from. The titles and intents are written, not derived.
- **The assistant's replies.** Composed locally from fixture joins. The pack's `askAssistant` returns a generic "a useful starting point is…" string, which reads as broken in a presentable surface, so it is not used. Free text in the composer lands on the nearest canned prompt.
- **Slippage language.** Actions carry exactly one `dueAt`, so anything implying a commitment moved repeatedly would be invented. Nothing here claims that.

One honest-labelling note that is *not* fabrication: `memory.people` means "involved in this",
not "this is about them". A preference of Riley's recorded in a conversation with Morgan carries
both ids, so the contact page groups memories under labels like "Preferences that came up" rather
than "Preferences" — the latter would silently assert the memory is the contact's.

None of the above is stated in the UI, by design — see the root `AGENTS.md`.
