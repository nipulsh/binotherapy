'use client'

import { Clock, Apple } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ScoreDisplayProps {
  score: number
  remainingTime: number
}

export function ScoreDisplay({
  score,
  remainingTime,
}: ScoreDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Apple className="h-4 w-4" />
            Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{score}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Apples caught
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Remaining Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{Math.round(remainingTime)}s</div>
          <div className="text-sm text-muted-foreground mt-1">
            {score >= 10 ? '🎉 You win!' : score < 10 ? 'Keep catching!' : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

