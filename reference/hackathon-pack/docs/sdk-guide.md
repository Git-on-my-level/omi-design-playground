# Omi UI Hackathon SDK guide

This pack includes a **fake TypeScript SDK** for prototyping Omi surfaces quickly. It is a local, deterministic stand-in: the data is synthetic, the actions do not reach Omi services, and no API key, account, device, or backend is required.

The SDK models Omi capabilities and state transitions only. It does not prescribe a layout, navigation model, visual style, or component library. The UI is free to present the same capability as a list, card, timeline, command surface, or something else.

Its types are deliberately **normalized prototype projections**, not Omi API-compatible DTOs: for example, `Memory.text`, `Conversation.summary`, `Person.relationship`, and local device battery/connectivity are simple shapes chosen for interaction design. App connectivity is synthetic too.

## Agent-first quick start

1. Inspect the exports in `src/` before coding. This guide describes the included local contract.
2. Create one `OmiMock` client for the prototype session, selecting a named scenario and optionally replacing parts of its synthetic seed.
3. Read an initial snapshot and render from that state. Do not invent production data in the UI.
4. Subscribe to events while the screen is active; update from the event payload or re-read the snapshot as appropriate.
5. Keep the returned unsubscribe function and call it when the screen is removed.
6. Exercise at least one populated state and one degraded/empty state before calling the flow done.

Usage:

```ts
import { OmiMock } from "./src";

const omi = new OmiMock({
  scenario: "power-user",
  // Optional: replace only the fixture areas your concept needs.
  seed: { device: { connection: "disconnected" } },
});

const initial = await omi.getSnapshot();
render(initial); // The app owns the rendering and interaction design.

const stopListening = omi.on("capture.changed", (event) => renderCapture(event.capture));

async function onRecordPressed() {
  await omi.startCapture("ios");
}

async function onStopPressed() {
  await omi.stopCapture();
}

async function onSearch(query: string) {
  renderResults(await omi.listMemories(query));
}

// Call when the route/view is disposed.
stopListening();
```

The pack uses asynchronous methods to resemble a real app boundary, even though every result is local and synthetic. Preserve the lifecycle: initialize → read → subscribe → act → unsubscribe.

### Named scenarios

`OmiMock` includes isolated, deterministic fixtures for common prototype
states. Use `scenario: "first-run"`, `"power-user"`, `"recording"`,
`"processing"`, `"offline-recovery"`, or `"empty-search"`; omit it for the
small `default` fixture. `getOmiScenario(name)` returns a fresh `OmiSeed` when
you need to inspect or compose a fixture yourself. A supplied `seed` is applied
after the scenario: scalar fields override the scenario, and arrays replace
only their named area. No scenario contains account data.

## Capability summary

Use the SDK as a thin capability boundary:

| Capability | What a prototype can read or request |
| --- | --- |
| Conversations | Recent synthetic conversations, summaries, timestamps, sources, speakers, and segments |
| Memories | Typed seeded memories, simple text filtering through `listMemories(query)`, and local `createMemory(draft)` |
| People | Relationships and recent context through `listPeople()` |
| Capture | Idle, capturing, processing, and completed transitions; live transcript segments; start/stop |
| Device | Local connection state, battery, firmware, and last-sync time; connection-state mutation |
| Apps and actions | Connected/disconnected app context and linked open/done follow-ups |
| Assistant | A synthetic reply with a mock citation through `askAssistant(prompt)` |
| Events | `capture.changed`, `conversation.updated`, `memory.created`, `device.changed`, `action.changed`, and `assistant.responded` subscriptions |

Prefer the snapshot/event data as the source of truth. A prototype should not infer microphone, sync, or account state from a button's local visual state.

## Recommended fake states and interactions

These states make a prototype believable without needing live infrastructure:

- **First run:** no memories, no recent transcript, and a short explanation of what the surface can do. Use the `first-run` scenario or explicitly override the relevant arrays.
- **Populated:** several conversations with different speakers/timestamps and a few searchable memories.
- **Recording:** an obvious active-recording/privacy indication, elapsed time, and a stop action.
- **Processing:** recording ended but transcript/memory extraction is pending; keep the user informed and allow safe navigation.
- **Offline/disconnected:** existing local data remains readable while device/session actions explain that they are unavailable.
- **Permission denied:** microphone or device permission is declined; represent it as local UI state and provide a recoverable explanation and a way to retry. The mock deliberately does not simulate browser/OS permission APIs.
- **Empty search:** a valid query with no matches, distinct from a loading or error state.
- **Error/retry:** one failed action with a retry path; do not silently pretend it succeeded.

The named `first-run` scenario provides synthetic setup context; for a truly
empty state, override the relevant arrays explicitly, for example
`seed: { conversations: [], memories: [], actions: [] }`.

Useful interactions to wire to the fake client include starting/stopping a session, opening a transcript, searching memories, filtering by time or speaker, selecting a device, reconnecting it, and retrying a failed operation. Keep optimistic UI bounded: reflect a requested action only when the mock state/event confirms it, unless the SDK explicitly documents optimistic behavior.

`startCapture(platform)` carries `macos` or `ios` into the completed
conversation's `source`. A new capture is rejected while another capture is
processing so a pending stop cannot consume or clear a newer session.

## Event subscription pattern

Subscriptions are useful for recording indicators, processing progress, and device changes. Keep handlers small and idempotent. Filter events by the active conversation/device when the SDK provides an identifier, and always unsubscribe on teardown to avoid duplicate updates during navigation.

The included event API is typed by event name:

```ts
const stopCapture = omi.on("capture.changed", ({ capture }) => setCapture(capture));
const stopDevice = omi.on("device.changed", ({ device }) => setDeviceStatus(device));
const stopAction = omi.on("action.changed", ({ action }) => setAction(action));
```

Call all unsubscribe functions when the page or component is removed. Adapt from the exported types rather than adding a second app-level event model.

## Accessibility and device framing

Even a visual prototype should communicate the real-world stakes of Omi:

- Use semantic headings, landmarks, labels, focus order, and keyboard activation. Do not make status color the only signal.
- Preserve readable text at larger system/browser sizes, support reduced motion, and keep interactive targets comfortably touchable.
- Make recording, processing, disconnected, and permission-denied states understandable to screen-reader and low-vision users.
- Treat microphone/recording indicators and consent copy as first-class product behavior, not decorative chrome.
- Show connection and sync limitations honestly. A browser frame is not proof of hardware support, Bluetooth behavior, background recording, or production latency.
- Test responsive behavior in the intended iOS and desktop-sized frames, including narrow widths and keyboard navigation, while remembering that all device data is mocked.

## Boundary for the hackathon

The SDK supplies synthetic data, mock state, actions, and events. Your prototype supplies information architecture, visual design, interaction choreography, and accessibility. Keep the seam explicit so a later integration can replace the fake client without rewriting the UI's conceptual model.
