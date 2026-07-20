# ledger

**The experience:** you are in debt to four people. Here is the balance.

Not a to-do list — a book of record. Commitments overheard in conversation are posted as double-entry obligations: what you owe, and what you are owed. Settling a line is final; age is the only ranking signal.

```bash
make ledger
```

## Try first

1. **Settle a line.** Click any row. A rule strikes through, the row goes grey, and the running balance at the bottom recalculates.
2. **Open an account.** Click a name. The sheet filters to that person and shows the arithmetic of the relationship.
3. **Trace the entry.** Click a date. The verbatim transcript line that produced the promise expands beneath — a ledger entry with no receipt is an accusation.

## What it is not

Not Things, not Todoist. No projects, tags, due-date pickers, or a "today" view. The vocabulary is entry, account, balance, settle, outstanding. If a 1920s bookkeeper would not recognize it, it does not belong here.

## Design notes

Ink on cream paper. IBM Plex Mono for the ruled columns (tabular numerals, always right-aligned), IBM Plex Serif for names and commitments. Oxidized red for debit, deep green for credit. No shadows, no radii, no hover lifts — only a 3% deeper row band. Full brief: [ideas/ledger.md](../../ideas/ledger.md).

## Data, and what is fabricated

Defaults to `power-user`. Debit entries come from open (and a few settled) `actions` that name a counterparty. Receipts are real `conversation` segments.

Fabricated:

- **Side.** `SuggestedAction` has no debit/credit field. Debits are derived from actions you owe; four **credit** entries are synthesized from segments where someone else made a promise (Casey on the filter, Taylor on instrumentation, Avery on unresolved edges, Drew on keeping the source close — the last already settled).
- **Age.** Days since the source conversation started, pinned to the fixture clock `2026-07-20T18:16Z`.

None of the above is stated in the UI.
