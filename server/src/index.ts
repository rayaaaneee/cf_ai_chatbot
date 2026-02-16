import { Hono } from "hono";
import { cors } from "hono/cors";

export { ChatSession } from "./chatSession";

// ── Worker Orchestrator ──────────────────────────────────────────────
// The Worker acts as the entry-point and router.
// It resolves a session ID from the client, obtains the corresponding
// Durable Object stub, and forwards the request to it.
// All AI inference and state management live inside the DO — the Worker
// is *not* a simple fetch-proxy.

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for the client
app.use(
	"*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "x-session-id"],
	}),
);

/**
 * Helper — get or create a Durable Object stub for a given session ID
 */
function getSessionStub(env: Env, sessionId: string) {
	const id = env.CHAT_SESSION.idFromName(sessionId);
	return env.CHAT_SESSION.get(id);
}

// ── Routes ──────────────────────────────────────────────────────────

/** POST /api/chat/message — send a user message, get AI reply */
app.post("/api/chat/message", async (c) => {
	const sessionId = c.req.header("x-session-id");
	if (!sessionId) {
		return c.json({ success: false, error: "x-session-id header is required" }, 400);
	}

	const stub = getSessionStub(c.env, sessionId);
	const res = await stub.fetch(new Request("https://do/message", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: await c.req.text(),
	}));
	return new Response(res.body, res);
});

/** GET /api/chat/history — retrieve full conversation history */
app.get("/api/chat/history", async (c) => {
	const sessionId = c.req.header("x-session-id");
	if (!sessionId) {
		return c.json({ success: false, error: "x-session-id header is required" }, 400);
	}

	const stub = getSessionStub(c.env, sessionId);
	const res = await stub.fetch(new Request("https://do/history", { method: "GET" }));
	return new Response(res.body, res);
});

/** DELETE /api/chat/clear — reset conversation in this session */
app.delete("/api/chat/clear", async (c) => {
	const sessionId = c.req.header("x-session-id");
	if (!sessionId) {
		return c.json({ success: false, error: "x-session-id header is required" }, 400);
	}

	const stub = getSessionStub(c.env, sessionId);
	const res = await stub.fetch(new Request("https://do/clear", { method: "DELETE" }));
	return new Response(res.body, res);
});

/** Health check / API info */
app.get("/", (c) =>
	c.json({
		name: "cf-chatbot-api",
		model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
		endpoints: [
			"POST /api/chat/message",
			"GET  /api/chat/history",
			"DELETE /api/chat/clear",
		],
	}),
);

export default app;
