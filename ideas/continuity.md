# Continuity

**The app switch is the new page turn. Omi keeps your place.**

## Thesis

Knowledge work is not one project in one app. A workstream is scattered across browser tabs,
messages, documents, and half-finished drafts. The cost of switching is not finding the window
again; it is reconstructing the mental state that made the window meaningful.

Continuity gives every focused app a quiet edge marker. When Omi recognizes a workstream, the
marker restores the smallest useful working set: the goal, the unresolved thought, and the next
intended move. When there is nothing useful to restore, it contracts to a voice affordance.

This is not a task manager floating over every app. It is a placekeeper for thought.

## The interaction worth building

Three overlapping macOS windows belong to different workstreams. Clicking a window brings it
forward and changes the Omi marker:

- a browser researching activation language restores an unresolved metric discrepancy;
- Slack restores a decision waiting on Priya;
- Notes has no project action and shows only the contextual ask affordance.

The marker is always present but barely occupies the edge. Clicking it opens Omi's fuller project
model: goal, current state, open loops, recent decisions, people, and connected artifacts. Holding
right Command asks a scripted question against the focused screen and current workstream.

The demo proves one claim: Omi understands that a project spans apps.

## Information hierarchy

The compact marker may show only:

1. workstream name;
2. one line describing where the user was;
3. one next move, when one exists;
4. the push-to-talk state.

The expanded app is not a kanban board. Its primary object is the workstream model:

- desired outcome;
- current understanding;
- decisions already made;
- unresolved questions;
- next intended moves;
- people and artifacts carrying the context.

## Trigger policy

For this prototype the marker updates on every app focus change. That makes the behavior legible
without depending on elapsed time. In a real product, frequency and confidence would need careful
calibration; this prototype tests whether an extremely quiet persistent surface can remain useful
without becoming an interruption.

## Design language

**A bookbinder's registration thread inside macOS.**

The desktop and work apps stay familiar. Omi is a narrow saffron line at the right edge, with a
small dark label attached like a physical place marker. It uses crisp system typography, black
ink, true-white working surfaces, and one honey accent. No glass cards, assistant sparkle,
chatbot bubble, gradient, or glowing AI chrome.

The expanded app is a precise project folio: one continuous surface divided by hairlines, not a
grid of cards. The same saffron thread travels through goal, state, open loops, and artifacts so
the visual metaphor survives expansion.

Motion is limited to continuity itself: the marker glides to the focused window, text crossfades,
and the thread draws into the expanded folio. Reduced motion replaces these with immediate state
changes.

## Prototype truth

App focus, project inference, window contents, contextual questions, and workstream records are
scripted. The `power-user` fixture supplies related people, actions, conversations, and memories
where useful. Voice transcription is fabricated; `_voice` supplies only microphone level and
speech boundaries.

## Not this

- not a notification;
- not a list of everything due;
- not a universal command palette;
- not automatic action-taking;
- not a project-management replacement;
- not Threshold: Threshold prepares for a person before a moment; Continuity restores a project
  while moving through work.
