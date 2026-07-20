# Omi codebase map

This is a browsing map for the standalone TypeScript/HTML hackathon pack. It
points to the real Omi source of truth for prototypes aimed at the macOS
desktop and iOS app. Paths are relative to `<omi-repo-root>`; the Omi source
repository is not included in this pack. Read the nearby code and docs before
relying on a detail; this map is orientation, not a copied API specification.

The pointers describe behavior and data ownership. They do not prescribe a UI
layout, visual treatment, information hierarchy, or interaction style.

## How to use this map

1. Start with `PRODUCT.md`, then read the invariant that covers the behavior
   you are representing (`docs/product/invariants/`).
2. Browse the backend route, its data owner, and the matching client/API model
   together. This is the fastest way to distinguish a product contract from a
   local presentation detail.
3. For capture or live chat, trace the real stream/session seam before showing
   a “recording”, “processing”, or “connected” state.
4. Build the browser prototype against a fixture or an explicit mock adapter
   first. Keep network and persistence opt-in, visible, and easy to remove.
5. Re-check the current branch when implementing: filenames and contracts can
   move, and generated files are outputs rather than edit points.

## Product model and guardrails

- `PRODUCT.md` is the short product north star. The core loop is **Capture →
  Understand → Remember → Retrieve → Act**; surfaces are one shared product
  mind, not separate histories.
- `docs/product/invariants/auth-session.md` covers authenticated-session
  ownership and recovery. Use it whenever a prototype represents sign-in,
  expiry, or account switching.
- `docs/product/invariants/chat-continuity.md` covers chat turn continuity and
  cancellation. Use it when a prototype shows streaming or an interrupted
  response.
- `docs/product/invariants/memory-canonical-fail-closed.md`,
  `docs/product/invariants/memory-tiers.md`, and
  `docs/product/invariants/memory-vector-hydration.md` cover memory visibility,
  tiering, and derived-search state.
- `docs/doc/developer/api/overview.mdx` explains the Developer API base path,
  key/scopes, resource families, and error shapes. It is the safest contract
  reference for a data-backed prototype.

## Backend capabilities

`backend/main.py` assembles the FastAPI application and includes the product
routers. The highest-signal route/data-owner pairs are:

| Capability | Route owner | Data owner / contract |
| --- | --- | --- |
| Conversations and transcripts | `backend/routers/conversations.py` | `backend/database/conversations.py`; `docs/doc/developer/api/conversations.mdx` |
| Product memories | `backend/routers/memories.py` (`/v3/memories`) | `backend/database/memories.py` and `backend/utils/memory/memory_service.py`; `docs/doc/developer/api/memories.mdx` |
| Chat sessions and desktop messages | `backend/routers/chat_sessions.py` | `backend/routers/chat.py` for general chat/voice paths; `docs/doc/developer/backend/chat_system.mdx` |
| Tasks/action items | `backend/routers/action_items.py` | `backend/database/action_items.py`; `docs/doc/developer/api/action-items.mdx` |
| Conversation folders | `backend/routers/folders.py` | `backend/database/folders.py`; `docs/doc/developer/api/folders.mdx` |
| Live audio/transcription | `backend/routers/listen/` (`/v4/listen` WebSocket components) | `docs/doc/developer/backend/listen_pusher_pipeline.mdx` and `docs/doc/developer/AudioStreaming.mdx` |

For an end-to-end mental model, `docs/doc/developer/backend/backend_deepdive.mdx`
describes capture, processing, storage, and chat boundaries. Treat its
provider-specific historical notes as documentation context; confirm current
serving behavior in the route and service code.

## macOS desktop (SwiftUI + Rust)

The desktop package is under `desktop/macos/`; its structure and local run
commands are summarized in `desktop/macos/README.md`.

- App lifecycle and auth-gated root content start at
  `desktop/macos/Desktop/Sources/OmiApp.swift` and
  `desktop/macos/Desktop/Sources/AppState.swift`. Related state transitions
  live in `desktop/macos/Desktop/Sources/AppState/` (especially
  `desktop/macos/Desktop/Sources/AppState/AppState+DataLoading.swift`,
  `desktop/macos/Desktop/Sources/AppState/AppState+Transcription.swift`, and
  `desktop/macos/Desktop/Sources/AppState/AppState+ListenEvents.swift`).
- The main window/navigation shell is in
  `desktop/macos/Desktop/Sources/MainWindow/DesktopHomeView.swift` and
  `desktop/macos/Desktop/Sources/MainWindow/SidebarView.swift`. Existing page
  entrypoints include
  `desktop/macos/Desktop/Sources/MainWindow/Pages/ConversationsPage.swift`,
  `desktop/macos/Desktop/Sources/MainWindow/Pages/ConversationDetailView.swift`,
  `desktop/macos/Desktop/Sources/MainWindow/Pages/MemoriesPage.swift`,
  `desktop/macos/Desktop/Sources/MainWindow/Pages/TasksPage.swift`, and
  `desktop/macos/Desktop/Sources/MainWindow/Pages/ChatPage.swift`. The
  graph-specific implementation is under
  `desktop/macos/Desktop/Sources/MainWindow/Pages/MemoryGraph/`.
- HTTP request transport and typed API projections are split between
  `desktop/macos/Desktop/Sources/Services/OmiHTTPTransport.swift` and
  `desktop/macos/Desktop/Sources/Services/APIClient/`. Start with
  `desktop/macos/Desktop/Sources/Services/APIClient/APIClient+ConversationModels.swift`,
  `desktop/macos/Desktop/Sources/Services/APIClient/APIClient+Memories.swift`,
  `desktop/macos/Desktop/Sources/Services/APIClient/APIClient+Messages.swift`,
  and
  `desktop/macos/Desktop/Sources/Services/APIClient/APIClient+TaskCatalog.swift`
  for client-side contracts.
