# Ideas

Concept briefs. One idea per file, each a **separate bet** — different job, different visual language, different information architecture. Nothing here is a revision of anything else here.

A brief is written before `prototypes/<name>/` exists. It names the thesis, the one interaction worth building, and a prescribed design language specific enough to build from without a second conversation.

## The six

| Idea | Thesis | Register |
|---|---|---|
| [Threshold](./threshold.md) | The twenty seconds before you walk into the room. | Warm dark, display serif, one card |
| [Filament](./filament.md) *(rejected)* | The whole app is 22 pixels tall. | System-native monochrome, motion-only |
| [Ledger](./ledger.md) | You are in debt to four people. Here is the balance. | Ink on paper, monospace tabular |
| [Live Margin](./live-margin.md) | The transcript is not the artifact. The understanding is. | Vellum overlay, editorial serif |
| [Mirror](./mirror.md) | Arrives Monday. Tells you what actually happened to the project. | Swiss annual report, gridded |
| [Field](./field.md) | Memories have no address. Give them one. | Deep water at night, single hue |

## Why these six

The two existing prototypes (`desk`, `attention`) occupy the same corner of the design space: retrospective, user-initiated, full-window, text-dense. They differ in density, which is a knob, not an axis.

These six were selected to spread across axes that actually matter:

| | Time | Initiative | Surface | Object |
|---|---|---|---|---|
| Threshold | before | interrupts | one card | a person |
| Filament | continuous | never speaks | menu bar | state |
| Ledger | after | you open it | document | obligation |
| Live Margin | during | ambient overlay | floats over work | understanding |
| Mirror | weekly | arrives once | printed page | the team |
| Field | timeless | you wander | full canvas | the whole corpus |

No two share a row, and no two share a visual language. Palettes were deliberately separated: warm dark (Threshold) vs. cold dark (Field), cream paper (Ledger) vs. white stock (Mirror), neutral system (Filament) vs. translucent vellum (Live Margin).

## Build order

Ranked by conviction per hour.

**Threshold is built** — see [prototypes/threshold](../prototypes/threshold). It also produced two
pieces of shared infrastructure the rest of these can use: `_macos-stage` (desktop bezel) and
`_voice` (mic level + push-to-talk, no UI).

**Ledger is built** — see [prototypes/ledger](../prototypes/ledger).

Remaining:

1. **Live Margin** — strongest single demo moment (the revision), but needs a fake macOS desktop and a hand-timed script.
2. **Field** — highest ceiling, highest risk. Only worth it if drag-to-connect gets built first.
3. **Mirror** — most content-dependent; its quality is mostly copywriting, and the Quiet section has a real tone hazard.

## Cut

**Filament** — built as [prototypes/filament](../prototypes/filament), then rejected. The menu-bar-only surface is a coherent thesis, but too thin as a walk-up demo: if you miss the glyph, there is no product. Expanding it into a browsable window would just make a small `desk`. Kept for the record; not the next bet.

**Shutter** — a consent and privacy instrument: visible recording state, per-person boundaries, scrub-back-and-forget. Strong concept, but it lives on the device rather than in a macOS app. Cut for scope, not for quality; worth revisiting if hardware surfaces come into range.
