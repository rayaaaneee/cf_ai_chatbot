import { Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

// AI Chat message role
export const ChatRole = z.enum(["system", "user", "assistant"]);

// A single message in a conversation
export const ChatMessage = z.object({
	role: ChatRole,
	content: Str({ description: "The message content" }),
});

// Request body for multi-turn conversation
export const ConversationRequest = z.object({
	messages: ChatMessage.array().describe("Full conversation history"),
	system_prompt: Str({
		description: "Optional system prompt to guide AI behavior",
		required: false,
	}).optional(),
});

// The AI model used across all endpoints
export const LLAMA_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;
