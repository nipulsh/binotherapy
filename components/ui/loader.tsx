'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  fullScreen?: boolean
  text?: string
  className?: string
}

export function Loader({ fullScreen = false, text, className }: LoaderProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}


