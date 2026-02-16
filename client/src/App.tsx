import { useState, useEffect } from 'react'
import './App.css'

interface Message {
  id: string
  text: string
  timestamp: number
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('chatbot_messages')
    if (stored) {
      try {
        setMessages(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse messages from localStorage:', error)
      }
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatbot_messages', JSON.stringify(messages))
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      timestamp: Date.now(),
    }

    setMessages([...messages, newMessage])
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
    if (!editingText.trim()) return

    setMessages(messages.map(m =>
      m.id === id ? { ...m, text: editingText } : m
    ))
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-screen max-h-screen md:max-h-[600px] bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 rounded-t-lg border-b border-gray-600">
          <h1 className="text-2xl font-bold text-white">Chat Assistant</h1>
          <p className="text-gray-300 text-sm mt-1">Messages are saved automatically</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-800">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-center">
                No messages yet. Start a conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="group">
                {editingId === message.id ? (
                  // Edit Mode
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full bg-gray-600 text-white placeholder-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded transition duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition duration-200">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-white break-words">{message.text}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition duration-200 flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditMessage(message.id)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition duration-200"
                          title="Edit message"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition duration-200"
                          title="Delete message"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="bg-gray-700 px-6 py-4 rounded-b-lg border-t border-gray-600">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition duration-200 flex-shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
