// Ferramentas do assistente de IA.
//
// SEGURANÇA: o modelo NUNCA executa SQL arbitrário. Ele só pode agir através
// destas funções tipadas, que:
//   - são sempre escopadas ao workspace do usuário autenticado;
//   - validam as entradas;
//   - não expõem operações destrutivas (sem DELETE) na v1.
//
// Cada tool tem uma definição (schema enviado ao Claude) e um executor
// (roda no servidor com o adminSupabase, injetando o workspace_id).

import { getWorkspaceMetaConnection } from '@/lib/server/meta-connection'
import { fetchMetaJson, normalizeMetaError } from '@/lib/server/meta-fetch'
import { resolveMetaDateSelection } from '@/lib/server/meta-date-range'
import { formatInsightsWithConversions } from '@/lib/meta-metrics'

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter']
const POST_STATUSES = ['pending', 'scheduled', 'published', 'cancelled']
const TASK_PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent']

// Definições enviadas ao Claude (formato de tool use da Anthropic).
export const ASSISTANT_TOOL_DEFINITIONS = [
  {
    name: 'list_clients',
    description:
      'Lista os clientes do workspace (id, nome, status). Use para descobrir o id de um cliente antes de criar posts/tarefas, ou para responder perguntas sobre a carteira.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Filtro opcional por parte do nome do cliente.' },
      },
    },
  },
  {
    name: 'list_tasks',
    description:
      'Lista tarefas internas do workspace (título, prioridade, prazo, status). Use para responder sobre pendências e carga de trabalho.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Máximo de tarefas a retornar (padrão 50, máx 100).' },
      },
    },
  },
  {
    name: 'list_editorial_posts',
    description:
      'Lista posts do calendário editorial (Social Media) do workspace. Filtre por mês (YYYY-MM) e/ou clientId.',
    input_schema: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Mês no formato YYYY-MM (opcional).' },
        clientId: { type: 'string', description: 'Filtrar por id de cliente (opcional).' },
      },
    },
  },
  {
    name: 'list_editorial_plans',
    description: 'Lista os planejamentos de Social Media salvos do workspace (nome, quantidade de posts).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_ad_account_balances',
    description:
      'Consulta o saldo/gasto das contas de anúncio do Meta (Facebook/Instagram) vinculadas aos clientes do workspace. Retorna, por conta: nome, moeda, saldo devedor, valor já gasto, limite de gasto e status. Filtre por cliente se quiser apenas uma conta.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Id do cliente para consultar só a conta dele (opcional).' },
        search: { type: 'string', description: 'Filtro opcional por parte do nome do cliente.' },
      },
    },
  },
  {
    name: 'get_meta_insights',
    description:
      'Consulta métricas de performance do Meta Ads de um cliente (investimento, impressões, cliques, CTR, CPC, leads e CPL) em um período. Use list_clients para achar o clientId.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Id do cliente (obrigatório).' },
        datePreset: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
          description: 'Período pré-definido (padrão last_7d). Ignorado se since/until forem informados.',
        },
        since: { type: 'string', description: 'Início do período YYYY-MM-DD (opcional, use com until).' },
        until: { type: 'string', description: 'Fim do período YYYY-MM-DD (opcional, use com since).' },
      },
      required: ['clientId'],
    },
  },
  {
    name: 'create_task',
    description:
      'Cria uma nova tarefa interna no workspace. Confirme com o usuário antes de criar se a intenção não estiver clara.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título da tarefa (obrigatório).' },
        description: { type: 'string', description: 'Descrição/observações (opcional).' },
        priority: { type: 'string', enum: TASK_PRIORITIES, description: 'Prioridade (opcional).' },
        dueDate: { type: 'string', description: 'Prazo no formato YYYY-MM-DD (opcional).' },
        clientId: { type: 'string', description: 'Vincular a um cliente pelo id (opcional).' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_editorial_post',
    description:
      'Cria um post no calendário editorial (Social Media) para um cliente. Use list_clients antes para obter o clientId.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Id do cliente (obrigatório).' },
        title: { type: 'string', description: 'Tema/título do post.' },
        scheduledDate: { type: 'string', description: 'Data de publicação YYYY-MM-DD (obrigatório).' },
        scheduledTime: { type: 'string', description: 'Horário HH:MM (opcional).' },
        status: { type: 'string', enum: POST_STATUSES, description: 'Status (padrão: pending).' },
        platforms: {
          type: 'array',
          items: { type: 'string', enum: PLATFORMS },
          description: 'Plataformas do post (opcional).',
        },
        description: { type: 'string', description: 'Descrição/copy do post (opcional).' },
      },
      required: ['clientId', 'scheduledDate'],
    },
  },
]

function ok(data) { return { ok: true, ...data } }
function fail(message) { return { ok: false, error: message } }

