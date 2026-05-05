# Project Packs

A project pack describes one Docker ecosystem. It is the source of truth for modules, presets, env vars, ports, guide text, QA commands, and security policy metadata.

## Minimal Shape

```ts
export const demoProject = {
  id: "demo",
  label: "Generic Demo Stack",
  defaultTargetId: "local",
  targets: [],
  presets: [],
  modules: []
};
```

## Module Responsibilities

Each module should keep related behavior together:

- Compose fragment
- Env vars
- Ports
- Dependencies and conflicts
- Security metadata
- Setup guide notes
- QA commands

Avoid remote module loading in early versions. Treat third-party module catalogs as supply-chain sensitive.
