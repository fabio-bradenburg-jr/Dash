/**
 * Automation Engine - core logic for evaluating conditions, executing actions,
 * calculating recurrence schedules, and checking expiry.
 */

/**
 * Evaluate a list of conditions against a context object.
 * @param {Array} conditions - Array of condition objects from automation_conditions
 * @param {Object} ctx - The event context (e.g. task fields, trigger data)
 * @returns {boolean}
 */
export function evaluateConditions(conditions, ctx) {
  if (!conditions || conditions.length === 0) return true

  for (const cond of conditions) {
    const { field, operator, value } = cond
    const actual = ctx[field]

    let pass = false
    switch (operator) {
      case 'equals':
        pass = String(actual) === String(value)
        break
      case 'not_equals':
        pass = String(actual) !== String(value)
        break
      case 'contains':
        pass = String(actual || '').includes(String(value))
        break
      case 'not_contains':
        pass = !String(actual || '').includes(String(value))
        break
      case 'greater_than':
        pass = Number(actual) > Number(value)
        break
      case 'less_than':
        pass = Number(actual) < Number(value)
        break
      case 'is_empty':
        pass = actual == null || actual === ''
        break
      case 'is_not_empty':
        pass = actual != null && actual !== ''
        break
      default:
        pass = false
    }

    if (!pass) return false
  }

  return true
}

/**
 * Execute a single automation action.
 * @param {Object} action - action object from automation_actions
 * @param {Object} ctx - context with adminSupabase, workspaceId, triggerData
 * @returns {Promise<Object>} result
 */
export async function executeAction(action, ctx) {
  const { adminSupabase, workspaceId, triggerData } = ctx
  const config = action.config || {}

  switch (action.action_type) {
    case 'create_task': {
      const insert = {
        workspace_id: workspaceId,
        title: interpolate(config.title || 'Nova tarefa', triggerData),
        description: config.description ? interpolate(config.description, triggerData) : null,
        priority: config.priority || 'none',
        // coluna real é status_item_id; space_id herda do espaço-alvo ou do gatilho.
        status_item_id: config.status_id || config.status_item_id || null,
        space_id: config.space_id || triggerData?.space_id || null,
        assignee_id: config.assignee_id || null,
        client_id: config.client_id || null,
        due_date: config.due_date || null,
        created_at: new Date().toISOString(),
      }
      const { data, error } = await adminSupabase.from('tasks').insert(insert).select().single()
      if (error) throw error
      return { task: data }
    }

    // Ações sobre a tarefa que disparou a automação (ou config.task_id).
    case 'change_status':
    case 'change_assignee':
    case 'change_priority':
    case 'move_task': {
      const taskId = config.task_id || triggerData?.task_id
      if (!taskId) return { skipped: 'sem task_id' }
      const updates = { updated_at: new Date().toISOString() }
      if (action.action_type === 'change_status') updates.status_item_id = config.status_id || config.status_item_id || null
      if (action.action_type === 'change_assignee') updates.assignee_id = config.assignee_id || null
      if (action.action_type === 'change_priority') updates.priority = config.priority || 'none'
      if (action.action_type === 'move_task') updates.space_id = config.space_id || null
      const { data, error } = await adminSupabase
        .from('tasks').update(updates).eq('id', taskId).eq('workspace_id', workspaceId).select().single()
      if (error) throw error
      return { task: data }
    }

    case 'add_comment': {
      const taskId = config.task_id || triggerData?.task_id
      if (!taskId) return { skipped: 'sem task_id' }
      const content = interpolate(config.message || config.content || config.body || '', triggerData)
      try {
        await adminSupabase.from('task_comments').insert({ task_id: taskId, content, created_at: new Date().toISOString() })
      } catch (e) {
        return { skipped: 'task_comments indisponível' }
      }
      return { content }
    }

    case 'update_task': {
      const taskId = config.task_id || triggerData?.task_id
      if (!taskId) throw new Error('update_task: task_id required')
      const updates = { updated_at: new Date().toISOString() }
      const allowed = ['title', 'description', 'status_id', 'priority', 'assignee_id', 'due_date']
      for (const f of allowed) {
        if (config[f] !== undefined) updates[f] = interpolate(String(config[f]), triggerData)
      }
      const { data, error } = await adminSupabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('workspace_id', workspaceId)
        .select()
        .single()
      if (error) throw error
      return { task: data }
    }

    case 'send_notification': {
      // Insert a notification record if a notifications table exists, otherwise log
      const message = interpolate(config.message || '', triggerData)
      try {
        await adminSupabase.from('notifications').insert({
          workspace_id: workspaceId,
          user_id: config.user_id || null,
          message,
          created_at: new Date().toISOString(),
        })
      } catch {
        // Notifications table may not exist; non-fatal
        console.warn('send_notification: notifications table not available')
      }
      return { message }
    }

    case 'send_ad_accounts': {
      // Lê as contas de anúncio configuradas por cliente no app e envia por webhook,
      // para o serviço externo saber quais contas analisar.
      const url = config.url
      if (!url) throw new Error('send_ad_accounts: url obrigatório')
      const onlyActive = config.only_active !== false
      const includeGoogle = Boolean(config.include_google)

      const { data: rows } = await adminSupabase
        .from('workspace_clients')
        .select('id, name, payload, is_archived')
        .eq('workspace_id', workspaceId)

      const accounts = []
      for (const r of rows || []) {
        if (r.is_archived) continue
        const p = r.payload || {}
        const integ = p.integrations || {}
        const status = String(p.status || '').toLowerCase()
        if (onlyActive && (status === 'churn' || status === 'pausado' || p.churn_date)) continue
        const meta = p.metaAdAccountId || integ.metaAdAccountId || ''
        const google = p.googleAdsAccountId || integ.googleAdsAccountId || ''
        if (!meta && !(includeGoogle && google)) continue
        const acc = { client_id: r.id, client_name: r.name, meta_ad_account_id: meta || null }
        if (includeGoogle) acc.google_ads_account_id = google || null
        accounts.push(acc)
      }

      const body = { workspace_id: workspaceId, generated_at: new Date().toISOString(), count: accounts.length, ad_accounts: accounts }
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
        body: JSON.stringify(body),
      })
      return { status: resp.status, count: accounts.length }
    }

    case 'webhook': {
      const url = config.url
      if (!url) throw new Error('webhook: url required')
      const body = config.body ? JSON.parse(interpolate(JSON.stringify(config.body), triggerData)) : triggerData
      const resp = await fetch(url, {
        method: config.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
        body: JSON.stringify(body),
      })
      return { status: resp.status }
    }

    default:
      // Ação ainda não suportada: ignora sem quebrar a automação.
      return { skipped: `action_type não suportado: ${action.action_type}` }
  }
}

