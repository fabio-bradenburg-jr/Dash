'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './page.module.css'

const NAV_SECTIONS = [
  { id: 'hero',          label: 'Início' },
  { id: 'como-funciona', label: 'Jornada' },
  { id: 'metodo-5ps',   label: '5 P\'s' },
  { id: 'etapas',       label: 'Etapas' },
  { id: 'planejamento', label: 'Planejamento' },
  { id: 'anuncios',     label: 'Anúncios' },
  { id: 'qualificacao', label: 'Qualificação' },
  { id: 'gestao-leads', label: 'Leads' },
  { id: 'atendimento',  label: 'Atendimento' },
  { id: 'venda',        label: 'Venda' },
  { id: 'funil',        label: 'Funil' },
  { id: 'comprometimento', label: 'Comprometimento' },
  { id: 'briefing',     label: 'Briefing' },
  { id: 'checklist',    label: 'Checklist' },
  { id: 'lembre-se',    label: 'Lembre-se' },
  { id: 'final',        label: 'Conclusão' },
]

const JOURNEY_STEPS = [
  { label: 'Apresentação',             done: true },
  { label: 'Assinatura do Contrato',   done: true },
  { label: 'Reunião de Integração',    current: true },
  { label: 'Processo Comercial',       done: false },
  { label: 'Início dos Anúncios',      done: false },
  { label: 'Consultoria Mensal',       done: false },
]

const FIVE_PS = [
  { icon: 'bx-target-lock',    title: 'Planejamento Estratégico', desc: 'Definimos público, produto, estratégia e metas antes de qualquer ação.' },
  { icon: 'bx-git-branch',     title: 'Processos Comerciais',     desc: 'Scripts, fluxos e CRM para transformar leads em vendas de forma previsível.' },
  { icon: 'bxs-group',         title: 'Potenciais Clientes',      desc: 'Captação ativa de leads qualificados com anúncios e formulários filtrados.' },
  { icon: 'bx-bar-chart-alt-2',title: 'PAC',                      desc: 'Controle de performance com indicadores claros e ações de melhoria contínua.' },
  { icon: 'bx-receipt',        title: 'Prestação de Contas',      desc: 'Relatórios e reuniões mensais para transparência total nos resultados.' },
]

const METHOD_STEPS = [
  { code: 'P1', label: 'Planejamento',          color: '#26c281' },
  { code: 'P2', label: 'Qualificação',          color: '#4fdf9b' },
  { code: 'P2', label: 'Atendimento',           color: '#4fdf9b' },
  { code: 'P2', label: 'Venda & Retenção',      color: '#4fdf9b' },
  { code: 'P3', label: 'Anúncios que Convertem',color: '#26c281' },
  { code: 'P3', label: 'Gestão dos Leads',      color: '#26c281' },
  { code: 'P4', label: 'Controle do Funil',     color: '#1ba86d' },
]

const FUNNEL_DATA = [
  { label: 'Leads',              value: 100, pct: 100 },
  { label: 'Negócios Iniciados', value: 30,  pct: 30 },
  { label: 'Orçamentos',         value: 15,  pct: 15 },
  { label: 'Vendas',             value: 3,   pct: 3 },
]

const BRIEFING_QUESTIONS = [
  'Quais produtos ou serviços queremos priorizar?',
  'Quem é o público ideal?',
  'Quais dores esse público sente?',
  'Quais objeções aparecem antes da compra?',
  'Quais diferenciais tornam a empresa mais competitiva?',
]

const CHECKLIST_ITEMS = [
  'Acesso ao Meta Ads, Google Ads, etc.',
  'Acesso do Instagram: login e senha',
  'Lista de clientes',
  'Materiais da marca, como logomarca',
  'Pasta no Drive com vídeos e imagens',
  'Número de WhatsApp Business da empresa',
  'Nome, número e código do cartão virtual para créditos dos anúncios',
]

const FAKE_LEADS = [
  { nome: 'Carlos Mendes',  origem: 'Instagram', hora: '09:14', status: 'Novo',           etapa: 'Recebido' },
  { nome: 'Ana Paula S.',   origem: 'Facebook',  hora: '10:02', status: 'Em atendimento', etapa: 'Qualificado' },
  { nome: 'Roberto Lima',   origem: 'Instagram', hora: '11:37', status: 'Proposta',        etapa: 'Orçamento' },
  { nome: 'Mariana Costa',  origem: 'Google',    hora: '13:22', status: 'Fechado',         etapa: 'Venda' },
]

