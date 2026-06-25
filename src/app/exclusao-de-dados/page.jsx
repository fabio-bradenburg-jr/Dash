export const metadata = {
  title: 'Exclusão de Dados do Usuário | Dash LP',
  description: 'Saiba como solicitar a exclusão dos seus dados na plataforma Dash LP.',
}

const BG   = '#0b1120'
const CARD  = 'rgba(255,255,255,0.04)'
const BDR   = 'rgba(255,255,255,0.08)'
const GREEN = '#26c281'
const TEXT  = '#f9fafb'
const MUTE  = '#9ca3af'

const S = {
  page:    { minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui, sans-serif', lineHeight: 1.8 },
  inner:   { maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' },
  logo:    { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44 },
  logoTxt: { fontSize: '1.1rem', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' },
  h1:      { fontSize: '1.85rem', fontWeight: 800, color: TEXT, marginBottom: 6, lineHeight: 1.2 },
  date:    { color: MUTE, marginBottom: 36, display: 'block', fontSize: '0.85rem' },
  h2:      { fontSize: '1rem', fontWeight: 700, color: GREEN, marginBottom: 8, marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' },
  section: { marginBottom: 32, background: CARD, border: '1px solid ' + BDR, borderRadius: 14, padding: '20px 22px' },
  p:       { margin: '0 0 10px', color: TEXT },
  ul:      { paddingLeft: 20, margin: '8px 0' },
  ol:      { paddingLeft: 20, margin: '8px 0' },
  li:      { marginBottom: 6, color: TEXT },
  a:       { color: GREEN, textDecoration: 'none', fontWeight: 600 },
  box:     { background: 'rgba(38,194,129,0.08)', border: '1px solid rgba(38,194,129,0.25)', borderRadius: 10, padding: '16px 20px', margin: '14px 0' },
}

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e676" />
          <stop offset="100%" stopColor="#26c281" />
        </linearGradient>
      </defs>
      {/* Body left half */}
      <path d="M50 20 C50 20 28 22 24 50 C20 74 38 82 50 82 L50 20Z" fill="url(#g1)" />
      {/* Wing right */}
      <path d="M50 20 L78 20 C78 20 82 38 72 52 C62 66 50 62 50 62 L50 20Z" fill="url(#g1)" />
      {/* Tail */}
      <path d="M50 66 C50 66 58 68 60 78 C62 88 52 88 50 82 L50 66Z" fill="url(#g1)" />
      {/* Head / beak hint */}
      <circle cx="34" cy="25" r="5" fill="url(#g1)" />
    </svg>
  )
}

export default function ExclusaoDeDadosPage() {
  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Logo */}
        <div style={S.logo}>
          <img src="/assessoria-lp-logo.png" alt="Dash LP" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <span style={S.logoTxt}>Dash LP</span>
        </div>

        <h1 style={S.h1}>Exclusão de Dados do Usuário</h1>
        <span style={S.date}>Última atualização: 25 de junho de 2026</span>

        <div style={S.section}>
          <h2 style={S.h2}>Sobre a plataforma</h2>
          <p style={S.p}>O <strong>Dash LP</strong> é uma plataforma que permite a conexão de contas do Facebook e outros serviços da Meta para a centralização de métricas e informações em dashboards e relatórios.</p>
          <p style={{ ...S.p, marginBottom: 0 }}>Respeitamos a privacidade dos usuários e garantimos o direito de solicitar a exclusão dos dados armazenados em nossa plataforma.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>Como solicitar a exclusão</h2>
          <p style={S.p}>Para solicitar a exclusão dos seus dados, envie um e-mail para:</p>
          <div style={S.box}>
            <p style={{ ...S.p, marginBottom: 4 }}><strong>E-mail:</strong> <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a></p>
            <p style={{ ...S.p, marginBottom: 0 }}><strong>Assunto:</strong> Solicitação de Exclusão de Dados – Dash LP</p>
          </div>
          <p style={{ ...S.p, marginTop: 12 }}>Na solicitação, informe:</p>
          <ul style={S.ul}>
            <li style={S.li}>Nome completo;</li>
            <li style={S.li}>E-mail utilizado no cadastro;</li>
            <li style={S.li}>Página, conta de anúncios ou perfil conectado (se aplicável).</li>
          </ul>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>O que será excluído</h2>
          <p style={S.p}>Após a confirmação da solicitação, o Dash LP realizará a exclusão de:</p>
          <ul style={S.ul}>
            <li style={S.li}>Dados de cadastro armazenados na plataforma;</li>
            <li style={S.li}>Tokens de autenticação do Facebook e Meta;</li>
            <li style={S.li}>Informações de integração e sincronização;</li>
            <li style={S.li}>Dados utilizados para a geração de dashboards e relatórios.</li>
          </ul>
          <p style={{ ...S.p, marginTop: 10, marginBottom: 0, color: MUTE, fontSize: '0.88rem' }}>Algumas informações poderão ser mantidas temporariamente quando exigidas por lei, por questões de segurança ou prevenção a fraudes.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>Prazo de processamento</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>As solicitações de exclusão serão processadas em até <strong>30 dias</strong> após a validação da identidade do solicitante.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>Remoção pelo Facebook</h2>
          <p style={S.p}>O usuário também pode remover o acesso do aplicativo diretamente pelo Facebook:</p>
          <ol style={S.ol}>
            <li style={S.li}>Acesse <strong>Configurações e Privacidade</strong>;</li>
            <li style={S.li}>Clique em <strong>Configurações</strong>;</li>
            <li style={S.li}>Entre em <strong>Aplicativos e Sites</strong>;</li>
            <li style={S.li}>Localize <strong>Dash LP</strong>;</li>
            <li style={S.li}>Clique em <strong>Remover</strong>.</li>
          </ol>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>Contato</h2>
          <ul style={{ ...S.ul, listStyle: 'none', paddingLeft: 0, marginBottom: 0 }}>
            <li style={S.li}><strong>Aplicativo:</strong> Dash LP</li>
            <li style={S.li}><strong>E-mail:</strong> <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a></li>
            <li style={{ ...S.li, marginBottom: 0 }}><strong>Website:</strong> <a href="https://assessorialp.com.br" style={S.a}>assessorialp.com.br</a></li>
          </ul>
        </div>

      </div>
    </div>
  )
}
