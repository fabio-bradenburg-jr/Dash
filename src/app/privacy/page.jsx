export const metadata = {
  title: 'Política de Privacidade | Dash LP',
  description: 'Política de Privacidade da plataforma Dash LP.',
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

export default function PrivacyPage() {
  return (
    <div style={S.page}>
      <div style={S.inner}>

        <div style={S.logo}>
          <img src="/assessoria-lp-logo.png" alt="Dash LP" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <span style={S.logoTxt}>Dash LP</span>
        </div>

        <h1 style={S.h1}>Política de Privacidade – Dash LP</h1>
        <span style={S.date}>Última atualização: 25 de junho de 2026</span>

        <div style={S.section}>
          <h2 style={S.h2}>1. Introdução</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>O Dash LP está comprometido com a proteção da privacidade dos seus usuários. Esta Política descreve como coletamos, utilizamos, armazenamos e protegemos as informações obtidas durante o uso da plataforma.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>2. Dados Coletados</h2>
          <p style={S.p}>Ao utilizar o Dash LP e conectar sua conta da Meta, podemos coletar:</p>
          <ul style={S.ul}>
            <li style={S.li}>Nome e identificador da conta do Facebook;</li>
            <li style={S.li}>Dados de contas de anúncios autorizadas;</li>
            <li style={S.li}>Métricas de campanhas, conjuntos de anúncios e anúncios;</li>
            <li style={S.li}>Informações de acesso à plataforma (logs, IP, navegador).</li>
          </ul>
          <p style={{ ...S.p, marginBottom: 0, marginTop: 10, color: MUTE, fontSize: '0.88rem' }}>Não coletamos senhas, dados financeiros pessoais ou informações além do necessário para o funcionamento da plataforma.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>3. Uso dos Dados</h2>
          <p style={S.p}>Os dados coletados são utilizados exclusivamente para:</p>
          <ul style={S.ul}>
            <li style={S.li}>Autenticação e acesso à plataforma;</li>
            <li style={S.li}>Exibição de dashboards e relatórios de performance;</li>
            <li style={S.li}>Melhoria contínua das funcionalidades oferecidas;</li>
            <li style={S.li}>Suporte técnico ao usuário.</li>
          </ul>
          <p style={{ ...S.p, marginBottom: 0, marginTop: 10, color: MUTE, fontSize: '0.88rem' }}>Os dados não são vendidos, alugados ou compartilhados com terceiros para fins comerciais.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>4. Armazenamento e Segurança</h2>
          <p style={S.p}>Os dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. Adotamos boas práticas de segurança para proteger as informações contra acesso não autorizado, perda ou alteração.</p>
          <p style={{ ...S.p, marginBottom: 0 }}>Tokens de acesso da Meta são armazenados de forma segura e utilizados apenas para consultas à API autorizadas pelo usuário.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>5. Compartilhamento de Dados</h2>
          <p style={S.p}>Os dados dos usuários não são compartilhados com terceiros, exceto:</p>
          <ul style={{ ...S.ul, marginBottom: 0 }}>
            <li style={S.li}>Quando exigido por lei ou autoridade competente;</li>
            <li style={{ ...S.li, marginBottom: 0 }}>Com prestadores de serviços de infraestrutura essenciais ao funcionamento da plataforma (ex.: hospedagem, banco de dados), sob acordos de confidencialidade.</li>
          </ul>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>6. Integração com a Meta</h2>
          <p style={S.p}>Ao conectar sua conta, você concede permissões específicas que podem ser revogadas a qualquer momento diretamente nas configurações do Facebook em <a href="https://www.facebook.com/settings?tab=applications" style={S.a} target="_blank" rel="noopener noreferrer">facebook.com/settings</a>.</p>
          <p style={{ ...S.p, marginBottom: 0 }}>A Meta possui sua própria Política de Privacidade, disponível em <a href="https://www.facebook.com/policy.php" style={S.a} target="_blank" rel="noopener noreferrer">facebook.com/policy</a>.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>7. Direitos do Usuário (LGPD)</h2>
          <p style={S.p}>Em conformidade com a LGPD, o usuário tem direito a acessar, corrigir ou solicitar a exclusão de seus dados, bem como revogar o consentimento a qualquer momento.</p>
          <p style={{ ...S.p, marginBottom: 0 }}>Para exercer esses direitos, acesse nossa <a href="/exclusao-de-dados" style={S.a}>página de exclusão de dados</a> ou entre em contato pelo e-mail abaixo.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>8. Retenção de Dados</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>Os dados são mantidos enquanto a conta do usuário estiver ativa. Após a solicitação de exclusão, os dados são removidos em até 30 dias, exceto quando há obrigação legal de retenção.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>9. Alterações nesta Política</h2>
          <p style={{ ...S.p, marginBottom: 0 }}>Esta Política de Privacidade pode ser atualizada periodicamente. Alterações significativas serão comunicadas aos usuários pela plataforma.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>10. Contato</h2>
          <ul style={{ ...S.ul, listStyle: 'none', paddingLeft: 0, marginBottom: 0 }}>
            <li style={S.li}><strong>E-mail:</strong> <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a></li>
            <li style={{ ...S.li, marginBottom: 0 }}><strong>Website:</strong> <a href="https://assessorialp.com.br" style={S.a}>assessorialp.com.br</a></li>
          </ul>
        </div>

      </div>
    </div>
  )
}
