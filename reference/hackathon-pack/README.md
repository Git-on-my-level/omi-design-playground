# Omi UI Hackathon Pack

Build radically different Omi concepts quickly, using ordinary HTML and TypeScript. This is a **local, fakeable capability layer**—not a product UI kit, an API client, or a production integration.

It is intentionally opinionated about the data and interactions a concept can use, and intentionally silent about what the interface should look like.

## Start here

```bash
npm install
npm run dev
```

Use Node 20 or newer. Open the local URL Vite prints. The small example is a functioning data harness; replace it wholesale or start a new HTML page. To verify the pack:

```bash
npm test
npm run build
```

## What is in the box

| Path | Purpose |
| --- | --- |
| `src/` | `OmiMock`, the local TypeScript SDK, types, synthetic seed data, and named scenarios. |
| `examples/vanilla-html/` | A deliberately plain, clickable macOS/iOS-oriented HTML starter. |
| `tests/` | Executable examples of the SDK contract. |
| `docs/sdk-guide.md` | How agents should use and extend the mock. |
| `docs/omi-codebase-map.md` | High-level pointers into the real Omi codebase. |
| `docs/hackathon-brief.md` | A compact handoff prompt and working rules for participants. |

## Design boundary

- Use `OmiMock` for local interactions: no sign-in, API keys, device, or network is needed.
- Treat all included data as **synthetic**. It resembles useful Omi capability shapes, not an actual account.
- You may select a named scenario, override the fixture with a seed, call the mock methods, subscribe to events, or replace the mock implementation behind the same interface.
- Do not treat this pack as an authoritative API schema or put real conversation, memory, or account data into prototypes.

For a richer starting point, pass a scenario when constructing the mock:

```ts
import { OmiMock } from './src';

const omi = new OmiMock({ scenario: 'power-user' });
```

Available scenarios include `default`, `first-run`, `power-user`, `recording`,
`processing`, `offline-recovery`, and `empty-search`. All fixtures are local,
synthetic, and cloned per mock instance. An explicit `seed` override wins over
the selected scenario; arrays replace only that fixture area.

## Fastest useful first move for an agent

1. Read `docs/hackathon-brief.md` and `docs/sdk-guide.md`.
2. Start `npm run dev`.
3. Replace `examples/vanilla-html/index.html`, `main.ts`, and `style.css` with one coherent concept.
4. Keep the mock SDK calls when they create a useful interaction; fake the rest without apology.
