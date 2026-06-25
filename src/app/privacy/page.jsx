export const metadata = {
  title: 'Política de Privacidade | Dash LP',
  description: 'Política de Privacidade da plataforma Dash LP.',
}

const S = {
  page:    { maxWidth: 780, margin: '0 auto', padding: '60px 24px 80px', fontFamily: 'system-ui, sans-serif', color: '#1a1a2e', lineHeight: 1.75 },
  h1:      { fontSize: '2rem', fontWeight: 800, marginBottom: 6 },
  date:    { color: '#6b7280', marginBottom: 44, display: 'block' },
  h2:      { fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, marginTop: 0 },
  section: { marginBottom: 32 },
  p:       { margin: '0 0 10px' },
  ul:      { paddingLeft: 22, margin: '8px 0' },
  li:      { marginBottom: 4 },
  a:       { color: '#26c281', textDecoration: 'none', fontWeight: 600 },
}

export default function PrivacyPage() {
  return (
    <main style={S.page}>
      <h1 style={S.h1}>Política de Privacidade – Dash LP</h1>
      <span style={S.date}>Última atualização: 25 de junho de 2026</span>

      <section style={S.section}>
        <h2 style={S.h2}>1. Introdução</h2>
        <p style={S.p}>O Dash LP está comprometido com a proteção da privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as informações obtidas durante o uso da plataforma.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>2. Dados Coletados</h2>
        <p style={S.p}>Ao utilizar o Dash LP e conectar sua conta da Meta, podemos coletar:</p>
        <ul style={S.ul}>
          <li style={S.li}>Nome e identificador da conta do Facebook;</li>
          <li style={S.li}>Dados de contas de anúncios autorizadas;</li>
          <li style={S.li}>Métricas de campanhas, conjuntos de anúncios e anúncios;</li>
          <li style={S.li}>Informações de acesso à plataforma (logs, IP, navegador).</li>
        </ul>
        <p style={{ ...S.p, marginTop: 10 }}>Não coletamos senhas, dados financeiros pessoais ou informações além do necessário para o funcionamento da plataforma.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>3. Uso dos Dados</h2>
        <p style={S.p}>Os dados coletados são utilizados exclusivamente para:</p>
        <ul style={S.ul}>
          <li style={S.li}>Autenticação e acesso à plataforma;</li>
          <li style={S.li}>Exibição de dashboards e relatórios de performance;</li>
          <li style={S.li}>Melhoria contínua das funcionalidades oferecidas;</li>
          <li style={S.li}>Suporte técnico ao usuário.</li>
        </ul>
        <p style={{ ...S.p, marginTop: 10 }}>Os dados não são vendidos, alugados ou compartilhados com terceiros para fins comerciais.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>4. Armazenamento e Segurança</h2>
        <p style={S.p}>Os dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. Adotamos boas práticas de segurança para proteger as informações contra acesso não autorizado, perda ou alteração.</p>
        <p style={S.p}>Tokens de acesso da Meta são armazenados de forma segura e utilizados apenas para consultas à API autorizadas pelo usuário.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>5. Compartilhamento de Dados</h2>
        <p style={S.p}>Os dados dos usuários não são compartilhados com terceiros, exceto:</p>
        <ul style={S.ul}>
          <li style={S.li}>Quando exigido por lei ou autoridade competente;</li>
          <li style={S.li}>Com prestadores de serviços de infraestrutura essenciais ao funcionamento da plataforma (ex.: hospedagem, banco de dados), sob acordos de confidencialidade.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>6. Integração com a Meta</h2>
        <p style={S.p}>O Dash LP utiliza as APIs oficiais da Meta. Ao conectar sua conta, você concede permissões específicas que podem ser revogadas a qualquer momento diretamente nas configurações da sua conta do Facebook em <a href="https://www.facebook.com/settings?tab=applications" style={S.a} target="_blank" rel="noopener noreferrer">facebook.com/settings</a>.</p>
        <p style={S.p}>A Meta possui sua própria Política de Privacidade, disponível em <a href="https://www.facebook.com/policy.php" style={S.a} target="_blank" rel="noopener noreferrer">facebook.com/policy</a>.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>7. Direitos do Usuário</h2>
        <p style={S.p}>Em conformidade com a LGPD, o usuário tem direito a:</p>
        <ul style={S.ul}>
          <li style={S.li}>Acessar seus dados armazenados;</li>
          <li style={S.li}>Corrigir dados incorretos ou desatualizados;</li>
          <li style={S.li}>Solicitar a exclusão de seus dados;</li>
          <li style={S.li}>Revogar o consentimento para uso dos dados a qualquer momento.</li>
        </ul>
        <p style={{ ...S.p, marginTop: 10 }}>Para exercer esses direitos, acesse nossa <a href="/data-deletion" style={S.a}>página de exclusão de dados</a> ou entre em contato pelo e-mail abaixo.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>8. Retenção de Dados</h2>
        <p style={S.p}>Os dados são mantidos enquanto a conta do usuário estiver ativa. Após a solicitação de exclusão, os dados são removidos em até 30 dias, exceto quando há obrigação legal de retenção.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>9. Alterações nesta Política</h2>
        <p style={S.p}>Esta Política de Privacidade pode ser atualizada periodicamente. Alterações significativas serão comunicadas aos usuários pela plataforma. O uso continuado após as alterações implica na aceitação da nova versão.</p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>10. Contato</h2>
        <p style={S.p}>Para dúvidas, solicitações ou exercício de direitos relacionados à privacidade:</p>
        <ul style={S.ul}>
          <li style={S.li}><strong>E-mail:</strong> <a href="mailto:ferramentas@assessorialp.com.br" style={S.a}>ferramentas@assessorialp.com.br</a></li>
          <li style={S.li}><strong>Website:</strong> <a href="https://assessorialp.com.br" style={S.a}>assessorialp.com.br</a></li>
        </ul>
      </section>
    </main>
  )
}
