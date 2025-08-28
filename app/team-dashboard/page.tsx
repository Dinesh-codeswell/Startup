'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { TeamChatWindow } from '@/components/team-chat/TeamChatWindow'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { AnimatedCounter, CircularProgress } from '@/components/ui/animated-counter'
import { UserAvatar, AvatarStack } from '@/components/ui/user-avatar'
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  MessageCircle, 
  Video, 
  Settings,
  Bell,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Clock,
  Award,
  Target,
  Zap,
  BookOpen,
  Trophy,
  Activity
} from 'lucide-react'
import type { SubmissionWithTeam } from '@/lib/types/team-matching'

export default function TeamDashboardPage() {
  const [userSubmission, setUserSubmission] = useState<SubmissionWithTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserTeamData()
  }, [])

  const loadUserTeamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get real user data from authentication
      const response = await fetch('/api/team-matching/user-status')
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const userData = await response.json()
      if (!userData.success) {
        throw new Error(userData.error || 'Failed to get user status')
      }
      
      // Check if user has a team
      if (!userData.data?.hasTeam || !userData.data?.team) {
        setUserSubmission(null)
        setLoading(false)
        return
      }
      
      // Transform real user data to expected format
      const userStatus = userData.data
      const realUserSubmission: SubmissionWithTeam = {
        id: userStatus.submission.id,
        user_id: userStatus.user.id,
        full_name: userStatus.submission.full_name,
        email: userStatus.submission.email,
        whatsapp_number: userStatus.submission.whatsapp_number,
        college_name: userStatus.submission.college_name,
        current_year: userStatus.submission.current_year,
        core_strengths: userStatus.submission.core_strengths,
        preferred_roles: userStatus.submission.preferred_roles,
        preferred_teammate_roles: userStatus.submission.preferred_teammate_roles,
        availability: userStatus.submission.availability,
        experience: userStatus.submission.experience,
        case_preferences: userStatus.submission.case_preferences,
        preferred_team_size: userStatus.submission.preferred_team_size,
        status: userStatus.submission.status,
        submitted_at: userStatus.submission.submitted_at,
        matched_at: userStatus.submission.matched_at,
        created_at: userStatus.submission.created_at,
        updated_at: userStatus.submission.updated_at,
        team: {
          id: userStatus.team.id,
          team_name: userStatus.team.team_name,
          team_size: userStatus.team.team_size,
          compatibility_score: userStatus.team.compatibility_score,
          status: userStatus.team.status,
          chat_group_id: userStatus.team.chat_group_id,
          chat_group_invite_link: userStatus.team.chat_group_invite_link,
          formed_at: userStatus.team.formed_at,
          created_at: userStatus.team.created_at,
          updated_at: userStatus.team.updated_at,
          members: userStatus.team.members || []
        },
        notifications: userStatus.notifications || []
      }

      // Use the real user data instead of mock data
      setUserSubmission(realUserSubmission)

    } catch (error) {
      console.error('Error loading team data:', error)
      setError('Failed to load team information')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pending_match': 'bg-yellow-100 text-yellow-800',
      'matched': 'bg-blue-100 text-blue-800',
      'team_formed': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <h1 className="text-2xl font-bold text-red-800 mb-4">Error Loading Team Data</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={loadUserTeamData} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!userSubmission) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
              <h1 className="text-2xl font-bold text-blue-800 mb-4">No Team Matching Submission Found</h1>
              <p className="text-blue-600 mb-6">
                You haven't submitted a team matching questionnaire yet.
              </p>
              <Button 
                onClick={() => window.location.href = '/team'} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Find Your Team
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Enhanced Header */}
          <div className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                <UserAvatar 
                  name={userSubmission.full_name} 
                  size="xl" 
                  status="online"
                  role="Team Lead"
                  className="hover:scale-110 transition-transform duration-200"
                />
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    Welcome back, {userSubmission.full_name.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Your team has been active today. Ready to collaborate?
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Last active: 2 minutes ago
                    </span>
                    <span className="flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      5 new messages
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>3</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>Start Meeting</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <GlassCard variant="elevated" className="group hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Status</h3>
                <div className="flex items-center justify-center">
                  {getStatusBadge(userSubmission.status)}
                  <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>Active</span>
                </div>
              </GlassCardContent>
            </GlassCard>
            
            <GlassCard variant="elevated" className="group hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Team Size</h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter 
                    value={userSubmission.team?.team_size || userSubmission.preferred_team_size} 
                  />
                </div>
                <AvatarStack 
                  users={userSubmission.team?.members.map(m => ({
                    name: m.submission.full_name,
                    role: m.role_in_team,
                    status: 'online' as const
                  })) || []}
                  className="justify-center"
                />
              </GlassCardContent>
            </GlassCard>
            
            <GlassCard variant="elevated" className="group hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Compatibility</h3>
                <div className="flex justify-center mb-2">
                  <CircularProgress 
                    value={userSubmission.team?.compatibility_score || 0}
                    size={60}
                    strokeWidth={6}
                    color="#10b981"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Excellent match!
                </div>
              </GlassCardContent>
            </GlassCard>
            
            <GlassCard variant="elevated" className="group hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Team Formed</h3>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {userSubmission.matched_at 
                    ? new Date(userSubmission.matched_at).toLocaleDateString()
                    : 'Pending'
                  }
                </div>
                <div className="text-xs text-gray-500">
                  {userSubmission.matched_at 
                    ? `${Math.floor((Date.now() - new Date(userSubmission.matched_at).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                    : 'Processing...'
                  }
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Team Information */}
          {userSubmission.team ? (
            <div className="space-y-8">
              {/* Team Chat - Enhanced Full Width */}
              <GlassCard variant="elevated" className="w-full">
                <TeamChatWindow
                  teamId={userSubmission.team.id}
                  currentUserSubmissionId={userSubmission.id}
                  currentUserName={userSubmission.full_name}
                />
              </GlassCard>
              
              {/* Team Details - Enhanced Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Enhanced Team Members */}
                <GlassCard variant="elevated">
                  <GlassCardHeader>
                    <div className="flex items-center justify-between">
                      <GlassCardTitle className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        Team Members
                      </GlassCardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {userSubmission.team.members.length} members
                      </Badge>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-6">
                      {userSubmission.team.members.map((member) => (
                        <div key={member.id} className="group relative">
                          <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-lg transition-all duration-300">
                            <UserAvatar 
                              name={member.submission.full_name}
                              size="lg"
                              status="online"
                              role={member.role_in_team}
                              className="flex-shrink-0"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {member.submission.full_name}
                                  {member.submission.id === userSubmission.id && (
                                    <span className="ml-2 text-sm text-blue-600 font-medium">(You)</span>
                                  )}
                                </h4>
                                {member.role_in_team && (
                                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                    {member.role_in_team}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{member.submission.college_name}</span>
                                </div>
                                <div className="flex items-center">
                                  <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{member.submission.current_year} • {member.submission.experience}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mt-3">
                                {member.submission.core_strengths.slice(0, 3).map((strength, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700">
                                    {strength}
                                  </Badge>
                                ))}
                                {member.submission.core_strengths.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    +{member.submission.core_strengths.length - 3} more
                                  </Badge>
                                )}
                              </div>

                              {member.submission.id !== userSubmission.id && (
                                <div className="mt-4 flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                                    onClick={() => copyToClipboard(member.submission.email, 'Email')}
                                  >
                                    <Mail className="w-4 h-4" />
                                    <span>Message</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center space-x-2 hover:bg-green-50 hover:border-green-300"
                                    onClick={() => copyToClipboard(member.submission.whatsapp_number, 'WhatsApp')}
                                  >
                                    <Phone className="w-4 h-4" />
                                    <span>Call</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center space-x-2 hover:bg-purple-50 hover:border-purple-300"
                                  >
                                    <Calendar className="w-4 h-4" />
                                    <span>Schedule</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCardContent>
                </GlassCard>

                {/* Enhanced Team Details */}
                <GlassCard variant="elevated">
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      Team Analytics
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Award className="w-5 h-5 mr-2 text-blue-600" />
                          Team Name
                        </h4>
                        <p className="text-lg font-medium text-gray-800">{userSubmission.team.team_name || 'Team Alpha'}</p>
                        <Button variant="ghost" size="sm" className="mt-2 text-blue-600 hover:text-blue-700">
                          <Settings className="w-4 h-4 mr-1" />
                          Edit Name
                        </Button>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-green-600" />
                          Compatibility Analysis
                        </h4>
                        <div className="flex items-center justify-center mb-4">
                          <CircularProgress 
                            value={userSubmission.team.compatibility_score || 0}
                            size={100}
                            strokeWidth={8}
                            color="#10b981"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">Skills Match</div>
                            <div className="text-gray-600">94%</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">Availability</div>
                            <div className="text-gray-600">87%</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600">Experience</div>
                            <div className="text-gray-600">91%</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-orange-600">Goals</div>
                            <div className="text-gray-600">89%</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                          Team Formation
                        </h4>
                        <p className="text-gray-600 mb-2">
                          Formed on {new Date(userSubmission.team.formed_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            {Math.floor((Date.now() - new Date(userSubmission.team.formed_at).getTime()) / (1000 * 60 * 60 * 24))} days of collaboration
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <MessageCircle className="w-5 h-5 mr-2 text-yellow-600" />
                          Communication Hub
                        </h4>
                        {userSubmission.team.chat_group_invite_link ? (
                          <div className="space-y-3">
                            <Button 
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                              onClick={() => window.open(userSubmission.team!.chat_group_invite_link, '_blank')}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Join WhatsApp Group
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" className="flex items-center justify-center">
                                <Video className="w-4 h-4 mr-1" />
                                Video Call
                              </Button>
                              <Button variant="outline" size="sm" className="flex items-center justify-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Schedule
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Settings className="w-6 h-6 text-white animate-spin" />
                            </div>
                            <p className="text-blue-800 text-sm font-medium mb-1">
                              Setting up your communication channels
                            </p>
                            <p className="text-blue-600 text-xs">
                              You'll be notified once everything is ready!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </div>
            </div>
          ) : (
            /* No Team Yet */
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <span className="text-6xl">⏳</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Finding Your Perfect Team
                </h3>
                <p className="text-gray-600 mb-6">
                  Your submission is being processed. We're finding the best teammates for you based on your preferences.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto text-left">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Submitted</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(userSubmission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Preferred Size</h4>
                    <p className="text-sm text-gray-600">
                      {userSubmission.preferred_team_size} members
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Quick Actions */}
          <GlassCard variant="elevated" className="mt-8">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                Quick Actions
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/team'}
                  className="group h-16 justify-start bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Update Preferences</div>
                      <div className="text-xs text-gray-600">Modify your team settings</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/resources'}
                  className="group h-16 justify-start bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Case Prep Resources</div>
                      <div className="text-xs text-gray-600">Study materials & guides</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/events'}
                  className="group h-16 justify-start bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:from-orange-100 hover:to-red-100 hover:border-orange-300 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Competitions</div>
                      <div className="text-xs text-gray-600">Upcoming events & contests</div>
                    </div>
                  </div>
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      <Footer />
    </div>
  )
}