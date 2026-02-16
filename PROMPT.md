# PROMPTS.md — Prompt Engineering Documentation

This file documents every prompt used throughout the development and operation of the chatbot.

---

## Development Prompts (used to build the project with AI assistance)

---

### Prompt 1 — Architecture & Base UI

> Please make a gray chatbot interface that allows these actions:
>
> - send a message
> - edit a message
> - remove a message
>
> Please make a modern and clear interface only using tailwind.
> You will use localStorage to store previous messages.

---

### Prompt 2 — UI Modernization

> Use react-icons library with its @types for typescript and let replace all text by icons to modernize interface. Please place the chat in a central box.

---

### Prompt 3 — Workers AI Integration

> Create all endpoints using Llama 3.0 in the ecosystem of Cloudflare Workers. Use the Workers AI SDK to interact with Llama 3.0 and implement the following endpoints.

---

### Prompt 4 — Full Requirements Compliance

> Please implement the chatbot according to the following requirements:
> - Host the frontend on Cloudflare Pages.
> - Use Cloudflare Workers for the backend, with Hono 4 as the router.
> - Implement Durable Objects to store conversation history on the server side.
> - Use Meta Llama 3.3 70B Instruct (FP8) as the AI model via Workers AI.
> - The client should generate a UUID session ID, store it in localStorage, and send it with every request to the Worker.
> - The Worker should route requests to the appropriate Durable Object based on the session ID, which manages state and AI inference.

This prompt triggered the implementation of:
- Durable Objects for server-side conversation memory
- Upgrade from Llama 3 8B to Llama 3.3 70B
- Session-based architecture (Worker orchestrator → DO state manager)
- Proper README documentation

---

