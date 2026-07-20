# Omi UI Hackathon

An intentionally lightweight workspace for exploring radically different Omi desktop and mobile concepts as runnable HTML prototypes.

## Start a prototype

First install the supplied hackathon pack's tooling:

```bash
cd reference/hackathon-pack
npm install
```

Then serve a prototype from the repository root:

```bash
./scripts/serve-prototype.sh hello-world
./scripts/serve-prototype.sh desk
./scripts/serve-prototype.sh attention
```

The command prints a local URL (normally `http://127.0.0.1:5173`).

## Structure

```text
prototypes/
  hello-world/        Tiny smoke-test surface
  desk/               Capture → thread → carry-forward desk concept
  attention/          Proactive “what needs you” concept
  <concept-name>/     One self-contained concept per directory
reference/
  hackathon-pack/     Unmodified supplied mock SDK, docs, and example harness
scripts/
  serve-prototype.sh  Local Vite launcher for any prototype directory
```

Each prototype should be self-contained HTML/CSS/JS. Use the reference pack's `src/` and docs when a concept needs mock Omi state or interactions; keep its contents unchanged so it remains a stable capability reference.

## Verify the supplied pack

```bash
cd reference/hackathon-pack
npm test
npm run build
```
