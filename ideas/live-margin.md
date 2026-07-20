# Live Margin

> The transcript is not the artifact. The understanding is.

## Thesis

Every meeting tool gives you a transcript afterward and calls it value. Live Margin runs **during** the conversation and writes the document you actually wanted: decisions, open questions, contradictions — revising itself in real time as the discussion moves.

The demo moment is specific and it is the whole pitch: a decision is made, recorded in the margin, and then eleven seconds later someone contradicts it. The margin **quietly revises itself**. The old line strikes and dims; the new one takes its place. You watch the software change its mind.

## Orthogonal on

- **Time** — synchronous. The only concept here that is useful *while you are still talking*.
- **Output** — it produces a document, not a feed. The artifact has structure and persists.
- **Surface** — an overlay that floats above your real work, not a destination you visit.

## The macOS framing

This one needs a stage. Mount on `prototypes/_macos-stage` for the desktop, menu bar, and dock, then build **one or two inert background windows** of your own — a video call tile, a doc — inside your prototype directory. The stage deliberately has no window manager; background content that specific belongs to this concept. The overlay is the product; the windows exist to prove it coexists with your actual work.

Overlay geometry: pinned right edge, `400px` wide, full height minus 80px, floating with a shadow. Draggable. It never takes focus and never blocks a click.

## The demo

Two columns inside the overlay:

- **Left rail (narrow, 120px):** the live transcript, small and dim, scrolling continuously. Deliberately hard to read. It is *evidence*, not content — its illegibility is the argument that raw transcript was never the point.
- **Right (the margin):** the living document, in three sections that only appear once populated — `Decided`, `Open`, `Disputed`.

The choreography, on a timed script:

1. Text accumulates in the rail. The margin stays empty for an uncomfortable ~8 seconds. **Restraint is the first impression.**
2. A line resolves into `Decided`. It fades up in place.
3. A question resolves into `Open`.
4. **The revision.** New transcript contradicts the decision. The `Decided` line strikes through and slides down into `Disputed`, and the replacement fades in above it. 600ms, one continuous motion, no flash.
5. Hover any margin line → the transcript lines that produced it highlight in the rail, and a hairline connector draws between them.

## Design language

**Mood:** editorial marginalia. A thoughtful reader annotating a manuscript in the margin while the text streams by. Quiet, literate, unhurried — the opposite of a live-captions overlay.

**Palette** — vellum over the desktop, restrained.

| Token | Value | Use |
|---|---|---|
| `--vellum` | `rgba(250,249,245,0.86)` + `backdrop-filter: blur(32px)` | overlay ground |
| `--ink` | `#22201C` | margin prose |
| `--ink-faint` | `#9A958C` | transcript rail |
| `--decided` | `#2F5D50` | section mark |
| `--open` | `#8A6A2F` | section mark |
| `--disputed` | `#8E3B2F` | section mark |
| `--connector` | `rgba(34,32,28,0.22)` | hover linkage |

Section marks are **4px vertical bars at the line's left edge only** — never filled backgrounds, never pills. Color enters the composition as punctuation.

**Type** — a real reading serif for the understanding, sans for the machine's raw output.

- Margin prose: **Source Serif 4**, 15px / 1.55, `--ink`. It should be genuinely pleasant to read.
- Section headers: **Inter**, 10px, uppercase, `letter-spacing: 0.14em`, `--ink-faint`.
- Transcript rail: **Inter**, 10px / 1.4, `--ink-faint`, `opacity: 0.55`.

The typographic argument: *the transcript is sans-serif exhaust; the understanding is set in serif because a human will read it.*

**Space** — 28px overlay padding, 20px between margin entries, 12px inside a section. Sections separated by 32px of pure air, no rules.

**Motion** — the hardest constraint in the whole set: **text that changes must feel considered, never twitchy.**

- Arrival: 400ms fade + 4px rise. Never slide from off-screen — thoughts do not enter from the right.
- Revision: strike (280ms) → reposition (320ms `cubic-bezier(0.16,1,0.3,1)`) → replacement fades in (280ms). Strictly sequential. Total ~900ms, which is slow on purpose.
- Transcript rail scrolls continuously at a constant slow rate, never jumping to bottom.
- Connector line: 200ms `stroke-dashoffset` draw.
- Nothing blinks, no cursors, no typewriter effect. Typewriter animation would make it feel like a chatbot; this is not a chatbot.

## Rules

- The margin never exceeds ~7 live entries. Older ones dissolve upward and out.
- Never show confidence scores or percentages. It either says something or stays silent.
- Silence is a valid state and must look intentional — an empty margin shows only the section-less phrase *"listening"* in `--ink-faint`, nothing more.
- The overlay must never steal focus, never modal, never block.

## SDK hooks

`captureState` + streaming `segments` feed the rail. `conversations[].summary` and `actions` supply the resolved margin content. **The revision choreography is scripted** — the mock will not contradict itself on its own, so time it by hand and label the demo synthetic.

## Failure mode to avoid

Becoming live captions with a sidebar. If the transcript is readable and prominent, the concept has inverted. The rail must stay small, dim, and secondary — the product's claim is that **raw transcript is a byproduct**, and the layout has to say that before any copy does.
