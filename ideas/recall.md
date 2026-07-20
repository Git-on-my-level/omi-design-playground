# Recall

> Remembering shouldn't be a place you go.

## Thesis

The Omi app can already answer questions about your memories. So can search. The capability is not the product — **the cost of asking is.** Today, retrieving something you heard means stopping your work, opening an app, typing a query, scanning results, and finding your way back. That cost is high enough that most questions never get asked; you strain, guess, or send the "hey, what was that again?" text.

Recall collapses that cost to two seconds and zero context. Hold a key while you work, ask out loud, and the answer arrives **where your cursor already is** — as a completion you can accept with Tab, with the verbatim source annotated beside the window. Copilot proved the shape: the assistant that changed behavior is the one that put its suggestion at the caret instead of in a panel. Recall is that shape, pointed at your own past speech. Same corpus as the app; completely different usage curve.

## Orthogonal on

- **Surface** — the caret. No window of its own, no destination, no full-screen moment. It annotates the work; it never replaces the screen.
- **Persistence** — none, structurally. Nothing accumulates, nothing can be browsed or managed. The only thing that survives is text the user chose to insert into their own document. The anti-app claim is made by the architecture, not by copy.
- **Input** — voice-first. The question is spoken, not typed, because you ask it the way you'd ask a person in the room.

## The demo

The value has to be shown *inside someone else's task*, or it reads as a search box with fewer features:

1. A half-written email to Priya sits open, cursor mid-sentence, needing the thing she said six days ago.
2. **Hold right ⌘.** A small dark chip surfaces just under the caret — a level dot and the words as they're spoken: *"what did priya say people actually need."* Nothing else on screen changes.
3. **Release.** A beat of thought — the words dim, the dot breathes. This is recall, not a query; it must read as remembering, never as a spinner.
4. The answer lands twice at once, split by role:
   - **In the document:** ghost text at the caret, grey, sentence-cased into the user's own prose — the phrase ready to accept.
   - **Beside the window:** a compact dark card, notch pointing at the line, with the verbatim quote in italic serif and the receipt: `PRIYA SHAH — CLIENT DISCOVERY — JUL 14`.
5. **The beat that sells it: Tab or Enter.** The ghost text commits into the document with a brief highlight, the card dissolves, and the user is still mid-sentence. Or they **type their own line in the app** — the recalled quote stays up as they write, and on dismiss the card flips to “Noted,” receipt becomes *Learned from you*, and the typed words are the new memory. Esc — or being ignored — dismisses everything without a trace.

The same hold works in a second app (Messages): switch from the dock, ask about Morgan, and the completion lands in the chat composer instead. Cross-app is the point — Recall follows the caret, not a window of its own.

Ask something it never heard and the chip says, fast and flat: *"Nothing about that."* The honest miss is what makes the hits trustworthy.

## Design language

**Mood:** an editor completion for your life. The register of Copilot ghost text — quiet, marginal, instantly dismissible — not an assistant, not a chat, never a modal moment. The work stays exactly as bright and exactly as focused; Recall is punctuation at its edge.

**Palette** — near-black annotations on the untouched desktop. Recall owns no color of its own.

| Token | Value | Use |
|---|---|---|
| `--slate` | `rgba(24, 25, 29, 0.95)` | chip and card ground |
| `--voice` | `rgba(255,255,255,0.85)` | your words, as spoken |
| `--answer` | `#FFFFFF` | the recalled quote |
| `--receipt` | `rgba(255,255,255,0.52)` | provenance |
| `--ghost` | `rgba(44,42,39,0.38)` | the completion, in-document |

No accent color, ever. Ghost grey and slate are the entire identity; an accent would make it a feature instead of an affordance.

**Type** — reported speech against machine plainness.

- The quote (card): **Newsreader**, italic, 16.5px, `--answer`. Italic serif because it is *quotation* — your past speaking back. The only serif anywhere.
- Ghost text: inherits the document's own face and size exactly — it must look like the sentence's possible future, not an insertion.
- Your words (chip): **Inter**, 12.5px, `--voice`, lowercase as spoken, no punctuation until you release.
- Receipt: **Inter**, 9px, uppercase, `letter-spacing: 0.1em`, one line, never wrapped.

**Space** — everything anchors to the work. The chip hangs 12px below the caret; the card sits 18px off the window's trailing edge, top-aligned to the caret's line, with a notch pointing back at it. Nothing is centered on the screen, because the screen is not the surface — the sentence is.

**Motion** — completion-weight, not ceremony.

- Chip: 220ms fade + 4px rise. Words land per word as spoken. **No typewriter cursor** — a cursor makes it a chatbot.
- Thinking: words drop to 45% opacity; the dot breathes at ~1.1s. 700–900ms, no longer.
- Answer: ghost text fades in over 360ms; the card slides 6px in from the window edge, 320ms `cubic-bezier(0.16,1,0.3,1)`.
- Tab: ghost becomes real text with a 240ms highlight decay — the exact grammar of an editor accepting a suggestion.
- Ignored for 9s: everything dissolves. A fresh press cuts instantly to listening.

**Material** — two small slate surfaces and nothing else. No scrim, no blur over the desktop, no dimming: **the moment the whole screen changes state, the concept has died.** The card's notch is what earns its place — it points at the line it belongs to.

## Rules

- One answer, always. One ghost completion, one card. Never a list, never "3 results," never a second candidate.
- Every answer carries a receipt: person, conversation, date. A memory without provenance is a guess.
- A miss is one flat line in the chip — *"Nothing about that."* — delivered as fast as a hit. No apology, no suggestions, no "try rephrasing."
- Nothing persists except what the user accepts into their own document. No history, no recent-questions, no transcript of the exchange. A tap without speaking leaves zero trace.
- Recall never speaks first. It has no notifications, no badges, no proactive mode. Initiative is the user's alone.
- The ghost text is set in the document's own type, and the inserted text is indistinguishable from typed text one second later.

## SDK hooks

`memories` + `conversations[].segments` are the corpus; the receipt is `segment.speaker` + conversation title + date, which the fixture joins cleanly. **Speech-to-text does not exist in the pack** — the spoken question and the matching are scripted: a small table of canned question→answer pairs timed to `_voice`'s envelope. Say so in the README. Mount on `_macos-stage`; the background email window is the prototype's own, which is also what makes caret-anchoring honest — a real macOS build would do the same through the Accessibility APIs that window managers and dictation already use.

## Failure mode to avoid

Two deaths, one on each side. Becoming a smaller copy of the app — a floating search field with results, anything clickable that leads deeper, any trace left after dismissal. And becoming a modal moment — a scrim, a dimmed desktop, a centered hero answer that owns the screen; the first build did exactly this and it read as ceremony, not utility. The whole bet is that the answer behaves like a completion: it appears at the point of need, it is accepted or ignored, and either way you never stopped typing.