/**
 * Simple template interpolation: replace {{key}} with ctx[key].
 */
function interpolate(str, ctx) {
  if (!ctx || typeof str !== 'string') return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (ctx[key] ?? ''))
}

/**
 * Calculate the next run timestamp for a recurrence rule.
 * @param {Object} rule - { frequency, interval, days_of_week, day_of_month, month_of_year, time_of_day }
 * @param {Date|string|null} from - base date (defaults to now)
 * @returns {Date}
 */
export function calcNextRun(rule, from = null) {
  const base = from ? new Date(from) : new Date()
  const { frequency, interval = 1, days_of_week, day_of_month, month_of_year, time_of_day } = rule

  // Apply time_of_day if specified (HH:MM)
  function applyTime(d) {
    if (time_of_day) {
      const [hh, mm] = time_of_day.split(':').map(Number)
      d.setHours(hh, mm, 0, 0)
    }
    return d
  }

  let next = new Date(base)

  switch (frequency) {
    case 'minutely': {
      next = new Date(base.getTime() + interval * 60 * 1000)
      break
    }
    case 'hourly': {
      next = new Date(base.getTime() + interval * 60 * 60 * 1000)
      break
    }
    case 'daily': {
      next.setDate(next.getDate() + interval)
      applyTime(next)
      break
    }
    case 'weekly': {
      if (days_of_week && days_of_week.length > 0) {
        // Find next occurrence on one of the specified weekdays
        let found = null
        for (let i = 1; i <= 7 * interval; i++) {
          const candidate = new Date(base)
          candidate.setDate(base.getDate() + i)
          if (days_of_week.includes(candidate.getDay())) {
            found = candidate
            break
          }
        }
        next = found || new Date(base.getTime() + 7 * interval * 24 * 3600 * 1000)
      } else {
        next.setDate(next.getDate() + 7 * interval)
      }
      applyTime(next)
      break
    }
    case 'monthly': {
      next.setMonth(next.getMonth() + interval)
      if (day_of_month) next.setDate(day_of_month)
      applyTime(next)
      break
    }
    case 'yearly': {
      next.setFullYear(next.getFullYear() + interval)
      if (month_of_year != null) next.setMonth(month_of_year - 1)
      if (day_of_month) next.setDate(day_of_month)
      applyTime(next)
      break
    }
    default:
      // Unknown frequency: add 1 day as fallback
      next.setDate(next.getDate() + 1)
  }

  return next
}

/**
 * Check if a recurrence has expired.
 * @param {Object} rule - { end_date, max_occurrences }
 * @param {number} occurrenceCount - how many times it has already run
 * @param {Date|string|null} nextRun - the proposed next run date
 * @returns {boolean}
 */
export function isRecurrenceExpired(rule, occurrenceCount, nextRun = null) {
  const { end_date, max_occurrences } = rule

  if (max_occurrences != null && occurrenceCount >= max_occurrences) return true

  if (end_date) {
    const deadline = new Date(end_date)
    const run = nextRun ? new Date(nextRun) : new Date()
    if (run > deadline) return true
  }

  return false
}
