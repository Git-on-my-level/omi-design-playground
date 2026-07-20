# AGENTS.md — Omi UI Hackathon

Spray-and-pray UI/UX exploration. Many distinct concepts beat one polished app.

## Where work goes

| Path | Role |
| --- | --- |
| `ideas/` | **Concept briefs.** One idea per file: thesis, key interaction, prescribed design language. Written before the prototype exists. |
| `prototypes/<name>/` | **Your concepts.** One idea per directory. Self-contained HTML/CSS/JS(TS). |
| `prototypes/_template/` | **Scaffold to copy.** Wiring only, zero visual language. Never import from it. |
| `prototypes/_macos-stage/` | **Shared macOS desktop.** Wallpaper, menu bar, widgets, files, dock. A bezel for overlay concepts. |
| `reference/hackathon-pack/` | **Read-only capability pack.** Mock SDK, synthetic scenarios, docs, diagnostic harness. |
| `reference/impeccable/` | **Read-only design skill reference** ([pbakaus/impeccable](https://github.com/pbakaus/impeccable)). Craft/critique guidance—not a Cursor install. |
| `scripts/serve-prototype.sh` | Serve any prototype by name. |

Do **not** put new concepts inside `reference/`. Do **not** edit reference trees unless the user explicitly asks to update them. Do **not** install Impeccable into Cursor or other harnesses from this repo.

## New prototype checklist

1. `./scripts/new-prototype.sh <kebab-name>` — copies `_template` (mock wiring, `?scenario=`, CSS reset, no taste).
2. Read `reference/AGENTS.md` **before designing a layout** — it says which fixture data actually
   exists, so you don't build a list for ten people when only four have usable data.
3. Import the mock from `../../reference/hackathon-pack/src` when you need Omi state.
4. Run: `./scripts/serve-prototype.sh <kebab-name>` (after `cd reference/hackathon-pack && npm install` once).
   It typechecks first; `OMI_SKIP_TYPECHECK=1` bypasses.
5. **Look at it before calling it done:** `./scripts/screenshot-prototype.sh <kebab-name>`, then
   open the PNG. Non-negotiable — see below.
6. Keep it independent: no shared UI kit, no cross-prototype imports, no “design system” that couples ideas.

Start from `_template` only. **Do not copy an existing prototype or the pack's `examples/` as a
starting point** — you will inherit its fonts, palette, and layout and produce a variant instead of
a new bet. That is exactly what the distinctness rule exists to prevent.

Directories starting with `_` are shared infrastructure, not concepts. They are excluded from
`serve-prototype.sh` and must never hold a bet of their own.

## Look at your work

This is a *design* hackathon, and a prototype that typechecks can still be visibly broken. Verifying
by curl, unit test, and reasoning is not verification here.

```bash
./scripts/screenshot-prototype.sh threshold                    # → prototypes/threshold/screenshot.png
./scripts/screenshot-prototype.sh threshold --wait 4000        # let animations advance further
./scripts/screenshot-prototype.sh threshold --scenario first-run
./scripts/screenshot-prototype.sh threshold --size 1512x982 -o /tmp/shot.png
```

It boots vite on its own port, shoots headless Chrome at 2×, and tears everything down (~5s). Then
**open the image and actually look at it.** Real defects found this way that nothing else caught: a
browser focus ring blaring across a card, desktop icons half-hidden behind an overlay, labels
wrapping mid-phrase, a surface that reads as unfinished rather than calm.

`--wait` advances virtual time, so timers and animations fast-forward deterministically. A prototype
with a running `setInterval` never lets Chrome exit on its own; the script handles that.

## Distinctness rule

Each prototype is a **separate bet**, not a revision of another:

- New folder, new visual language, new information architecture.
- Do not extend `desk` or `attention` into a mega-app; fork a new concept instead.
- Reuse only the pack’s data/SDK contract (`OmiMock`, scenarios, types)—not another prototype’s layout or components.

## Staging a macOS overlay

Some concepts are not windows. Panels, HUDs, notification-style cards, menu-bar surfaces, and
anything that floats over the user’s real work only makes sense on a desktop. Those mount on the
shared stage rather than inventing their own:

```ts
import { mountMacStage } from '../_macos-stage';

const stage = mountMacStage(document.querySelector('#root')!, {
  appName: 'omi',
  menus: ['File', 'Edit', 'View', 'Capture', 'Window', 'Help'],
  now: fixtureClock,          // freeze the menu bar for screenshots
});
stage.surface.append(myPanel); // your UI, above the desktop
```

`stage.surface` is click-through except where you place something. Call `stage.destroy()` on HMR
dispose. Options: `appName`, `menus`, `files`, `widgets`, `dock`, `now`. See its README.

**This is the one carve-out from the distinctness rule, and it holds only on one condition: the
stage is a bezel, not a design decision.** It is the phone-mockup frame around a screenshot. It
looks identical in every prototype that uses it and expresses nothing about the concept it holds.
Everything inside `stage.surface` is the prototype’s own visual language and stays unshared — if
you want to add a card style, type scale, or color token to `_macos-stage`, it belongs to your
prototype instead.

Concepts that genuinely need windows and apps *behind* the overlay (a document being annotated, a
call in progress) should build that background content inside their own directory. Do not grow
`_macos-stage` into a window manager.

Do not use the stage for iOS concepts, full-screen apps that own the whole display, or anything
where the desktop would be pure decoration.

## What’s in the reference pack

- `src/` — `OmiMock`, types, default seed, named scenarios (`power-user`, `first-run`, `recording`, …).
- `docs/` — hackathon brief, SDK guide, codebase map (capability pointers, not UI to copy).
- `examples/vanilla-html/` — plain diagnostic harness, not a design direction.
- Local only: no sign-in, device, API keys, or real account data. All fixtures are synthetic.

Useful loop from the brief: **capture → understand → remember → retrieve → act**. Fake anything outside the SDK if it serves the concept.

## Design craft (Impeccable)

When shaping or reviewing a prototype’s UI, use `reference/impeccable/` as optional guidance:

- Start: `reference/impeccable/skill/SKILL.src.md` and the product register `skill/reference/product.md` (app UI) or `skill/reference/brand.md` (marketing).
- Commands live as markdown under `reference/impeccable/skill/reference/` (`craft`, `critique`, `polish`, `distill`, `typeset`, …).
- Upstream overview: `reference/impeccable/README.md`. Pin/source note: `reference/impeccable/SOURCE.md`.

Impeccable is a **taste reference**, not a shared component library. Each prototype still gets its own visual language.

## Working norms

- Prefer one sharp interaction that proves the idea over full navigation chrome.
- **Never put explanatory text inside a prototype.** No "synthetic fixture" disclaimers, no
  "try clicking this", no captions narrating the concept, no scenario switchers on screen. A
  prototype is a presentable artifact that must read as a real product to someone who walks up
  to it cold. Anything you need to say about fabricated data, interactions to try, or design
  intent goes in the prototype's `README.md` or its `ideas/` brief — never in the UI.
- Every pixel on screen must be something the real product would ship. If a surface looks empty,
  fill it with credible product content or shrink the surface; do not explain the emptiness.
- macOS, iOS, or a credible responsive stand-in are all fine.
- Verify the pack only when needed: `cd reference/hackathon-pack && npm test`.
