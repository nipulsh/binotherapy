// Global type declarations for external libraries used in games

declare global {
  interface Window {
    gsap?: {
      timeline: () => {
        to: (targets: unknown, vars: unknown) => unknown
        then: () => Promise<void>
      }
      to: (targets: unknown, vars: unknown) => unknown
      set: (targets: unknown, vars: unknown) => unknown
      delayedCall: (delay: number, callback?: () => void) => {
        then: () => Promise<void>
      }
    }
    THREE?: typeof import('three')
    Phaser?: typeof import('phaser')
    gameAdapter?: {
      saveGameResult: (result: { score: number; accuracy?: number; reaction_time?: number; duration?: number; level?: number; metadata?: Record<string, unknown> }) => void
    }
    handleGameEnd?: (result: { score: number; accuracy?: number; reaction_time?: number; duration?: number; level?: number; metadata?: Record<string, unknown> }) => void
  }
}

export {}

