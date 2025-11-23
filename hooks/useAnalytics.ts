'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameSession, PerformanceMetrics } from '@/lib/types/game.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useAnalytics() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch game sessions
  const fetchSessions = useCallback(async (gameType?: string, limit: number = 50) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      let query = supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(limit)

      if (gameType) {
        query = query.eq('game_type', gameType)
      }

      const { data: fetchedSessions, error: fetchError } = await query

      if (fetchError) throw fetchError

      return fetchedSessions || []
    } catch (err) {
      console.error('Error fetching sessions:', err)
      return []
    }
  }, [supabase])

  // Fetch performance metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data: fetchedMetrics, error: fetchError } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      return fetchedMetrics || []
    } catch (err) {
      console.error('Error fetching metrics:', err)
      return []
    }
  }, [supabase])

  // Set up real-time subscriptions
  const setupRealtime = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Subscribe to game_sessions changes
    const sessionsChannel = supabase
      .channel('game_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Game session change:', payload.eventType)
          // Refetch sessions when changes occur
          const updatedSessions = await fetchSessions()
          setSessions(updatedSessions)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_metrics',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Performance metrics change:', payload.eventType)
          // Refetch metrics when changes occur
          const updatedMetrics = await fetchMetrics()
          setMetrics(updatedMetrics)
        }
      )
      .subscribe()

    channelRef.current = sessionsChannel
  }, [supabase, fetchSessions, fetchMetrics])

  // Initial data fetch
  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [fetchedSessions, fetchedMetrics] = await Promise.all([
          fetchSessions(),
          fetchMetrics(),
        ])

        if (mounted) {
          setSessions(fetchedSessions)
          setMetrics(fetchedMetrics)
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          setError(errorMessage)
          console.error('Analytics fetch error:', err)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Set up real-time subscriptions after initial fetch
    const setupTimer = setTimeout(() => {
      setupRealtime()
    }, 1000)

    return () => {
      mounted = false
      clearTimeout(setupTimer)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchSessions, fetchMetrics, setupRealtime, supabase])

  // Refresh data manually
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [fetchedSessions, fetchedMetrics] = await Promise.all([
        fetchSessions(),
        fetchMetrics(),
      ])

      setSessions(fetchedSessions)
      setMetrics(fetchedMetrics)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data'
      setError(errorMessage)
      console.error('Refresh error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchSessions, fetchMetrics])

  // Get sessions by game type
  const getSessionsByGameType = useCallback(async (gameType: string, limit: number = 50) => {
    const fetchedSessions = await fetchSessions(gameType, limit)
    return fetchedSessions
  }, [fetchSessions])

  // Get aggregated stats
  const getStats = useCallback(() => {
    const totalGames = sessions.length
    const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0)
    const avgScore = totalGames > 0 ? totalScore / totalGames : 0
    const bestScore = Math.max(...sessions.map(s => s.score || 0), 0)
    const totalPlaytime = metrics.reduce((sum, m) => sum + (m.total_playtime || 0), 0)
    const avgAccuracy = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.average_accuracy || 0), 0) / metrics.length
      : 0

    return {
      totalGames,
      avgScore: Math.round(avgScore),
      bestScore,
      totalPlaytime,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      gameTypesPlayed: new Set(sessions.map(s => s.game_type)).size,
    }
  }, [sessions, metrics])

  return { 
    sessions, 
    metrics, 
    loading, 
    error,
    refresh,
    getSessionsByGameType,
    getStats,
  }
}


