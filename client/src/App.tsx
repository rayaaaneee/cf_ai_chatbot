import { useState, useEffect, useTransition, useRef } from 'react';
import {
    FiSend,
    FiInbox,
    FiClock,
    FiZap,
    FiHash,
    FiDownload,
    FiTrash,
    FiLoader,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { loadMessages, saveMessages, exportMessages, clearAll, sendMessage, clearServerHistory, resetSession } from './utils';
import type { Message } from './utils';
import './App.css';

export default function App() {
    const [messages, setMessages] = useState<Message[]>(() => loadMessages())
    const [input, setInput] = useState('')
    const [, startTransition] = useTransition();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Save messages to storage whenever they change
    useEffect(() => {
        if (messages.length > 0 || localStorage.getItem('chatbot_messages')) {
            const saveTimer = setTimeout(() => setIsSaving(true), 0);
            const success = saveMessages(messages);
            if (!success) {
                console.error('Failed to save messages');
            }
            const hideTimer = setTimeout(() => setIsSaving(false), 500);
            return () => {
                clearTimeout(saveTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            timestamp: Date.now(),
            role: 'user',
        }

        const updatedMessages = [...messages, userMessage];
        startTransition(() => {
            setMessages(updatedMessages)
        })
        setInput('')
        setIsLoading(true)

        try {
            // Server stores the message, calls AI, and returns the response
            const response = await sendMessage(input);

            if (response.success && response.result) {
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: response.result.response,
                    timestamp: Date.now(),
                    role: 'assistant',
                }
                startTransition(() => {
                    setMessages(prev => [...prev, aiMessage])
                })
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: `Error: ${response.error || 'Failed to get AI response'}`,
                    timestamp: Date.now(),
                    role: 'assistant',
                }
                startTransition(() => {
                    setMessages(prev => [...prev, errorMessage])
                })
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `Connection error: ${error instanceof Error ? error.message : 'Could not reach the server'}`,
                timestamp: Date.now(),
                role: 'assistant',
            }
            startTransition(() => {
                setMessages(prev => [...prev, errorMessage])
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportMessages = () => {
        exportMessages(messages);
    }

    const handleClearAll = async () => {
        if (window.confirm(`Are you sure you want to delete all ${messages.length} messages? This action cannot be undone.`)) {
            // Clear server-side conversation history
            try {
                await clearServerHistory();
            } catch {
                // Continue even if server clear fails
            }
            // Reset to a new session
            resetSession();
            // Clear local storage
            clearAll();
            setMessages([]);
        }
    }

    return (
        <div className="min-h-screen lg:w-1/2 lg:max-w-[600px] sm:w-full bg-stone-50 flex items-center justify-center p-3 sm:p-6 lg:p-10">
            <div className="chat-box w-full max-w-4xl bg-white rounded-3xl shadow-md shadow-stone-200/60 flex flex-col border border-stone-200/80 overflow-hidden">

                {/* Header */}
                <div className="flex-shrink-0 bg-white px-6 sm:px-8 py-5 border-b border-stone-100">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col items-center gap-3.5">
                            <h1 className="text-stone-800 text-lg font-semibold leading-tight tracking-tight">Chat</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <FiZap className={`text-[10px] transition-colors ${isSaving ? 'text-amber-500' : 'text-emerald-500'}`} aria-hidden="true" />
                                <span className="text-stone-400 text-[11px] font-medium">
                                    {isSaving ? 'Saving...' : 'Saved'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="tooltip-wrap flex items-center gap-1.5 bg-stone-50 rounded-full px-3.5 py-2 border border-stone-200">
                                <FiHash className="text-violet-400 text-xs" aria-hidden="true" />
                                <span className="text-stone-600 text-xs font-semibold">{messages.length}</span>
                                <span className="tooltip">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span>
                            </div>
                            {messages.length > 0 && (
                                <>
                                    <button
                                        onClick={handleExportMessages}
                                        className="tooltip-wrap w-9 h-9 flex items-center justify-center rounded-full bg-stone-50 hover:bg-emerald-50 text-stone-400 hover:text-emerald-600 border border-stone-200 hover:border-emerald-200 transition-all duration-150"
                                        aria-label="Export messages"
                                    >
                                        <FiDownload className="text-[15px]" aria-hidden="true" />
                                        <span className="tooltip">Export as JSON</span>
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="tooltip-wrap w-9 h-9 flex items-center justify-center rounded-full bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-500 border border-stone-200 hover:border-red-200 transition-all duration-150"
                                        aria-label="Clear all messages"
                                    >
                                        <FiTrash className="text-[15px]" aria-hidden="true" />
                                        <span className="tooltip">Delete all</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-4 custom-scrollbar min-h-0 bg-stone-50/40">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-16">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border border-stone-200 shadow-sm">
                            <FiInbox className="text-stone-300 text-4xl" aria-hidden="true" />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-stone-500 text-base font-semibold">No messages yet</h2>
                            <p className="text-stone-400 text-sm max-w-[240px]">Type a message below to get started</p>
                        </div>
                    </div>
                ) : (
                    <>
                    {messages.map((message) => (
                    <div key={message.id} className="animate-fadeIn">
                        <div className={`rounded-2xl px-5 py-4 border transition-all duration-150 ${
                            message.role === 'assistant'
                                ? 'bg-blue-50/60 border-blue-100 hover:border-blue-200'
                                : 'bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-sm'
                        }`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    {message.role === 'assistant' ? (
                                        <HiSparkles className="text-blue-500 text-xs flex-shrink-0" aria-hidden="true" />
                                    ) : null}
                                    <span className={`text-[11px] font-semibold ${
                                        message.role === 'assistant' ? 'text-blue-500' : 'text-stone-400'
                                    }`}>
                                        {message.role === 'assistant' ? 'Llama 3.3' : 'You'}
                                    </span>
                                </div>
                                <p className="text-stone-700 break-words leading-relaxed text-[15px] whitespace-pre-wrap">{message.text}</p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <FiClock className="text-stone-300 text-xs" aria-hidden="true" />
                                    <span className="text-stone-400 text-xs" title={new Date(message.timestamp).toLocaleString()}>
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </>
                )}
                {isLoading && (
                    <div className="animate-fadeIn flex items-center gap-3 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-blue-400 text-xs font-medium">Llama 3.3 is thinking...</span>
                    </div>
                )}
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 bg-white px-6 sm:px-8 py-5 border-t border-stone-100">
                    <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isLoading ? "Waiting for AI..." : "Write something..."}
                            aria-label="Type your message"
                            disabled={isLoading}
                            className="w-full bg-stone-50 text-stone-700 placeholder-stone-400 rounded-full pl-11 pr-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white transition-all duration-150 border border-stone-200 hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="tooltip-wrap w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-stone-200 disabled:cursor-not-allowed text-white disabled:text-stone-400 transition-all duration-150 flex-shrink-0 shadow-sm hover:shadow-md disabled:shadow-none"
                            aria-label="Send message"
                        >
                            {isLoading ? (
                                <FiLoader className="text-lg animate-spin" aria-hidden="true" />
                            ) : (
                                <FiSend className="text-lg" aria-hidden="true" />
                            )}
                            <span className="tooltip">{isLoading ? 'AI is thinking...' : input.trim() ? 'Send message' : 'Type a message first'}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
