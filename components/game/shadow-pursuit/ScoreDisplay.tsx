'use client'

import { Clock, Zap, Gauge, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ScoreDisplayProps {
  survivalTime: number
  chaserSpeed: number
  distance: number
  level?: number
}

export function ScoreDisplay({
  survivalTime,
  chaserSpeed,
  distance,
  level = 1,
}: ScoreDisplayProps) {
  const minutes = Math.floor(survivalTime / 60)
  const seconds = (survivalTime % 60).toFixed(1)
  const isDanger = distance < 100

  return (
    <>
      {/* Mobile: Single horizontal line */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 mb-3"
        style={{
          borderColor: isDanger ? '#ef4444' : 'var(--galaxy-primary)',
          boxShadow: isDanger
            ? '0 4px 20px rgba(239, 68, 68, 0.3)'
            : '0 4px 20px rgba(107, 76, 255, 0.15)',
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Trophy className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--galaxy-highlight)' }} />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground leading-tight">Level</span>
            <span className="text-sm font-bold leading-tight" style={{ color: 'var(--galaxy-highlight)' }}>
              {level}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--galaxy-primary)' }} />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground leading-tight">Time</span>
            <span className="text-sm font-bold leading-tight whitespace-nowrap" style={{ color: 'var(--galaxy-primary)' }}>
              {minutes}:{seconds.padStart(4, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--galaxy-secondary)' }} />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground leading-tight">Speed</span>
            <span className="text-sm font-bold leading-tight" style={{ color: 'var(--galaxy-secondary)' }}>
              {Math.round(chaserSpeed)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <Gauge className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--galaxy-accent)' }} />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground leading-tight">Dist</span>
            <span className="text-sm font-bold leading-tight" style={{ color: 'var(--galaxy-accent)' }}>
              {Math.round(distance)}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-4 gap-4 mb-6">
        <Card 
          className="border-2"
          style={{
            borderColor: 'var(--galaxy-highlight)',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.15)',
            backgroundColor: 'rgba(26, 26, 46, 0.6)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle 
              className="text-sm font-medium flex items-center gap-2"
              style={{ color: 'var(--galaxy-accent)' }}
            >
              <Trophy className="h-4 w-4" />
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-3xl font-bold"
              style={{ color: 'var(--galaxy-highlight)' }}
            >
              {level}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Getting harder!
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-2 transition-all ${
            isDanger ? 'border-red-500' : ''
          }`}
          style={{
            borderColor: isDanger 
              ? '#ef4444' 
              : 'var(--galaxy-primary)',
            boxShadow: isDanger
              ? '0 4px 20px rgba(239, 68, 68, 0.3)'
              : '0 4px 20px rgba(107, 76, 255, 0.15)',
            backgroundColor: 'rgba(26, 26, 46, 0.6)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle 
              className="text-sm font-medium flex items-center gap-2"
              style={{ color: 'var(--galaxy-accent)' }}
            >
              <Clock className="h-4 w-4" />
              Survival Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-3xl font-bold"
              style={{ color: 'var(--galaxy-primary)' }}
            >
              {minutes}:{seconds.padStart(4, '0')}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {isDanger ? '⚠️ Danger Zone!' : 'Keep running!'}
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-2"
          style={{
            borderColor: 'var(--galaxy-secondary)',
            boxShadow: '0 4px 20px rgba(157, 92, 255, 0.15)',
            backgroundColor: 'rgba(26, 26, 46, 0.6)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle 
              className="text-sm font-medium flex items-center gap-2"
              style={{ color: 'var(--galaxy-accent)' }}
            >
              <Zap className="h-4 w-4" />
              Police Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-3xl font-bold"
              style={{ color: 'var(--galaxy-secondary)' }}
            >
              {Math.round(chaserSpeed)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Getting faster...
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-2"
          style={{
            borderColor: 'var(--galaxy-accent)',
            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.15)',
            backgroundColor: 'rgba(26, 26, 46, 0.6)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle 
              className="text-sm font-medium flex items-center gap-2"
              style={{ color: 'var(--galaxy-accent)' }}
            >
              <Gauge className="h-4 w-4" />
              Distance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-3xl font-bold"
              style={{ color: 'var(--galaxy-accent)' }}
            >
              {Math.round(distance)}px
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {distance < 50 ? '🚨 Too close!' : distance < 100 ? '⚠️ Close' : 'Safe'}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
