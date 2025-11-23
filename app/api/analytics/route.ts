import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('game_type')

    if (metricsError) {
      console.error('Metrics error:', metricsError)
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      )
    }

    // Fetch recent sessions for trend analysis
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(100)

    if (sessionsError) {
      console.error('Sessions error:', sessionsError)
    }

    return NextResponse.json({
      success: true,
      metrics: metrics || [],
      recentSessions: recentSessions || [],
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


