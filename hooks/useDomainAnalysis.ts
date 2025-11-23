import { useState, useCallback } from 'react'
import type { DomainPerformance } from '@/lib/types/game.types'

interface UseDomainAnalysisOptions {
  userId: string
  periodStart?: string
  periodEnd?: string
}

interface DomainAnalysisData {
  domains: Record<string, DomainPerformance | null>
  period_start: string
  period_end: string
}

/**
 * React hook for managing domain-level analysis data
 * 
 * Usage:
 * ```tsx
 * const { data, loading, error, fetchDomains, computeMetrics } = useDomainAnalysis({
 *   userId: user.id,
 *   periodStart: '2024-01-01',
 *   periodEnd: '2024-01-31'
 * })
 * ```
 */
export function useDomainAnalysis(options: UseDomainAnalysisOptions) {
  const { userId, periodStart, periodEnd } = options

  const [data, setData] = useState<DomainAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches domain metrics from the API
   */
  const fetchDomains = useCallback(async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (periodStart) params.set('period_start', periodStart)
      if (periodEnd) params.set('period_end', periodEnd)

      const response = await fetch(
        `/api/analysis/domains/${userId}?${params.toString()}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch domain metrics')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching domain metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, periodStart, periodEnd])

  /**
   * Computes/recomputes domain metrics for the user
   */
  const computeMetrics = useCallback(async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analysis/compute-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to compute metrics')
      }

      const result = await response.json()
      
      // Update local data with computed results
      setData({
        domains: result.domains,
        period_start: result.period_start,
        period_end: result.period_end,
      })

      // Optionally fetch again to ensure we have the latest
      await fetchDomains()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error computing metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, periodStart, periodEnd, fetchDomains])

  return {
    data,
    loading,
    error,
    fetchDomains,
    computeMetrics,
  }
}

