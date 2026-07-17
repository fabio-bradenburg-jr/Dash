const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Durante o `next build` (coleta de page data), os módulos de rota são avaliados
// e o env pode não estar presente nesse contexto — não derrube o build por isso.
// As variáveis existem em runtime (onde a validação abaixo continua valendo).
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

if (!isBuildPhase && !supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!isBuildPhase && !supabasePublishableKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export { supabaseUrl, supabasePublishableKey }
