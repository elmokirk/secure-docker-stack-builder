# Secure Docker Stack Builder

Reusable static starterkit for generating Docker Compose stacks from declarative project packs.

This repo is intentionally generic. It ships with one small demo project so other developers can adapt the pattern for their own Docker setups without inheriting any Paperclip, Hermes, or bridge-specific logic.

## What It Does

- Lets users choose a project, target, modules, and ports in a browser UI.
- Generates `docker-compose.yaml`, `.env.example`, setup guide, QA checklist, `risk-report.json`, and `stack-builder.config.json`.
- Blocks unsafe production exports through a policy engine.
- Keeps secrets out of browser storage and generated docs.
- Renders Compose YAML with syntax highlighting and visually grouped service blocks.

## Quick Start

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Validate:

```powershell
npm run test
npm run build
```

## Project Pack Concept

Project packs live in `src/projects`.

The demo pack shows the minimum structure:

- `targets`: local or production-style deployment targets
- `modules`: reusable Docker service blocks
- `presets`: known-good module combinations
- `env`: generated `.env.example` contract
- `ports`: internal/container vs host/public port intent
- `security`: policy metadata for safe export decisions
- `guide`: setup notes rendered into the generated guide
- `qa`: copy-paste validation commands

Start by copying `src/projects/demo.ts` and adapting it to your own stack.

## Security Model

This tool is not a free-form YAML generator. It is a configuration compiler with policy gates.

Production exports should be blocked when:

- databases publish public ports
- internal webhook receivers publish public ports
- LLM gateways or admin dashboards are exposed without an explicit ingress/auth plan
- local-only modules are selected for production targets
- dangerous capabilities are enabled without explicit risk acceptance

Generated secrets are placeholders only. Do not paste real API keys into the app unless you intentionally keep them local and out of screenshots, tickets, URLs, and git.

## Deploy The Builder

The app is static. Any static host works:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- any static nginx/Caddy container

The included GitHub Actions workflow builds the app and publishes `dist/` to GitHub Pages.

## Repository Layout

```text
src/core/       renderer, env handling, port planner, policies
src/editor/     CodeMirror YAML editor and service block decorations
src/projects/   demo project pack and project registry
src/App.tsx     static UI
```

## License

Choose a license before publishing publicly.
