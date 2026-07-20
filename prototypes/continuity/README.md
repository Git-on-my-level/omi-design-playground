# Continuity

The app switch is the new page turn. Omi keeps your place.

## Try first

1. Click a Stage Manager thumb (Notes / Slack) — that app becomes the focused window; the previous
   one drops into the strip. Menu bar name and the continuity marker follow.
2. Use the dock: Notes (yellow), Arc (dark), Slack (purple), omi (orange). Running dots mark open
   apps; the focused tile lifts. Finder / Mail / Calendar stay inert.
3. Traffic lights on the focused window: red closes (reopen from the dock), yellow sends it back to
   the strip, green zooms across the strip. Drag the title bar to nudge; the marker re-anchors.
4. The marker floats over the focused window — it does not shrink it. Tap the ⌘ ask capsule (or hold
   right Command) and the answer lands in the overlay itself. Omi only opens when you dive deeper:
   the reminder card, the overlay's "Open in omi" ingress, or a follow-up question.
5. Switching to another dock app closes omi and focuses that app.

## Prototype truth

The windows, workstream inference, project records, contextual answers, and speech transcription
are scripted. The `power-user` fixture supplies the linked Priya action. `_voice` supplies live
microphone level and speech boundaries, with its deterministic fallback in headless Chrome.

Unlike a task manager, the expanded view is organized around desired outcome, current
understanding, decisions, unresolved questions, and connected artifacts. It does not act on the
user's behalf.
