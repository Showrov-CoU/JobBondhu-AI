# JobBondhu AI

Facebook Messenger bot for Bangladeshi job seekers — built with NestJS + Anthropic Claude, running on Bun.

## Features

- Bangla-first menu (job circular, AI CV builder, interview prep, BCS practice, AI chat)
- In-memory CV builder state machine (name → phone → email → education → experience → skills → AI summary)
- Claude `claude-sonnet-4-6` for free-form chat, CV generation, and BCS MCQ questions
- Facebook Graph API v19.0 for sending replies

> The original spec referenced `claude-sonnet-4-20250514`; that ID was outdated, so the implementation uses the current Sonnet alias `claude-sonnet-4-6`. Change `MODEL` in `src/claude/claude.service.ts` if you need a different model.

## Setup

```bash
bun install
cp .env.example .env
# Fill in PAGE_ACCESS_TOKEN, ANTHROPIC_API_KEY, APP_SECRET
bun run dev
```

Bun runs TypeScript directly — no compile step needed in development. `bun run build` produces a standalone bundle in `dist/` if you want one for deployment.

## Configure Facebook webhook

1. Expose the server publicly — `ngrok http 3000` is the easiest.
2. In your Facebook App → Messenger → Webhooks:
   - **Callback URL:** `https://<your-ngrok-host>/webhook`
   - **Verify Token:** value of `VERIFY_TOKEN` (default `jobbondhu_secret_123`)
   - **Subscription fields:** `messages`, `messaging_postbacks`
3. Subscribe the page (`PAGE_ID=1023868447487312`) to the app.

The bot replies fire-and-forget, so the webhook returns `200` immediately (Facebook requires a reply within 20s).

## Endpoints

| Method | Path        | Purpose                              |
|--------|-------------|--------------------------------------|
| GET    | `/webhook`  | Facebook verification handshake      |
| POST   | `/webhook`  | Incoming Messenger events            |

## Project layout

```
src/
├── main.ts                    # NestFactory bootstrap (loads reflect-metadata)
├── app.module.ts              # Wires every module
├── webhook/                   # GET/POST /webhook
├── bot/                       # Conversation state machine + menu routing
├── messenger/                 # Facebook Graph API client
└── claude/                    # Anthropic SDK wrapper
```

## Scripts

- `bun run dev` — watch mode (auto-reload on file change)
- `bun run start` — run once
- `bun run build` — bundle to `dist/main.js`
- `bun test` — run tests

## Notes

- Conversation state lives in a `Map<senderId, Conversation>` inside `BotService` — restart wipes in-progress CVs.
- `APP_SECRET` is read into config but not yet used to verify `X-Hub-Signature-256`; add signature checking before going to production.
- `main.ts` imports `reflect-metadata` explicitly — Bun doesn't auto-load it the way `nest start` did.
