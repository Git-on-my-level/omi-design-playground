# AGENTS.md — reference trees

Everything under `reference/` is **read-only**. Do not edit `hackathon-pack/` or `impeccable/`
unless the user explicitly asks. This file is the exception: it is repo notes *about* the
reference material, not part of it.

## What lives here

| Path | Role |
| --- | --- |
| `hackathon-pack/` | Mock SDK (`OmiMock`), synthetic scenarios, types, docs, diagnostic harness. |
| `impeccable/` | Design craft/critique guidance. A taste reference, never a component library or a Cursor install. |

---

# Fixture cheat sheet

Read this instead of grepping the scenarios. Every name and fact below is synthetic.

## The fixture clock

The scenarios are a **fixed synthetic day: 2026-07-20**, latest activity around `18:16Z`. There is
no exported "now" — pin your own constant and derive relative time from it, or every "6 days ago"
drifts with the real calendar:

```ts
const FIXTURE_NOW = new Date('2026-07-20T18:16:00.000Z');
```

## Scenarios

| Name | Shape | Reach for it when |
| --- | --- | --- |
| `default` | Small, balanced | Getting started; you need a little of everything |
| `power-user` | 10 people · 16 conversations · 36 memories · 20 actions · 12 apps | Density, ranking, timelines, IA. **The one most concepts want.** |
| `first-run` | Sparse, device connecting | Onboarding, empty states, setup |
| `recording` | Live capture with transcript segments | Anything synchronous or capture-facing |
| `processing` | Transcript pending, extraction in flight | Latency, in-between states |
| `offline-recovery` | Readable local context, device disconnected | Degraded states, trust, retry |
| `empty-search` | Populated, but a valid query matches nothing | Honest empty results |

Override at runtime with `?scenario=<name>` — the `_template` scaffold already wires this up.

## Who is in `power-user`

`Riley Park` is you (`person-me`). The others, by how usable they are:

| Person | Relationship | Has an open commitment? |
| --- | --- | --- |
| Priya Shah | Client contact | **Yes** — `action-001`, workshop decision trail |
| Taylor Reed | Engineering partner | **Yes** — `action-002`, export pilot |
| Morgan Ellis | Research partner | **Yes** — `action-006`, workaround pattern |
| Quinn Ellis | Community host | **Yes** — `action-014`, practice-sharing call |
| Avery Chen | Product partner | No (hers is `done`) |
| Casey Nguyen, Drew Santos, Noah Kim, Robin Hale | Ops, writing group, neighbor, family | No named action |

**Only four people have an open, named, conversation-linked commitment.** Any concept that renders
"one card per person you owe something" gets four items, not ten. Check this before designing a
layout that assumes a longer list.

## Joins that actually resolve

These are the relationships worth building on — they hold across the fixture:

- `action.conversationId` → a real `Conversation` with 2–4 `segments`. **This is your receipt**:
  the verbatim line behind a claim. Use it; unsourced inference about people is not shippable.
- `memory.people[]` → `person.id`. Filter memories by person for context.
- `memory.sourceConversationId` → the conversation that produced the memory.
- `memory.kind` is one of `fact | preference | relationship | commitment | insight`.
  `relationship` memories are the most useful single line about a person.
- `memory.relevance` (0–1) exists on most memories and is a reasonable ranking signal.

## Sharp edges

- **Actions have exactly one `dueAt`.** There is no history of previous due dates, so anything
  about *slippage* or a commitment moving repeatedly must be fabricated.
- **There is no calendar and no meeting.** Concepts keyed to "before a meeting" fabricate the
  schedule entirely.
- `people` includes `person-me`; filter it out before rendering a list of others.
- 12 of 20 `power-user` actions are `open`, 8 are `done` — enough for both states.
- Names are matched by first name in action titles (`"Send Priya the…"`), which is a convenient
  but fragile join. It works across this fixture; do not assume it generalizes.

Fabricating beyond the SDK is explicitly allowed. What is **not** allowed is telling the user
about it inside the prototype — see the root `AGENTS.md`. Fabrication notes go in the prototype's
`README.md`.
