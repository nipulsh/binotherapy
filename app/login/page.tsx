'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader } from '@/components/ui/loader'
import { AlertCircle } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const redirect = searchParams.get('redirect') || '/dashboard'
      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      setMessage(
        'Check your email for the confirmation link to complete sign up!'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
            searchParams.get('redirect') || '/dashboard'
          )}`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-4 px-4 sm:py-8 sm:px-6 lg:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground px-4">
            Sign in to your account or create a new one
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto sm:h-10">
            <TabsTrigger
              value="signin"
              className="text-xs sm:text-sm py-2 sm:py-1.5"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="text-xs sm:text-sm py-2 sm:py-1.5"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4 sm:mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email-signin"
                  className="text-sm sm:text-base"
                >
                  Email
                </Label>
                <Input
                  id="email-signin"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password-signin"
                  className="text-sm sm:text-base"
                >
                  Password
                </Label>
                <Input
                  id="password-signin"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-base sm:text-sm"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium"
                disabled={loading}
              >
                {loading ? <Loader /> : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4 sm:mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name-signup"
                  className="text-sm sm:text-base"
                >
                  Full Name
                </Label>
                <Input
                  id="name-signup"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email-signup"
                  className="text-sm sm:text-base"
                >
                  Email
                </Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password-signup"
                  className="text-sm sm:text-base"
                >
                  Password
                </Label>
                <Input
                  id="password-signup"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-10 sm:h-11 text-base sm:text-sm"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium"
                disabled={loading}
              >
                {loading ? <Loader /> : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative py-2 sm:py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 sm:px-3 text-muted-foreground text-xs sm:text-sm">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Continue with Google
        </Button>

        {error && (
          <Alert variant="destructive" className="text-sm sm:text-base">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm sm:text-base">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="text-sm sm:text-base">
            <AlertDescription className="text-sm sm:text-base">
              {message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-screen items-center justify-center py-4 px-4 sm:py-8 sm:px-6 lg:py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader />
            <p className="text-sm sm:text-base text-muted-foreground">
              Loading login...
            </p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}


