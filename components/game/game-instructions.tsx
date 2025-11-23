'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface GameInstructionsProps {
  title: string
  instructions: string[]
  open: boolean
  onStart: () => void
}

export function GameInstructions({
  title,
  instructions,
  open,
  onStart,
}: GameInstructionsProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Read the instructions carefully before starting
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            {instructions.map((instruction, index) => (
              <li key={index} className="leading-relaxed">
                {instruction}
              </li>
            ))}
          </ol>
        </ScrollArea>
        <div className="flex justify-end">
          <Button onClick={onStart} size="lg" className="w-full sm:w-auto">
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