const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'])
function centsToAmount(value, currency) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return 0
  return ZERO_DECIMAL.has(String(currency || '').toUpperCase()) ? n : n / 100
}
function normalizeAdAccountId(value) {
  return String(value || '').replace(/^act_/, '').replace(/\D/g, '')
}

// Resolve o token do Meta do workspace (mesma fonte usada pelas rotas /api/meta).
async function getWorkspaceMetaToken(adminSupabase, workspaceId) {
  try {
    const connection = await getWorkspaceMetaConnection(adminSupabase, workspaceId)
    if (connection?.access_token) return connection.access_token
  } catch { /* segue para env */ }
  return process.env.META_ACCESS_TOKEN || ''
}

// Lê os clientes do workspace e a conta de anúncio Meta configurada em cada um
// (workspace_clients.payload.metaAdAccountId), seguindo o mesmo padrão das automações.
async function resolveWorkspaceAdAccounts(adminSupabase, workspaceId) {
  const { data, error } = await adminSupabase
    .from('workspace_clients')
    .select('id, name, payload, is_archived')
    .eq('workspace_id', workspaceId)
  if (error) throw error
  const accounts = []
  for (const r of data || []) {
    if (r.is_archived) continue
    const p = r.payload || {}
    const integ = p.integrations || {}
    const metaId = normalizeAdAccountId(p.metaAdAccountId || integ.metaAdAccountId || '')
    if (!metaId) continue
    accounts.push({ clientId: r.id, clientName: r.name, metaAdAccountId: metaId })
  }
  return accounts
}

