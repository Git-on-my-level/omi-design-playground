# Mirror

> Arrives Monday. Tells you what actually happened to the project.

## Thesis

Omi sits through every standup, hallway conversation, and 1:1. It knows things a project manager cannot get from a tracker: which decision was made in a corridor and never written down, which commitment has now slipped three weeks running, who has stopped speaking in the meetings they used to drive.

Mirror is a **weekly report that arrives once and cannot be browsed**. Not a dashboard you check — a document that shows up, gets read, and is done. The project-management angle keeps it professionally legible while staying uncomfortably observant.

## Orthogonal on

- **Object** — the subject is the *project and the team*, not the user's own memories.
- **Cadence** — weekly and periodic. Everything else in this set is instantaneous or ambient.
- **Mode** — analysis over retrieval. It draws conclusions and takes the risk of being wrong.

## The four sections

Fixed structure every week. The discipline of an unchanging skeleton is what makes it scannable in ninety seconds.

1. **Slippage** — commitments that moved, with how many times. A small multiple per commitment: a sparkline of promise dates walking rightward. This is the single most damning visualization in the product.
2. **Decided in passing** — decisions made in conversation that never reached a tracker. Each with its verbatim source and a *"where did this land?"* prompt.
3. **Quiet** — participation drift. Who spoke a lot last month and little this one. Handled without judgment: it is a signal to check on someone, not a productivity metric. **Get this tone right or cut the section.**
4. **Unanswered** — questions asked in meetings that never received an answer.

## The demo

1. **The arrival.** A single line in a mostly empty window: *"Week of July 13 — ready."* Click. The report composes itself top-down, sections settling 120ms apart. Ceremony matters; this is the one concept allowed a moment of gravity.
2. **The slippage sparkline.** Hover a commitment → the dates label themselves and the total drift shows in weeks.
3. **Acknowledge.** Every finding takes exactly one action: *noted*. It greys and collapses to a single line. There is no snooze, no assign, no comment thread. You read it, you take it in, you move on.

## Design language

**Mood:** a Swiss annual report. Analytical, gridded, restrained, printed. It should look like it was typeset rather than rendered, and like it has no opinion about how you feel — which is precisely why the observations land.

**Palette** — paper white with one accent and one alarm.

| Token | Value | Use |
|---|---|---|
| `--stock` | `#FBFBF9` | ground |
| `--ink` | `#111111` | headings, data |
| `--ink-60` | `#6E6E6B` | body |
| `--ink-25` | `#BEBEB9` | grid lines, axes |
| `--accent` | `#1B4DB1` | data marks, section numerals |
| `--drift` | `#C2410C` | slippage only — the one alarming color |

No gradients. No fills under charts. Data marks are 2px strokes and 4px dots. Everything else is black on white.

**Type** — a grotesque doing all the work, with real typographic hierarchy instead of color.

- Headline: **Neue Haas Grotesk** / fallback **Inter Tight**, 32px, `weight 600`, `letter-spacing: -0.025em`.
- Section numerals: 56px, `weight 300`, `--ink-25` — large, pale, structural. They are architecture, not decoration.
- Body: **Inter**, 14px / 1.6, `--ink-60`, measure capped at **62 characters**. Non-negotiable.
- Data labels: **Inter**, 10px, tabular numerals, `letter-spacing: 0.04em`.
- Verbatim quotes: same Inter, italic, with a 2px `--ink-25` left rule and 16px indent.

**Space** — a visible 12-column grid with 24px gutters. Content occupies columns 3–10; the outer columns stay empty and that asymmetry is the layout's signature. Sections separated by a full 96px. Page max-width 1000px, centered.

**Motion** — nearly none, and slow when present.

- Compose-in: 500ms fade + 8px rise, sections staggered 120ms. Once, on open.
- Sparklines draw left-to-right, 700ms `ease-out`, on first scroll into view. Once.
- Acknowledge: 280ms collapse.
- No hover lifts, no transitions on scroll, no parallax. **A printed page does not animate**; this one is permitted exactly three exceptions.

## Rules

- Fixed section order, always. Even an empty section prints its header and the word *"none."* Absence is a finding.
- Never rank people against each other. No leaderboards, no scores, no per-person totals. The Quiet section names a person at most once.
- Every claim carries a verbatim receipt. This concept makes inferences about humans; unsourced inference is unshippable.
- Cannot be filtered, sorted, searched, or re-run. One document, one week, take it or leave it.

## SDK hooks

`conversations` across the week for participation and decisions, `actions` with `dueAt` history for slippage, `people` for the roster. Slippage requires *multiple* past due dates — the SDK has one, so **fabricate the history** and label it synthetic.

## Failure mode to avoid

Two ways to ruin it. First, becoming an analytics dashboard — filters, date pickers, drill-downs — which turns a document into a tool and destroys the once-a-week ceremony. Second, and worse: the Quiet section reading as surveillance scoring. The frame is *"someone may need support,"* never *"someone is underperforming."* If the copy cannot hold that line, ship three sections.
