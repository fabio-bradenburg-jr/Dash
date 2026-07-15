'use client'

import { useEffect, useState } from 'react'
import { Building2, LockKeyhole, Mail, User2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import LpBirdLogo from '@/components/brand/LpBirdLogo'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlError = new URLSearchParams(window.location.search).get('error')
    if (urlError) {
      setError(urlError)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true
    const nextPath = new URLSearchParams(window.location.search).get('next') || '/'

    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!isMounted || !response.ok) return
        const data = await response.json()
        if (data?.authenticated) {
          window.location.replace(nextPath)
        }
      })
      .catch(() => {
        // Sessão ausente ou expirada: mantém o usuário na tela de login.
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const nextPath =
        typeof window === 'undefined'
          ? '/'
          : new URLSearchParams(window.location.search).get('next') || '/'

      const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'login'
            ? { email, password }
            : {
                full_name: fullName,
                company_name: companyName,
                email,
                password,
              }
        ),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível autenticar.')
      }

      window.location.href = nextPath
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(38,194,129,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(38,194,129,0.08),transparent_24%),#0a0c0b] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Painel esquerdo — logo LED do pássaro LP */}
        <section className="relative hidden items-center justify-center overflow-hidden rounded-[36px] border border-[rgba(38,194,129,0.14)] bg-[radial-gradient(circle_at_30%_30%,rgba(38,194,129,0.06),transparent_60%),#0d0f0e] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)] md:p-12 lg:flex">
          <LpBirdLogo />
        </section>

        <section className="rounded-[36px] border border-[rgba(255,255,255,0.08)] bg-[#131615] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)] md:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#26c281]/70">
              {mode === 'login' ? 'Entrar com segurança' : 'Criar nova conta'}
            </p>
            <h2 className="mt-3 font-manrope text-3xl font-extrabold tracking-tight text-white">
              {mode === 'login' ? 'Acesse seu ambiente' : 'Crie seu ambiente'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {mode === 'login'
                ? 'Use seu e-mail e sua senha para entrar no sistema.'
                : 'Cadastre sua conta de administrador e criamos um novo workspace para sua operação.'}
            </p>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-[#26c281] text-[#04150d]' : 'text-slate-400'}`}
                onClick={() => setMode('login')}
                type="button"
              >
                Entrar
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-[#26c281] text-[#04150d]' : 'text-slate-400'}`}
                onClick={() => setMode('register')}
                type="button"
              >
                Criar conta
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-300">
                  Nome completo
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-[#26c281]/50">
                    <User2 className="h-4 w-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-300">
                  Empresa ou agência
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-[#26c281]/50">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      type="text"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              E-mail
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-[#26c281]/50">
                <Mail className="h-4 w-4 text-slate-500" />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  required
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Senha
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-[#26c281]/50">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  required
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
                {error}
              </div>
            ) : null}

            <Button className="h-12 w-full bg-[#26c281] text-base font-semibold text-[#04150d] hover:bg-[#26c281]/90" disabled={loading} type="submit">
              {loading
                ? mode === 'login'
                  ? 'Entrando...'
                  : 'Criando conta...'
                : mode === 'login'
                  ? 'Entrar na plataforma'
                  : 'Criar conta e entrar'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
