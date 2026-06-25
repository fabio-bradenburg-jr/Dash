export const metadata = {
  title: 'Termos de Serviço | Dash LP',
  description: 'Termos de Serviço da plataforma Dash LP.',
}

const BG    = '#0b1120'
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
  h2:      { fontSize: '0.75rem', fontWeight: 700, color: GREEN, marginBottom: 8, marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.06em' },
  section: { marginBottom: 32, background: CARD, border: '1px solid ' + BDR, borderRadius: 14, padding: '20px 22px' },
  p:       { margin: '0 0 10px', color: TEXT },
  ul:      { paddingLeft: 20, margin: '8px 0' },
  li:      { marginBottom: 6, color: TEXT },
  a:       { color: GREEN, textDecoration: 'none', fontWeight: 600 },
}

export default function TermsPage() {
  return (
    <div style={S.page}>
      <div style={S.inner}>

        <div style={S.logo}>
          <img src="/assessoria-lp-logo.png" alt="Dash LP" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <span style={S.logoTxt}>Dash LP</span>
        </div>

        <h1 style={S.h1}>Termos de Serviço – Dash LP</h1>
        <span style={S.date}>Última atualização: 25 de junho de 2026</span>

        <div style={S.section}>
          <h2 style={S.h2}>1. Aceitação dos Termos</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>Ao acessar ou utilizar o aplicativo Dash LP, o usuário concorda com estes Termos de Serviço. Caso não concorde com qualquer parte destes termos, deverá interromper imediatamente o uso da plataforma.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>2. Descrição do Serviço</h2>
          <p style={S.p}>O Dash LP é uma plataforma de análise e visualização de dados que permite aos usuários conectar suas contas do Facebook e outros serviços da Meta para centralizar informações em dashboards e relatórios.</p>
          <p style={{ ...S.p, marginBottom: 0 }}>A plataforma poderá acessar dados disponibilizados pelas APIs da Meta, sempre mediante autorização expressa do usuário e de acordo com as permissões concedidas durante o processo de autenticação.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>3. Uso da Conta Meta</h2>
          <p style={S.p}>Ao conectar sua conta do Facebook ao Dash LP, o usuário declara que:</p>
          <ul style={S.ul}>
            <li style={S.li}>Possui autorização para acessar e gerenciar a conta conectada;</li>
            <li style={S.li}>As informações fornecidas são verdadeiras e atualizadas;</li>
            <li style={S.li}>É responsável pela segurança de suas credenciais de acesso.</li>
          </ul>
          <p style={{ ...S.p, marginBottom: 0, marginTop: 10 }}>O Dash LP não armazena senhas do Facebook ou de qualquer outro serviço da Meta.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>4. Permissões e Dados Coletados</h2>
          <p style={S.p}>Para o funcionamento da plataforma, o Dash LP poderá acessar informações autorizadas pelo usuário, incluindo, mas não se limitando a:</p>
          <ul style={S.ul}>
            <li style={S.li}>Nome e identificação da conta;</li>
            <li style={S.li}>Páginas administradas;</li>
            <li style={S.li}>Contas de anúncios;</li>
            <li style={S.li}>Dados de campanhas, anúncios e métricas;</li>
            <li style={S.li}>Informações necessárias para geração de dashboards e relatórios.</li>
          </ul>
          <p style={{ ...S.p, marginBottom: 0, marginTop: 10 }}>Os dados são utilizados exclusivamente para fornecer as funcionalidades da plataforma.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>5. Uso Permitido</h2>
          <p style={S.p}>O usuário concorda em não:</p>
          <ul style={{ ...S.ul, marginBottom: 0 }}>
            <li style={S.li}>Utilizar o Dash LP para atividades ilegais ou fraudulentas;</li>
            <li style={S.li}>Tentar acessar dados sem autorização;</li>
            <li style={S.li}>Interferir no funcionamento da plataforma;</li>
            <li style={{ ...S.li, marginBottom: 0 }}>Violar os Termos de Uso da Meta ou de terceiros.</li>
          </ul>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>6. Privacidade e Proteção de Dados</h2>
          <p style={S.p}>O tratamento de dados pessoais é realizado em conformidade com a legislação aplicável, incluindo a Lei Geral de Proteção de Dados (LGPD).</p>
          <p style={S.p}>Os dados acessados pelo Dash LP são utilizados exclusivamente para: conexão com os serviços da Meta, geração de dashboards e relatórios, e melhoria da experiência do usuário.</p>
          <p style={{ ...S.p, marginBottom: 0 }}>Para mais informações, consulte nossa <a href="/privacy" style={S.a}>Política de Privacidade</a>.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>7. Disponibilidade do Serviço</h2>
          <p style={S.p}>O Dash LP envida esforços para manter a plataforma disponível e atualizada, porém não garante funcionamento ininterrupto, ausência de falhas ou disponibilidade contínua das integrações fornecidas pela Meta.</p>
          <p style={{ ...S.p, marginBottom: 0, color: MUTE, fontSize: '0.88rem' }}>Alterações nas APIs da Meta podem impactar temporariamente determinadas funcionalidades.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>8. Propriedade Intelectual</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>Todos os direitos relacionados ao Dash LP, incluindo software, marcas, logotipos, interfaces, relatórios e conteúdos, pertencem exclusivamente aos seus proprietários e são protegidos pela legislação aplicável.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>9. Limitação de Responsabilidade</h2>
          <p style={S.p}>O Dash LP não se responsabiliza por:</p>
          <ul style={{ ...S.ul, marginBottom: 0 }}>
            <li style={S.li}>Perdas decorrentes de indisponibilidade das plataformas da Meta;</li>
            <li style={S.li}>Informações incorretas fornecidas pelo usuário;</li>
            <li style={{ ...S.li, marginBottom: 0 }}>Interrupções ocasionadas por serviços de terceiros.</li>
          </ul>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>10. Suspensão e Encerramento</h2>
          <p style={S.p}>O acesso do usuário poderá ser suspenso ou encerrado caso haja violação destes Termos, uso indevido da plataforma ou tentativas de fraude ou comprometimento da segurança do sistema.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>11. Alterações nos Termos</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>Estes Termos de Serviço poderão ser atualizados periodicamente. O uso contínuo da plataforma após as alterações constitui aceitação dos novos termos.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>12. Contato</h2>
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
