'use client'

import { Trophy, Clock, Award, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface GameOverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  survivalTime: number
  levelReached?: number
  onPlayAgain: () => void
  isSaving?: boolean
}

export function GameOverDialog({
  open,
  onOpenChange,
  survivalTime,
  levelReached = 1,
  onPlayAgain,
  isSaving = false,
}: GameOverDialogProps) {
  const minutes = Math.floor(survivalTime / 60)
  const seconds = (survivalTime % 60).toFixed(1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md border-2"
        style={{
          borderColor: 'var(--galaxy-primary)',
          boxShadow: '0 8px 32px rgba(107, 76, 255, 0.3)',
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="flex items-center gap-2"
            style={{ color: 'var(--galaxy-accent)' }}
          >
            <Trophy className="h-5 w-5" style={{ color: 'var(--galaxy-highlight)' }} />
            CAUGHT!
          </DialogTitle>
          <DialogDescription>
            The shadow finally caught you. Great effort!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div 
            className="text-center p-6 rounded-lg border-2"
            style={{
              borderColor: 'var(--galaxy-secondary)',
              backgroundColor: 'rgba(157, 92, 255, 0.1)',
              boxShadow: '0 4px 20px rgba(157, 92, 255, 0.2)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-6 w-6" style={{ color: 'var(--galaxy-accent)' }} />
              <div 
                className="text-4xl font-bold"
                style={{ color: 'var(--galaxy-primary)' }}
              >
                {minutes}:{seconds.padStart(4, '0')}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">Survival Time</div>
            
            <div className="flex items-center justify-center gap-2 mt-4">
              <Award className="h-5 w-5" style={{ color: 'var(--galaxy-highlight)' }} />
              <div 
                className="text-2xl font-bold"
                style={{ color: 'var(--galaxy-highlight)' }}
              >
                Level {levelReached}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">Level Reached</div>
            
            {/* Auto-save status */}
            <div className="mt-6">
              {isSaving ? (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  <span className="text-sm">Saving results...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Results saved!</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => {
                onOpenChange(false)
                onPlayAgain()
              }}
              disabled={isSaving}
              className="w-full"
              style={{
                background: 'linear-gradient(to right, var(--galaxy-primary), var(--galaxy-secondary))',
              }}
            >
              Play Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
