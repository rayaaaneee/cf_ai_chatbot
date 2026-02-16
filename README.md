# CF AI Chatbot

An AI-powered chatbot built on the Cloudflare ecosystem — Workers, Durable Objects, Workers AI, and Pages — using **Meta Llama 3.3 70B**.

## Architecture

```
┌──────────────────┐        ┌───────────────────────────┐        ┌──────────────┐
│   React Client   │  HTTP  │   Cloudflare Worker       │  DO    │  ChatSession │
│   (Vite + TS)    │───────▶│   (Hono router)           │───────▶│  Durable Obj │
│                  │◀───────│   Orchestrator            │◀───────│  (state + AI)│
└──────────────────┘        └───────────────────────────┘        └──────────────┘
     Cloudflare                  Routes requests                  Stores history,
     Pages                       by session ID                    calls Workers AI
```

### Request Flow

1. **Client** generates a UUID session ID (persisted in `localStorage`) and sends it as `x-session-id` header with every request.
2. **Worker** (Hono) receives the request, extracts the session ID, and obtains the corresponding **Durable Object** stub via `CHAT_SESSION.idFromName(sessionId)`.
3. **Durable Object** (`ChatSession`) loads conversation history from its built-in storage, appends the user message, prepends a system prompt, calls **Workers AI** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`), stores the AI response, and returns it.
4. Worker forwards the DO response back to the client.

This design ensures:
- **Server-side conversation memory** — the DO persists messages across requests, not just `localStorage`.
- **True orchestration** — the Worker is not a simple proxy; it routes by session and the DO manages state + AI inference.
- **Scalability** — each session gets its own isolated DO instance.

## Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | Meta Llama 3.3 70B Instruct (FP8) via Workers AI |
| **Backend** | Cloudflare Workers (Hono 4) |
| **State** | Durable Objects (per-session conversation storage) |
| **Frontend** | React 19 + TypeScript 5.9 + Tailwind CSS 4 |
| **Build** | Vite 7, Wrangler 4 |
| **Hosting** | Cloudflare Pages (client) + Workers (server) |

## Project Structure

```
cf_chatbot/
├── PROMPT.md                  # All prompts used (dev + system)
├── README.md                  # This file
├── client/                    # React frontend
│   ├── src/
│   │   ├── App.tsx            # Main chat UI component
│   │   ├── App.css            # Chat box styling
│   │   ├── index.css          # Global styles
│   │   └── utils/
│   │       ├── api.ts         # API client (session management + HTTP calls)
│   │       ├── types/         # Message, StorageData interfaces
│   │       └── storage/       # localStorage helpers (backup, export, import)
│   └── package.json
└── server/                    # Cloudflare Worker
    ├── src/
    │   ├── index.ts           # Hono worker — routes & orchestration
    │   ├── chatSession.ts     # Durable Object — state + AI inference
    │   └── types.ts           # Zod schemas, model constant
    ├── wrangler.jsonc         # Worker config (AI + DO bindings)
    └── package.json
```

## Local Development

### Prerequisites

- Node.js 18+
- A Cloudflare account (for Workers AI access)

### Setup

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start server (port 8787)
cd ../server
npm run dev

# Start client (port 5173) — in a second terminal
cd ../client
npm run dev
```

The client defaults to `http://localhost:8787` as the API URL. Override with `VITE_API_URL` env var if needed.

### Generate Types (after changing wrangler.jsonc bindings)

```bash
cd server
npx wrangler types
```

## Deployment

```bash
# Deploy the Worker
cd server
npx wrangler deploy

# Build & deploy the client to Cloudflare Pages
cd ../client
npm run build
npx wrangler pages deploy dist
```

Set `VITE_API_URL` to your deployed Worker URL before building the client:

```bash
VITE_API_URL=https://dark-smoke-086f.<your-subdomain>.workers.dev npm run build
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat/message` | Send a user message, receive AI response |
| `GET` | `/api/chat/history` | Retrieve full conversation history |
| `DELETE` | `/api/chat/clear` | Reset conversation for current session |
| `GET` | `/` | Health check / API info |

All endpoints require the `x-session-id` header.

## Features

- **Multi-turn conversations** with full context retention (server-side)
- **Session isolation** — each browser tab / session ID gets independent state
- **Message editing & deletion** (client-side)
- **Export / Import** conversations as JSON
- **Loading indicators** with animated dots during AI inference
- **Responsive UI** — works on desktop and mobile