- Recording and device capture flow through
  `desktop/macos/Desktop/Sources/Audio/AudioSourceManager.swift`,
  `desktop/macos/Desktop/Sources/Audio/BleAudioService.swift`, and the AppState
  transcription/listen files
  above. Local write-ahead capture/storage primitives are in
  `desktop/macos/Desktop/Sources/OmiWAL/WALModel.swift`.
- Session/auth ownership is in
  `desktop/macos/Desktop/Sources/AuthSessionCoordinator.swift`,
  `desktop/macos/Desktop/Sources/AuthService.swift`, and
  `desktop/macos/Desktop/Sources/DesktopKeychainStore.swift`. Do not infer a signed-
  in state from a static mock flag when a prototype is meant to mirror runtime
  behavior.
- The local Rust backend lives in `desktop/macos/Backend-Rust/`; begin with
  `desktop/macos/Backend-Rust/ARCHITECTURE.md`,
  `desktop/macos/Backend-Rust/src/main.rs`, and
  `desktop/macos/Backend-Rust/src/config.rs`. The TypeScript agent runtime is a
  separate surface under `desktop/macos/agent/`.

## iOS and Flutter

Flutter is the cross-platform app layer; native iOS code supplies device and
capture bridges.

- App startup/auth/provider wiring begins at `app/lib/main.dart`. HTTP client
  functions are grouped under `app/lib/backend/http/api/`; useful first stops
  are `app/lib/backend/http/api/conversations.dart`,
  `app/lib/backend/http/api/memories.dart`,
  `app/lib/backend/http/api/action_items.dart`, and
  `app/lib/backend/http/api/messages.dart`. Shared Dart schemas are under
  `app/lib/backend/schema/`.
- User-facing flow entrypoints include
  `app/lib/pages/home/page.dart`,
  `app/lib/pages/conversations/conversations_page.dart`,
  `app/lib/pages/conversation_detail/page.dart`,
  `app/lib/pages/memories/page.dart`, and `app/lib/pages/chat/page.dart`.
- Capture orchestration is in
  `app/lib/services/capture/capture_controller.dart`. Streaming transcription
  lives under `app/lib/services/sockets/`, and local/offline recording sync is
  under `app/lib/services/wals/`.
- Native bridge contracts are authored in `app/lib/pigeon_interfaces.dart`
  (watch/BLE and other Pigeon APIs) and `app/lib/phone_mic_interface.dart`
  (phone microphone). Generated outputs such as
  `app/lib/gen/pigeon_communicator.g.dart` and
  `app/lib/gen/phone_mic_pigeon.g.dart` should not be edited directly.
- iOS registration is centralized in `app/ios/Runner/AppDelegate.swift`.
  Watch recording adaptation is in `app/ios/Runner/RecorderHostApiImpl.swift`;
  phone-mic adaptation starts at
  `app/ios/Runner/PhoneMic/PhoneMicHostApiImpl.swift` and
  `app/ios/Runner/PhoneMic/PhoneMicController.swift`. The watch target's own
  capture UI/model begins at `app/ios/omiWatchApp/ContentView.swift` and
  `app/ios/omiWatchApp/WatchAudioRecorderViewModel.swift`.

## Optional SDK and web references

These are useful when a prototype needs to explain integration boundaries, not
when it needs to reproduce a product screen:

- Swift device SDK: `sdks/swift/Sources/omi-lib/omi_lib.swift` and
  `sdks/swift/Sources/omi-lib/FriendManager.swift`; guide:
  `docs/doc/developer/sdk/swift.mdx`.
- React Native SDK: `sdks/react-native/src/OmiConnection.ts` and
  `sdks/react-native/src/index.ts`; guide:
  `docs/doc/developer/sdk/ReactNative.mdx`.
- Python/CLI SDK: `sdks/python/omi/bluetooth.py`,
  `sdks/python/omi/transcribe.py`, and
  `sdks/python-cli/omi_cli/client.py`; guides:
  `docs/doc/developer/sdk/python.mdx` and `sdks/python-cli/README.md`.
- The web frontend has a read-only sharing/reference flow in
  `web/frontend/src/app/memories/[id]/page.tsx`,
  `web/frontend/src/components/memories/memory.tsx`,
  `web/frontend/src/components/memories/summary/memory-with-tabs.tsx`, and
  `web/frontend/src/actions/memories/get-shared-memory.ts`. Browse these for
  data flow only; they are not a design authority for the hackathon prototype.

## Safe data boundary for prototypes

- Use the checked-in non-private fixtures
  `contract_tests/fixtures/conversations.json` and
  `contract_tests/fixtures/memories.json`, or an explicit in-memory adapter in
  the standalone pack.
- Never copy private account records, Firebase credentials, bearer/API keys,
  tokens, or production logs into the pack. Do not put secrets in HTML,
  TypeScript, screenshots, or committed environment files.
- Treat writes as simulated unless the prototype is deliberately connected to
  an isolated development account and the endpoint/scopes are documented. A
  fake “saved” state must not imply that Omi persisted anything.
- If live data is necessary, keep it read-only, use the documented API contract,
  and label the environment. Preserve the real loading, empty, error, and
  unauthorized states instead of silently replacing them with fake success.
