"use client";

import { type FormEvent, useState, useTransition } from 'react'
import { signIn } from '@/app/login/actions' 

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div>
        <div className="text-base font-bold text-slate-900 leading-tight font-display">Creator Plus</div>
        <div className="text-[11px] text-slate-400">Content Creator Platform</div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }
    setError('')
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await signIn(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="w-full lg:w-[52%] flex flex-col min-h-screen">
        <div className="px-6 sm:px-10 lg:px-14 py-7">
          <Logo />
        </div>

        <main className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Your creator business, organised
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">
                Welcome back
              </h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Sign in to manage your collaborations, invoices, and payments.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                  <input
                    id="login-email"
                    name="email"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                    }}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-600">
                    Password
                  </label>
                  
                </div>
                <div className="relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  <input
                    id="login-password"
                    name="password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError('')
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      remember
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-300 text-transparent'
                    }`}
                  >
                    <CheckIcon />
                  </span>
                  <span className="text-xs text-slate-500">Remember me</span>
                </label>
                <span className="text-xs font-medium text-indigo-600">Forgot password?</span>
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200"
              >
                {pending ? 'Signing in…' : 'Sign in'}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="13 6 19 12 13 18" />
                </svg>
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-7">
              New to Creator Plus?{' '}
              <button
                type="button"
                onClick={() => setError('Account registration is not available yet. Contact the app owner to create your account.')}
                className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
        </main>

        <div className="px-6 sm:px-10 lg:px-14 py-6 text-[11px] text-slate-400">
          © 2026 Creator Plus · Built for KOCs and content creators. All rights reserved.
        </div>
      </div>

      <aside className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-slate-950 p-10 xl:p-14 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-violet-600/20" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Everything in one calm workspace
          </div>

          <div className="my-12">
            <p className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight font-display">
              Spend less time managing work.
              <span className="block text-indigo-300">Create more.</span>
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mt-4 max-w-md">
              Plan brand collaborations, send professional invoices, and know exactly what has been paid.
            </p>

            <div className="mt-10 bg-white/10 border border-white/10 backdrop-blur-sm rounded-3xl p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs text-slate-400">October overview</div>
                  <div className="text-sm font-semibold mt-0.5">Your business at a glance</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-[10px] text-slate-400">Expected income</div>
                  <div className="text-xl font-bold mt-1 font-mono">RM 8,100</div>
                  <div className="text-[10px] text-emerald-300 mt-1">8 collaborations</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-[10px] text-slate-400">Collected</div>
                  <div className="text-xl font-bold mt-1 text-emerald-300 font-mono">RM 400</div>
                  <div className="text-[10px] text-slate-400 mt-1">1 payment received</div>
                </div>
              </div>

              <div className="mt-3 bg-white rounded-2xl p-4 text-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold">Lunas Coffee</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">New Menu Launch · due 15 Oct</div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600 text-[10px] font-bold">
                    Scheduled
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Calendar', 'Never miss a deadline'],
              ['Invoices', 'Get paid professionally'],
              ['Income', 'Track every payment'],
            ].map(([title, detail]) => (
              <div key={title}>
                <div className="text-xs font-semibold text-white">{title}</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
