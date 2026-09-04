'use client'
import styles from './page.module.css'

/* ─────────────────────────────────────────────────────────────
   Conteúdo alinhado ao Contrato de Prestação de Assessoria
   Comercial — PLANO PERFORMANCE | MÉTODO LP.
   As cláusulas citadas nos comentários são só referência de
   manutenção; nada disso aparece na tela.
   ───────────────────────────────────────────────────────────── */

const JOURNEY_STEPS = [
  { label: 'Apresentação',                             done: true },
  { label: 'Assinatura do contrato',                   done: true },
  { label: 'Reunião de integração',                    current: true },
  { label: 'Entrega de acessos e materiais' },
  { label: 'Ativação da 1ª campanha de leads' },
  { label: 'Rotina contínua' },
]

const FOUR_PS = [
  { icon: 'bx-target-lock', title: 'Planejamento Estratégico', desc: 'Diagnóstico da oferta, do público-alvo e do canal prioritário antes de qualquer campanha.' },
  { icon: 'bx-git-branch',  title: 'Processos Comerciais',     desc: 'Scripts, funil e CRM estruturados para sustentar o atendimento e a conversão.' },
  { icon: 'bxs-group',      title: 'Potenciais Clientes',      desc: 'Tráfego pago e anúncios em Meta Ads ou Google Ads para gerar contatos qualificados.' },
  { icon: 'bx-receipt',     title: 'Prestação de Contas',      desc: 'Relatório semanal dos indicadores e reunião mensal de resultados e próximos passos.' },
]

// Entregáveis expressamente incluídos no pacote PERFORMANCE (cláusula 1.3)
const DELIVERABLES = [
  { icon: 'bx-target-lock',    title: 'Planejamento da aquisição',    desc: 'Diagnóstico inicial da oferta, do público-alvo e do canal prioritário, com definição das premissas das campanhas.' },
  { icon: 'bx-broadcast',      title: 'Tráfego pago',                 desc: 'Criação, ativação, gestão e otimização contínua de campanhas em Meta Ads ou Google Ads, conforme o canal definido.' },
  { icon: 'bx-photo-album',    title: 'Desenvolvimento de anúncios',  desc: 'Criação das peças e textos publicitários das campanhas, a partir dos materiais e aprovações enviados por você.' },
  { icon: 'bx-line-chart',     title: 'Relatórios semanais',          desc: 'Síntese semanal dos indicadores: investimento, contatos ou leads e custo por resultado.' },
  { icon: 'bx-calendar-check', title: 'Reuniões mensais',             desc: 'Uma reunião por mês para apresentar resultados, analisar aprendizados e alinhar as ações seguintes.' },
  { icon: 'bx-chat',           title: 'Scripts de vendas',            desc: 'Roteiros de abordagem, qualificação, follow-up, contorno de objeções e fechamento.' },
  { icon: 'bx-user-voice',     title: 'Treinamento comercial',        desc: 'Capacitação do time para aplicar os scripts, usar o processo e evoluir a rotina comercial.' },
  { icon: 'bx-collection',     title: 'CRM',                          desc: 'Implantação e organização do CRM: funil, etapas, campos essenciais e orientação de uso.' },
]

// Fora do escopo, salvo contratação por aditivo (1.4)
const OUT_OF_SCOPE = [
  { icon: 'bx-code-alt', label: 'Site ou landing page' },
  { icon: 'bx-like',     label: 'Gestão de redes sociais' },
  { icon: 'bx-bot',      label: 'Automações e soluções de IA' },
]

// Custos pagos diretamente pela empresa (1.5 e 5.4)
const CLIENT_COSTS = [
  'Investimento em mídia',
  'Licenças e assinaturas de software',
  'Domínio e hospedagem',
]

