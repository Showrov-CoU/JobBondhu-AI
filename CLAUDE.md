# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A NestJS Facebook Messenger bot ("JobBondhu AI") for Bangladeshi job seekers, running on Bun. All user-facing strings are in Bangla.

## Commands

```bash
bun install
bun run dev            # watch mode (preferred during development)
bun run start          # run once
bun run build          # bundle to dist/main.js
bun test               # run all tests
bun test path/to.spec  # run a single test file
```

Bun executes TypeScript directly — there is no `nest start` / `nest build` step. The Nest CLI is intentionally not installed.

## Architecture

Request flow for a Messenger message:

```
Facebook → POST /webhook → WebhookController
                           → BotService.handleMessage(senderId, text)
                              ├─ checks conversation state (Map<senderId, Conversation>)
                              ├─ routes by menu number, greeting, or CV-flow state
                              └─ calls ClaudeService or replies directly
                           → MessengerService.sendText (Graph API v19.0)
```

The webhook responds `200` synchronously and the bot handler runs fire-and-forget — Facebook requires a reply within 20s, but Claude calls can take longer. See `WebhookController.receive`.

### Conversation state

`BotService` keeps a `Map<senderId, Conversation>` of `{ state, cv }`. States: `IDLE`, `CV_NAME`, `CV_PHONE`, `CV_EMAIL`, `CV_EDUCATION`, `CV_EXPERIENCE`, `CV_SKILLS`. The map is in-memory, so a restart drops in-flight CV sessions. If you need persistence, swap the Map for Redis here — nothing else needs to change.

### Module wiring

`AppModule` imports `ConfigModule` (global) + the four feature modules. `BotModule` depends on `MessengerModule` and `ClaudeModule`; `WebhookModule` depends on `BotModule`. Keep this DAG — no module should import `WebhookModule`.

### Claude usage

`ClaudeService` wraps `@anthropic-ai/sdk` with three methods: `chat`, `generateCv`, `bcsMcq`. Model is `claude-sonnet-4-6` (constant at top of `claude.service.ts`). The system prompt is in Bangla and tells Claude to reply in Bangla — don't translate it.

The original spec (`INITIAL.md`) named `claude-sonnet-4-20250514`; that was outdated. The current Sonnet alias is `claude-sonnet-4-6`. If you change the model, update the README too.

### Bun-specific notes

- `src/main.ts` imports `reflect-metadata` explicitly. NestJS decorators need it loaded before any decorated class is evaluated; `nest start` did this implicitly, Bun does not.
- `tsconfig.json` has `"types": ["bun"]` so `Bun`/`bun` globals type-check.
- Don't add `ts-node`, `ts-loader`, `jest`, `ts-jest`, or `@nestjs/cli` back to deps — Bun replaces all of them.

## Conventions

- All Messenger-facing strings are Bangla. Keep emoji usage consistent with existing menus.
- `MessengerService.sendText` swallows axios errors and logs them — callers don't need try/catch.
- `ClaudeService` returns a Bangla fallback string on API failure rather than throwing, so the bot always replies something.
- Don't add `X-Hub-Signature-256` verification silently; it's intentionally missing for local dev. The README flags this as a pre-production todo.
