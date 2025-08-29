'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Users, Video, Settings } from 'lucide-react'
import type { 
  TeamChatMessageWithSender, 
  TeamChatParticipantWithDetails,
  TeamChatStats 
} from '@/lib/types/team-chat'

interface TeamChatWindowProps {
  teamId: string
  currentUserSubmissionId: string
  currentUserName: string
  currentUserId?: string
  className?: string
}

export function TeamChatWindow({ 
  teamId, 
  currentUserSubmissionId, 
  currentUserName,
  currentUserId,
  className 
}: TeamChatWindowProps) {
  const [messages, setMessages] = useState<TeamChatMessageWithSender[]>([])
  const [participants, setParticipants] = useState<TeamChatParticipantWithDetails[]>([])
  const [stats, setStats] = useState<TeamChatStats | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])  
  const [messageReactions, setMessageReactions] = useState<Record<string, any[]>>({})
  const [readReceipts, setReadReceipts] = useState<Record<string, any[]>>({})
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadChatData()
    
    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource(`/api/team-chat/events?team_id=${teamId}`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'new_message':
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === data.message.id)
              if (!exists) {
                return [...prev, data.message]
              }
              return prev
            })
            break
            
          case 'typing':
            setTypingUsers(prev => {
              if (data.isTyping) {
                return prev.includes(data.userName) ? prev : [...prev, data.userName]
              } else {
                return prev.filter(user => user !== data.userName)
              }
            })
            break
            
          case 'connected':
            console.log('Connected to team chat events')
            break
            
          case 'heartbeat':
            // Keep connection alive
            break
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      // Fallback to polling if SSE fails
      const interval = setInterval(loadMessages, 5000)
      return () => clearInterval(interval)
    }
    
    return () => {
      eventSource.close()
    }
  }, [teamId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        loadMessages(),
        loadParticipants(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading chat data:', error)
      setError('Failed to load chat data')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add user ID for simplified authentication
      if (currentUserId) {
        headers['x-user-id'] = currentUserId
      }
      
      const response = await fetch(`/api/team-chat/messages?team_id=${teamId}&limit=50`, {
        headers
      })
      const data = await response.json()
      
      if (response.status === 401) {
        setError('Authentication required. Please sign in to access team chat.')
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        }, 2000)
        return
      }
      
      if (response.status === 403) {
        setError('You are not authorized to access this team chat. Please contact your team administrator.')
        return
      }
      
      if (data.success) {
        setMessages(data.data.messages)
        setError(null) // Clear any previous errors
        
        // Mark messages as read if there are new messages
        if (data.data.messages.length > 0) {
          const lastMessage = data.data.messages[data.data.messages.length - 1]
          markMessagesRead(lastMessage.id)
        }
        
        // Load reactions and read receipts for all messages
        loadReactions()
        loadReadReceipts()
      } else {
        setError(data.error || 'Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setError('Network error. Please check your connection and try again.')
    }
  }

  const loadParticipants = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add user ID for simplified authentication
      if (currentUserId) {
        headers['x-user-id'] = currentUserId
      }
      
      const response = await fetch(`/api/team-chat/participants?team_id=${teamId}`, {
        headers
      })
      
      if (response.status === 401) {
        setError('Authentication required. Please sign in to access team chat.')
        setTimeout(() => {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        }, 2000)
        return
      }
      
      if (response.status === 403) {
        setError('You are not authorized to access this team chat.')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setParticipants(data.data || [])
        } else {
          console.error('Failed to load participants:', data.error)
          setParticipants([])
        }
      } else {
        console.error('Failed to fetch participants')
        setParticipants([])
      }
    } catch (error) {
      console.error('Error loading participants:', error)
      setParticipants([])
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/team-chat/stats?team_id=${teamId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        } else {
          console.error('Failed to load stats:', data.error)
          // Fallback to basic stats
          setStats({
            total_messages: messages.length,
            messages_today: 0,
            active_participants: participants.length,
            most_active_member: {
              name: 'No activity',
              message_count: 0
            },
            recent_activity: []
          })
        }
      } else {
        console.error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      setError(null)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add user ID for simplified authentication
      if (currentUserId) {
        headers['x-user-id'] = currentUserId
      }

      const response = await fetch('/api/team-chat/messages', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          team_id: teamId,
          message_text: newMessage.trim(),
          message_type: 'text'
        })
      })

      const data = await response.json()

      if (data.success) {
        setNewMessage('')
        // Message will be added via SSE, no need to add locally
        
        // Stop typing indicator
        updateTypingIndicator(false)
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const updateTypingIndicator = async (isTyping: boolean) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add user ID for simplified authentication
      if (currentUserId) {
        headers['x-user-id'] = currentUserId
      }

      await fetch('/api/team-chat/typing', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          team_id: teamId,
          is_typing: isTyping
        })
      })
    } catch (error) {
      console.error('Error updating typing indicator:', error)
    }
  }

  const markMessagesRead = async (lastMessageId: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add user ID for simplified authentication
      if (currentUserId) {
        headers['x-user-id'] = currentUserId
      }
      
      await fetch('/api/team-chat/read', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          team_id: teamId,
          last_message_id: lastMessageId
        })
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // Load reactions for messages
  const loadReactions = async () => {
    try {
      const response = await fetch(`/api/team-chat/reactions?teamId=${teamId}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.success) {
        setMessageReactions(data.data)
      }
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  // Toggle reaction on a message
  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch('/api/team-chat/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
           teamId,
           messageId,
           emoji
         })
      })
      
      const data = await response.json()
      if (data.success) {
        // Reload reactions to get updated state
        loadReactions()
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  // Show reaction picker (simple implementation)
  const showReactionPicker = (messageId: string) => {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡']
    const emoji = prompt('Choose an emoji: ' + emojis.join(' '))
    if (emoji && emojis.includes(emoji)) {
      toggleReaction(messageId, emoji)
    }
  }

  // Load read receipts for messages
  const loadReadReceipts = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add user ID for simplified authentication
      if (currentUserId) {
        headers['x-user-id'] = currentUserId
      }

      const response = await fetch(`/api/team-chat/read?teamId=${teamId}`, {
        headers,
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.success) {
        setReadReceipts(data.data)
      }
    } catch (error) {
      console.error('Error loading read receipts:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Update typing indicator
    updateTypingIndicator(true)
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingIndicator(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages: TeamChatMessageWithSender[]) => {
    const groups: { date: string, messages: TeamChatMessageWithSender[] }[] = []
    let currentDate = ''
    let currentGroup: TeamChatMessageWithSender[] = []

    messages.forEach(message => {
      const messageDate = new Date(message.created_at).toDateString()
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: formatDate(currentGroup[0].created_at), messages: currentGroup })
        }
        currentDate = messageDate
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ date: formatDate(currentGroup[0].created_at), messages: currentGroup })
    }

    return groups
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">💬</span>
            Team Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className={className}>
      <div className="p-6 pb-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Team Chat</h3>
              {stats && stats.total_messages > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{stats.total_messages} messages</span>
                  {stats.messages_today > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 font-medium">{stats.messages_today} today</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {participants.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                <Users className="w-4 h-4" />
                <span>{participants.length} online</span>
              </div>
            )}
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-0">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto px-6 pb-4 bg-gradient-to-b from-white/50 to-gray-50/50">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}
          
          {messageGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Start the conversation!</h4>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Break the ice with your teammates. Share ideas, ask questions, or just say hello!
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" className="text-xs">
                  👋 Say hello
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  🎯 Share today's goals
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  💡 Brainstorm ideas
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                      {group.date}
                    </div>
                  </div>
                  
                  {/* Messages */}
                  {group.messages.map((message) => (
                    <div key={message.id} className="flex space-x-3 mb-4">
                      {/* Avatar */}
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {message.message_type === 'system' ? '🤖' : (message.sender?.full_name?.[0] || '?')}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {message.message_type !== 'system' && (
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {message.sender?.full_name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.created_at)}
                            </span>
                            {message.is_edited && (
                              <span className="text-xs text-gray-400">(edited)</span>
                            )}
                          </div>
                        )}
                        
                        <div className={`text-sm ${
                          message.message_type === 'system' 
                            ? 'text-gray-600 italic text-center' 
                            : 'text-gray-800'
                        }`}>
                          {message.message_text}
                        </div>
                        
                        {/* Message Reactions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(
                                  messageReactions[message.id].reduce((acc, reaction) => {
                                    const key = reaction.emoji
                                    if (!acc[key]) acc[key] = []
                                    acc[key].push(reaction)
                                    return acc
                                  }, {})
                                ).map(([emoji, reactions]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(message.id, emoji)}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 transition-colors"
                                  >
                                    <span className="mr-1">{emoji}</span>
                                    <span>{reactions.length}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {message.message_type !== 'system' && (
                              <button
                                onClick={() => showReactionPicker(message.id)}
                                className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                title="Add reaction"
                              >
                                😊+
                              </button>
                            )}
                          </div>
                          
                          {/* Read Receipts */}
                          {message.sender_id !== currentUserSubmissionId && readReceipts[message.id] && readReceipts[message.id].length > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="mr-1">✓</span>
                              <span>Read by {readReceipts[message.id].length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              
              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="flex space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 italic">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Enhanced Message Input */}
        <div className="border-t border-white/20 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-2xl">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... ✨"
                className="w-full resize-none border-0 rounded-xl px-4 py-3 text-sm bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                rows={2}
                disabled={sending}
              />
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                  <span className="text-lg">😊</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                  <span className="text-lg">📎</span>
                </Button>
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Send</span>
                  <span className="text-lg">🚀</span>
                </div>
              )}
            </Button>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                3 online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}