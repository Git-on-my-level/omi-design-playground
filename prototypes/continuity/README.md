# Continuity

The app switch is the new page turn. Omi keeps your place.

## Try first

1. Click a Stage Manager thumb (Notes / Slack) — that app becomes the focused window; the previous
   one drops into the strip. Menu bar name and the continuity marker follow.
2. Use the dock: Notes (yellow), Arc (dark), Slack (purple), omi (orange). Running dots mark open
   apps; the focused tile lifts. Finder / Mail / Calendar stay inert.
3. Traffic lights on the focused window: red closes (reopen from the dock), yellow sends it back to
   the strip, green zooms across the strip. Drag the title bar to nudge; the marker re-anchors.
4. The marker is a translucent HUD floating over the focused window — it does not shrink it. Tap the
   ⌘ ask row (or hold right Command) and the answer streams into the overlay itself. The overlay is
   ask-by-voice only; to type a follow-up you open the full app. Omi opens on dive-deeper: the
   reminder card or the overlay's "Open in omi" ingress.
5. Switching to another dock app closes omi and focuses that app.
6. Inside omi: the sidebar lists one workstream per app — **Atlas launch** (Arc), **Atlas pilot**
   (Slack), and the still-unfiled **Context should travel** (Notes), which offers to become a
   workstream. Opening omi lands on the focused app's workstream; click another to switch. The brief
   is for reading; asking Omi opens a distinct conversation that floats above the composer.

## Prototype truth

The windows, workstream inference, project records, contextual answers, and speech transcription
are scripted. The `power-user` fixture supplies the linked Priya action. `_voice` supplies live
microphone level and speech boundaries, with its deterministic fallback in headless Chrome.

Unlike a task manager, each workstream is organized around desired outcome, current understanding,
open loops, decisions, and connected context — not a to-do backlog. Conversation lives in its own
surface, separate from the brief, so reading and asking never blur together. Omi does not act on the
user's behalf.
