export const metadata = {
  title: 'Termos de Serviço | Assessoria LP',
  description: 'Termos de Serviço da plataforma Assessoria LP.',
}

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '60px 24px 80px', fontFamily: 'system-ui, sans-serif', color: '#1a1a2e', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Termos de Serviço</h1>
      <p style={{ color: '#6b7280', marginBottom: 40 }}>Última atualização: junho de 2025</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>1. Aceitação dos Termos</h2>
        <p>Ao acessar e utilizar a plataforma Assessoria LP ("Plataforma"), você concorda com estes Termos de Serviço. Se não concordar com qualquer parte destes termos, não utilize a Plataforma.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>2. Descrição do Serviço</h2>
        <p>A Assessoria LP oferece uma plataforma de gestão e análise de performance de mídia paga, integrando dados de plataformas como Meta Ads (Facebook e Instagram) para geração de relatórios, acompanhamento de campanhas e tomada de decisão estratégica.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>3. Uso da Conta Meta / Facebook</h2>
        <p>Para utilizar os recursos de integração com a Meta, você autoriza a Assessoria LP a acessar, em seu nome, os seguintes dados da sua conta de anúncios:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Informações de campanhas, conjuntos de anúncios e anúncios</li>
          <li>Métricas de performance (impressões, cliques, investimento, resultados)</li>
          <li>Informações da conta de anúncios vinculada</li>
        </ul>
        <p style={{ marginTop: 8 }}>Esses dados são utilizados exclusivamente para exibição de relatórios dentro da Plataforma e nunca são compartilhados com terceiros.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>4. Responsabilidades do Usuário</h2>
        <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso, pelo uso adequado da Plataforma e por garantir que as contas conectadas pertencem a você ou que você possui autorização para acessá-las.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>5. Privacidade e Dados</h2>
        <p>O tratamento dos seus dados é regido pela nossa <a href="/privacy" style={{ color: '#26c281', textDecoration: 'none', fontWeight: 600 }}>Política de Privacidade</a>. Ao utilizar a Plataforma, você consente com a coleta e uso dos dados conforme descrito nessa política.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>6. Limitação de Responsabilidade</h2>
        <p>A Assessoria LP não se responsabiliza por decisões tomadas com base nos dados exibidos na Plataforma, por interrupções nos serviços de terceiros (como a API da Meta), ou por perdas indiretas decorrentes do uso da Plataforma.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>7. Alterações nos Termos</h2>
        <p>Podemos atualizar estes Termos periodicamente. Alterações significativas serão comunicadas através da Plataforma. O uso continuado após as alterações implica na aceitação dos novos termos.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>8. Contato</h2>
        <p>Em caso de dúvidas sobre estes Termos, entre em contato pelo e-mail: <a href="mailto:ferramentas@assessorialp.com.br" style={{ color: '#26c281', textDecoration: 'none' }}>ferramentas@assessorialp.com.br</a></p>
      </section>
    </main>
  )
}
