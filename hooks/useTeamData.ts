import { useState, useEffect } from 'react'
import { CompleteTeamData, TeamMemberDisplay } from '../types/team'

interface UseTeamDataReturn {
  teamData: CompleteTeamData | null
  members: TeamMemberDisplay[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseTeamDataOptions {
  teamId?: string
  autoFetch?: boolean
}

export function useTeamData({ teamId, autoFetch = true }: UseTeamDataOptions = {}): UseTeamDataReturn {
  const [teamData, setTeamData] = useState<CompleteTeamData | null>(null)
  const [members, setMembers] = useState<TeamMemberDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamData = async () => {
    if (!teamId) {
      setError('Team ID is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/team/${teamId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch team data')
      }

      if (result.success && result.data) {
        setTeamData(result.data)
        setMembers(result.data.members || [])
      } else {
        throw new Error(result.error || 'Invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching team data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembersOnly = async () => {
    if (!teamId) {
      setError('Team ID is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/team/${teamId}/members`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch team members')
      }

      if (result.success && result.data) {
        setMembers(result.data)
        // Update members in teamData if it exists
        if (teamData) {
          setTeamData(prev => prev ? {
            ...prev,
            members: result.data,
            memberCount: result.data.length
          } : null)
        }
      } else {
        throw new Error(result.error || 'Invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching team members:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    await fetchTeamData()
  }

  useEffect(() => {
    if (autoFetch && teamId) {
      fetchTeamData()
    }
  }, [teamId, autoFetch])

  return {
    teamData,
    members,
    loading,
    error,
    refetch
  }
}

// Hook specifically for fetching team members only
export function useTeamMembers(teamId?: string): Omit<UseTeamDataReturn, 'teamData'> {
  const [members, setMembers] = useState<TeamMemberDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = async () => {
    if (!teamId) {
      setError('Team ID is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/team/${teamId}/members`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch team members')
      }

      if (result.success && result.data) {
        setMembers(result.data)
      } else {
        throw new Error(result.error || 'Invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching team members:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    await fetchMembers()
  }

  useEffect(() => {
    if (teamId) {
      fetchMembers()
    }
  }, [teamId])

  return {
    members,
    loading,
    error,
    refetch
  }
}