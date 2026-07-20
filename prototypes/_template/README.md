# _template

Scaffold for a new prototype. **Copy it, don't import from it.**

```bash
./scripts/new-prototype.sh my-concept
./scripts/serve-prototype.sh my-concept
```

## What it is

Wiring with no taste: mock binding, `?scenario=` override, snapshot on load, live re-render on mock events, HMR-safe listener cleanup, and a CSS reset. That's the whole surface.

## What it deliberately is not

Not a UI kit. No fonts, colors, spacing scale, or components — those are each prototype's own argument, and sharing them would make every concept look like a variant of the same app. Per `AGENTS.md`, prototypes stay independent: the only thing they share is the pack's data contract (`OmiMock`, scenarios, types).

If you find yourself wanting to promote something from a prototype back into this template, it's almost certainly a design decision and belongs to that prototype instead. The exceptions worth adding: wiring, dev ergonomics, accessibility defaults.

## Scenarios

`default` · `first-run` · `power-user` · `recording` · `processing` · `offline-recovery` · `empty-search`

Set the concept's best default in `DEFAULT_SCENARIO`; `?scenario=` overrides it for demos.
