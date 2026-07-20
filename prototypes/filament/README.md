# filament

> **Rejected.** Coherent as a menu-bar instrument, too thin as a demo. Kept for the record — see [ideas/filament.md](../../ideas/filament.md).

**The experience:** the whole app is 22 pixels tall.

Omi as a menu-bar instrument — one glyph that carries five states without text, one press-and-hold to mark a moment, and one sentence when you ask. Nothing to browse.

```bash
make filament
```

## Try first

1. **Watch the glyph.** In `recording` it breathes (listening), a second stroke fades in (someone else is in the room), and a warm dot sits above it (holding open follow-ups).
2. **Press and hold** the glyph for ~600ms. A hairline ring completes; release marks the moment. No dialog — the ring is the confirmation.
3. **Click** (don’t hold) to open the popover: one distilled sentence, two things it’s holding, and the marked moment if you made one.

Switch capture mood with `?scenario=processing` (thinking burn-down) or `?scenario=offline-recovery` (idle).

## What it is not

Not a mini `desk`. No settings, tabs, badge counts, or “see all.” If it doesn’t fit in a glyph and one sentence, it doesn’t belong here.

## Design notes

System-native monochrome — SF Pro / SF Mono, vibrancy popover, one rationed accent (`#D9A441`) for the held mark. Full light/dark via `prefers-color-scheme`. Motion is the product: 4s breath, 240ms cross-fades, 600ms linear hold ring, 160ms popover. Brief: [ideas/filament.md](../../ideas/filament.md).

## Data

Defaults to `recording`. Glyph state from `capture.status`, live-transcript speakers (presence), and open `actions` (held). Popover summary is the newest conversation’s first sentence. Marked moments are local to the session.
