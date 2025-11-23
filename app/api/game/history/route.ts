import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GameType } from '@/lib/types/game.types'

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const gameType = searchParams.get('game_type') as GameType | null
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (gameType) {
      query = query.eq('game_type', gameType)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch game history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, sessions: sessions || [] })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


