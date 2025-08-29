"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Smile } from "lucide-react"
import Avatar from "./Avatar"

interface ChatScreenProps {
  teamData: any
  currentUser: any
  onUnreadCountChange?: (count: number) => void
}

export default function ChatScreen({ teamData, currentUser, onUnreadCountChange }: ChatScreenProps) {
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  
  // Mock chat messages data
  const [chatMessages] = useState([
    {
      id: 1,
      userName: "Alex Chen",
      userAvatar: "/placeholder.svg?height=40&width=40&text=AC",
      message: "Hey team! Just finished the user research phase. Found some interesting insights about our target audience.",
      timestamp: "2:30 PM",
      isCurrentUser: false,
    },
    {
      id: 2,
      userName: "Sarah Kim",
      userAvatar: "/placeholder.svg?height=40&width=40&text=SK",
      message: "That's awesome! Can you share the key findings in our next meeting?",
      timestamp: "2:32 PM",
      isCurrentUser: false,
    },
    {
      id: 3,
      userName: "You",
      userAvatar: "/placeholder.svg?height=40&width=40&text=ME",
      message: "I've been working on the prototype. Should have something to show by tomorrow.",
      timestamp: "2:35 PM",
      isCurrentUser: true,
    },
    {
      id: 4,
      userName: "Mike Johnson",
      userAvatar: "/placeholder.svg?height=40&width=40&text=MJ",
      message: "Perfect timing! I'll have the technical architecture ready by then too.",
      timestamp: "2:37 PM",
      isCurrentUser: false,
    },
  ])
  


  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👏",
    "🙌",
    "🤝",
    "🙏",
    "✍️",
    "💪",
    "🦵",
    "🦶",
    "👂",
    "🦻",
    "👃",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
  ]



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleEmojiClick = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !teamData?.team?.id) return
    
    const messageText = message.trim()
    setMessage("") // Clear input immediately for better UX
    
    try {
      const response = await fetch('/api/team-chat/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamData.team.id,
          message_text: messageText,
          message_type: 'text',
          user_id: currentUser.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Reload messages to get the new message with proper formatting
          await loadMessages()
        } else {
          console.error('Failed to send message:', data.error)
          setError('Failed to send message')
          setMessage(messageText) // Restore message on error
        }
      } else {
        console.error('Failed to send message')
        setError('Failed to send message')
        setMessage(messageText) // Restore message on error
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Error sending message')
      setMessage(messageText) // Restore message on error
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b bg-white border-r border-slate-400 border-l-0 border-t-0 rounded">
        <h2 className="text-xl font-semibold text-gray-900">Team Chat</h2>
        <p className="text-sm text-gray-500 mt-1">4 members • 3 unread messages</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-96 px-6 py-4 overflow-y-auto scroll-smooth border-slate-600 border-r-0 border-l-0">
          <div className="space-y-6">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <Avatar name={msg.userName} src={msg.userAvatar} size="md" />
                <div className={`flex-1 ${msg.isCurrentUser ? "flex flex-col items-end" : ""}`}>
                  <div
                    className={`flex items-center space-x-2 mb-2 ${msg.isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <span className="font-medium text-gray-900 text-sm">{msg.userName}</span>
                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 max-w-md ${
                      msg.isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-l-0 border-b-0 border-slate-400 border-r-0 rounded">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={toggleEmojiPicker}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Smile size={20} />
            </button>

            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 max-h-48 overflow-y-auto z-50"
              >
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
