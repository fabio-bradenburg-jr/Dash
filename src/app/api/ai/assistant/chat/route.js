import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { ASSISTANT_TOOL_DEFINITIONS, executeAssistantTool } from '@/lib/server/assistant-tools'

// Modelo padrão: Claude Opus 5 (configurável via env). Deve ser um modelo Anthropic.
const MODEL = process.env.ASSISTANT_MODEL || 'claude-opus-5'
const MAX_TOOL_ITERATIONS = 8

function buildSystemPrompt(accessContext) {
  const today = new Date().toISOString().slice(0, 10)
  return [
    'Você é o assistente interno do dashboard da Assessoria LP, uma agência de marketing.',
    `A data de hoje é ${today}.`,
    'Você conversa em português do Brasil, de forma objetiva e direta.',
    '',
    'Você tem ferramentas para LER e ALTERAR os dados do workspace do usuário:',
    '- Sempre use as ferramentas de leitura (list_*) para basear respostas em dados reais; não invente números.',
    '- Antes de criar um post editorial, descubra o clientId com list_clients.',
    '- Ao criar tarefas ou posts (create_*), só execute quando a intenção do usuário estiver clara. Se estiver ambígua, pergunte antes.',
    '- Todas as ações já são automaticamente restritas ao workspace do usuário; você não precisa (nem consegue) acessar outros workspaces.',
    '- Não existe ferramenta de exclusão: nunca prometa apagar dados.',
    '',
    'Ao terminar uma ação, confirme de forma curta o que foi feito.',
  ].join('\n')
}

// Converte o histórico simples do cliente ({role, content}) para o formato da API.
function toApiMessages(messages) {
  const out = []
  for (const m of Array.isArray(messages) ? messages : []) {
    const role = m?.role === 'assistant' ? 'assistant' : 'user'
    const content = typeof m?.content === 'string' ? m.content : ''
    if (!content.trim()) continue
    out.push({ role, content })
  }
  return out
}

export async function POST(request) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const { user, accessContext, adminSupabase } = ctx

    if (!accessContext?.canUseAi) {
      return NextResponse.json({ error: 'Você não tem permissão para usar o assistente de IA.' }, { status: 403 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A API do Claude não está configurada. Defina ANTHROPIC_API_KEY no ambiente.' },
        { status: 503 },
      )
    }

    const body = await request.json()
    const messages = toApiMessages(body?.messages)
    if (!messages.length) {
      return NextResponse.json({ error: 'Envie ao menos uma mensagem.' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey })
    const toolCtx = { adminSupabase, workspaceId: accessContext.workspaceId, userId: user?.id || null }
    const system = buildSystemPrompt(accessContext)

    const toolActions = [] // log transparente das ações executadas (para a UI)
    let finalText = ''

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system,
        tools: ASSISTANT_TOOL_DEFINITIONS,
        messages,
      })

      // Preserva o turno do assistente na íntegra (inclui blocos de thinking/tool_use).
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason !== 'tool_use') {
        finalText = response.content
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim()
        break
      }

      // Executa cada tool solicitada e devolve os resultados num único turno de usuário.
      const toolUses = response.content.filter((b) => b.type === 'tool_use')
      const toolResults = []
      for (const tu of toolUses) {
        const result = await executeAssistantTool(tu.name, tu.input, toolCtx)
        toolActions.push({ name: tu.name, input: tu.input, ok: result.ok !== false })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result),
          is_error: result.ok === false,
        })
      }
      messages.push({ role: 'user', content: toolResults })

      if (i === MAX_TOOL_ITERATIONS - 1) {
        finalText = 'Cheguei ao limite de passos para esta solicitação. Pode reformular ou dividir o pedido?'
      }
    }

    return NextResponse.json({
      message: finalText || 'Não consegui gerar uma resposta.',
      toolActions,
    })
  } catch (error) {
    console.error('Assistant chat error:', error)
    const status = error?.status && Number.isInteger(error.status) ? error.status : 500
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar a conversa.' },
      { status: status >= 400 && status < 600 ? status : 500 },
    )
  }
}
