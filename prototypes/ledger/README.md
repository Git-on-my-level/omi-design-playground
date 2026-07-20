# ledger

**The experience:** you are in debt — to people, and to your own goals. Here is the balance.

Not a to-do list — a book of record. Commitments overheard in conversation are posted as double-entry obligations against an *account*: a person you owe, a person who owes you, or a goal the work is owed to. Settling a line is final; age is the only ranking signal.

```bash
make ledger
```

## Try first

1. **Open a goal.** Pick one in the rail ("Ship the narrow pilot"). The pane shows everything owed to that goal — including what *other people* promised toward it, which no plain to-do list can say.
2. **Open a person.** The same book re-cut as a relationship: what you owe them, what they owe you, and the oldest open line.
3. **Follow a tag.** Every row carries its cross-links — an entry owed to Taylor *and* to the pilot shows both, and clicking either jumps to that account.
4. **Trace and settle.** Click the tick to mark a line Done (or reopen it); expand a row for the receipt and the same Done action. A rule strikes through and every balance recalculates.
   - **Open the conversation.** When a line was quoted from a conversation, *View conversation →* opens the **Conversations** page on that recording — summary, full transcript (quoted line highlighted), and an **ask** box. Answers think briefly, then stream in word by word, citing the matching transcript line.
   - **Open Rewind from a shot.** Screen-sourced lines expand to a mock screenshot; click the shot (or *View in Rewind →*) to jump to that frame in Rewind.
5. **Tell Omi.** The line at the bottom is the counter. Focus it and Omi offers a few canned lines; they filter as you type. A draft slip appears — inferred account, inferred side — with an *Add to list* button. Ask `Where do I stand with Taylor?` and the book re-cuts to Taylor's account; Omi thinks, then streams the answer. Or hold **right ⌘** and speak: Omi types the words out as it hears them and an ink stroke follows your voice; releasing adds the line.
6. **Let Omi watch.** The rail shows a quiet *Watching screen* status. Obligations you never say out loud — a Slack ask, a mail thread — land in the book too: screen-sourced entries carry a source chip (`slack`, `mail`), and expanding one shows a **mock app window** as the receipt. A few seconds after load, Omi catches a fresh one and drops a draft at the counter to confirm — same *Add to list* flow as speech.
7. **Rewind.** Open *Rewind* (top of the rail) to scrub back through what Omi saw — a **timeline** grouped by day (Today / Yesterday / date), each capture a mock window (Slack / Mail / Calendar / Notes chrome) pinned to its time on a running rule. A filled node means the capture *became a to-do* (green **Added to the book** badge + the line Omi drew from it); a hollow node is ambient (seen, nothing to track). Click a task capture to reveal *Open in the book →*.
8. **Conversations.** Open *Conversations* (top of the rail) for the full list of recordings; each row shows how many obligations it put **on the book**. Pick one for summary, transcript, and ask.

## What it is not

Not Things, not Todoist, and not a chatbot. No due-date pickers, priority flags, a "today" view, or a message thread. The vocabulary is entry, account, balance, settle, outstanding — and an account can be a person or a goal, because a bookkeeper posts to whatever the debt is against. Input has exactly two acts here: **adding** (dictate or type a line into the book) and **inquiry** (ask Omi, which answers by opening the right page plus one written line that fades). The book is the memory; no chat transcript accumulates. If a 1920s bookkeeper would not recognize it, it does not belong here.

## Design notes

Ink on cream paper, in the shape of a desktop tool: a rail on the left split into two categories — **Memory** (Rewind, Conversations, as icon tiles: the sources Omi remembers) above **The book** (Everything open, then Goals and People, each with its net position) — and the open book on the right. One line per entry — tick, commitment, cross-link tags, side, date — expanding in place for the receipt and the settle action. IBM Plex Serif carries the content; mono only for balances, dates, tags, and side markers. Goal tags are dashed, person tags solid. Oxidized red for what you owe, deep green for what you are owed. No zebra stripes, no column headers. Full brief: [ideas/ledger.md](../../ideas/ledger.md).

## Data, and what is fabricated

Defaults to `power-user`. Debit entries come from open (and a few settled) `actions` that name a counterparty. Receipts are real `conversation` segments.

Fabricated:

- **Side.** `SuggestedAction` has no debit/credit field. Debits are derived from actions you owe; four **credit** entries are synthesized from segments where someone else made a promise (Casey on the filter, Taylor on instrumentation, Avery on unresolved edges, Drew on keeping the source close — the last already settled).
- **Goals.** The SDK has no goal object. The four goals (narrow pilot, evidence-first roadmap, calm-arrival trip, home upkeep) are hand-authored from the fixture's conversation clusters, and each action is posted to a person, a goal, or both.
- **Age.** Days since the source conversation started, pinned to the fixture clock `2026-07-20T18:16Z`.
- **Transcription.** Does not exist in the pack. `_voice` supplies the mic level and push-to-talk binding; while the key is held Omi "types out" the next of four scripted utterances word by word (`HEARD_LINES`, `streamTranscript`) so the demo reads as live dictation, and releasing submits it.
- **Canned typing.** For a believable live demo the counter is a scripted typer, not a real editor: it ignores which keys you press and reveals one canned line at a time character by character (`SUGGESTIONS`, `handleCannedKey`), Enter submits and advances to the next line. The parser it feeds is real — keyword matching over account names, not NLU (`npx tsx prototypes/ledger/counter.ts` runs its self-check on the same grammar). Added entries live in memory only and reset on reload.
- **Conversations page.** Real data: summary, transcript, participants, and timestamps come from the pack's `conversations` (`power-user` ships 16 with 45 segments). Ask answers are **not** an LLM — `converse.ts` picks the best-overlapping segment and cites it (`npx tsx prototypes/ledger/converse.ts` self-checks). Streaming (thinking dots, then word reveal) is demo pacing only.
- **Screen capture / Rewind.** The SDK has no screen frames. Captures are CSS mock windows (traffic-light chrome + app-specific stage), not image files. Screen-sourced entries, ambient frames, and the incoming draft (`entries.ts` `SCREEN_CAPTURES` / `REWIND_AMBIENT`, `main.ts` `scheduleIncomingCapture`) are fabricated. The Rewind timeline sorts every capture newest-first and groups it by calendar day against the fixture clock (`listRewindFrames`, `dayLabel`); the *Watching screen* status is decorative. The "N on the book" count on a conversation is the real number of ledger entries carrying that `conversationId`.

None of the above is stated in the UI.
