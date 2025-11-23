import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DOMAINS, getDomainTableName } from '@/lib/utils/domain-mapping'
import type { DomainPerformance } from '@/lib/types/game.types'

/**
 * GET /api/analysis/domains/[user_id]
 * 
 * Retrieves domain-level performance metrics for a user.
 * 
 * Query params:
 *   - period_start?: string (ISO date, defaults to 30 days ago)
 *   - period_end?: string (ISO date, defaults to today)
 * 
 * Returns:
 *   {
 *     domains: {
 *       [domainKey]: DomainPerformance | null
 *     }
 *   }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ user_id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    const { user_id } = await context.params

    // Validate user_id
    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      )
    }

    // Only allow users to view their own metrics
    if (user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: can only view own metrics' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const periodEnd = searchParams.get('period_end') || new Date().toISOString().split('T')[0]
    const periodStart = searchParams.get('period_start') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    console.log(`Fetching domain metrics for user ${user_id} from ${periodStart} to ${periodEnd}`)

    // Fetch metrics from each domain table
    const domains: Record<string, DomainPerformance | null> = {}

    for (const domain of DOMAINS) {
      const tableName = getDomainTableName(domain)

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', user_id)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .maybeSingle()

        if (error) {
          console.error(`Error fetching from ${tableName}:`, error)
          // Return null for this domain if there's an error
          domains[domain] = null
        } else {
          domains[domain] = data as DomainPerformance | null
        }
      } catch (err) {
        console.error(`Exception fetching from ${tableName}:`, err)
        domains[domain] = null
      }
    }

    // If all domains are null, we might need to compute first
    const allNull = Object.values(domains).every(d => d === null)

    if (allNull) {
      console.log('No computed metrics found, may need to call /api/analysis/compute-user first')
    }

    return NextResponse.json(
      {
        success: true,
        user_id,
        period_start: periodStart,
        period_end: periodEnd,
        domains,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get domains error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