const METHOD_STEPS = [
  { code: 'P1', label: 'Planejamento da aquisição',                color: '#26c281' },
  { code: 'P2', label: 'Processos comerciais: scripts, funil e CRM', color: '#4fdf9b' },
  { code: 'P3', label: 'Anúncios e tráfego pago',                  color: '#26c281' },
  { code: 'P3', label: 'Qualificação dos leads',                    color: '#26c281' },
  { code: 'P4', label: 'Relatório semanal e reunião mensal',       color: '#4fdf9b' },
]

// Prestação de contas e atendimento (1.3.4, 1.3.5 e 4.5)
const CADENCE = [
  {
    icon: 'bx-line-chart', tag: 'SEMANAL', title: 'Relatório semanal',
    items: ['Investimento do período', 'Contatos ou leads gerados', 'Custo por resultado'],
  },
  {
    icon: 'bx-calendar-check', tag: 'MENSAL', title: 'Reunião de resultados',
    items: ['Resultados do período anterior', 'Análise dos aprendizados', 'Ações do período seguinte'],
  },
  {
    icon: 'bxl-whatsapp', tag: 'DIA A DIA', title: 'Canal de atendimento',
    items: ['WhatsApp ou canal acordado', 'Dias úteis, em horário comercial'],
  },
]

// Obrigações da CONTRATANTE (3.1)
const CLIENT_DUTIES = [
  'Enviar informações, acessos, materiais e aprovações em tempo hábil',
  'Participar das reuniões e colaborar com a implantação dos processos',
  'Garantir a veracidade e a titularidade dos conteúdos e materiais enviados',
  'Manter os acessos às plataformas atualizados e avisar sobre bloqueios',
  'Realizar as vendas, o atendimento e o acompanhamento dos potenciais clientes',
  'Pagar diretamente a mídia, as licenças e os serviços de terceiros',
]

const FUNNEL_DATA = [
  { label: 'Leads',              value: 100, pct: 100 },
  { label: 'Negócios Iniciados', value: 30,  pct: 30 },
  { label: 'Orçamentos',         value: 15,  pct: 15 },
  { label: 'Vendas',             value: 3,   pct: 3 },
]

const BRIEFING_QUESTIONS = [
  'Produtos e Serviços',
  'Público-alvo e Mercado',
  'Marketing e Comunicação',
  'Vendas e Comercial',
  'Finanças e Metas',
  'Dores e Desafios',
]

const CHECKLIST_ITEMS = [
  'Acesso ao Meta Ads (e ao Google Ads, se for o canal definido)',
  'Acesso do Instagram: login e senha',
  'Acesso ao CRM atual, se já houver um em uso',
  'Lista de clientes',
  'Materiais da marca, como logomarca',
  'Pasta no Drive com vídeos e imagens',
  'Número de WhatsApp Business da empresa',
  'Nome, número e código do cartão virtual para créditos dos anúncios',
]

// Campaign metrics card — update values here, UI renders automatically
const CAMPAIGN_METRICS = [
  { label: 'Investimento',  value: 'R$ 7.131,99' },
  { label: 'Impressões',    value: '206.903'      },
  { label: 'Cliques',       value: '5.340'        },
  { label: 'CTR',           value: '0,55%'        },
  { label: 'Leads',         value: '553'          },
]

