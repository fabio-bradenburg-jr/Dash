import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import {
  createAssistantConversation,
  listAssistantConversations,
} from '@/lib/server/assistant-conversations'

export async function GET() {
  try {
    const { errorResponse, user, accessContext, adminSupabase } = await resolveAuthContext()
    if (errorResponse) return errorResponse

    if (!accessContext.canUseAi || !accessContext.workspaceId) {
      return NextResponse.json({ error: 'Sem permissão para usar o assistente.' }, { status: 403 })
    }

    const conversations = await listAssistantConversations(
      adminSupabase,
      accessContext.workspaceId,
      user.id
    )

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Assistant conversations GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível listar as conversas.' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const { errorResponse, user, accessContext, adminSupabase } = await resolveAuthContext()
    if (errorResponse) return errorResponse

    if (!accessContext.canUseAi || !accessContext.workspaceId) {
      return NextResponse.json({ error: 'Sem permissão para usar o assistente.' }, { status: 403 })
    }

    const conversation = await createAssistantConversation(
      adminSupabase,
      accessContext.workspaceId,
      user.id,
      accessContext.aiAccessLevel
    )

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Assistant conversations POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível criar a conversa.' },
      { status: 500 }
    )
  }
}