// Executa uma tool. ctx = { adminSupabase, workspaceId, userId }.
export async function executeAssistantTool(name, input, ctx) {
  const { adminSupabase, workspaceId, userId } = ctx
  const args = input && typeof input === 'object' ? input : {}

  try {
    switch (name) {
      case 'list_clients': {
        let query = adminSupabase
          .from('workspace_clients')
          .select('*')
          .eq('workspace_id', workspaceId)
          .limit(500)
        const { data, error } = await query
        if (error) throw error
        let rows = (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status ?? null,
        }))
        const search = String(args.search || '').trim().toLowerCase()
        if (search) rows = rows.filter((c) => String(c.name || '').toLowerCase().includes(search))
        return ok({ clients: rows, count: rows.length })
      }

      case 'list_tasks': {
        const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100)
        const { data, error } = await adminSupabase
          .from('tasks')
          .select('id, title, priority, due_date, status_item_id, created_at, task_status_items(name)')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) throw error
        const tasks = (data || []).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.due_date,
          status: t.task_status_items?.name ?? null,
        }))
        return ok({ tasks, count: tasks.length })
      }

      case 'list_editorial_posts': {
        let query = adminSupabase
          .from('editorial_posts')
          .select('id, client_id, title, scheduled_date, scheduled_time, status, platforms')
          .eq('workspace_id', workspaceId)
          .order('scheduled_date', { ascending: true })
          .limit(300)
        if (args.clientId) query = query.eq('client_id', String(args.clientId))
        const month = String(args.month || '')
        if (/^\d{4}-\d{2}$/.test(month)) {
          const [y, m] = month.split('-')
          const start = `${y}-${m}-01`
          const end = new Date(Number(y), Number(m), 0).toISOString().slice(0, 10)
          query = query.gte('scheduled_date', start).lte('scheduled_date', end)
        }
        const { data, error } = await query
        if (error) throw error
        return ok({ posts: data || [], count: (data || []).length })
      }

      case 'list_editorial_plans': {
        const { data, error } = await adminSupabase
          .from('editorial_plans')
          .select('id, label, month, year, items, created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(100)
        if (error) throw error
        const plans = (data || []).map((p) => ({
          id: p.id,
          label: p.label,
          postsCount: Array.isArray(p.items) ? p.items.length : 0,
          createdAt: p.created_at,
        }))
        return ok({ plans, count: plans.length })
      }

      case 'get_ad_account_balances': {
        const token = await getWorkspaceMetaToken(adminSupabase, workspaceId)
        if (!token) return fail('Nenhuma conexão da Meta configurada para este workspace.')
        let accounts = await resolveWorkspaceAdAccounts(adminSupabase, workspaceId)
        if (args.clientId) accounts = accounts.filter((a) => a.clientId === String(args.clientId))
        const search = String(args.search || '').trim().toLowerCase()
        if (search) accounts = accounts.filter((a) => String(a.clientName || '').toLowerCase().includes(search))
        if (!accounts.length) return fail('Nenhum cliente com conta de anúncio Meta configurada foi encontrado.')

        const fields = 'name,currency,balance,amount_spent,spend_cap,account_status'
        const results = await Promise.all(accounts.slice(0, 50).map(async (acc) => {
          try {
            const url = `https://graph.facebook.com/v19.0/act_${acc.metaAdAccountId}?fields=${fields}&access_token=${encodeURIComponent(token)}`
            const data = await fetchMetaJson(url, 'Falha ao consultar saldo da conta.')
            const currency = data.currency || 'BRL'
            return {
              client: acc.clientName,
              adAccountId: acc.metaAdAccountId,
              name: data.name || null,
              currency,
              balance: centsToAmount(data.balance, currency),
              amountSpent: centsToAmount(data.amount_spent, currency),
              spendCap: data.spend_cap ? centsToAmount(data.spend_cap, currency) : null,
              accountStatus: data.account_status ?? null,
            }
          } catch (e) {
            return { client: acc.clientName, adAccountId: acc.metaAdAccountId, error: normalizeMetaError(e)?.message || 'Erro ao consultar.' }
          }
        }))
        return ok({ accounts: results, count: results.length })
      }

      case 'get_meta_insights': {
        const token = await getWorkspaceMetaToken(adminSupabase, workspaceId)
        if (!token) return fail('Nenhuma conexão da Meta configurada para este workspace.')
        const accounts = await resolveWorkspaceAdAccounts(adminSupabase, workspaceId)
        const acc = accounts.find((a) => a.clientId === String(args.clientId))
        if (!acc) return fail('Cliente não encontrado ou sem conta de anúncio Meta configurada.')

        const selection = resolveMetaDateSelection(args.datePreset || 'last_7d', args.since, args.until)
        const fields = 'spend,reach,impressions,clicks,cpc,ctr,actions,action_values,cost_per_action_type'
        const params = new URLSearchParams({
          fields,
          access_token: token,
          action_attribution_windows: JSON.stringify(['7d_click', '1d_view']),
          use_unified_attribution_setting: 'true',
        })
        if (selection.mode === 'time_range') {
          params.set('time_range', JSON.stringify({ since: selection.since, until: selection.until }))
        } else {
          params.set('date_preset', selection.datePreset)
        }
        try {
          const url = `https://graph.facebook.com/v19.0/act_${acc.metaAdAccountId}/insights?${params.toString()}`
          const data = await fetchMetaJson(url, 'Falha ao consultar métricas da conta.')
          const summary = formatInsightsWithConversions(data?.data?.[0] || null)
          return ok({ client: acc.clientName, adAccountId: acc.metaAdAccountId, period: selection, summary })
        } catch (e) {
          return fail(normalizeMetaError(e)?.message || 'Erro ao consultar métricas do Meta.')
        }
      }

      case 'create_task': {
        const title = String(args.title || '').trim()
        if (!title) return fail('title é obrigatório.')
        const { data: maxRow } = await adminSupabase
          .from('tasks')
          .select('sort_order')
          .eq('workspace_id', workspaceId)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle()
        const insert = {
          workspace_id: workspaceId,
          title,
          sort_order: (maxRow?.sort_order ?? -1) + 1,
          created_by: userId || null,
          priority: TASK_PRIORITIES.includes(args.priority) ? args.priority : 'none',
        }
        if (args.description) insert.description = String(args.description)
        if (args.dueDate) insert.due_date = String(args.dueDate)
        if (args.clientId) insert.client_id = String(args.clientId)
        const { data, error } = await adminSupabase
          .from('tasks')
          .insert(insert)
          .select('id, title')
          .single()
        if (error) throw error
        return ok({ created: 'task', task: data })
      }

      case 'create_editorial_post': {
        const clientId = String(args.clientId || '').trim()
        const scheduledDate = String(args.scheduledDate || '').trim()
        if (!clientId) return fail('clientId é obrigatório.')
        if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return fail('scheduledDate deve estar em YYYY-MM-DD.')
        // Garante que o cliente pertence ao workspace antes de criar.
        const { data: client } = await adminSupabase
          .from('workspace_clients')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('id', clientId)
          .maybeSingle()
        if (!client) return fail('Cliente não encontrado neste workspace.')
        const platforms = Array.isArray(args.platforms)
          ? args.platforms.filter((p) => PLATFORMS.includes(p))
          : []
        const { data, error } = await adminSupabase
          .from('editorial_posts')
          .insert({
            workspace_id: workspaceId,
            client_id: clientId,
            title: String(args.title || ''),
            description: String(args.description || ''),
            scheduled_date: scheduledDate,
            scheduled_time: args.scheduledTime || null,
            status: POST_STATUSES.includes(args.status) ? args.status : 'pending',
            platforms,
            created_by: userId || null,
          })
          .select('id, title, scheduled_date')
          .single()
        if (error) throw error
        return ok({ created: 'editorial_post', post: data })
      }

      default:
        return fail(`Ferramenta desconhecida: ${name}`)
    }
  } catch (error) {
    return fail(error?.message || 'Erro ao executar a ferramenta.')
  }
}