const FAKE_LEADS = [
  { nome: 'Carlos Mendes', origem: 'Instagram', hora: '09:14', status: 'Novo',           p1: 'Sim, vi pelo feed',       p2: 'Precisa de resultado rápido'     },
  { nome: 'Ana Paula S.',  origem: 'Facebook',  hora: '10:02', status: 'Em atendimento', p1: 'Não, indicação de amigo', p2: 'Quer escalar o faturamento'      },
  { nome: 'Roberto Lima',  origem: 'Instagram', hora: '11:37', status: 'Proposta',        p1: 'Sim, acompanha há meses', p2: 'Já tem equipe de vendas'         },
  { nome: 'Mariana Costa', origem: 'Google',    hora: '13:22', status: 'Fechado',         p1: 'Não, pesquisou no Google', p2: 'Busca previsibilidade de receita' },
]

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function Integracao2Page() {
  return (
    <div className={styles.root}>
      <main className={styles.main}>

        {/* 1 — HERO */}
        <section id="hero" className={`${styles.section} ${styles.sectionHero}`}>
          <div className={styles.heroGlow} />
          <div className={styles.ledRing} />

          {/* Left: text */}
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>PROJETO PERFORMANCE · MÉTODO LP</span>
            <h1 className={styles.heroTitle}>Integração<br /><span className={styles.green}>Método LP</span></h1>
            <p className={styles.heroSub}>A partir daqui, aceleramos seu crescimento.</p>
            <button className={styles.ctaBtn} onClick={() => scrollTo('como-funciona')}>
              Começar integração <i className="bx bx-chevron-down" />
            </button>
          </div>

          {/* Right: LP bird logo LED */}
          <div className={styles.heroVisual}>
            <div className={styles.lpLogoWrap}>
              {/* Background panel */}
              <div className={styles.lpBg} />
              {/* Outer LED ring */}
              <div className={styles.lpRing} />
              {/* Inner counter-spinning ring */}
              <div className={styles.lpRingInner} />
              {/* Corner dots */}
              <div className={styles.lpCorner} />
              <div className={styles.lpCorner} />
              <div className={styles.lpCorner} />
              <div className={styles.lpCorner} />
              {/* Glow center */}
              <div className={styles.lpGlowCenter} />

              {/* Circuit lines behind logo */}
              <svg className={styles.lpCircuit} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="trailGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <path d="M 44 185 H 90 V 135 H 118" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
                <path d="M 44 215 H 90 V 268 H 118" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
                <path d="M 356 148 H 316 V 95  H 284" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
                <path d="M 356 258 H 316 V 312 H 284" stroke="rgba(38,194,129,0.22)" strokeWidth="1.5" />
                <path d="M 198 44  V 90  H 248 V 110" stroke="rgba(38,194,129,0.16)" strokeWidth="1.5" />
                <path d="M 198 356 V 310 H 248 V 292" stroke="rgba(38,194,129,0.16)" strokeWidth="1.5" />
                <circle cx="118" cy="135" r="3.5" fill="rgba(38,194,129,0.45)" />
                <circle cx="118" cy="268" r="3.5" fill="rgba(38,194,129,0.45)" />
                <circle cx="284" cy="95"  r="3.5" fill="rgba(38,194,129,0.45)" />
                <circle cx="284" cy="312" r="3.5" fill="rgba(38,194,129,0.45)" />
                <circle cx="248" cy="110" r="3"   fill="rgba(38,194,129,0.3)" />
                <circle cx="248" cy="292" r="3"   fill="rgba(38,194,129,0.3)" />
                <path className={styles.lpTrail1}
                  d="M 44 185 H 90 V 135 H 118"
                  stroke="#26c281" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray="200" strokeDashoffset="200" filter="url(#trailGlow)" />
                <path className={styles.lpTrail2}
                  d="M 356 148 H 316 V 95 H 284"
                  stroke="#4ade80" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray="200" strokeDashoffset="200" filter="url(#trailGlow)" />
                <path className={styles.lpTrail3}
                  d="M 198 356 V 310 H 248 V 292"
                  stroke="#26c281" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray="160" strokeDashoffset="160" filter="url(#trailGlow)" />
              </svg>

              {/* Actual LP bird logo on top */}
              <img src="/assessoria-lp-logo.png" alt="Assessoria LP" className={styles.lpLogoImg} />
            </div>
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
        <section id="metodo-4ps" className={`${styles.section} ${styles.sectionWide}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>MÉTODO</span>
            <h2 className={styles.sectionTitle}>Os 4 P&apos;s</h2>
            <p className={styles.sectionSub}>Aplicados na extensão necessária aos entregáveis incluídos no projeto Performance.</p>
          </div>
          <div className={styles.psGrid}>
            {FOUR_PS.map((p, i) => (
              <div key={i} className={`${styles.pCard} ${styles.ledCard}`}>
                <div className={styles.pCardIcon}><i className={`bx ${p.icon}`} /></div>
                <h3 className={styles.pCardTitle}>{p.title}</h3>
                <p className={styles.pCardDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — ENTREGÁVEIS DO PLANO */}
        <section id="entregaveis" className={`${styles.section} ${styles.sectionWide}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>ESCOPO</span>
            <h2 className={styles.sectionTitle}>O que está incluído no seu projeto</h2>
          </div>
          <div className={styles.deliverGrid}>
            {DELIVERABLES.map((d) => (
              <div key={d.title} className={`${styles.deliverCard} ${styles.ledCard}`}>
                <div className={styles.deliverHead}>
                  <span className={styles.deliverIcon}><i className={`bx ${d.icon}`} /></span>
                </div>
                <h3 className={styles.deliverTitle}>{d.title}</h3>
                <p className={styles.deliverDesc}>{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5 — FORA DO ESCOPO */}
        <section id="fora-do-escopo" className={`${styles.section} ${styles.sectionDark}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>TRANSPARÊNCIA</span>
            <h2 className={styles.sectionTitle}>O que não está incluído</h2>
            <p className={styles.sectionSub}>Tudo aqui pode ser contratado por aditivo.</p>
          </div>
          <div className={styles.scopeWrap}>
            <div className={styles.scopeGrid}>
              {OUT_OF_SCOPE.map((s, i) => (
                <div key={i} className={styles.scopeCard}>
                  <i className={`bx ${s.icon}`} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.scopeCosts}>
              <p className={styles.scopeCostsTitle}>Custos pagos diretamente pela sua empresa</p>
              <div className={styles.scopeChips}>
                {CLIENT_COSTS.map((c, i) => <span key={i} className={styles.scopeChip}>{c}</span>)}
              </div>
            </div>
          </div>
        </section>

        {/* 6 — ETAPAS DO MÉTODO */}
        <section id="etapas" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>PROCESSO</span>
            <h2 className={styles.sectionTitle}>As Etapas do Método</h2>
            <p className={styles.sectionSub}>O método é um processo contínuo, não uma ação isolada.</p>
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

        {/* 7 — PLANEJAMENTO */}
        <section id="planejamento" className={styles.section}>
          <div className={styles.twoCol}>
            <div>
              <span className={styles.sectionTag}>P1</span>
              <h2 className={styles.sectionTitle}>Planejamento da aquisição</h2>
              <p className={styles.bodyText}>Diagnóstico inicial que define as premissas de todas as campanhas:</p>
              <ul className={styles.greenList}>
                <li>Oferta e produto/serviço foco</li>
                <li>Público-alvo</li>
                <li>Canal prioritário: Meta Ads ou Google Ads</li>
                <li>Estratégia de comunicação, dores e objeções</li>
                <li>Metas e indicadores de acompanhamento</li>
              </ul>
            </div>
            <div className={`${styles.impactCard} ${styles.ledCard}`}>
              <i className="bx bx-bulb" style={{ fontSize: 40, color: '#26c281', marginBottom: 16 }} />
              <p className={styles.impactText}>&ldquo;Anunciar sem estratégia é rasgar dinheiro.&rdquo;</p>
            </div>
          </div>
        </section>

        {/* 8 — ANÚNCIOS */}
        <section id="anuncios" className={styles.section}>
          <div className={styles.twoCol}>
            <div>
              <span className={styles.sectionTag}>P3</span>
              <h2 className={styles.sectionTitle}>Tráfego pago e anúncios que convertem</h2>
              <p className={styles.bodyText}>Campanhas em Meta Ads ou Google Ads, conforme o canal definido no planejamento.</p>
              <p className={styles.bodyText} style={{ marginTop: 8, opacity: 0.5 }}>O que fazemos:</p>
              <ul className={styles.greenList}>
                <li>Criação e ativação das campanhas</li>
                <li>Textos publicitários com foco em conversão</li>
                <li>Peças em imagem e vídeo</li>
                <li>Segmentação precisa</li>
                <li>Gestão e otimização contínua</li>
              </ul>
            </div>
            <div className={`${styles.adCard} ${styles.ledCard}`}>
              <div className={styles.adCardTag}><i className="bx bx-bar-chart-alt-2" /> EXEMPLO DE CAMPANHA</div>
              {CAMPAIGN_METRICS.map(({ label, value }) => (
                <div key={label} className={styles.adCardBar}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9 — QUALIFICAÇÃO */}
        <section id="qualificacao" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P3</span>
            <h2 className={styles.sectionTitle}>Qualificação por Formulário</h2>
          </div>
          <div className={styles.qualGrid}>
            {[
              { icon: 'bx-filter-alt',   title: 'Filtragem automática', desc: 'Filtramos automaticamente quem tem real intenção de compra.' },
              { icon: 'bxs-user-check',  title: 'Resultado',             desc: 'Leads mais preparados e comerciais mais eficientes.' },
              { icon: 'bx-question-mark',title: 'Como funciona',          desc: 'As perguntas do formulário separam curiosos de potenciais compradores.' },
            ].map((c, i) => (
              <div key={i} className={`${styles.qualCard} ${styles.ledCard}`}>
                <i className={`bx ${c.icon}`} style={{ fontSize: 32, color: '#26c281' }} />
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 10 — CRM E GESTÃO DE LEADS */}
        <section id="gestao-leads" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P2</span>
            <h2 className={styles.sectionTitle}>CRM e Gestão dos Leads — PGL</h2>
            <p className={styles.sectionSub}>Implantamos e organizamos o CRM definido no planejamento: funil, etapas, campos essenciais e orientação de uso.</p>
          </div>
          <div className={`${styles.crmCard} ${styles.ledCard}`}>
            <div className={styles.crmHeader}>
              <span>Nome</span><span>Origem</span><span>Horário</span><span>Status</span><span>Pergunta 1?</span><span>Pergunta 2?</span>
            </div>
            {FAKE_LEADS.map((lead, i) => (
              <div key={i} className={styles.crmRow}>
                <span className={styles.crmName}>{lead.nome}</span>
                <span className={styles.crmBadge}>{lead.origem}</span>
                <span className={styles.crmMuted}>{lead.hora}</span>
                <span className={styles.crmStatus}>{lead.status}</span>
                <span className={styles.crmMuted}>{lead.p1}</span>
                <span className={styles.crmMuted}>{lead.p2}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 11 — SCRIPTS, TREINAMENTO E VENDAS */}
        <section id="atendimento" className={styles.section}>
          <div className={styles.twoCol}>
            <div>
              <span className={styles.sectionTag}>P2</span>
              <h2 className={styles.sectionTitle}>Scripts de vendas e treinamento</h2>
              <ul className={styles.greenList}>
                <li>Abordagem e qualificação</li>
                <li>Follow-up e contorno de objeções</li>
                <li>Condução até a proposta e fechamento</li>
                <li>Treinamento do time em encontros agendados</li>
                <li>Melhoria contínua da rotina comercial</li>
              </ul>
            </div>
            <div className={`${styles.impactCard} ${styles.ledCard}`}>
              <i className="bx bx-message-dots" style={{ fontSize: 40, color: '#26c281', marginBottom: 16 }} />
              <p className={styles.impactText}>&ldquo;Lead bom precisa de atendimento rápido e processo comercial bem executado.&rdquo;</p>
            </div>
          </div>
        </section>

        {/* 12 — CONTROLE DO FUNIL */}
        <section id="funil" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P2</span>
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
            <div>
              <p className={styles.bodyText}>O que você precisa garantir:</p>
              <ul className={styles.greenList}>
                <li>Agilidade no atendimento</li>
                <li>Uso diário do CRM, para preenchimento da PGL</li>
                <li>Participar das reuniões</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 13 — PRESTAÇÃO DE CONTAS E ATENDIMENTO */}
        <section id="prestacao-de-contas" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>P4</span>
            <h2 className={styles.sectionTitle}>Prestação de contas e atendimento</h2>
            <p className={styles.sectionSub}>A rotina de acompanhamento que passa a valer assim que as campanhas forem ao ar.</p>
          </div>
          <div className={styles.cadenceGrid}>
            {CADENCE.map((c, i) => (
              <div key={i} className={`${styles.cadenceCard} ${styles.ledCard}`}>
                <span className={styles.cadenceTag}>{c.tag}</span>
                <i className={`bx ${c.icon}`} style={{ fontSize: 30, color: '#26c281' }} />
                <h3 className={styles.cadenceTitle}>{c.title}</h3>
                <ul className={styles.greenList}>
                  {c.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 14 — COMPROMETIMENTO */}
        <section id="comprometimento" className={`${styles.section} ${styles.sectionDark}`}>
          <div className={styles.commitWrap}>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>Mas tudo isso só vai funcionar...</h2>
            <div className={styles.commitHighlight}>com seu comprometimento!</div>
            <p className={styles.bodyText} style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto', opacity: 0.6 }}>
              A LP entrega estrutura, processo e direção — estes pontos ficam com a sua empresa:
            </p>
            <div className={styles.dutyGrid}>
              {CLIENT_DUTIES.map((d, i) => (
                <div key={i} className={styles.dutyItem}>
                  <i className="bx bx-check-circle" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
            <p className={styles.noteBox}>
              <i className="bx bx-time-five" />
              Atrasos na entrega de materiais, acessos ou aprovações prorrogam os prazos da assessoria pelo período necessário à reprogramação das atividades.
            </p>
          </div>
        </section>

        {/* 15 — BRIEFING */}
        <section id="briefing" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>BRIEFING</span>
            <h2 className={styles.sectionTitle}>Sobre o seu negócio</h2>
            <p className={styles.sectionSub}>Base do planejamento da aquisição: seus principais desafios comerciais, objeções e diferenciais.</p>
          </div>
          <div className={styles.briefingCards}>
            {BRIEFING_QUESTIONS.map((q, i) => (
              <div key={i} className={`${styles.briefingCard} ${styles.ledCard}`}>
                <span className={styles.briefingNum}>{String(i + 1).padStart(2, '0')}</span>
                <p>{q}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 16 — CHECKLIST */}
        <section id="checklist" className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>START</span>
            <h2 className={styles.sectionTitle}>Checklist para Início dos Anúncios</h2>
            <p className={styles.sectionSub}>Com tudo entregue, a primeira campanha é ativada em até 10 dias úteis.</p>
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

        {/* 17 — LEMBRE-SE */}
        <section id="lembre-se" className={`${styles.section} ${styles.sectionAccent}`}>
          <div className={styles.rememberWrap}>
            <i className="bx bx-bell" style={{ fontSize: 48, color: '#26c281' }} />
            <h2 className={styles.sectionTitle}>Lembre-se</h2>
            <p className={styles.bodyText}>Logo após a reunião finalizar, será enviado esse mesmo checklist para o start dos anúncios.</p>
            <div className={styles.rememberHighlight}>
              Quanto antes você finalizar o checklist, antes os anúncios poderão ir ao ar.
            </div>
          </div>
        </section>

        {/* 18 — FINAL */}
        <section id="final" className={`${styles.section} ${styles.sectionFinal}`}>
          <div className={styles.finalGlow} />
          <div className={styles.ledRingFinal} />
          <div className={styles.finalContent}>
            <span className={styles.heroBadge}>PROJETO PERFORMANCE · MÉTODO LP</span>
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
