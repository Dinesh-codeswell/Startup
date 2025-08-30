"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Send, Smile } from 'lucide-react'

interface ChatScreenProps {
  teamData: any
  currentUser: any
  onUnreadCountChange?: (count: number) => void
}

export default function ChatScreen({ teamData, currentUser, onUnreadCountChange }: ChatScreenProps) {
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const teamId = teamData?.team?.id
  
  // Calculate team member count from teamData
  const memberCount = teamData?.members?.length || teamData?.team?.team_size || 0
  


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

  // Calculate unread messages count
  const calculateUnreadCount = (messages: any[]) => {
    if (!currentUser?.id) return 0
    
    // Count messages from other users that are newer than a reasonable timeframe
    // In a real implementation, this would use last read timestamp from user preferences
    const now = new Date().getTime()
    const oneDayAgo = now - (24 * 60 * 60 * 1000) // 24 hours ago
    
    return messages.filter(msg => {
      const messageTime = new Date(msg.created_at).getTime()
      return msg.sender_id !== currentUser.id && 
             messageTime > oneDayAgo &&
             msg.message_type !== 'system'
    }).length
  }

  const loadMessages = async (isInitialLoad = false) => {
    if (!teamId || !currentUser?.id) return
    
    try {
      if (isInitialLoad) setLoading(true)
      const response = await fetch(`/api/team-chat/messages?team_id=${teamId}&limit=50`, {
        headers: {
          'x-user-id': currentUser.id
        }
      })
      const data = await response.json()
      
      if (data.success) {
        const newMessages = data.data.messages || []
        let finalMessages: any[]
        
        if (isInitialLoad) {
          // For initial load, replace all messages
          setChatMessages(newMessages)
          finalMessages = newMessages
        } else {
          // For refresh, deduplicate and merge
          setChatMessages(prev => {
            const messageMap = new Map()
            // Add existing messages
            prev.forEach(msg => messageMap.set(msg.id, msg))
            // Add/update with new messages
            newMessages.forEach(msg => messageMap.set(msg.id, msg))
            const merged = Array.from(messageMap.values()).sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            finalMessages = merged
            return merged
          })
        }
        
        // Calculate and update unread count
        const newUnreadCount = calculateUnreadCount(finalMessages || newMessages)
        setUnreadCount(newUnreadCount)
        
        // Notify parent component of unread count change
        if (onUnreadCountChange) {
          onUnreadCountChange(newUnreadCount)
        }
        
        setError(null)
      } else {
        setError(data.error || 'Failed to load messages')
      }
    } catch (err) {
      console.error('Error loading messages:', err)
      setError('Failed to load messages')
    } finally {
      if (isInitialLoad) setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages(true)
  }, [teamId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Reset unread count when user is viewing the chat (component is mounted)
  useEffect(() => {
    // Reset unread count when component mounts (user is viewing chat)
    setUnreadCount(0)
    if (onUnreadCountChange) {
      onUnreadCountChange(0)
    }

    // Set up interval to refresh messages and update counts
    const interval = setInterval(() => {
      loadMessages(false)
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [teamId, currentUser?.id])

  const handleEmojiClick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  const handleSendMessage = async () => {
    if (newMessage.trim() && teamId && currentUser?.id) {
      const messageText = newMessage.trim()
      const tempId = `temp-${Date.now()}`
      
      // Create optimistic message object
      const optimisticMessage = {
        id: tempId,
        message_text: messageText,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || currentUser.name || 'You',
        sender_avatar: currentUser.avatar_url,
        created_at: new Date().toISOString(),
        team_id: teamId
      }
      
      // Immediately add message to UI (check for duplicates first)
      setChatMessages(prev => {
        const isDuplicate = prev.some(msg => 
          msg.message_text === messageText && 
          msg.sender_id === currentUser.id &&
          Math.abs(new Date(msg.created_at).getTime() - new Date().getTime()) < 5000
        )
        return isDuplicate ? prev : [...prev, optimisticMessage]
      })
      setNewMessage('')
      
      try {
        const response = await fetch('/api/team-chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id
          },
          body: JSON.stringify({
            team_id: teamId,
            message_text: messageText
          })
        })
        
        const data = await response.json()
        if (data.success) {
          // Replace optimistic message with real message from server
          const serverMessage = data.data?.message || data.data
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === tempId ? {
                ...serverMessage,
                sender_name: optimisticMessage.sender_name,
                sender_avatar: optimisticMessage.sender_avatar
              } : msg
            )
          )
        } else {
          // Remove optimistic message on failure
          setChatMessages(prev => prev.filter(msg => msg.id !== tempId))
          setError(data.error || 'Failed to send message')
          setNewMessage(messageText) // Restore message text
        }
      } catch (error) {
        console.error('Error sending message:', error)
        // Remove optimistic message on failure
        setChatMessages(prev => prev.filter(msg => msg.id !== tempId))
        setError('Failed to send message')
        setNewMessage(messageText) // Restore message text
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b bg-white border-r border-slate-400 border-l-0 border-t-0 rounded">
        <h2 className="text-xl font-semibold text-gray-900">Team Chat</h2>
        <p className="text-sm text-gray-500 mt-1">
          {memberCount} {memberCount === 1 ? 'member' : 'members'} • {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-96 px-6 py-4 overflow-y-auto scroll-smooth border-slate-600 border-r-0 border-l-0">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <div className="space-y-6">
              {chatMessages.map((msg, index) => {
                 const isCurrentUser = msg.sender_id === currentUser?.id
                 const messageKey = msg.id || `msg-${index}-${msg.created_at}`
                return (
                  <div
                    key={messageKey}
                    className={`flex items-start space-x-3 ${isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                      {msg.sender_avatar ? (
                        <img src={msg.sender_avatar} alt={msg.sender_name || 'Unknown'} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span>{(msg.sender_name || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className={`flex-1 ${isCurrentUser ? "flex flex-col items-end" : ""}`}>
                      <div
                        className={`flex items-center space-x-2 mb-2 ${isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}
                      >
                        <span className="font-medium text-gray-900 text-sm">{msg.sender_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : 'Now'}
                        </span>
                      </div>
                      <div
                        className={`inline-block rounded-2xl px-4 py-3 max-w-md ${
                          isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message_text || ''}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-l-0 border-b-0 border-slate-400 border-r-0 rounded">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
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
