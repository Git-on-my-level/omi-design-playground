# Ledger

> You are in debt to four people. Here is the balance.

## Thesis

Every "I'll send you that link" is an unrecorded liability. Omi hears all of them. Ledger recasts memory as **double-entry bookkeeping of obligation** — not a to-do list, a *balance sheet between you and the people in your life*.

The reframe does the work. A to-do list is a pile you feel bad about. A ledger has two sides: what you owe, and what you are owed. Seeing that Marcus owes you three things and you owe him none changes a relationship's texture in a way no checklist does.

## Orthogonal on

- **Object** — the unit is not a memory or a conversation, it is a **debt between two parties**.
- **Register** — accounting stationery. Nothing else in the hackathon will look remotely like it.
- **Emotional frame** — obligation and settlement, not capture and recall.

## The demo

A ruled account book. Rows are commitments, columns are `date · counterparty · commitment · age · side`. Sorted by age, because old debts are the ones that cost you.

Three interactions:

1. **Settle a line.** Click it. A rule strikes through, the row desaturates to grey, and the running balance at the bottom recalculates with rolling tabular numerals. Settling should feel *satisfying and final*.
2. **Open an account.** Click a name → the sheet filters to that person, and a subtotal appears: *"You owe Priya 2. Priya owes you 0. Oldest: 19 days."* The relationship, as arithmetic.
3. **Trace the entry.** Every row shows a source: click the date and the verbatim transcript line where the promise was made expands beneath it, indented, in italic. **A ledger entry with no receipt is an accusation** — this interaction is what makes the concept honest rather than presumptuous.

## Design language

**Mood:** a hand-kept account book. Cream stock, ruled hairlines, ink that varies in weight. Slightly old-fashioned, entirely serious. Zero app-ness — no cards, no shadows, no rounded anything.

**Palette** — ink on paper, one red.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F7F4EC` | ground |
| `--paper-alt` | `#F2EEE4` | alternating row band, barely there |
| `--ink` | `#1A1815` | primary |
| `--ink-soft` | `#6B655C` | metadata, settled rows |
| `--rule` | `#DDD6C7` | hairlines |
| `--debit` | `#A32C1E` | what *you* owe — oxidized red, never fire-engine |
| `--credit` | `#2E5741` | what you're owed — deep green |

Dark mode: invert to `#141310` ground with `#E8E2D4` ink; keep the red and green, desaturate them ~15%.

**Type** — monospace tabular, serif for prose.

- Ledger rows: **IBM Plex Mono**, 13px, `font-variant-numeric: tabular-nums`. Every column aligns because every glyph is the same width. This is the entire typographic thesis.
- Names and headings: **IBM Plex Serif**, 15px / 22px. Warmth against the machine grid.
- Column headers: Plex Mono 10px, uppercase, `letter-spacing: 0.12em`, `--ink-soft`.
- Numbers are **right-aligned always**, no exceptions.

**Space** — a strict 24px baseline grid, rows exactly 36px, 1px rules between. Generous outer margins (64px+) so it reads as a *sheet*, not a table widget. Page width capped at 860px.

**Motion** — sparse and mechanical.

- Strike-through: 320ms `ease-out` width `0 → 100%`, then 200ms desaturation. Two beats, in sequence.
- Balance recalculation: digits roll vertically, 180ms, staggered right-to-left like a mechanical counter.
- Row expansion for receipts: 240ms height, no fade. Paper does not fade.
- Nothing hovers, lifts, or glows. The only hover state is the row band deepening by 3%.

**Material** — no shadows, no radii, no gradients. A faint paper grain (`opacity: 0.025` SVG turbulence) is the *only* texture permitted.

## Rules

- No checkboxes. Checkboxes are to-do lists. Use the strike-through.
- No priority colors, no urgency badges. **Age is the only ranking signal**, and it is a number in a column.
- Never say "task." The vocabulary is: entry, account, balance, settle, outstanding.
- The bottom of the sheet always shows a running balance. Always. It is the punchline.

## SDK hooks

`actions` provide the entries; `dueAt` and creation time give age; `people` supply counterparties. The debit/credit *side* is not in the SDK — derive it from the action's phrasing, and fabricate the field if needed. Segment text from the source `conversation` is the receipt.

## Failure mode to avoid

Drifting into Things/Todoist. The moment it grows projects, tags, due-date pickers, or a "today" view, the reframe is dead. **It is a book of record, not a productivity app.** If you are tempted to add a feature, ask whether a 1920s bookkeeper would recognize it.
