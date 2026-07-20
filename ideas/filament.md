# Filament

> The whole app is 22 pixels tall.

## Thesis

Omi runs all day. Anything that demands a window is, for most of that day, wrong. Filament argues the correct macOS surface for an always-on memory device is a **menu bar glyph and nothing else** — and that a single mark, given enough craft, can carry more state than a dashboard.

The entire prototype is one item in the menu bar plus one popover that appears only when you ask. All design effort goes into micro-state, transition, and one gesture.

Mount on `prototypes/_macos-stage` and prepend the glyph to `stage.statusSlot`, so it sits where a real status item would: left of the system icons and clock, against a real menu bar you do not control. That constraint is the point — the concept has to survive competing with Wi-Fi and battery.

## Orthogonal on

- **Surface** — a sliver, not a window. Competes for zero screen real estate.
- **Initiative** — ambient. It never interrupts and it never asks.
- **Register** — system-native craft, not brand expression. The bet is that *restraint reads as trustworthiness* for a device listening to your life.

## The demo

The glyph must legibly carry five states with no text:

| State | Mark |
|---|---|
| Idle | a thin vertical stroke, static, 40% opacity |
| Listening | the stroke breathes — 4s cycle, opacity 0.4 → 0.75, never moving position |
| Someone new in the room | a second faint stroke fades in beside it |
| Thinking | the stroke shortens from the top, like burn-down |
| Holding something for you | a single dot above the stroke, warm, patient |

**The gesture:** press and hold the glyph for 600ms → a hairline ring completes around it → release marks *this moment* as important. No dialog, no confirmation. The ring completing **is** the confirmation. The next popover shows it captured.

Click (not hold) opens a `320 × 400` popover: the last thing heard, distilled to one sentence, and the two things it is holding. That is the entire UI.

## Design language

**Mood:** a well-made instrument you stop noticing. Think status LED, not app icon. It should look like Apple shipped it, and like it cost someone a month.

**Palette** — near-monochrome, one accent, and the accent is rationed.

| Token | Value | Use |
|---|---|---|
| `--mark` | `currentColor` at 40–90% | the glyph; inherits menu bar light/dark |
| `--surface` | `rgba(28,28,30,0.72)` + blur | popover, vibrancy-backed |
| `--rule` | `rgba(255,255,255,0.09)` | separators |
| `--held` | `#D9A441` | the "holding something" dot — **the only color in the product** |

Full light/dark support is non-negotiable; the menu bar is not yours.

**Type** — system, small, correct.

- **SF Pro Text** (`-apple-system`), 13px popover body, 11px labels at `letter-spacing: 0.02em`.
- **SF Mono** 11px for timestamps and counts, tabular numerals.
- No display type. No brand typeface. Filament has no personality font *by design* — the personality is entirely in motion.

**Space** — 12px popover padding, 8px rhythm, hairline dividers at exactly 1 device pixel (`0.5px` @2x). Sub-pixel discipline is the whole craft argument.

**Motion** — this is the product.

- Breathing: `ease-in-out`, 4000ms, infinite alternate. Slow enough that you feel it rather than watch it.
- State changes: 240ms `cubic-bezier(0.4, 0, 0.2, 1)`. Marks **cross-fade**, never slide. Position is stable; only character changes.
- Hold ring: 600ms linear stroke-dashoffset. Linear because it is a *timer*, and timers must not ease.
- Popover: 160ms scale `0.96 → 1` from the anchor point, with opacity. Fast. It is not an entrance.

## Rules

- Nothing may move the glyph's position. Ever. A menu bar item that jitters is a bug you can feel.
- No badge counts. Numbers in a menu bar are anxiety.
- The popover has no scroll and no navigation. If content overflows, the distillation failed.
- Respect `prefers-reduced-motion`: breathing becomes a static 60% opacity.

## SDK hooks

`captureState` drives idle/listening/thinking. `people` presence drives the second stroke. `actions` with open status drive the held dot. The popover reads the newest `conversation.summary`, truncated to one sentence — if it needs two, show fewer things instead.

## Failure mode to avoid

Growing a settings pane, a tab bar, or a "see all" link. The instant Filament can be browsed, it is just a small `desk`. The constraint *is* the concept: **anything that does not fit in a glyph and one sentence does not belong to this product.**
