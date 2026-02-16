import { DurableObject } from "cloudflare:workers";

/**
 * ChatSession Durable Object
 *
 * Stores conversation history per session on the server side.
 * Each unique session_id maps to its own DO instance with its own storage.
 * This ensures conversation memory persists across requests without
 * relying on client-side localStorage as the source of truth.
 */

interface StoredMessage {
	role: "system" | "user" | "assistant";
	content: string;
	timestamp: number;
}

const SYSTEM_PROMPT = `You are a helpful, friendly AI assistant powered by Meta Llama 3.3. You provide clear, concise, and accurate answers. You can help with coding, writing, analysis, math, and general knowledge. When you don't know something, you say so honestly. You format your responses with proper structure when appropriate.`;

const LLAMA_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;

export class ChatSession extends DurableObject<Env> {
	private messages: StoredMessage[] = [];
	private initialized = false;

	/**
	 * Load messages from durable storage on first access
	 */
	private async ensureLoaded(): Promise<void> {
		if (this.initialized) return;
		const stored = await this.ctx.storage.get<StoredMessage[]>("messages");
		this.messages = stored ?? [];
		this.initialized = true;
	}

	/**
	 * Persist messages to durable storage
	 */
	private async persist(): Promise<void> {
		await this.ctx.storage.put("messages", this.messages);
	}

	/**
	 * Handle incoming HTTP requests routed from the Worker
	 */
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers for all responses
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		try {
			if (path === "/message" && request.method === "POST") {
				return await this.handleMessage(request, corsHeaders);
			}

			if (path === "/history" && request.method === "GET") {
				return await this.handleHistory(corsHeaders);
			}

			if (path === "/clear" && request.method === "DELETE") {
				return await this.handleClear(corsHeaders);
			}

			return Response.json(
				{ success: false, error: "Not found" },
				{ status: 404, headers: corsHeaders },
			);
		} catch (error) {
			return Response.json(
				{
					success: false,
					error: error instanceof Error ? error.message : "Internal error",
				},
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	/**
	 * POST /message — Add user message, call Workers AI, store & return response
	 */
	private async handleMessage(
		request: Request,
		corsHeaders: Record<string, string>,
	): Promise<Response> {
		await this.ensureLoaded();

		const body = (await request.json()) as { message: string };
		if (!body.message?.trim()) {
			return Response.json(
				{ success: false, error: "Message is required" },
				{ status: 400, headers: corsHeaders },
			);
		}

		// Add user message to history
		const userMsg: StoredMessage = {
			role: "user",
			content: body.message.trim(),
			timestamp: Date.now(),
		};
		this.messages.push(userMsg);

		// Build the messages array for Workers AI with system prompt
		const aiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
			{ role: "system", content: SYSTEM_PROMPT },
			...this.messages.map((m) => ({ role: m.role, content: m.content })),
		];

		// Call Workers AI
		const aiResponse = await this.env.AI.run(LLAMA_MODEL, {
			messages: aiMessages,
		});
		const responseText = (aiResponse as { response: string }).response;

		// Add assistant response to history
		const assistantMsg: StoredMessage = {
			role: "assistant",
			content: responseText,
			timestamp: Date.now(),
		};
		this.messages.push(assistantMsg);

		// Persist updated conversation
		await this.persist();

		return Response.json(
			{
				success: true,
				result: {
					response: responseText,
					model: LLAMA_MODEL,
					messageCount: this.messages.length,
				},
			},
			{ headers: corsHeaders },
		);
	}

	/**
	 * GET /history — Return full conversation history
	 */
	private async handleHistory(
		corsHeaders: Record<string, string>,
	): Promise<Response> {
		await this.ensureLoaded();

		return Response.json(
			{
				success: true,
				result: {
					messages: this.messages,
					messageCount: this.messages.length,
				},
			},
			{ headers: corsHeaders },
		);
	}

	/**
	 * DELETE /clear — Reset conversation history
	 */
	private async handleClear(
		corsHeaders: Record<string, string>,
	): Promise<Response> {
		this.messages = [];
		this.initialized = true;
		await this.persist();

		return Response.json(
			{ success: true, result: { cleared: true } },
			{ headers: corsHeaders },
		);
	}
}
