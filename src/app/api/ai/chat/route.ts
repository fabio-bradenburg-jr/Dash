import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { getDashboardState } from '@/lib/server/dashboard-store'
import { requestAssistantReply, resolveAssistantAiConfig } from '@/lib/server/ai-chat'
import type { AssistantChatBody, AssistantContextSnapshot, AssistantMessage } from '@/lib/types/ai'

function normalizeChatBody(body: unknown): AssistantChatBody & { providerOverride?: string } {
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

  return {
    clientId: String(payload.clientId || '').trim(),
    conversationId: String(payload.conversationId || '').trim(),
    messages: Array.isArray(payload.messages) ? (payload.messages as AssistantMessage[]) : [],
    contextSnapshot:
      payload.contextSnapshot && typeof payload.contextSnapshot === 'object'
        ? (payload.contextSnapshot as AssistantContextSnapshot)
        : null,
    providerOverride: payload.providerOverride ? String(payload.providerOverride).trim() : undefined,
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse, accessContext, adminSupabase } = await resolveAuthContext()
    if (errorResponse) return errorResponse

    if (!accessContext.canUseAi) {
      return NextResponse.json(
        { error: 'Seu usuário não tem permissão para usar o assistente.' },
        { status: 403 }
      )
    }

    const body = normalizeChatBody(await request.json().catch(() => ({})))
    const dashboardState = await getDashboardState(adminSupabase, accessContext)
    const baseIntegrations = dashboardState.globalIntegrations || {}
    const mergedIntegrations = body.providerOverride
      ? { ...baseIntegrations, aiProvider: body.providerOverride }
      : baseIntegrations
    const aiConfig = resolveAssistantAiConfig(mergedIntegrations)
    const result = await requestAssistantReply({
      config: aiConfig,
      adminSupabase,
      dashboardState,
      accessContext,
      clientId: body.clientId,
      conversationId: body.conversationId,
      contextSnapshot: body.contextSnapshot,
      messages: body.messages,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assistant chat error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar a resposta do assistente.',
      },
      { status: 500 }
    )
  }
}
