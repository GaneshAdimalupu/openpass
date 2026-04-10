'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@openpass/auth/client'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('identifier') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const { error: authError } = await signIn.email({
      email,
      password,
      callbackURL: '/',
    })

    if (authError) {
      setError(authError.message ?? 'Invalid credentials. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    await signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
    // better-auth handles the redirect — no need to setGoogleLoading(false)
  }

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col mesh-gradient">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-white font-headline">
            OpenPass
          </Link>
          <Link
            href="/auth/register"
            className="bg-primary-dim hover:bg-primary text-white px-5 py-2 rounded-full font-semibold active:scale-95 duration-200 transition-all"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-md relative">
          {/* Ambient glows */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-dim/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-tertiary/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="glass-panel p-8 md:p-10 rounded-3xl relative z-10 shadow-2xl">
            {/* Branding */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 mb-6 relative group">
                <div className="absolute inset-0 bg-primary-dim/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all" />
                <div className="relative bg-surface-container-highest w-full h-full rounded-2xl flex items-center justify-center border border-outline-variant/30">
                  <span
                    className="material-symbols-outlined text-4xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    confirmation_number
                  </span>
                </div>
              </div>
              <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
                Welcome back.
              </h1>
              <p className="text-on-surface-variant font-body">
                Sign in to your event infrastructure.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-on-surface-variant ml-1"
                  htmlFor="identifier"
                >
                  Email
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    alternate_email
                  </span>
                  <input
                    id="identifier"
                    name="identifier"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-surface-container-highest border border-transparent focus:border-primary/40 focus:ring-0 focus:outline-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 transition-all"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-medium text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-primary hover:text-white transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock_open
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full bg-surface-container-highest border border-transparent focus:border-primary/40 focus:ring-0 focus:outline-none rounded-xl py-4 pl-12 pr-12 text-on-surface placeholder:text-outline/50 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed font-bold py-4 rounded-xl glow-button hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-px flex-grow bg-outline-variant/30" />
              <span className="text-xs font-bold text-outline uppercase tracking-widest whitespace-nowrap">
                or continue with
              </span>
              <div className="h-px flex-grow bg-outline-variant/30" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full bg-surface-container-highest hover:bg-surface-bright text-on-surface border border-outline-variant/20 py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <span className="material-symbols-outlined text-sm animate-spin">
                  progress_activity
                </span>
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span className="font-semibold">Continue with Google</span>
            </button>

            {/* Sign up */}
            <div className="mt-10 text-center">
              <p className="text-on-surface-variant">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/register"
                  className="text-primary font-bold hover:underline underline-offset-4 ml-1 transition-all"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 bg-[#131313]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-black text-white font-headline">OpenPass</span>
            <p className="font-body text-sm text-on-surface-variant text-center md:text-left">
              © {new Date().getFullYear()} OpenPass. AGPL-3.0.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary-dim animate-pulse" />
            <span className="text-xs font-mono text-primary tracking-widest uppercase">
              System Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
