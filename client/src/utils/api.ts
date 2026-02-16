/**
 * API service for communicating with the Cloudflare Workers AI backend
 * Uses session-based routing via Durable Objects for server-side memory
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

// ── Session management ──────────────────────────────────────
const SESSION_KEY = "chatbot_session_id";

/**
 * Get or create a persistent session ID (stored in localStorage)
 */
export function getSessionId(): string {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

/**
 * Reset the session ID (new conversation on the server)
 */
export function resetSession(): void {
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
}

// ── Common headers ─────────────────────────────────────────
function headers(): Record<string, string> {
    return {
        "Content-Type": "application/json",
        "x-session-id": getSessionId(),
    };
}

// ── API response types ─────────────────────────────────────
export interface MessageResponse {
    success: boolean;
    result?: {
        response: string;
        model: string;
        messageCount: number;
    };
    error?: string;
}

export interface HistoryMessage {
    role: "system" | "user" | "assistant";
    content: string;
    timestamp: number;
}

export interface HistoryResponse {
    success: boolean;
    result?: {
        messages: HistoryMessage[];
        messageCount: number;
    };
    error?: string;
}

// ── API calls ──────────────────────────────────────────────

/**
 * Send a single user message — server stores it, calls AI, returns response
 */
export async function sendMessage(message: string): Promise<MessageResponse> {
    const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ message }),
    });
    return res.json();
}

/**
 * Fetch full conversation history from the server
 */
export async function fetchHistory(): Promise<HistoryResponse> {
    const res = await fetch(`${API_BASE}/api/chat/history`, {
        method: "GET",
        headers: headers(),
    });
    return res.json();
}

/**
 * Clear conversation history on the server
 */
export async function clearServerHistory(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/chat/clear`, {
        method: "DELETE",
        headers: headers(),
    });
    return res.json();
}
