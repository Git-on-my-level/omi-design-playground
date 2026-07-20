# Field

> Memories have no address. Give them one.

## Thesis

A list implies your memories arrived in order and matter in that order. Neither is true. Field lays them out in **space**, where position carries meaning — proximity is semantic relation, luminance is recency — so that recall becomes *wandering* rather than querying.

This is the exploratory concept, and it is honest about that: it is for the person who wants to *look at* the shape of what they know, not the person trying to find a phone number. That is a real mode and nothing else in this set serves it.

## Orthogonal on

- **Representation** — spatial, not linear. The only concept where layout itself encodes data.
- **Intent** — undirected browsing. No query, no ranking, no urgency.
- **Register** — the only one that aims for atmosphere and beauty as a primary goal.

## The one interaction that saves it

Spatial memory UIs are usually gorgeous and useless. Field earns its keep with a single mechanic:

**Drag one memory onto another and it tells you what connects them.**

Two nodes are pulled together, a filament stretches between them, and a line of text resolves at the midpoint: *"Both from conversations with Marcus about the Denver move — six weeks apart."* If nothing connects them, say so plainly: *"No shared thread."* Honesty here is what separates an instrument from a screensaver.

Supporting interactions, in order of importance:

1. **Drift.** The field breathes slowly on its own — nodes wander a few pixels. It is alive before you touch it.
2. **Pull focus.** Click a node → neighbors within its semantic radius brighten, everything else dims to 15%. The cluster reveals itself without any panel opening.
3. **Time scrub.** A slider along the bottom rewinds the field. Nodes fade in as they were formed. **You watch a year of your life accumulate**, and clusters visibly thicken where life was dense. This is the emotional payload.
4. **Reveal.** Double-click → a plain, quiet text card. Deliberately unstyled compared to the field. The romance stops at the boundary of the actual content.

## Design language

**Mood:** deep water at night. Cold, vast, patient. Bioluminescence, not a galaxy — a nebula screensaver is the cliché to avoid. Things here are *submerged*, and they glow faintly because they are alive.

**Palette** — cool void, luminance as the only variable.

| Token | Value | Use |
|---|---|---|
| `--deep` | `#080B14` | ground |
| `--deep-2` | `#0E1424` | subtle radial vignette, off-center |
| `--node` | `#8FB8D9` | base node, opacity carries recency |
| `--node-hot` | `#DCEEFB` | focused node |
| `--filament` | `rgba(143,184,217,0.28)` | connection lines |
| `--type` | `#C9D8E6` | all text |

**One hue.** Everything is the same blue at different luminance and opacity. The moment a second hue enters, it becomes a data visualization and loses its atmosphere. Recency is `opacity: 0.25 → 1.0`; nothing else encodes color.

**Type** — small, wide, quiet. Text is a visitor here.

- Node labels: **Inter**, 11px, `letter-spacing: 0.06em`, `--type` at 70%. Visible only within the focus radius; the rest of the field is unlabeled dots. An always-labeled field is unreadable noise.
- Connection reveal: **Inter**, 13px / 1.5, centered on the filament, max 90 characters.
- Chrome (scrub dates, counts): **Inter**, 10px, uppercase, `letter-spacing: 0.16em`, 40% opacity.
- No display face. Typography stays subordinate to the spatial composition.

**Space** — a full-bleed canvas, no window chrome, no panels, no sidebar. The only persistent UI is the time scrub, and it is a 1px line with a 6px handle at the very bottom edge.

**Motion** — slow is the entire aesthetic.

- Drift: nodes on independent 20–40s sine paths, amplitude ≤ 6px. Barely perceptible; unmistakable when you stop and watch.
- Focus: 420ms `ease-out` for brighten and dim. Never instant — the field *turns its attention*.
- Drag-to-connect: spring physics, ~0.7 damping. The nodes should feel like they have mass and are suspended in fluid.
- Filament draw: 320ms, then the text fades in 180ms after the line lands. Sequence matters — the connection is drawn *before* it is explained.
- Time scrub: nodes fade in over 600ms each, staggered by their actual timestamps, so scrubbing fast produces a wave.
- Render with canvas, not DOM. At 300+ nodes, DOM will jitter, and jitter destroys the entire mood.

## Rules

- No search box. Adding search concedes the whole thesis.
- No node count, no stats, no legend. The field is not explained; it is entered.
- Positions must be **deterministic and stable** — same memory, same place, every session. Spatial memory only works if the space stops moving. Seed the layout from memory IDs.
- No zoom controls. Scroll-to-zoom only, and clamp it — a lost user in an infinite canvas is a failed prototype.

## SDK hooks

`memories` are the nodes; `type` and shared `people` give a crude semantic distance for the force layout; `createdAt` drives opacity and the scrub. Connection explanations can be **template-generated** from shared person + type + time gap — genuinely derived, no LLM needed, and it reads as intelligent.

## Failure mode to avoid

Becoming a screensaver. The test: can a stranger, in ninety seconds, learn one true thing about the person whose memories these are? If the only available reaction is *"pretty,"* the drag-to-connect mechanic is underbuilt — that is where all remaining effort should go, ahead of any additional polish on the field itself.
