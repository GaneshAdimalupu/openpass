'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp, signIn } from '@openpass/auth/client'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    // Note: Better Auth doesn't use 'username' by default, so we're skipping it for the auth call,
    // but you could save it to your database later if needed.
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const terms = (form.elements.namedItem('terms') as HTMLInputElement).checked

    if (!terms) {
      setError('You must agree to the Terms of Service and Privacy Policy.')
      setLoading(false)
      return
    }

    const { error: authError } = await signUp.email({
      email,
      password,
      name,
      callbackURL: '/',
    })

    if (authError) {
      setError(authError.message ?? 'An error occurred during sign up.')
      setLoading(false)
      return
    }

    // Better Auth will handle the redirect if successful
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError(null)
    await signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
  }

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen flex flex-col antialiased">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto font-headline tracking-tight">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-[#ffffff]">
            Open Pass
          </Link>
          <div className="flex items-center gap-4">
            <button className="text-[#adaaaa] hover:text-[#85adff] transition-colors duration-300">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <Link
              href="/auth/login"
              className="bg-primary text-on-primary-fixed font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-fixed transition-colors active:scale-95 duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row pt-16">
        {/* Left Side: Visual/Branding */}
        <section className="hidden md:flex md:w-1/2 relative overflow-hidden items-center justify-center bg-surface-container-low">
          {/* Decorative Ambient Glows */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-tertiary/10 rounded-full blur-[100px]"></div>

          <div className="relative z-10 p-12 max-w-xl">
            {/* 3D Ticket Asset Mockup */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-tertiary/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative glass-panel rounded-[2rem] p-8 electric-glow transform rotate-3 hover:rotate-0 transition-transform duration-700 bg-surface-container-highest/40 backdrop-blur-xl border border-outline-variant/15">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <span
                      className="material-symbols-outlined text-primary text-5xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      confirmation_number
                    </span>
                    <div className="text-right">
                      <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold">
                        Access Protocol
                      </p>
                      <p className="text-xs font-mono text-primary">v2.0.4-STABLE</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-headline font-extrabold tracking-tighter leading-none">
                      THE OPEN PASS
                    </h3>
                    <p className="text-on-surface-variant text-sm">
                      Decentralized Event Infrastructure for the Modern Web.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-headline font-extrabold tracking-tight leading-tight">
                Join the <span className="text-primary">community.</span>
              </h2>
              <p className="text-on-surface-variant text-lg max-w-md">
                Deploy the ultimate event infrastructure and join the community of open organizers.
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Sign Up Form */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-surface">
          <div className="w-full max-w-md space-y-10">
            <div className="space-y-2">
              <h1 className="text-3xl font-headline font-bold">Create your account</h1>
              <p className="text-on-surface-variant">Start building your event ecosystem today.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            {/* Google Auth Action (Changed from GitHub) */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full h-[56px] flex items-center justify-center gap-3 bg-surface-container-highest hover:bg-surface-bright text-on-surface border border-outline-variant/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 font-bold"
            >
              {googleLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
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
                  Sign Up with Google
                </>
              )}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-outline-variant/30"></div>
              <span className="flex-shrink mx-4 text-on-surface-variant text-xs font-bold tracking-widest uppercase">
                Or use email
              </span>
              <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-on-surface-variant ml-1"
                  htmlFor="name"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  className="w-full h-[56px] px-6 rounded-xl bg-surface-container-highest border border-transparent focus:border-primary/40 focus:ring-0 transition-all outline-none text-on-surface placeholder:text-outline/50"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-on-surface-variant ml-1"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="alex@domain.com"
                  className="w-full h-[56px] px-6 rounded-xl bg-surface-container-highest border border-transparent focus:border-primary/40 focus:ring-0 transition-all outline-none text-on-surface placeholder:text-outline/50"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-on-surface-variant ml-1"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    className="w-full h-[56px] px-6 rounded-xl bg-surface-container-highest border border-transparent focus:border-primary/40 focus:ring-0 transition-all outline-none text-on-surface placeholder:text-outline/50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="w-5 h-5 rounded border-none bg-surface-container-highest text-primary focus:ring-primary/40 focus:ring-offset-0 cursor-pointer"
                />
                <label className="text-sm text-on-surface-variant" htmlFor="terms">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-black rounded-xl text-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20 disabled:opacity-70"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="text-center text-on-surface-variant text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 bg-[#131313] border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="text-lg font-black text-[#ffffff] font-headline">Open Pass</div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/privacy" className="text-[#adaaaa] hover:text-[#ffffff] transition-all">
              Privacy
            </Link>
            <Link href="/terms" className="text-[#adaaaa] hover:text-[#ffffff] transition-all">
              Terms
            </Link>
            <Link
              href="/open-source"
              className="text-[#adaaaa] hover:text-[#ffffff] transition-all"
            >
              Open Source
            </Link>
          </div>
          <p className="text-[#adaaaa]">
            © {new Date().getFullYear()} Open Pass Infrastructure. Built for the Electric Noir.
          </p>
        </div>
      </footer>
    </div>
  )
}
