import { useState, useEffect, useTransition, useRef } from 'react';
import {
    FiMessageCircle,
    FiSave,
    FiX,
    FiEdit2,
    FiTrash2,
    FiSend,
    FiInbox,
    FiClock,
    FiEdit3,
    FiZap,
    FiHash,
    FiDownload,
    FiTrash,
} from 'react-icons/fi';
import { loadMessages, saveMessages, exportMessages, clearAll } from './utils';
import type { Message } from './utils';
import './App.css';

export default function App() {
    const [messages, setMessages] = useState<Message[]>(() => loadMessages())
    const [input, setInput] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')
    const [, startTransition] = useTransition();
    const [isSaving, setIsSaving] = useState(false);
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

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            text: input,
            timestamp: Date.now(),
        }

        startTransition(() => {
            setMessages([...messages, newMessage])
        })
        setInput('')
    }

    const handleEditMessage = (id: string) => {
        const message = messages.find(m => m.id === id)
        if (message) {
            setEditingId(id)
            setEditingText(message.text)
        }
    }

    const handleSaveEdit = (id: string) => {
        if (!editingText.trim()) return setMessages(messages.map(m =>
            m.id === id ? { ...m, text: editingText } : m
        ));

        setEditingId(null)
        setEditingText('')
    }

    const handleDeleteMessage = (id: string) => {
        setMessages(messages.filter(m => m.id !== id))
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditingText('')
    }

    const handleExportMessages = () => {
        exportMessages(messages);
    }

    const handleClearAll = () => {
        if (window.confirm(`Are you sure you want to delete all ${messages.length} messages? This action cannot be undone.`)) {
            clearAll();
            setMessages([]);
        }
    }

    return (
        <div className="min-h-screen w-1/2 max-w-[600px] bg-stone-50 flex items-center justify-center p-3 sm:p-6 lg:p-10">
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
                    <div key={message.id} className="group animate-fadeIn">
                        {editingId === message.id ? (
                        // Edit Mode
                        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <FiEdit3 className="text-blue-500 text-sm" aria-hidden="true" />
                                <span className="text-blue-500 text-xs font-semibold">Editing message</span>
                            </div>
                            <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full bg-stone-50 text-stone-700 placeholder-stone-400 rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white resize-none border border-stone-200 transition-all duration-150"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => handleSaveEdit(message.id)}
                                    className="tooltip-wrap flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-full transition-all duration-150 flex items-center justify-center gap-2 text-sm shadow-sm"
                                    aria-label="Save changes"
                                >
                                    <FiSave className="text-sm" aria-hidden="true" />
                                    <span>Save</span>
                                    <span className="tooltip">Apply changes</span>
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="tooltip-wrap flex-1 bg-white hover:bg-stone-50 text-stone-500 font-semibold py-2.5 px-5 rounded-full transition-all duration-150 flex items-center justify-center gap-2 text-sm border border-stone-200 hover:border-stone-300"
                                    aria-label="Cancel editing"
                                >
                                    <FiX className="text-sm text-stone-400" aria-hidden="true" />
                                    <span>Cancel</span>
                                    <span className="tooltip">Discard changes</span>
                                </button>
                            </div>
                        </div>
                        ) : (
                        // Display Mode
                        <div className="bg-white rounded-2xl px-5 py-4 border border-stone-200/80 hover:border-stone-300 hover:shadow-sm transition-all duration-150">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-stone-700 break-words leading-relaxed text-[15px]">{message.text}</p>
                                    <div className="flex items-center gap-1.5 mt-3">
                                        <FiClock className="text-stone-300 text-xs" aria-hidden="true" />
                                        <span className="text-stone-400 text-xs" title={new Date(message.timestamp).toLocaleString()}>
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-2 flex-shrink-0 pt-0.5">
                                    <button
                                        onClick={() => handleEditMessage(message.id)}
                                        className="tooltip-wrap w-8 h-8 flex items-center justify-center rounded-full bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-600 border border-amber-200 transition-all duration-150"
                                        aria-label="Edit message"
                                    >
                                        <FiEdit2 className="text-sm" aria-hidden="true" />
                                        <span className="tooltip">Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="tooltip-wrap w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 border border-red-200 transition-all duration-150"
                                        aria-label="Delete message"
                                    >
                                        <FiTrash2 className="text-sm" aria-hidden="true" />
                                        <span className="tooltip">Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </>
                )}
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 bg-white px-6 sm:px-8 py-5 border-t border-stone-100">
                    <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Write something..."
                            aria-label="Type your message"
                            className="w-full bg-stone-50 text-stone-700 placeholder-stone-400 rounded-full pl-11 pr-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white transition-all duration-150 border border-stone-200 hover:border-stone-300"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="tooltip-wrap w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-stone-200 disabled:cursor-not-allowed text-white disabled:text-stone-400 transition-all duration-150 flex-shrink-0 shadow-sm hover:shadow-md disabled:shadow-none"
                            aria-label="Send message"
                        >
                            <FiSend className="text-lg" aria-hidden="true" />
                            <span className="tooltip">{input.trim() ? 'Send message' : 'Type a message first'}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