export default function IntegracaoPage() {
  const [activeSection, setActiveSection] = useState('hero')
  const [navOpen, setNavOpen] = useState(false)
  const sectionRefs = useRef({})

  useEffect(() => {
    const observers = []
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.35 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setNavOpen(false)
  }

  return (
    <div className={styles.root}>
      {/* Sticky side nav */}
      <nav className={styles.sideNav}>
        {NAV_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            className={`${styles.navDot} ${activeSection === id ? styles.navDotActive : ''}`}
            onClick={() => scrollTo(id)}
            title={label}
          >
            <span className={styles.navDotInner} />
            <span className={styles.navLabel}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile top nav */}
      <div className={styles.mobileNav}>
        {NAV_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            className={`${styles.mobileNavItem} ${activeSection === id ? styles.mobileNavItemActive : ''}`}
            onClick={() => scrollTo(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <main className={styles.main}>

        {/* 1 — HERO */}
        <section id="hero" className={`${styles.section} ${styles.sectionHero}`}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>MÉTODO LP</span>
            <h1 className={styles.heroTitle}>Integração<br /><span className={styles.green}>Método LP</span></h1>
            <p className={styles.heroSub}>A partir daqui, aceleramos seu crescimento.</p>
            <p className={styles.heroDesc}>
              Você está entrando em uma máquina comercial completa, criada para gerar demanda, organizar leads e transformar oportunidades em vendas.
            </p>
            <button className={styles.ctaBtn} onClick={() => scrollTo('como-funciona')}>
              Começar integração <i className="bx bx-chevron-down" />
            </button>
          </div>
        </section>

        {/* 2 — JORNADA */}
        <section id="como-funciona" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>JORNADA</span>
            <h2 className={styles.sectionTitle}>Como funciona a partir de agora</h2>
            <p className={styles.sectionSub}>Você está entrando em uma máquina comercial completa.</p>
          </div>
          <div className={styles.journey}>
            {JOURNEY_STEPS.map((step, i) => (
              <div key={i} className={`${styles.journeyStep} ${step.current ? styles.journeyStepCurrent : ''} ${step.done ? styles.journeyStepDone : ''}`}>
                <div className={styles.journeyDot}>
                  {step.done ? <i className="bx bx-check" /> : step.current ? <i className="bx bx-radio-circle-marked" /> : <span>{i + 1}</span>}
                </div>
                {i < JOURNEY_STEPS.length - 1 && <div className={styles.journeyLine} />}
                <div className={styles.journeyLabel}>
                  {step.current && <span className={styles.journeyYouAreHere}>Você está aqui</span>}
                  <span>{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 — MÉTODO 5 P'S */}
        <section id="metodo-5ps" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>MÉTODO</span>
            <h2 className={styles.sectionTitle}>Os 5 P's</h2>
          </div>
          <div className={styles.fivePs}>
            {FIVE_PS.map((p, i) => (
              <div key={i} className={styles.pCard}>
                <div className={styles.pCardIcon}><i className={`bx ${p.icon}`} /></div>
                <h3 className={styles.pCardTitle}>{p.title}</h3>
                <p className={styles.pCardDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — ETAPAS DO MÉTODO */}
        <section id="etapas" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>PROCESSO</span>
            <h2 className={styles.sectionTitle}>As Etapas do Método</h2>
            <p className={styles.sectionSub}>O método é um processo, não uma ação isolada.</p>
          </div>
          <div className={styles.methodSteps}>
            {METHOD_STEPS.map((s, i) => (
              <div key={i} className={styles.methodStep}>
                <div className={styles.methodStepCode} style={{ borderColor: s.color, color: s.color }}>{s.code}</div>
                <div className={styles.methodStepLine} />
                <div className={styles.methodStepLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 5 — PLANEJAMENTO */}
        <section id="planejamento" className={styles.section}>
          <div className={styles.twoCol}>
            <div className={styles.twoColText}>
              <span className={styles.sectionTag}>P1</span>
              <h2 className={styles.sectionTitle}>Planejamento</h2>
              <p className={styles.bodyText}>Definimos:</p>
              <ul className={styles.greenList}>
                <li>Público certo</li>
                <li>Produto/serviço foco</li>
                <li>Estratégia de comunicação</li>
                <li>Dores e objeções</li>
                <li>Metas e indicadores</li>
              </ul>
            </div>
            <div className={styles.impactCard}>
              <i className="bx bx-bulb" style={{ fontSize: 40, color: '#26c281', marginBottom: 16 }} />
              <p className={styles.impactText}>"Anunciar sem estratégia é rasgar dinheiro."</p>
            </div>
          </div>
        </section>

        {/* 6 — ANÚNCIOS */}
        <section id="anuncios" className={styles.section}>
          <div className={styles.twoCol}>
            <div className={styles.twoColText}>
              <span className={styles.sectionTag}>P3</span>
              <h2 className={styles.sectionTitle}>Anúncios que Convertem</h2>
              <p className={styles.bodyText}>Anúncios criados para atrair quem realmente pode comprar.</p>
              <p className={styles.bodyText} style={{ marginTop: 8, opacity: 0.6 }}>O que fazemos:</p>
              <ul className={styles.greenList}>
                <li>Textos com foco em conversão</li>
                <li>Material em imagem e vídeo</li>
                <li>Segmentação precisa</li>
                <li>Testes e otimizações contínuos</li>
              </ul>
            </div>
            <div className={styles.adVisual}>
              <div className={styles.adCard}>
                <div className={styles.adCardTag}><i className="bx bxs-megaphone" /> ANÚNCIO ATIVO</div>
                <div className={styles.adCardBar} style={{ width: '82%' }}><span>CTR</span><strong>8,2%</strong></div>
                <div className={styles.adCardBar} style={{ width: '64%' }}><span>Conv.</span><strong>6,4%</strong></div>
                <div className={styles.adCardBar} style={{ width: '91%', background: 'rgba(38,194,129,0.18)' }}><span>Qualif.</span><strong>91%</strong></div>
              </div>
            </div>
          </div>
        </section>

        {/* 7 — QUALIFICAÇÃO */}
        <section id="qualificacao" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P2</span>
            <h2 className={styles.sectionTitle}>Qualificação por Formulário</h2>
          </div>
          <div className={styles.qualGrid}>
            <div className={styles.qualCard}>
              <i className="bx bx-filter-alt" style={{ fontSize: 32, color: '#26c281' }} />
              <h3>Filtragem automática</h3>
              <p>Filtramos automaticamente quem tem real intenção de compra.</p>
            </div>
            <div className={styles.qualCard}>
              <i className="bx bxs-user-check" style={{ fontSize: 32, color: '#26c281' }} />
              <h3>Resultado</h3>
              <p>Leads mais preparados e comerciais mais eficientes.</p>
            </div>
            <div className={styles.qualCard}>
              <i className="bx bx-question-mark" style={{ fontSize: 32, color: '#26c281' }} />
              <h3>Como funciona</h3>
              <p>As perguntas do formulário separam curiosos de potenciais compradores.</p>
            </div>
          </div>
        </section>

        {/* 8 — GESTÃO DE LEADS */}
        <section id="gestao-leads" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P3</span>
            <h2 className={styles.sectionTitle}>Gestão dos Leads — PGL</h2>
            <p className={styles.sectionSub}>Todos os leads organizados em um único lugar para que nada seja perdido.</p>
          </div>
          <div className={styles.crmCard}>
            <div className={styles.crmHeader}>
              <span>Nome</span>
              <span>Origem</span>
              <span>Horário</span>
              <span>Status</span>
              <span>Etapa</span>
            </div>
            {FAKE_LEADS.map((lead, i) => (
              <div key={i} className={styles.crmRow}>
                <span className={styles.crmName}>{lead.nome}</span>
                <span className={styles.crmBadge}>{lead.origem}</span>
                <span className={styles.crmMuted}>{lead.hora}</span>
                <span className={`${styles.crmStatus} ${styles[`crmStatus_${lead.status.replace(' ','_')}`]}`}>{lead.status}</span>
                <span className={styles.crmMuted}>{lead.etapa}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 9 — ATENDIMENTO */}
        <section id="atendimento" className={styles.section}>
          <div className={styles.twoCol}>
            <div className={styles.twoColText}>
              <span className={styles.sectionTag}>P2</span>
              <h2 className={styles.sectionTitle}>Atendimento</h2>
              <p className={styles.bodyText}>O comercial recebe o lead e segue um processo claro.</p>
              <ul className={styles.greenList}>
                <li>Responder rápido</li>
                <li>Seguir o script</li>
                <li>Conduzir o cliente até a proposta</li>
              </ul>
            </div>
            <div className={styles.impactCard}>
              <i className="bx bx-message-dots" style={{ fontSize: 40, color: '#26c281', marginBottom: 16 }} />
              <p className={styles.impactText}>"Lead bom precisa de atendimento rápido e processo comercial bem executado."</p>
            </div>
          </div>
        </section>

        {/* 10 — VENDA E RETENÇÃO */}
        <section id="venda" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P2</span>
            <h2 className={styles.sectionTitle}>Venda e Retenção</h2>
            <p className={styles.sectionSub}>Venda é método: CRM, follow-up, proposta e fechamento.</p>
          </div>
          <div className={styles.vendaGrid}>
            <div className={styles.vendaHighlight}>
              <span className={styles.vendaBig}>90%</span>
              <span className={styles.vendaLabel}>das empresas não faz isso</span>
            </div>
            <div className={styles.vendaSteps}>
              {['CRM atualizado', 'Follow-up estruturado', 'Proposta clara', 'Fechamento ativo', 'Acompanhamento pós-venda', 'Fidelização do cliente'].map((item, i) => (
                <div key={i} className={styles.vendaStep}>
                  <i className="bx bx-check-circle" style={{ color: '#26c281' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11 — CONTROLE DO FUNIL */}
        <section id="funil" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P4</span>
            <h2 className={styles.sectionTitle}>Controle do Funil</h2>
          </div>
          <div className={styles.funnelWrap}>
            <div className={styles.funnelViz}>
              {FUNNEL_DATA.map((item, i) => (
                <div key={i} className={styles.funnelBar}>
                  <div className={styles.funnelBarInner} style={{ width: `${item.pct}%` }}>
                    <span className={styles.funnelBarLabel}>{item.label}</span>
                    <span className={styles.funnelBarValue}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.funnelInfo}>
              <p className={styles.bodyText}>O que você precisa garantir:</p>
              <ul className={styles.greenList}>
                <li>Agilidade no atendimento</li>
                <li>Uso diário do CRM</li>
                <li>Participar das reuniões</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 12 — COMPROMETIMENTO */}
        <section id="comprometimento" className={`${styles.section} ${styles.sectionDark}`}>
          <div className={styles.commitWrap}>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>Mas tudo isso só vai funcionar...</h2>
            <div className={styles.commitHighlight}>com seu comprometimento!</div>
            <p className={styles.bodyText} style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto', opacity: 0.7 }}>
              O método entrega estrutura, processo e direção. Mas o resultado depende da execução conjunta entre LP e cliente.
            </p>
          </div>
        </section>

        {/* 13 — BRIEFING */}
        <section id="briefing" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>BRIEFING</span>
            <h2 className={styles.sectionTitle}>Dores e Desafios</h2>
            <p className={styles.sectionSub}>Vamos entender seus principais desafios comerciais, objeções e diferenciais.</p>
          </div>
          <div className={styles.briefingCards}>
            {BRIEFING_QUESTIONS.map((q, i) => (
              <div key={i} className={styles.briefingCard}>
                <span className={styles.briefingNum}>{String(i + 1).padStart(2, '0')}</span>
                <p>{q}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 14 — CHECKLIST */}
        <section id="checklist" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>START</span>
            <h2 className={styles.sectionTitle}>Checklist para Início dos Anúncios</h2>
          </div>
          <div className={styles.checklistWrap}>
            {CHECKLIST_ITEMS.map((item, i) => (
              <div key={i} className={styles.checklistItem}>
                <span className={styles.checkBox}><i className="bx bx-square" /></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 15 — LEMBRE-SE */}
        <section id="lembre-se" className={`${styles.section} ${styles.sectionAccent}`}>
          <div className={styles.rememberWrap}>
            <i className="bx bx-bell" style={{ fontSize: 48, color: '#26c281' }} />
            <h2 className={styles.sectionTitle}>Lembre-se</h2>
            <p className={styles.bodyText}>
              Logo após a reunião finalizar, será enviado esse mesmo checklist para o start dos anúncios.
            </p>
            <div className={styles.rememberHighlight}>
              Quanto antes você finalizar o checklist, antes os anúncios poderão ir ao ar.
            </div>
          </div>
        </section>

        {/* 16 — FINAL */}
        <section id="final" className={`${styles.section} ${styles.sectionFinal}`}>
          <div className={styles.finalGlow} />
          <div className={styles.finalContent}>
            <span className={styles.heroBadge}>MÉTODO LP</span>
            <h2 className={styles.finalTitle}>
              Agora começa sua jornada de crescimento com<br />
              <span className={styles.green}>previsibilidade e processo.</span>
            </h2>
            <p className={styles.heroSub}>Bem-vindo ao Método LP.</p>
            <button className={styles.ctaBtn} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <i className="bx bx-check-circle" /> Finalizar integração
            </button>
          </div>
        </section>

      </main>
    </div>
  )
}
