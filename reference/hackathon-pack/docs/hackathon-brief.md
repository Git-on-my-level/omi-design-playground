# Omi UI Hackathon: Agent Handoff

## Goal

Create a clickable, high-conviction HTML prototype that reimagines Omi on macOS, iOS, or both. The output should make a product idea legible through interaction. It does **not** need production functionality.

Omi’s broad product loop is: **capture → understand → remember → retrieve → act**. The supplied SDK exposes a useful subset of those capabilities locally, but no screen, hierarchy, navigation model, or visual language is prescribed.

## Working rules

1. Start with `npm run dev`; it opens a deliberately plain example, not a design direction.
2. Use `OmiMock` where changing state helps the concept: live capture, conversations, memories, people, device connection, integrations, actions, and assistant replies.
3. Fake anything outside the SDK if it supports the interaction you want to demonstrate. Label fabricated data as synthetic when that would otherwise be confusing.
4. Design for macOS, iOS, or a responsive web surface that credibly expresses either. HTML is the delivery medium, not a constraint on product thinking.
5. Do not require sign-in, a physical device, API keys, a backend, or a populated Omi account.
6. Do not copy production UI by default. Use the real codebase only as a factual reference when you need to understand a capability.

## Capability palette (not a screen checklist)

| Capability | What the mock provides | A prototype may explore |
| --- | --- | --- |
| Capture | Start, live transcript segments, stop, processing/idle state | Presence, control, privacy, live reflection |
| Conversations | Summaries, speakers, source, segments | Recall, narrative, context, timelines |
| Memories | Typed facts, preferences, relationships, commitments | Retrieval, trust, connection, insight |
| People | Relationship and recency | Social context, consent, shared understanding |
| Device | Connection, battery, firmware, sync time | Ambient status, continuity, setup |
| Integrations | Connected/disconnected apps | Context boundaries, value exchange, control |
| Actions | Open/done follow-ups linked to context | Follow-through, prioritization, agency |
| Assistant | Mock response with citations | Guidance, exploration, confidence |

## Deliverable bar

- One runnable prototype with at least one compelling interaction.
- A short note naming the experience it is trying to create and the interaction to try first.
- No fidelity requirement beyond what makes the idea convincing.

## Reference only when useful

Read [the codebase map](./omi-codebase-map.md) for real capability and source pointers. It is intentionally high-level so it does not turn the hackathon into a production-app clone.
