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
  className?: string
}

export function TeamChatWindow({ 
  teamId, 
  currentUserSubmissionId, 
  currentUserName,
  className 
}: TeamChatWindowProps) {
  const [messages, setMessages] = useState<TeamChatMessageWithSender[]>([])
  const [participants, setParticipants] = useState<TeamChatParticipantWithDetails[]>([])
  const [stats, setStats] = useState<TeamChatStats | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadChatData()
    const interval = setInterval(loadMessages, 3000) // Poll for new messages every 3 seconds
    return () => clearInterval(interval)
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
      const response = await fetch(`/api/team-chat/messages?team_id=${teamId}&limit=50`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.data.messages)
        
        // Mark messages as read if there are new messages
        if (data.data.messages.length > 0) {
          const lastMessage = data.data.messages[data.data.messages.length - 1]
          markMessagesRead(lastMessage.id)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadParticipants = async () => {
    try {
      // Mock participants data for now
      const mockParticipants: TeamChatParticipantWithDetails[] = [
        {
          id: 'participant-1',
          team_id: teamId,
          submission_id: currentUserSubmissionId,
          joined_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          submission: {
            id: currentUserSubmissionId,
            full_name: currentUserName,
            college_name: 'Your College',
            current_year: '3rd Year'
          },
          unread_count: 0
        }
      ]
      setParticipants(mockParticipants)
    } catch (error) {
      console.error('Error loading participants:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Mock stats data for now
      const mockStats: TeamChatStats = {
        total_messages: messages.length,
        messages_today: 5,
        active_participants: 3,
        most_active_member: {
          name: currentUserName,
          message_count: 10
        },
        recent_activity: []
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      setError(null)

      const response = await fetch('/api/team-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          message_text: newMessage.trim(),
          message_type: 'text'
        })
      })

      const data = await response.json()

      if (data.success) {
        setNewMessage('')
        // Add the new message to the list immediately for better UX
        const newMsg: TeamChatMessageWithSender = {
          ...data.data,
          sender: {
            id: currentUserSubmissionId,
            full_name: currentUserName,
            college_name: 'Your College'
          }
        }
        setMessages(prev => [...prev, newMsg])
        
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
      await fetch('/api/team-chat/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      await fetch('/api/team-chat/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          last_message_id: lastMessageId
        })
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
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
                        
                        {/* Reactions would go here */}
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