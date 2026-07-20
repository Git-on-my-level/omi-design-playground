# AGENTS.md — Omi UI Hackathon

Spray-and-pray UI/UX exploration. Many distinct concepts beat one polished app.

## Where work goes

| Path | Role |
| --- | --- |
| `prototypes/<name>/` | **Your concepts.** One idea per directory. Self-contained HTML/CSS/JS(TS). |
| `reference/hackathon-pack/` | **Read-only capability pack.** Mock SDK, synthetic scenarios, docs, diagnostic harness. |
| `scripts/serve-prototype.sh` | Serve any prototype by name. |

Do **not** put new concepts inside the pack (`examples/`, `src/`, etc.). Do **not** edit the pack unless the user explicitly asks to update the reference.

## New prototype checklist

1. Create `prototypes/<kebab-name>/` with its own `index.html` (+ CSS/JS or TS).
2. Import the mock from `../../reference/hackathon-pack/src` when you need Omi state.
3. Run: `./scripts/serve-prototype.sh <kebab-name>` (after `cd reference/hackathon-pack && npm install` once).
4. Keep it independent: no shared UI kit, no cross-prototype imports, no “design system” that couples ideas.

## Distinctness rule

Each prototype is a **separate bet**, not a revision of another:

- New folder, new visual language, new information architecture.
- Do not extend `desk` or `attention` into a mega-app; fork a new concept instead.
- Reuse only the pack’s data/SDK contract (`OmiMock`, scenarios, types)—not another prototype’s layout or components.

## What’s in the reference pack

- `src/` — `OmiMock`, types, default seed, named scenarios (`power-user`, `first-run`, `recording`, …).
- `docs/` — hackathon brief, SDK guide, codebase map (capability pointers, not UI to copy).
- `examples/vanilla-html/` — plain diagnostic harness, not a design direction.
- Local only: no sign-in, device, API keys, or real account data. All fixtures are synthetic.

Useful loop from the brief: **capture → understand → remember → retrieve → act**. Fake anything outside the SDK if it serves the concept.

## Working norms

- Prefer one sharp interaction that proves the idea over full navigation chrome.
- Label fabricated UI copy/data as synthetic when confusion is likely.
- macOS, iOS, or a credible responsive stand-in are all fine.
- Verify the pack only when needed: `cd reference/hackathon-pack && npm test`.
