export const metadata = {
  title: 'Exclusão de Dados do Usuário | Dash LP',
  description: 'Saiba como solicitar a exclusão dos seus dados na plataforma Dash LP.',
}

const S = {
  page:    { maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px', fontFamily: 'system-ui, sans-serif', color: '#1a1a2e', lineHeight: 1.8 },
  h1:      { fontSize: '1.9rem', fontWeight: 800, marginBottom: 6 },
  date:    { color: '#6b7280', marginBottom: 40, display: 'block', fontSize: '0.9rem' },
  h2:      { fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, marginTop: 0 },
  section: { marginBottom: 34 },
  p:       { margin: '0 0 10px' },
  ul:      { paddingLeft: 22, margin: '8px 0' },
  ol:      { paddingLeft: 22, margin: '8px 0' },
  li:      { marginBottom: 5 },
  a:       { color: '#26c281', textDecoration: 'none', fontWeight: 600 },
  box:     { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', margin: '16px 0' },
  strong:  { fontWeight: 700 },
}

export default function ExclusaoDeDadosPage() {
  return (
    <main style={S.page}>
      <h1 style={S.h1}>Exclusão de Dados do Usuário – Dash LP</h1>
      <span style={S.date}>Última atualização: 25 de junho de 2026</span>

      <section style={S.section}>
        <p style={S.p}>O <strong style={S.strong}>Dash LP</strong> é uma plataforma que permite a conexão de contas do Facebook e outros serviços da Meta para a centralização de métricas e informações em dashboards e relatórios.</p>
        <p style={S.p}>Respeitamos a privacidade dos usuários e garantimos o direito de solicitar a exclusão dos dados armazenados em nossa plataforma.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Como solicitar a exclusão dos dados</h2>
        <p style={S.p}>Para solicitar a exclusão dos seus dados, envie um e-mail para:</p>
        <div style={S.box}>
          <p style={{ ...S.p, marginBottom: 6 }}><strong style={S.strong}>E-mail:</strong> <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a></p>
          <p style={{ ...S.p, marginBottom: 0 }}><strong style={S.strong}>Assunto:</strong> Solicitação de Exclusão de Dados – Dash LP</p>
        </div>
        <p style={{ ...S.p, marginTop: 12 }}>Na solicitação, informe:</p>
        <ul style={S.ul}>
          <li style={S.li}>Nome completo;</li>
          <li style={S.li}>E-mail utilizado no cadastro;</li>
          <li style={S.li}>Página, conta de anúncios ou perfil conectado (se aplicável).</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>O que será excluído</h2>
        <p style={S.p}>Após a confirmação da solicitação, o Dash LP realizará a exclusão de:</p>
        <ul style={S.ul}>
          <li style={S.li}>Dados de cadastro armazenados na plataforma;</li>
          <li style={S.li}>Tokens de autenticação do Facebook e Meta;</li>
          <li style={S.li}>Informações de integração e sincronização;</li>
          <li style={S.li}>Dados utilizados para a geração de dashboards e relatórios.</li>
        </ul>
        <p style={{ ...S.p, marginTop: 10 }}>Algumas informações poderão ser mantidas temporariamente quando exigidas por lei, por questões de segurança ou prevenção a fraudes.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Prazo de processamento</h2>
        <p style={S.p}>As solicitações de exclusão serão processadas em até <strong style={S.strong}>30 dias</strong> após a validação da identidade do solicitante.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Remoção do aplicativo pelo Facebook</h2>
        <p style={S.p}>O usuário também pode remover o acesso do aplicativo diretamente pelo Facebook:</p>
        <ol style={S.ol}>
          <li style={S.li}>Acesse <strong style={S.strong}>Configurações e Privacidade</strong>;</li>
          <li style={S.li}>Clique em <strong style={S.strong}>Configurações</strong>;</li>
          <li style={S.li}>Entre em <strong style={S.strong}>Aplicativos e Sites</strong>;</li>
          <li style={S.li}>Localize <strong style={S.strong}>Dash LP</strong>;</li>
          <li style={S.li}>Clique em <strong style={S.strong}>Remover</strong>.</li>
        </ol>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Contato</h2>
        <ul style={{ ...S.ul, listStyle: 'none', paddingLeft: 0 }}>
          <li style={S.li}><strong style={S.strong}>Aplicativo:</strong> Dash LP</li>
          <li style={S.li}><strong style={S.strong}>E-mail:</strong> <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a></li>
          <li style={S.li}><strong style={S.strong}>Website:</strong> <a href="https://assessorialp.com.br" style={S.a}>assessorialp.com.br</a></li>
        </ul>
      </section>
    </main>
  )
}
