/**
 * Game Adapter - Bridges original game code with Next.js
 * Games call this adapter which then saves to backend
 */

import type { GameType } from '@/lib/types/game.types'
import type { GameResult } from '@/hooks/useGame'

export interface GameAdapterConfig {
  gameType: GameType
  gameName: string
}

class GameAdapter {
  private config: GameAdapterConfig | null = null

  init(config: GameAdapterConfig) {
    this.config = config
  }

  async saveGameResult(result: {
    score: number
    accuracy?: number
    reaction_time?: number | number[]
    duration?: number
    level?: number
    metadata?: Record<string, unknown>
  }) {
    if (!this.config) {
      console.error('GameAdapter not initialized')
      return
    }

    // Call global handler if available
    if (typeof window !== 'undefined') {
      const win = window as Window & { handleGameEnd?: (result: GameResult) => void };
      if (win.handleGameEnd) {
        const gameResult: GameResult = {
          score: result.score,
          accuracy: result.accuracy,
          reaction_time: result.reaction_time,
          duration: result.duration,
          level: result.level,
          metadata: result.metadata,
        }
        win.handleGameEnd(gameResult)
      }
    }
  }
}

// Export singleton instance
export const gameAdapter = new GameAdapter()

// Also expose globally for game scripts
if (typeof window !== 'undefined') {
  (window as Window & { gameAdapter?: GameAdapter }).gameAdapter = gameAdapter
}

