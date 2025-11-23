'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const scoreFormSchema = z.object({
  playerName: z.string().min(1, 'Name is required').max(50, 'Name too long'),
})

type ScoreFormValues = z.infer<typeof scoreFormSchema>

interface GameOverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  score: number
  won: boolean
  onPlayAgain: () => void
}

export function GameOverDialog({
  open,
  onOpenChange,
  score,
  won,
  onPlayAgain,
}: GameOverDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const form = useForm<ScoreFormValues>({
    resolver: zodResolver(scoreFormSchema),
    defaultValues: {
      playerName: '',
    },
  })

  const onSubmit = async (data: ScoreFormValues) => {
    setSubmitting(true)
    try {
      // Get current user if available
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Insert score into game_sessions table
      // Type assertion needed because Supabase types don't properly infer for game_sessions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('game_sessions') as any).insert({
        user_id: user?.id || '00000000-0000-0000-0000-000000000000', // Anonymous user
        game_type: 'depth-perception',
        game_name: 'falling-blocks',
        score: score,
        metadata: {
          playerName: data.playerName,
          score,
          won,
          gameName: 'apple-catcher',
        },
      })

      if (error) throw error

      toast.success('Score submitted successfully!', {
        description: `Your score of ${score} apples has been saved.`,
      })

      onOpenChange(false)
      onPlayAgain()
    } catch (error) {
      console.error('Error submitting score:', error)
      toast.error('Failed to submit score', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Game Over!
          </DialogTitle>
          <DialogDescription>
            {won ? '🎉 Congratulations! You won!' : '😭 You lost! Try again!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center p-6 bg-muted rounded-lg">
            <div className="text-4xl font-bold mb-2">{score}</div>
            <div className="text-sm text-muted-foreground">Apples Caught</div>
            <div className="text-lg font-semibold mt-4">
              {won ? '🎉 Win! 😊' : '😭 Lose!'}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {won ? 'You caught 10 or more apples!' : 'You need to catch at least 10 apples to win.'}
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Your Name</Label>
              <Input
                id="playerName"
                placeholder="Enter your name"
                {...form.register('playerName')}
                disabled={submitting}
              />
              {form.formState.errors.playerName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.playerName.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  onPlayAgain()
                }}
                disabled={submitting}
              >
                Skip
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Score'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

