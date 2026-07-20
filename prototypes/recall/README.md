# Recall

> Remembering shouldn't be a place you go.

Hold **right ⌘** in **Mail** or **Messages**, ask out loud, release. The answer arrives at your
caret: ghost text you can accept with **Tab** or **Enter**, plus a compact source card. Type
instead in the app — Omi notes the correction as a new memory. **Esc** dismisses. Concept brief:
[`ideas/recall.md`](../../ideas/recall.md).

```bash
make recall        # serve
make shot-recall   # screenshot
```

## Try

- Switch apps from the dock (Mail / Messages) — both have a live caret Recall can land on.
- Hold right ⌘, wait for the words, release → ghost text plus the source card.
- **Tab** or **Enter** → insert the completion (ghost clears; text becomes real).
- Or type any key in the app → a canned correction lands there, and the card notes the learn.
- Ask four times: the fourth misses on purpose — *"Nothing about that."*
- Tap right ⌘ without speaking → zero trace.

## Fabricated

- **There is no speech-to-text.** The "heard" questions are a scripted cycle in `SCRIPT`
  (`main.ts`); `_voice` supplies only the level meter and the push-to-talk binding. The answers
  are real `power-user` fixture segments resolved through the mock SDK, receipts included.
- Mail and Messages are inert scenery built here so the completion has real carets in two apps.
  A real macOS build would anchor via Accessibility APIs. The dock only shows those two apps.
- Typed “corrections” ignore the actual keys and use canned lines in `CORRECTIONS` — the note on
  the card is the demo beat, not a write to the mock SDK.
- All names and quotes are the pack's synthetic fixtures.
