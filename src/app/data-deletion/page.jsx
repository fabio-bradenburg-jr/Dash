export const metadata = {
  title: 'Exclusão de Dados | Dash LP',
  description: 'Solicite a exclusão dos seus dados na plataforma Dash LP.',
}

const S = {
  page:    { maxWidth: 680, margin: '0 auto', padding: '60px 24px 80px', fontFamily: 'system-ui, sans-serif', color: '#1a1a2e', lineHeight: 1.75 },
  h1:      { fontSize: '2rem', fontWeight: 800, marginBottom: 6 },
  date:    { color: '#6b7280', marginBottom: 44, display: 'block' },
  h2:      { fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, marginTop: 0 },
  section: { marginBottom: 32 },
  p:       { margin: '0 0 10px' },
  ul:      { paddingLeft: 22, margin: '8px 0' },
  li:      { marginBottom: 4 },
  a:       { color: '#26c281', textDecoration: 'none', fontWeight: 600 },
  box:     { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '20px 24px', marginTop: 24 },
  boxTitle:{ fontWeight: 700, marginBottom: 6, color: '#15803d' },
}

export default function DataDeletionPage() {
  return (
    <main style={S.page}>
      <h1 style={S.h1}>Exclusão de Dados</h1>
      <span style={S.date}>Dash LP – Assessoria LP</span>

      <section style={S.section}>
        <h2 style={S.h2}>Seus direitos</h2>
        <p style={S.p}>Você tem o direito de solicitar a exclusão de todos os seus dados pessoais armazenados pela plataforma Dash LP, incluindo os dados obtidos por meio da integração com sua conta do Facebook/Meta.</p>
        <p style={S.p}>Após a solicitação, seus dados serão removidos em até <strong>30 dias</strong>, exceto quando houver obrigação legal de retenção.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>O que será excluído</h2>
        <ul style={S.ul}>
          <li style={S.li}>Token de acesso à conta Meta/Facebook;</li>
          <li style={S.li}>Dados de perfil vinculados à sua conta;</li>
          <li style={S.li}>Histórico de acesso e dados de sessão;</li>
          <li style={S.li}>Dados de campanhas e métricas armazenados em cache.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Como solicitar a exclusão</h2>
        <p style={S.p}>Envie um e-mail para <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a> com o assunto <strong>"Exclusão de dados"</strong> informando:</p>
        <ul style={S.ul}>
          <li style={S.li}>Seu nome;</li>
          <li style={S.li}>E-mail cadastrado na plataforma;</li>
          <li style={S.li}>ID do Facebook (se aplicável).</li>
        </ul>

        <div style={S.box}>
          <div style={S.boxTitle}>📧 Contato para exclusão</div>
          <div><strong>E-mail:</strong> <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a></div>
          <div style={{ marginTop: 4 }}><strong>Assunto:</strong> Exclusão de dados</div>
          <div style={{ marginTop: 4 }}><strong>Prazo de resposta:</strong> até 30 dias</div>
        </div>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Revogar acesso à conta Meta</h2>
        <p style={S.p}>Você também pode revogar o acesso do Dash LP à sua conta do Facebook diretamente nas configurações da Meta, sem precisar entrar em contato conosco:</p>
        <ul style={S.ul}>
          <li style={S.li}>Acesse <a href="https://www.facebook.com/settings?tab=applications" style={S.a} target="_blank" rel="noopener noreferrer">facebook.com/settings → Aplicativos e sites</a></li>
          <li style={S.li}>Localize <strong>Dash LP</strong> na lista</li>
          <li style={S.li}>Clique em <strong>Remover</strong></li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Dúvidas</h2>
        <p style={S.p}>Para mais informações, consulte nossa <a href="/privacy" style={S.a}>Política de Privacidade</a> ou entre em contato pelo e-mail <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a>.</p>
      </section>
    </main>
  )
}
